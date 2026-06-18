package za.co.univen.research_output.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import za.co.univen.research_output.entities.ProceedingsStatus;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
public class ConferenceProceedingsListItemDto {
    private final Long id;
    private final String dhetNo;
    private final Integer yearOfPublication;
    private final ProceedingsStatus status;
    private final String titleOfContribution;
    private final String publisher;
    private final String isbn;
    private final String submittedByUsername;
    private final LocalDateTime updatedAt;

    public ConferenceProceedingsListItemDto(
            Long id,
            String dhetNo,
            Integer yearOfPublication,
            ProceedingsStatus status,
            String titleOfContribution,
            String publisher,
            String isbn,
            String submittedByUsername,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.dhetNo = dhetNo;
        this.yearOfPublication = yearOfPublication;
        this.status = status;
        this.titleOfContribution = titleOfContribution;
        this.publisher = publisher;
        this.isbn = isbn;
        this.submittedByUsername = submittedByUsername;
        this.updatedAt = updatedAt;
    }

    @JsonProperty("submittedBy")
    public Map<String, String> getSubmittedBy() {
        if (submittedByUsername == null || submittedByUsername.isBlank()) {
            return null;
        }
        return Map.of("username", submittedByUsername);
    }
}

