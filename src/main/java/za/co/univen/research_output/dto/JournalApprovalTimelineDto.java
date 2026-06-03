package za.co.univen.research_output.dto;

import lombok.Data;
import za.co.univen.research_output.entities.JournalApprovalAction;

import java.time.LocalDateTime;

@Data
public class JournalApprovalTimelineDto {
    private Long id;
    private Long journalId;
    private String actionBy;
    private String actionRole;
    private JournalApprovalAction action;
    private String comments;
    private LocalDateTime actionDate;
}

