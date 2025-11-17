package za.co.univen.research_output.dto;

import lombok.Data;

@Data
public class ClaimingAuthorsContributionDto {
    private Double proportionOfAuthors;
    private Double authorUnitsClaimed;
    private String additionalComments;
}
