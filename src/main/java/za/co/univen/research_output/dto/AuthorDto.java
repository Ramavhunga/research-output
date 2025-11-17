package za.co.univen.research_output.dto;

import lombok.Data;

@Data
public class AuthorDto {
    private Long id;
    private String studentEmployeeNo;
    private String firstName;
    private String surname;
    private String initials;
    private String gender;
    private String populationGroup;
    private String dob;               // yyyy-MM-dd as string
    private String orcid;
    private String countryOfBirth;
    private String saResidencyStatus;
    private Boolean disability;
    private String highestQualification;
    private String employmentStatus;
    private String department;
    private String faculty;
    private String academicTitle;
}
