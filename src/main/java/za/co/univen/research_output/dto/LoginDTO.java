package za.co.univen.research_output.dto;

import lombok.Data;


@Data
public class LoginDTO {
    private User user;
    private Staff staff;
    private Student student;
    private Communication communication;
}
