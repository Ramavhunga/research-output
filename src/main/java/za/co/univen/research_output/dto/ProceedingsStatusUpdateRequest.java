package za.co.univen.research_output.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import za.co.univen.research_output.entities.ProceedingsStatus;

@Data
public class ProceedingsStatusUpdateRequest {
    @NotNull
    private ProceedingsStatus status;
}

