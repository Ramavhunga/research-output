package za.co.univen.research_output.dto;

import lombok.Data;

import java.util.Date;

@Data
public class Staff {

    private String personNumber;
    private String surname;
    private String firstname;
    private String initials;
    private String title;
    private String postName;
    private String postType;
    private String departmentName;
    private String idNumber;
    private String passportNumber;
    private String supervisor;
    private String faculty;
    private Date birthDate;
    private String rankName;
    private String gender;
    private String maritalStatus;
    private String countryName;
    private String langauge;
    private Date appointmentDate;
    private Date resignationDate;
    private String permanentOrTemp;

}
