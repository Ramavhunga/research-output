package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conference_proceedings")
@Data
public class ConferenceProceedings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String dhetNo;
    private String originalOrPhotocopy;

    // Evidence Details
    private Boolean evidenceOfPeerReview;
    private String typeOfEvidence;

    // Publication Details
    private Integer yearOfPublication;
    private String titleOfProceeding;
    private String titleOfContribution;

    @Column(name = "complies_60_rule")
    private Boolean compliesWith60Rule;

    private String editorIfApplicable;
    private String publisher;
    private String issn;
    private String isbn;

    // Research Classification
    private String fieldOfResearch;   // renamed from fieldOfResearch (already correct, kept consistent)

    // Conference Dates and Location
    private LocalDate startDate;
    private LocalDate endDate;
    private String city;
    private String country;

    // Funding and Authors
    private String funders;
 //   private Double totalProportionOfAuthors;
  //  private Integer authorCount;
    private String additionalProceedingComments;

    /* ================= RELATIONSHIPS (UNCHANGED) ================= */
    @OneToMany(mappedBy = "conferenceProceedings", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("conference-authors")
    private List<Author> authors = new ArrayList<>();

    /* ================= EMBEDDED OBJECTS (UNCHANGED) ================= */
    @Embedded
    private Units units;

    @Embedded
    private ClaimingAuthorsContribution claimingAuthorsContribution;
}