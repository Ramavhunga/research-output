package za.co.univen.research_output.dto;

import lombok.Data;

import java.util.List;

@Data
public class JournalDto {
    private Long id;
    private String dhetNo;
    private String year;
    private String title;
    private String publisher;
    private String index;
    private Boolean comply;
    private Integer volume;
    private Integer issue;
    private String issn;
    private String eSsn;
    private String doi;

    private List<AuthorDto> authors;
    private UnitsDto units;
    private ClaimingAuthorsContributionDto claimingAuthorsContribution;
}
