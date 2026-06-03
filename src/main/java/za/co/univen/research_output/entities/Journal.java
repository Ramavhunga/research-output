package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
 import jakarta.validation.Valid;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "journals")
@Data
public class Journal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String dhetNo;
    private String year;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JournalStatus status = JournalStatus.SUBMITTED;

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
    private Boolean dhetAccepted;
    private Double dhetUnitsAwarded;
    private String dhetComments;

    /* ================= NEW PUBLICATION FEE FIELDS ================= */
    private String publicationfeedescription;         // formerly publicationfeedescription
    private String publishercurrency;                 // formerly publishercurrency
    private Double totalpublicationfeepublishercurrency;
    private Double publicationfeearticle;            // formerly publicationfeearticle
    private Double authorscontributionfee;
    private Double authorscontributionfeezar;

    // Separate from ClaimingAuthorsContribution.additionalComments.
    @Column(name = "journal_additional_comments", length = 2000)
    private String additionalComments;

    /* ================= AUTHOR/UNITS ================= */
//    private Double totalProportionOfAuthors;
//    private Integer authorCount;

    @OneToMany(mappedBy = "journal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Valid
    @JsonManagedReference("journal-authors")
    private List<Author> authors = new ArrayList<>();

    @OneToMany(mappedBy = "journal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Valid
    private List<Attachment> attachments = new ArrayList<>();

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @JsonProperty("submittedBy")
    public Map<String, Object> getSubmittedByForJson() {
        if (submittedBy == null) {
            return null;
        }
        Map<String, Object> result = new HashMap<>();
        result.put("username", submittedBy.getUsername());
        return result;
    }


//    @ElementCollection
//    @CollectionTable(name = "journal_funders", joinColumns = @JoinColumn(name = "journal_id"))
//    @Column(name = "funder")
//    private List<String> funders = new ArrayList<>();

    /* ================= EMBEDDED OBJECTS ================= */
    @Embedded
    private Units units;

    @Embedded
    private ClaimingAuthorsContribution claimingAuthorsContribution;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = JournalStatus.SUBMITTED;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /* ================= GETTERS AND SETTERS ================= */
    // Generate getters and setters for all fields
}