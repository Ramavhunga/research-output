package za.co.univen.research_output.dto;

import lombok.Data;

import java.util.List;
@Data
public class JournalDto {

    private Long id;
    private String dhetNo;
    private String year;
    private String title;
    private String journalTitle;
    private String publisher;
    private String index;

    private String comply;
    private Integer volume;
    private Integer issue;

    private String issn;
    private String eSsn;
    private String doi;
    private String url;

    private String openaccess;

    private List<String> fieldofsearch;

    private String publicationfeedescription;
    private String publishercurrency;
    private String publicationfeearticle;

    private Double authorsContributionFee;
    private Double authorsContributionFeeZar;

    private List<String> funders;

    private Integer maxUnitsForPublication;
    private Double totalProportionOfAuthors;
    private Integer authorCount;
    private Double totalUnitsClaimed;

    private List<AuthorDto> authors;

    private List<OtherAuthorDto> otherAuthorsNonAffiliated;

    private ClaimingAuthorsContributionDto claimingAuthorsContribution;

    private String additionalComments;
}
