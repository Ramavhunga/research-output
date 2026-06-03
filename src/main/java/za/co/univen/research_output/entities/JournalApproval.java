package za.co.univen.research_output.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "journal_approvals")
@Data
public class JournalApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_id", nullable = false)
    private Journal journal;

    @Column(name = "action_by", nullable = false)
    private String actionBy;

    @Column(name = "action_role", nullable = false)
    private String actionRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    private JournalApprovalAction action;

    @Column(name = "comments", length = 2000)
    private String comments;

    @Column(name = "action_date", nullable = false)
    private LocalDateTime actionDate;

    @PrePersist
    public void prePersist() {
        if (actionDate == null) {
            actionDate = LocalDateTime.now();
        }
    }
}

