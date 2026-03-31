package za.co.univen.research_output.entities;

import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class ClaimingAuthorsContribution {

    private Double proportionOfAuthors;
    private Double authorUnitsClaimed;
    private String additionalComments;

}