package za.co.univen.research_output.dto;

import lombok.Data;


@Data
public class Login {

    private String username;
    private String password;
    private String roles;

}
