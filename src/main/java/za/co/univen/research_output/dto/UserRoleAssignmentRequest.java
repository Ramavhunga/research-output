package za.co.univen.research_output.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.Set;

@Data
public class UserRoleAssignmentRequest {
    @NotEmpty
    private Set<String> roles;
}

