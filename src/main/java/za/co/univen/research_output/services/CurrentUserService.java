package za.co.univen.research_output.services;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import za.co.univen.research_output.entities.User;
import za.co.univen.research_output.repositories.UserRepository;

import java.security.Principal;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CurrentUserService {

        private static final String ADMIN_STAFF_NO = "16211";

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getLoggedInUser(Principal principal) {
        String username = resolveUsername(principal);
        return userRepository.findByUsername(username)
                .orElseGet(() -> createDefaultUser(username));
    }

    public User getOrCreateUserByUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new SecurityException("Username is required");
        }
        String trimmed = username.trim();
        return userRepository.findByUsername(trimmed)
                .orElseGet(() -> createDefaultUser(trimmed));
    }

    public Set<String> getRoles(User user) {
        if (user == null) {
            return Set.of("REQUESTOR");
        }

        Set<String> roles = (user.getRole() == null || user.getRole().isBlank())
                ? new LinkedHashSet<>(Set.of("REQUESTOR"))
                : Arrays.stream(user.getRole().split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(value -> value.toUpperCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (ADMIN_STAFF_NO.equals(user.getUsername())) {
            roles.add("ADMIN");
        }

        expandRoleAliases(roles);

        return roles;
    }

    public boolean hasAnyRole(User user, String... requiredRoles) {
        Set<String> currentRoles = getRoles(user);
        for (String requiredRole : requiredRoles) {
            if (currentRoles.contains(requiredRole.toUpperCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    public User assignRoles(String username, Set<String> roles) {
        User user = getOrCreateUserByUsername(username);
        String normalized = roles.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.trim().toUpperCase(Locale.ROOT))
                .distinct()
                .collect(Collectors.joining(","));
        user.setRole(normalized);
        return userRepository.save(user);
    }

    public String getRole(Principal principal) {
        User user = getLoggedInUser(principal);
        return getRoles(user).stream().findFirst().orElse("REQUESTOR");
    }

    private String resolveUsername(Principal principal) {
        if (principal != null && principal.getName() != null && !principal.getName().isBlank()) {
            return principal.getName();
        }

        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes servletAttrs) {
            HttpServletRequest req = servletAttrs.getRequest();
            String fromHeader = req.getHeader("X-Username");
            if (fromHeader == null || fromHeader.isBlank()) {
                fromHeader = req.getHeader("X-User");
            }
            if (fromHeader != null && !fromHeader.isBlank()) {
                return fromHeader.trim();
            }
        }

        throw new SecurityException("Authenticated user is required");
    }

    private User createDefaultUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@local");
        user.setRole("REQUESTOR");
        return userRepository.save(user);
    }

    private void expandRoleAliases(Set<String> roles) {
        if (roles.contains("ADMINISTRATOR")) {
            roles.add("ADMIN");
        }
        if (roles.contains("LEVEL_1_APPROVER")) {
            roles.add("REVIEWER_LEVEL_1");
        }
        if (roles.contains("LEVEL_2_APPROVER")) {
            roles.add("REVIEWER_LEVEL_2");
        }
    }
}
