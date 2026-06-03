package za.co.univen.research_output.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

@Data
@AllArgsConstructor
public class StaffRoleView {
    private String staffNo;
    private String title;
    private String firstname;
    private String surname;
    private String initials;
    private String departmentName;
    private String faculty;
    private Set<String> roles;

    public static StaffRoleView from(LoginDTO loginDTO, String staffNo, Set<String> roles) {
        Staff staff = loginDTO.getStaff();
        return new StaffRoleView(
                staffNo,
                staff == null ? null : staff.getTitle(),
                staff == null ? null : staff.getFirstname(),
                staff == null ? null : staff.getSurname(),
                staff == null ? null : staff.getInitials(),
                staff == null ? null : staff.getDepartmentName(),
                staff == null ? null : staff.getFaculty(),
                roles
        );
    }
}

