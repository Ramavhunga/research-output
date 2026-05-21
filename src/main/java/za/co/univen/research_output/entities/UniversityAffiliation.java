package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Entity
@Table(name = "university_affiliations")
@Data
public class UniversityAffiliation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String universityCode;

    @NotBlank(message = "University name is required")
    private String universityName;

    private Boolean isUniven = false;

    private Boolean isInternationalUniversity = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    @JsonBackReference("author-university-affiliations")
    private Author author;
}


