package za.co.univen.research_output.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDeanDTO {
    private Long id;
    private Long departmentId;
    private String departmentCode;
    private String departmentName;
    private String staffNo;
    private String title;
    private String firstname;
    private String surname;
    private String faculty;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

