package za.co.univen.research_output.services;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import za.co.univen.research_output.entities.User;
import za.co.univen.research_output.repositories.UserRepository;

import java.security.Principal;
import java.util.Locale;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getLoggedInUser(Principal principal) {
        String username = resolveUsername(principal);
        return userRepository.findByUsername(username)
                .orElseGet(() -> createDefaultUser(username));
    }

    public String getRole(Principal principal) {
        User user = getLoggedInUser(principal);
        return (user.getRole() == null ? "RESEARCHER" : user.getRole()).toUpperCase(Locale.ROOT);
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
        user.setRole("RESEARCHER");
        return userRepository.save(user);
    }
}

