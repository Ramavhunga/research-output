package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "authors")
@Data
public class Author {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String studentEmployeeNo;
    private Boolean affiliation;
    @NotBlank(message = "First name is required")
    private String firstName;
    @NotBlank(message = "Surname is required")
    private String surname;
    private String initials;
    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
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
    private Double authorShare = 0d;
    private Double totalUnitsClaimed = 0d;

    /* ================= RELATION ================= */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @ManyToOne
    @JoinColumn(name = "journal_id")
    @JsonBackReference("journal-authors")
    private Journal journal;
    @JsonIgnoreProperties(ignoreUnknown = true)
    @ManyToOne
   // @JoinColumn(name = "conference_proceedings_id")
    @JsonBackReference("conference-authors")
    private ConferenceProceedings conferenceProceedings;

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("author-university-affiliations")
    @Valid
    private List<UniversityAffiliation> universityAffiliations = new ArrayList<>();

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("author-research-affiliations")
    @Valid
    private List<ResearchAffiliation> researchAffiliations = new ArrayList<>();

}