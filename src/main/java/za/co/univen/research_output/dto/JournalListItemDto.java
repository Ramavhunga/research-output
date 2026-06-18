package za.co.univen.research_output.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import za.co.univen.research_output.entities.JournalStatus;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
public class JournalListItemDto {
    private final Long id;
    private final String dhetNo;
    private final String year;
    private final JournalStatus status;
    private final String title;
    private final String publisher;
    private final String doi;
    private final String submittedByUsername;
    private final LocalDateTime updatedAt;

    public JournalListItemDto(
            Long id,
            String dhetNo,
            String year,
            JournalStatus status,
            String title,
            String publisher,
            String doi,
            String submittedByUsername,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.dhetNo = dhetNo;
        this.year = year;
        this.status = status;
        this.title = title;
        this.publisher = publisher;
        this.doi = doi;
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

