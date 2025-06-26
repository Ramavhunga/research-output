package za.co.univen.research_output.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Review implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private ResearchOutput researchOutput;

    @ManyToOne
    private Reviewer reviewer;

    private String comments;
    private LocalDateTime reviewedAt;
    private boolean approved;
}
