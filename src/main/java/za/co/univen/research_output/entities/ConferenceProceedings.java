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
    private String dhetNo;                          // The unique identifier of the conference paper record
    private String originalOrPhotocopy;             // Original / O or Photocopy / P

    // Evidence Details
    private Boolean evidenceOfPeerReview;           // Yes / No
    private String typeOfEvidence;                  // Type of evidence that provides proof of peer review

    // Publication Details
    private Integer yearOfPublication;              // Year in which the article was published in conference proceeding
    private String titleOfProceeding;               // Title of the conference proceeding
    private String titleOfContribution;             // Full title of submission / paper as it appears in proceeding

    @Column(name = "complies_60_rule")
    private Boolean compliesWith60Rule;             // Signed letter from DVC confirming 60% rule

    private String editorIfApplicable;              // Volume number of the journal
    private String publisher;                       // Publisher of the journal
    private String issn;                            // ISSN
    private String isbn;                            // ISBN

    // Research Classification
    private String fieldOfResearch;                 // Research field(s) - separate multiple values with semi-colons (;)

    // Conference Dates and Location
    private LocalDate startDate;                    // First day of conference (YYYY-MM-DD)
    private LocalDate endDate;                      // Last day of conference (YYYY-MM-DD)
    private String city;                            // City where conference was hosted
    private String country;                         // Country where conference was hosted

    // Funding and Authors
    private String funders;                         // Funder(s) - separate multiple funders with semi-colons (;)
    private Double maxUnitsForPublication;          // Maximum number of units for the article (0.5 or 1.0)
    private Double totalProportionOfAuthors;        // Decimal value between 0 and 1 - sum of all authors
    private Integer authorCount;                    // Total number of authors
    private Double totalUnitsClaimed;               // Decimal value between 0 and 1

    // Additional Information
    private String otherAuthorsNonAffiliatedSemicolon;  // List of other contributing authors
    private String additionalComments;              // Additional comments for DHET and/or panel reviewers

    // Author relationships
    @OneToMany(mappedBy = "conferenceProceedings", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Author> authors = new ArrayList<>();

    // Embedded objects for units calculation
    @Embedded
    private Units units;

    @Embedded
    private ClaimingAuthorsContribution claimingAuthorsContribution;

}

