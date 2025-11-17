package za.co.univen.research_output.dto;

import lombok.Data;

@Data
public class UnitsDto {
    private Double maxUnitsForPublication;
    private Double totalProportionOfAuthors;
    private Integer authorsCount;
    private Double totalUnitsClaimed;
    private String otherAuthorsNonAffiliates;
    private String additionalComments;
}
