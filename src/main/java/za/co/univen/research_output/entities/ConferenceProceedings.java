package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "conference_proceedings")
@Data
public class ConferenceProceedings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProceedingsStatus status = ProceedingsStatus.SUBMITTED;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private String username;

    @Column(name = "dhet_no")
    private String dhetNo;

    @Column(name = "original_or_photocopy")
    private String originalOrPhotocopy;

    // Evidence Details
    @Column(name = "evidence_of_peer_review")
    private Boolean evidenceOfPeerReview;

    @Column(name = "type_of_evidence")
    private String typeOfEvidence;

    // Publication Details
    @Column(name = "year_of_publication")
    private Integer yearOfPublication;

    @Column(name = "title_of_proceeding")
    private String titleOfProceeding;

    @Column(name = "title_of_contribution")
    private String titleOfContribution;

    @Column(name = "complies_60_rule")
    private Boolean compliesWith60Rule;

    @Column(name = "editor_if_applicable")
    private String editorIfApplicable;

    private String publisher;
    private String issn;
    private String isbn;

    // Research Classification
    @Column(name = "field_of_research")
    private String fieldOfResearch;

    // Conference Dates and Location
    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    private String city;
    private String country;

    // Funding and Authors
    private String funders;

    @Column(name = "additional_proceeding_comments")
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

    @JsonProperty("submittedBy")
    public Map<String, Object> getSubmittedByForJson() {
        if (submittedBy == null) {
            return null;
        }
        Map<String, Object> result = new HashMap<>();
        result.put("username", submittedBy.getUsername());
        return result;
    }

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = ProceedingsStatus.SUBMITTED;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @JsonSetter("evidenceOfPeerReview")
    public void setEvidenceOfPeerReviewFromJson(Object evidenceOfPeerReview) {
        if (evidenceOfPeerReview == null) {
            this.evidenceOfPeerReview = null;
            return;
        }
        if (evidenceOfPeerReview instanceof Boolean bool) {
            this.evidenceOfPeerReview = bool;
            return;
        }
        String normalized = String.valueOf(evidenceOfPeerReview).trim().toLowerCase();
        if (normalized.equals("yes") || normalized.equals("y") || normalized.equals("true") || normalized.equals("1")) {
            this.evidenceOfPeerReview = Boolean.TRUE;
            return;
        }
        if (normalized.equals("no") || normalized.equals("n") || normalized.equals("false") || normalized.equals("0")) {
            this.evidenceOfPeerReview = Boolean.FALSE;
            return;
        }
        this.evidenceOfPeerReview = null;
    }

    @JsonSetter("compliesWith60Rule")
    public void setCompliesWith60RuleFromJson(Object compliesWith60Rule) {
        if (compliesWith60Rule == null) {
            this.compliesWith60Rule = null;
            return;
        }
        if (compliesWith60Rule instanceof Boolean bool) {
            this.compliesWith60Rule = bool;
            return;
        }
        String normalized = String.valueOf(compliesWith60Rule).trim().toLowerCase();
        if (normalized.equals("yes") || normalized.equals("y") || normalized.equals("true") || normalized.equals("1")) {
            this.compliesWith60Rule = Boolean.TRUE;
            return;
        }
        if (normalized.equals("no") || normalized.equals("n") || normalized.equals("false") || normalized.equals("0")) {
            this.compliesWith60Rule = Boolean.FALSE;
            return;
        }
        this.compliesWith60Rule = null;
    }
}
