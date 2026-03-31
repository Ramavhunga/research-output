package za.co.univen.research_output.controller;

import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.dto.Login;
import za.co.univen.research_output.dto.LoginDTO;
import za.co.univen.research_output.dto.User;
import za.co.univen.research_output.services.UserService;

@RestController
@RequestMapping("user")
@CrossOrigin("*")
public class UserController {

    private final UserService userService;


    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping(path="login")
    private LoginDTO getUser(@RequestBody User user) throws Exception
    {
        return this.userService.itsLogin( user );
    }


}
