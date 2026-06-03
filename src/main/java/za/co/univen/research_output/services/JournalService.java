package za.co.univen.research_output.services;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.dto.JournalApprovalTimelineDto;
import za.co.univen.research_output.entities.Attachment;
import za.co.univen.research_output.entities.Author;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.entities.JournalApproval;
import za.co.univen.research_output.entities.JournalApprovalAction;
import za.co.univen.research_output.entities.JournalStatus;
import za.co.univen.research_output.entities.User;
import za.co.univen.research_output.repositories.JournalApprovalRepository;
import za.co.univen.research_output.repositories.JournalRepository;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class JournalService {

    private final JournalRepository repository;
    private final JournalApprovalRepository approvalRepository;
    private final CurrentUserService currentUserService;
    private final JournalUnitCalculationService unitCalculationService;

    private static final Map<JournalStatus, List<JournalStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(JournalStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(JournalStatus.SUBMITTED, List.of(JournalStatus.UNDER_REVIEW_L1));
        ALLOWED_TRANSITIONS.put(JournalStatus.UNDER_REVIEW_L1, List.of(JournalStatus.UNDER_REVIEW_L2, JournalStatus.REJECTED_L1));
        ALLOWED_TRANSITIONS.put(JournalStatus.UNDER_REVIEW_L2, List.of(JournalStatus.READY_FOR_POSTING, JournalStatus.REJECTED_L2));
        ALLOWED_TRANSITIONS.put(JournalStatus.REJECTED_L1, List.of(JournalStatus.UNDER_REVIEW_L1));
        ALLOWED_TRANSITIONS.put(JournalStatus.REJECTED_L2, List.of(JournalStatus.UNDER_REVIEW_L1));
        ALLOWED_TRANSITIONS.put(JournalStatus.READY_FOR_POSTING, List.of());

        // Legacy transitions retained to avoid breaking older clients while migrating.
        ALLOWED_TRANSITIONS.put(JournalStatus.DRAFT, List.of(JournalStatus.SUBMITTED));
        ALLOWED_TRANSITIONS.put(JournalStatus.UNDER_REVIEW, List.of(JournalStatus.APPROVED, JournalStatus.REJECTED, JournalStatus.REVISION_REQUIRED));
        ALLOWED_TRANSITIONS.put(JournalStatus.REVISION_REQUIRED, List.of(JournalStatus.SUBMITTED));
        ALLOWED_TRANSITIONS.put(JournalStatus.APPROVED, List.of());
        ALLOWED_TRANSITIONS.put(JournalStatus.REJECTED, List.of());
    }

    public JournalService(
            JournalRepository repository,
            JournalApprovalRepository approvalRepository,
            CurrentUserService currentUserService,
            JournalUnitCalculationService unitCalculationService
    ) {
        this.repository = repository;
        this.approvalRepository = approvalRepository;
        this.currentUserService = currentUserService;
        this.unitCalculationService = unitCalculationService;
    }

    @Transactional
    public Journal createOrUpdate(Journal payload, String username) {
        User currentUser = currentUserService.getOrCreateUserByUsername(username);

        Journal journal = payload;
        if (journal.getId() != null) {
            Journal existing = getById(journal.getId());
            enforceEditable(existing, currentUser);
            // Preserve original requestor ownership for updates.
            journal.setSubmittedBy(existing.getSubmittedBy());
            if (journal.getStatus() == null) {
                journal.setStatus(existing.getStatus());
            }
        } else {
            journal.setStatus(journal.getStatus() == null ? JournalStatus.SUBMITTED : journal.getStatus());
            journal.setSubmittedBy(currentUser);
        }

        validateBeforeSave(journal);
        unitCalculationService.recalculate(journal);
        linkGraph(journal);

        Journal saved = repository.save(journal);

        if (saved.getId() != null) {
            String mappedDhetNo = formatDhetNo(saved.getId());
            if (!mappedDhetNo.equals(saved.getDhetNo())) {
                saved.setDhetNo(mappedDhetNo);
                saved = repository.save(saved);
            }
        }

        return saved;
    }

    @Transactional
    public Journal submitForReview(Long id, String username, String comments) {
        Journal journal = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        if (!isOwner(journal, currentUser)) {
            throw new SecurityException("Only the requestor can submit this journal");
        }

        JournalStatus status = journal.getStatus();
        if (status != JournalStatus.SUBMITTED
                && status != JournalStatus.REJECTED_L1
                && status != JournalStatus.REJECTED_L2
                && status != JournalStatus.DRAFT) {
            throw new IllegalStateException("Journal cannot be submitted from status " + status);
        }

        journal.setStatus(JournalStatus.UNDER_REVIEW_L1);
        Journal saved = repository.save(journal);
        addApprovalLog(saved, currentUser, JournalApprovalAction.SUBMITTED, comments);
        return saved;
    }

    @Transactional
    public Journal approve(Long id, String username, String comments) {
        Journal journal = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        String normalizedComments = requireComments(comments, "Approval comments are required");

        JournalStatus current = journal.getStatus();
        if ((current == JournalStatus.SUBMITTED || current == JournalStatus.UNDER_REVIEW_L1)
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1", "ADMIN")) {
            journal.setStatus(JournalStatus.UNDER_REVIEW_L2);
        } else if (current == JournalStatus.UNDER_REVIEW_L2 && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2", "ADMIN")) {
            journal.setStatus(JournalStatus.READY_FOR_POSTING);
        } else {
            throw new SecurityException("You are not allowed to approve this journal at status " + current);
        }

        Journal saved = repository.save(journal);
        addApprovalLog(saved, currentUser, JournalApprovalAction.APPROVED, normalizedComments);
        return saved;
    }

    @Transactional
    public Journal reject(Long id, String username, String comments) {
        Journal journal = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        String normalizedComments = requireComments(comments, "Rejection comments are required");

        JournalStatus current = journal.getStatus();
        if ((current == JournalStatus.SUBMITTED || current == JournalStatus.UNDER_REVIEW_L1)
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1", "ADMIN")) {
            journal.setStatus(JournalStatus.REJECTED_L1);
        } else if (current == JournalStatus.UNDER_REVIEW_L2 && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2", "ADMIN")) {
            journal.setStatus(JournalStatus.REJECTED_L2);
        } else {
            throw new SecurityException("You are not allowed to reject this journal at status " + current);
        }

        Journal saved = repository.save(journal);
        addApprovalLog(saved, currentUser, JournalApprovalAction.REJECTED, normalizedComments);
        return saved;
    }

    @Transactional
    public Journal transitionStatus(Long id, JournalStatus newStatus, String username) {
        Journal journal = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        JournalStatus current = journal.getStatus();

        if (current == newStatus) {
            return journal;
        }

        List<JournalStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(current, List.of());
        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException("Invalid status transition from " + current + " to " + newStatus);
        }

        // Preserve backward-compatible endpoint but enforce strict roles on two-level statuses.
        if ((newStatus == JournalStatus.UNDER_REVIEW_L2 || newStatus == JournalStatus.REJECTED_L1)
                && !currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1", "ADMIN")) {
            throw new SecurityException("Only REVIEWER_LEVEL_1 or ADMIN can set status to " + newStatus);
        }
        if ((newStatus == JournalStatus.READY_FOR_POSTING || newStatus == JournalStatus.REJECTED_L2)
                && !currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2", "ADMIN")) {
            throw new SecurityException("Only REVIEWER_LEVEL_2 or ADMIN can set status to " + newStatus);
        }

        journal.setStatus(newStatus);
        return repository.save(journal);
    }

    @Transactional
    public Journal getById(Long id) {
        Journal journal = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Journal not found: " + id));
        initializeJournalGraph(journal);
        return journal;
    }

    @Transactional
    public Journal getByIdForExport(Long id) {
        Journal journal = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Journal not found: " + id));

        if (journal.getAuthors() != null) {
            journal.getAuthors().forEach(author -> {
                if (author.getUniversityAffiliations() != null) {
                    author.getUniversityAffiliations().size();
                }
                if (author.getResearchAffiliations() != null) {
                    author.getResearchAffiliations().size();
                }
            });
        }

        return journal;
    }

    @Transactional
    public List<Journal> findAll(String year, JournalStatus status, Long facultyId) {
        return repository.search(year, status, facultyId);
    }

    @Transactional
    public List<Journal> findAllForUser(String username) {
        return repository.findBySubmittedByUsername(username);
    }

    @Transactional
    public List<JournalApprovalTimelineDto> getApprovalTimeline(Long journalId) {
        return approvalRepository.findByJournalIdOrderByActionDateAsc(journalId)
                .stream()
                .map(this::toTimelineDto)
                .toList();
    }

    public boolean existsByTitleAndIssn(String title, String issn) {
        return repository.existsByTitleAndIssn(title, issn);
    }

    private void validateBeforeSave(Journal journal) {
        if (journal.getAuthors() == null || journal.getAuthors().isEmpty()) {
            throw new IllegalArgumentException("At least one author is required");
        }

        boolean hasAffiliated = journal.getAuthors().stream().anyMatch(a -> Boolean.TRUE.equals(a.getAffiliation()));
        if (!hasAffiliated) {
            throw new IllegalArgumentException("At least one affiliated author is required");
        }

        for (Author author : journal.getAuthors()) {
            if (isBlank(author.getFirstName()) || isBlank(author.getSurname()) || isBlank(author.getEmail())) {
                throw new IllegalArgumentException("Author firstName, surname and email are required");
            }
        }
    }

    private void linkGraph(Journal journal) {
        if (journal.getAuthors() != null) {
            journal.getAuthors().forEach(author -> {
                author.setJournal(journal);
                if (author.getUniversityAffiliations() != null) {
                    author.getUniversityAffiliations().forEach(univ -> {
                        if (isBlank(univ.getUniversityName())) {
                            throw new IllegalArgumentException("University name is required");
                        }
                        univ.setAuthor(author);
                    });
                }
                if (author.getResearchAffiliations() != null) {
                    author.getResearchAffiliations().forEach(affiliation -> affiliation.setAuthor(author));
                }
            });
        }

        if (journal.getAttachments() != null) {
            for (Attachment attachment : journal.getAttachments()) {
                attachment.setJournal(journal);
            }
        }
    }

    private void enforceEditable(Journal existing, User currentUser) {
        JournalStatus status = existing.getStatus();

        if (status == JournalStatus.READY_FOR_POSTING) {
            throw new IllegalStateException("Journal is locked and cannot be edited at status " + status);
        }

        boolean isAdmin = currentUserService.hasAnyRole(currentUser, "ADMIN");
        if (isAdmin) {
            return;
        }

        boolean isReviewerL1 = currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1");
        boolean isReviewerL2 = currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2");

        if (isReviewerL1 || isReviewerL2) {
            boolean l1Stage = status == JournalStatus.SUBMITTED || status == JournalStatus.UNDER_REVIEW_L1;
            boolean l2Stage = status == JournalStatus.UNDER_REVIEW_L2;

            if ((isReviewerL1 && l1Stage) || (isReviewerL2 && l2Stage)) {
                return;
            }

            throw new SecurityException("You can only edit journals assigned to your review level at status " + status);
        }

        if (!isOwner(existing, currentUser)) {
            throw new SecurityException("Only the requestor or assigned approver can edit this journal");
        }

        if (status != JournalStatus.REJECTED
                && status != JournalStatus.REJECTED_L1
                && status != JournalStatus.REJECTED_L2) {
            throw new IllegalStateException("Requestor can only edit rejected journals. Current status is " + status);
        }
    }

    private boolean isOwner(Journal journal, User currentUser) {
        return journal.getSubmittedBy() != null
                && currentUser.getUsername() != null
                && currentUser.getUsername().equalsIgnoreCase(journal.getSubmittedBy().getUsername());
    }

    private void addApprovalLog(Journal journal, User actor, JournalApprovalAction action, String comments) {
        JournalApproval approval = new JournalApproval();
        approval.setJournal(journal);
        approval.setActionBy(actor.getUsername());
        approval.setActionRole(String.join(",", currentUserService.getRoles(actor)));
        approval.setAction(action);
        approval.setComments(comments);
        approvalRepository.save(approval);
    }

    private JournalApprovalTimelineDto toTimelineDto(JournalApproval approval) {
        JournalApprovalTimelineDto dto = new JournalApprovalTimelineDto();
        dto.setId(approval.getId());
        dto.setJournalId(approval.getJournal() == null ? null : approval.getJournal().getId());
        dto.setActionBy(approval.getActionBy());
        dto.setActionRole(approval.getActionRole());
        dto.setAction(approval.getAction());
        dto.setComments(approval.getComments());
        dto.setActionDate(approval.getActionDate());
        return dto;
    }

    private void initializeJournalGraph(Journal journal) {
        if (journal.getSubmittedBy() != null) {
            journal.getSubmittedBy().getUsername();
        }

        if (journal.getAttachments() != null) {
            journal.getAttachments().size();
        }

        if (journal.getAuthors() != null) {
            journal.getAuthors().forEach(author -> {
                if (author.getUniversityAffiliations() != null) {
                    author.getUniversityAffiliations().size();
                }
                if (author.getResearchAffiliations() != null) {
                    author.getResearchAffiliations().size();
                }
            });
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String requireComments(String comments, String message) {
        if (comments == null || comments.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return comments.trim();
    }

    private String formatDhetNo(Long id) {
        return String.format("J%04d", id);
    }
}
