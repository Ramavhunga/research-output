package za.co.univen.research_output.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class ClaimingAuthorsContribution {

    @Column(name = "proportion_of_authors")
    private Double proportionOfAuthors;

    @Column(name = "author_units_claimed")
    private Double authorUnitsClaimed;

    @Column(name = "additional_comments", length = 2000)
    private String additionalComments;

}