package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.Valid;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "books")
@Data
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookStatus status = BookStatus.SUBMITTED;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    @Column(updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "dhet_no")
    private String dhetNo;

    @Column(name = "original_or_photocopy")
    private String originalOrPhotocopy;

    @Column(name = "evidence_of_peer_review")
    private String evidenceOfPeerReview;

    @Column(name = "type_of_evidence")
    private String typeOfEvidence;

    @Column(name = "year_of_publication")
    private Integer yearOfPublication;

    @Column(nullable = false, name = "title_of_book")
    private String titleOfBook;

    private String editors;
    private String publisher;

    @Column(nullable = false)
    private String isbn;

    @Column(name = "field_of_research")
    private String fieldOfResearch;

    private String funders;

    @Column(name = "total_no_pages")
    private Integer totalNoPages;

    @Column(name = "start_page")
    private Integer startPage;

    @Column(name = "end_page")
    private Integer endPage;

    @Column(name = "total_pages_claimed")
    private Integer totalPagesClaimed;

    @Column(name = "max_units_for_publication")
    private Double maxUnitsForPublication;

    @Column(name = "total_proportion_of_authors")
    private Double totalProportionOfAuthors;

    @Column(length = 2000, name = "other_authors_non_affiliated")
    private String otherAuthorsNonAffiliated;

    @Column(name = "author_count")
    private Integer authorCount;

    @Column(name = "total_units_claimed")
    private Double totalUnitsClaimed;

    @Column(length = 2000, name = "additional_comments")
    private String additionalComments;

    @Column(name = "dhet_accepted")
    private Boolean dhetAccepted;

    @Column(name = "dhet_units_awarded")
    private Double dhetUnitsAwarded;

    @Column(length = 2000, name = "dhet_comments")
    private String dhetComments;

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    @Valid
    @JsonManagedReference("book-authors")
    private List<Author> authors = new ArrayList<>();

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    @Valid
    private List<Attachment> attachments = new ArrayList<>();

    @JsonProperty("submittedBy")
    public Map<String, Object> getSubmittedByForJson() {
        if (submittedBy == null) {
            return null;
        }
        Map<String, Object> result = new HashMap<>();
        result.put("username", submittedBy.getUsername());
        return result;
    }

    @JsonSetter("evidenceOfPeerReview")
    public void setEvidenceOfPeerReviewFromJson(Object evidenceOfPeerReview) {
        if (evidenceOfPeerReview == null || String.valueOf(evidenceOfPeerReview).isBlank()) {
            this.evidenceOfPeerReview = null;
            return;
        }
        String normalized = String.valueOf(evidenceOfPeerReview).trim().toLowerCase();
        if (normalized.equals("yes") || normalized.equals("y") || normalized.equals("true") || normalized.equals("1")) {
            this.evidenceOfPeerReview = "Yes";
            return;
        }
        if (normalized.equals("no") || normalized.equals("n") || normalized.equals("false") || normalized.equals("0")) {
            this.evidenceOfPeerReview = "No";
            return;
        }
        // Keep original value if it's something else
        this.evidenceOfPeerReview = String.valueOf(evidenceOfPeerReview).trim();
    }

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = BookStatus.SUBMITTED;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}


