package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "journals")
@Data
public class Journal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String dhetNo;
    private String year;

    private String title;          // Article title
    private String journalTitle;   // Journal name

    private String publisher;

    @Column(name = "idx")
    private String index;

    private Boolean comply;

    private Integer volume;
    private Integer issue;

    private String issn;
    private String eissn;
    private String doi;

    private String urls;

    private String funders;
    private String fieldofsearch;
    private Boolean openaccess;

    /* ================= NEW PUBLICATION FEE FIELDS ================= */
    private String publicationfeedescription;         // formerly publicationfeedescription
    private String publishercurrency;                 // formerly publishercurrency
    private Double totalpublicationfeepublishercurrency;
    private Double publicationfeearticle;            // formerly publicationfeearticle
    private Double authorscontributionfee;
    private Double authorscontributionfeezar;

    /* ================= AUTHOR/UNITS ================= */
    private Double totalProportionOfAuthors;
    private Integer authorCount;

    @OneToMany(mappedBy = "journal", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Author> authors = new ArrayList<>();


//    @ElementCollection
//    @CollectionTable(name = "journal_funders", joinColumns = @JoinColumn(name = "journal_id"))
//    @Column(name = "funder")
//    private List<String> funders = new ArrayList<>();

    /* ================= EMBEDDED OBJECTS ================= */
    @Embedded
    private Units units;

    @Embedded
    private ClaimingAuthorsContribution claimingAuthorsContribution;

    /* ================= GETTERS AND SETTERS ================= */
    // Generate getters and setters for all fields
}