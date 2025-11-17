package za.co.univen.research_output.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

@Embeddable
@Data
public class ClaimingAuthorsContribution {
    private Double proportionOfAuthors;
    private Double authorUnitsClaimed;

    @Column(length = 2000)
    private String additionalComment;
}
