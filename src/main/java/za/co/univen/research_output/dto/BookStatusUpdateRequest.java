package za.co.univen.research_output.dto;

import jakarta.validation.constraints.NotNull;
import za.co.univen.research_output.entities.BookStatus;

public class BookStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private BookStatus status;

    public BookStatus getStatus() {
        return status;
    }

    public void setStatus(BookStatus status) {
        this.status = status;
    }
}

