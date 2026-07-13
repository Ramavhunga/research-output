package za.co.univen.research_output.services;

import jakarta.servlet.http.HttpServletRequest;
import org.apache.logging.log4j.util.Base64Util;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import za.co.univen.research_output.dto.LoginDTO;
import za.co.univen.research_output.dto.StaffRoleView;
import za.co.univen.research_output.dto.User;
import za.co.univen.research_output.dto.UserRoleView;
import za.co.univen.research_output.repositories.UserRepository;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Set<String> REVIEWER_ROLES = Set.of("REVIEWER_LEVEL_1", "REVIEWER_LEVEL_2");

    private final RestTemplate restTemplate;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public UserService(RestTemplateBuilder builder, UserRepository userRepository, CurrentUserService currentUserService) {
        this.restTemplate = builder.build();
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    public LoginDTO itsLogin(User user) throws Exception {
        LoginDTO loginDTO;
        try {
            String userAndPass = user.getUsername() + ":" + user.getPassword();
            var headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.add("Authorization", "Basic " + Base64Util.encode(userAndPass));

            ResponseEntity<LoginDTO> rs = restTemplate.exchange("https://univenproduction-integration.azuremicroservices.io/api/user/" + user.getUsername(), HttpMethod.GET, new HttpEntity<>(headers), LoginDTO.class);
            loginDTO = Objects.requireNonNull(rs.getBody());

            if (rs.getBody() == null) {
                throw new SecurityException("Illegal username or password");
            }

        } catch (Exception e) {
            throw new SecurityException("Illegal username or password");
        }
        return loginDTO;
    }

    public LoginDTO ImpersonateLogin(User user) throws Exception {
        // Production behavior: authenticate with the credentials provided by the user.
        return itsLogin(user);
    }

    public List<UserRoleView> listUsersWithRoles() {
        return userRepository.findAll().stream()
                .map(user -> new UserRoleView(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        currentUserService.getRoles(user)
                ))
                .toList();
    }

    public StaffRoleView loadStaffRoleByStaffNo(String staffNo) throws Exception {
        String normalizedStaffNo = normalizeStaffNo(staffNo);
        LoginDTO loginDTO = loadLoginByStaffNo(normalizedStaffNo);
        za.co.univen.research_output.entities.User localUser = userRepository.findByUsername(normalizedStaffNo).orElse(null);
        Set<String> assignedReviewerRoles = extractReviewerRoles(localUser == null ? Set.of() : currentUserService.getRoles(localUser));

        return StaffRoleView.from(loginDTO, normalizedStaffNo, assignedReviewerRoles);
    }

    public StaffRoleView assignReviewerRolesByStaffNo(String staffNo, Set<String> roles) throws Exception {
        String normalizedStaffNo = normalizeStaffNo(staffNo);
        LoginDTO loginDTO = loadLoginByStaffNo(normalizedStaffNo);

        Set<String> requestedRoles = extractReviewerRolesAndAdmin(roles);
        za.co.univen.research_output.entities.User localUser = currentUserService.getOrCreateUserByUsername(normalizedStaffNo);

        Set<String> mergedRoles = new LinkedHashSet<>(currentUserService.getRoles(localUser));
        mergedRoles.removeIf(role -> {
          String upperRole = role.toUpperCase(Locale.ROOT);
          return REVIEWER_ROLES.contains(upperRole) || "ADMIN".equals(upperRole);
        });
        mergedRoles.addAll(requestedRoles);
        if (mergedRoles.isEmpty()) {
            mergedRoles.add("REQUESTOR");
        }

        currentUserService.assignRoles(normalizedStaffNo, mergedRoles);
        return StaffRoleView.from(loginDTO, normalizedStaffNo, requestedRoles);
    }

    public LoginDTO loadStudentOrStaffByNumber(String number) throws Exception {
        String normalized = normalizeStaffNo(number);
        try {
            HttpHeaders headers = buildLoggedInUserHeaders();
            ResponseEntity<LoginDTO> rs = restTemplate.exchange(
                    "https://univenproduction-integration.azuremicroservices.io/api/user/" + normalized,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    LoginDTO.class
            );

            LoginDTO loginDTO = Objects.requireNonNull(rs.getBody());
            if (loginDTO.getStaff() == null && loginDTO.getStudent() == null) {
                throw new IllegalArgumentException("Person not found");
            }
            return loginDTO;
        } catch (SecurityException e) {
            throw new SecurityException("Username and password are required for ITS lookup");
        } catch (Exception e) {
            throw new IllegalArgumentException("Person not found");
        }
    }

    public LoginDTO loadLoginByStaffNo(String staffNo) throws Exception {
        try {
            HttpHeaders headers = buildLoggedInUserHeaders();
            ResponseEntity<LoginDTO> rs = restTemplate.exchange(
                    "https://univenproduction-integration.azuremicroservices.io/api/user/" + staffNo,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    LoginDTO.class
            );

            LoginDTO loginDTO = Objects.requireNonNull(rs.getBody());
            if (loginDTO.getStaff() == null) {
                throw new SecurityException("Staff member not found");
            }
            return loginDTO;
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            throw new SecurityException("Staff member not found");
        }
    }

    private HttpHeaders buildLoggedInUserHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Authorization", resolveBasicAuthorizationHeader());
        return headers;
    }

    private String resolveBasicAuthorizationHeader() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes servletAttrs) {
            HttpServletRequest req = servletAttrs.getRequest();
            String authorization = req.getHeader("Authorization");
            if (authorization != null && authorization.regionMatches(true, 0, "Basic ", 0, 6)) {
                return authorization;
            }
        }
        throw new SecurityException("Username and password are required for ITS lookup");
    }

    private String normalizeStaffNo(String staffNo) {
        if (staffNo == null || staffNo.isBlank()) {
            throw new IllegalArgumentException("Staff number is required");
        }
        return staffNo.trim();
    }

    private Set<String> extractReviewerRoles(Set<String> roles) {
        if (roles == null) {
            return Set.of();
        }
        return roles.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.trim().toUpperCase(Locale.ROOT))
                .filter(REVIEWER_ROLES::contains)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<String> extractReviewerRolesAndAdmin(Set<String> roles) {
        if (roles == null) {
            return Set.of();
        }
        return roles.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.trim().toUpperCase(Locale.ROOT))
                .filter(role -> REVIEWER_ROLES.contains(role) || "ADMIN".equals(role))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
