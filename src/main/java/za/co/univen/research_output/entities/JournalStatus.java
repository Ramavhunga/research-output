package za.co.univen.research_output.entities;

public enum JournalStatus {
    // Legacy status retained for compatibility with existing records; workflow ignores it.
    DRAFT,
    SUBMITTED,
    UNDER_REVIEW_L1,
    UNDER_REVIEW_L2,
    REJECTED_L1,
    REJECTED_L2,
    READY_FOR_POSTING,

    // Legacy statuses retained to avoid breaking older data rows.
    UNDER_REVIEW,
    REVISION_REQUIRED,
    APPROVED,
    REJECTED
}
