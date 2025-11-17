package za.co.univen.research_output.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

@Embeddable
@Data
public class Units {
    private Double maxUnitsForPublication;
    private Double totalProportionOfAuthors;
    private Integer authorsCount;
    private Double totalUnitsClaimed;

    @Column(length = 2000)
    private String otherAuthorsNonAffiliates;

    @Column(length = 2000)
    private String additionalComments;
}
