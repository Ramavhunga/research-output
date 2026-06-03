package za.co.univen.research_output.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

@Data
@AllArgsConstructor
public class UserRoleView {
    private Long id;
    private String username;
    private String email;
    private Set<String> roles;
}

