package za.co.univen.research_output.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.dto.LoginDTO;
import za.co.univen.research_output.dto.StaffRoleView;
import za.co.univen.research_output.dto.User;
import za.co.univen.research_output.dto.UserRoleAssignmentRequest;
import za.co.univen.research_output.dto.UserRoleView;
import za.co.univen.research_output.services.CurrentUserService;
import za.co.univen.research_output.services.UserService;

import java.util.List;

@RestController
@RequestMapping("user")
public class UserController {

    private final UserService userService;
    private final CurrentUserService currentUserService;

    public UserController(UserService userService, CurrentUserService currentUserService) {
        this.userService = userService;
        this.currentUserService = currentUserService;
    }

    @PostMapping(path = "login")
    private LoginDTO getUser(@RequestBody User user) throws Exception {
        return this.userService.ImpersonateLogin(user);
    }

    @GetMapping(path = "roles")
    public List<UserRoleView> listUsersWithRoles() {
        return userService.listUsersWithRoles();
    }

    @PutMapping(path = "roles/{username}")
    public UserRoleView assignRoles(
            @PathVariable String username,
            @Valid @RequestBody UserRoleAssignmentRequest request
    ) {
        za.co.univen.research_output.entities.User updated = currentUserService.assignRoles(username, request.getRoles());
        return new UserRoleView(updated.getId(), updated.getUsername(), updated.getEmail(), currentUserService.getRoles(updated));
    }

    @GetMapping(path = "roles/staff/{staffNo}")
    public StaffRoleView findStaffForRoleAssignment(@PathVariable String staffNo) throws Exception {
        return userService.loadStaffRoleByStaffNo(staffNo);
    }

    @PutMapping(path = "roles/staff/{staffNo}")
    public StaffRoleView assignReviewerRolesByStaffNo(
            @PathVariable String staffNo,
            @Valid @RequestBody UserRoleAssignmentRequest request
    ) throws Exception {
        return userService.assignReviewerRolesByStaffNo(staffNo, request.getRoles());
    }

    @GetMapping(path = "student-info/{studentNo}")
    public LoginDTO getStudentInfo(@PathVariable String studentNo) throws Exception {
        return userService.loadStudentOrStaffByNumber(studentNo);
    }
}
