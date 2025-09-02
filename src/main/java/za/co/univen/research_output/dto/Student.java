package za.co.univen.research_output.dto;

import lombok.Data;

import java.util.Date;


@Data
public class Student {

    private String studentNumber;
    private String surname;
    private String firstNames;
    private String qualificationCode;
    private String qualificationName;
    private String departmentCode;
    private String departmentName;
    private String facultyCode;
    private String facultyName;
    private String gender;
    private String initials;
    private Date dateOfBirth;
    private String idNumber;

}
