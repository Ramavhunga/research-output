package za.co.univen.research_output.services;

import org.apache.logging.log4j.util.Base64Util;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
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

    private static final String IMPERSONATION_CREDENTIAL = "16211:85467";
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
        return loadLoginByStaffNo(user.getUsername());
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

        Set<String> requestedReviewerRoles = extractReviewerRoles(roles);
        za.co.univen.research_output.entities.User localUser = currentUserService.getOrCreateUserByUsername(normalizedStaffNo);

        Set<String> mergedRoles = new LinkedHashSet<>(currentUserService.getRoles(localUser));
        mergedRoles.removeIf(role -> REVIEWER_ROLES.contains(role.toUpperCase(Locale.ROOT)));
        mergedRoles.addAll(requestedReviewerRoles);
        if (mergedRoles.isEmpty()) {
            mergedRoles.add("REQUESTOR");
        }

        currentUserService.assignRoles(normalizedStaffNo, mergedRoles);
        return StaffRoleView.from(loginDTO, normalizedStaffNo, requestedReviewerRoles);
    }

    private LoginDTO loadLoginByStaffNo(String staffNo) throws Exception {
        try {
            ResponseEntity<LoginDTO> rs = restTemplate.exchange(
                    "https://univenproduction-integration.azuremicroservices.io/api/user/" + staffNo,
                    HttpMethod.GET,
                    new HttpEntity<>(buildImpersonationHeaders()),
                    LoginDTO.class
            );

            LoginDTO loginDTO = Objects.requireNonNull(rs.getBody());
            if (loginDTO.getStaff() == null) {
                throw new SecurityException("Staff member not found");
            }
            return loginDTO;
        } catch (Exception e) {
            throw new SecurityException("Staff member not found");
        }
    }

    private HttpHeaders buildImpersonationHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Authorization", "Basic " + Base64Util.encode(IMPERSONATION_CREDENTIAL));
        return headers;
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
}
