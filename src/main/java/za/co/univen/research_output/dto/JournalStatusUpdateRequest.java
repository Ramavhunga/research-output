package za.co.univen.research_output.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import za.co.univen.research_output.entities.JournalStatus;

@Data
public class JournalStatusUpdateRequest {
    @NotNull
    private JournalStatus status;
}

