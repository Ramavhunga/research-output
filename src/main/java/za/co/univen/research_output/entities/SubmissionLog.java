package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class SubmissionLog  implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;

    private LocalDateTime timestamp;
    private String action;
    private String performedBy;
    private String fromStatus;
    private String toStatus;
    private String comments;

    @JsonIgnore
    @ManyToOne
    private ResearchOutput researchOutput;

    @JsonIgnore
    @ManyToOne
    private Book book;

    @JsonIgnore
    @ManyToOne
    private ConferenceProceedings conferenceProceedings;

    @JsonIgnore
    @ManyToOne
    private Chapter chapter;
}
