package za.co.univen.research_output.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class Units {

    @Column(name = "max_units_for_publication")
    private Double maxUnitsForPublication;

    @Column(name = "total_proportion_of_authors")
    private Double totalProportionOfAuthors;

    @Column(name = "author_count")
    private Integer authorCount;

    @Column(name = "total_units_claimed")
    private Double totalUnitsClaimed;

    @Column(name = "other_authors_non_affiliates")
    private Integer otherAuthorsNonAffiliates;

}