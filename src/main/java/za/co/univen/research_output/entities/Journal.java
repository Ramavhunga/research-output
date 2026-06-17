package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
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

    @Column(name = "dhet_no")
    private String dhetNo;

    private String year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JournalStatus status = JournalStatus.SUBMITTED;

    private String title;          // Article title

    @Column(name = "journal_title")
    private String journalTitle;   // Journal name

    private String publisher;

    @Column(name = "idx")
    private String index;

    // Stored as BIT in database: true="Yes", false="No", null="N/A"
    @Column(name = "comply")
    private String comply;


    private Integer volume;
    private Integer issue;

    private String issn;
    private String eissn;
    private String doi;

    private String urls;

    private String funders;

    @Column(name = "fieldofsearch")
    private String fieldofsearch;

    private Boolean openaccess;

    @Column(name = "dhet_accepted")
    private Boolean dhetAccepted;

    @Column(name = "dhet_units_awarded")
    private Double dhetUnitsAwarded;

    @Column(name = "dhet_comments")
    private String dhetComments;

    /* ================= NEW PUBLICATION FEE FIELDS ================= */
    @Column(name = "publicationfeedescription")
    private String publicationfeedescription;

    @Column(name = "publishercurrency")
    private String publishercurrency;

    @Column(name = "totalpublicationfeepublishercurrency")
    private Double totalpublicationfeepublishercurrency;

    @Column(name = "publicationfeearticle")
    private Double publicationfeearticle;

    @Column(name = "authorscontributionfee")
    private Double authorscontributionfee;

    @Column(name = "authorscontributionfeezar")
    private Double authorscontributionfeezar;

    // Separate from ClaimingAuthorsContribution.additionalComments.
    @Column(name = "journal_additional_comments")
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

    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @Column(nullable = false, name = "updated_at")
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


    @JsonSetter("openaccess")
    public void setOpenaccessFromJson(Object openaccess) {
        this.openaccess = parseYesNoBoolean(openaccess);
    }

    @JsonSetter("dhetAccepted")
    public void setDhetAcceptedFromJson(Object dhetAccepted) {
        this.dhetAccepted = parseYesNoBoolean(dhetAccepted);
    }

    private Boolean parseYesNoBoolean(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        String normalized = String.valueOf(value).trim().toLowerCase();
        if (normalized.equals("yes") || normalized.equals("y") || normalized.equals("true") || normalized.equals("1")) {
            return Boolean.TRUE;
        }
        if (normalized.equals("no") || normalized.equals("n") || normalized.equals("false") || normalized.equals("0")) {
            return Boolean.FALSE;
        }
        return null;
    }

    /* ================= GETTERS AND SETTERS ================= */
    // Generate getters and setters for all fields
}