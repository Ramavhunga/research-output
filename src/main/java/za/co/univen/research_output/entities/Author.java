package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "authors")
@Data
public class Author {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String studentEmployeeNo;
    private Boolean affiliation;
    private String firstName;
    private String surname;
    private String initials;
    private String email;
    private String gender;
    private String populationGroup;
    private String dob;
    public String dobDay;
    public String dobMonth;
    private String orcid;
    private String countryOfBirth;
    private String saResidencyStatus;
    private Long departmentId;
    private Long facultyId;
    private Boolean disability;

    private String highestQualification;
    private String employmentStatus;

    private String department;
    private String faculty;
    private String academicTitle;

    /* ================= RELATION ================= */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @ManyToOne
    @JoinColumn(name = "journal_id")
    @JsonBackReference
    private Journal journal;
    @JsonIgnoreProperties(ignoreUnknown = true)
    @ManyToOne
    @JoinColumn(name = "conference_proceedings_id")
    @JsonBackReference
    private ConferenceProceedings conferenceProceedings;

}