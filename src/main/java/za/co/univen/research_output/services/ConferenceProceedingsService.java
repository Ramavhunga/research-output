package za.co.univen.research_output.services;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.dto.ConferenceProceedingsListItemDto;
import za.co.univen.research_output.entities.Author;
import za.co.univen.research_output.entities.ConferenceProceedings;
import za.co.univen.research_output.entities.ProceedingsStatus;
import za.co.univen.research_output.entities.SubmissionLog;
import za.co.univen.research_output.entities.User;
import za.co.univen.research_output.repositories.ConferenceProceedingsRepository;
import za.co.univen.research_output.repositories.SubmissionLogRepository;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class ConferenceProceedingsService {

    private final ConferenceProceedingsRepository repository;
    private final CurrentUserService currentUserService;
    private final SubmissionLogRepository submissionLogRepository;

    private static final Map<ProceedingsStatus, List<ProceedingsStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(ProceedingsStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.SUBMITTED, List.of(ProceedingsStatus.UNDER_REVIEW_L1));
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.UNDER_REVIEW_L1, List.of(ProceedingsStatus.UNDER_REVIEW_L2, ProceedingsStatus.REJECTED_L1));
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.UNDER_REVIEW_L2, List.of(ProceedingsStatus.READY_FOR_POSTING, ProceedingsStatus.REJECTED_L2));
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.REJECTED_L1, List.of(ProceedingsStatus.UNDER_REVIEW_L1));
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.REJECTED_L2, List.of(ProceedingsStatus.UNDER_REVIEW_L1));
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.READY_FOR_POSTING, List.of(ProceedingsStatus.ACCEPTED_BY_DHET));
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.ACCEPTED_BY_DHET, List.of());

        // Legacy transitions
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.DRAFT, List.of(ProceedingsStatus.SUBMITTED));
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.UNDER_REVIEW, List.of(ProceedingsStatus.APPROVED, ProceedingsStatus.REJECTED, ProceedingsStatus.REVISION_REQUIRED));
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.REVISION_REQUIRED, List.of(ProceedingsStatus.SUBMITTED));
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.APPROVED, List.of());
        ALLOWED_TRANSITIONS.put(ProceedingsStatus.REJECTED, List.of());
    }

    public ConferenceProceedingsService(
            ConferenceProceedingsRepository repository,
            CurrentUserService currentUserService,
            SubmissionLogRepository submissionLogRepository
    ) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.submissionLogRepository = submissionLogRepository;
    }

    @Transactional
    public ConferenceProceedings createOrUpdate(ConferenceProceedings payload, String username) {
        User currentUser = currentUserService.getOrCreateUserByUsername(username);

        ConferenceProceedings proceedings = payload;
        if (proceedings.getId() != null) {
            ConferenceProceedings existing = getById(proceedings.getId());
            enforceEditable(existing, currentUser);
            // Preserve original requestor ownership for updates
            proceedings.setSubmittedBy(existing.getSubmittedBy());
            if (proceedings.getStatus() == null) {
                proceedings.setStatus(existing.getStatus());
            }
        } else {
            proceedings.setStatus(proceedings.getStatus() == null ? ProceedingsStatus.SUBMITTED : proceedings.getStatus());
            proceedings.setSubmittedBy(currentUser);
        }

        validateBeforeSave(proceedings);
        linkGraph(proceedings);

        ConferenceProceedings saved = repository.save(proceedings);

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
    public ConferenceProceedings submitForReview(Long id, String username, String comments) {
        ConferenceProceedings proceedings = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);

        if (!isOwner(proceedings, currentUser)) {
            throw new SecurityException("Only the requestor can submit this proceedings");
        }

        ProceedingsStatus status = proceedings.getStatus();
        if (status != ProceedingsStatus.SUBMITTED
                && status != ProceedingsStatus.REJECTED_L1
                && status != ProceedingsStatus.REJECTED_L2
                && status != ProceedingsStatus.DRAFT) {
            throw new IllegalStateException("Proceedings cannot be submitted from status " + status);
        }

        proceedings.setStatus(ProceedingsStatus.UNDER_REVIEW_L1);
        ConferenceProceedings saved = repository.save(proceedings);
        addSubmissionLog(saved, currentUser.getUsername(), "SUBMITTED", status, saved.getStatus(), comments);
        return saved;
    }

    @Transactional
    public ConferenceProceedings approve(Long id, String username, String comments) {
        ConferenceProceedings proceedings = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        String normalizedComments = requireComments(comments, "Approval comments are required");

        ProceedingsStatus current = proceedings.getStatus();
        if ((current == ProceedingsStatus.SUBMITTED || current == ProceedingsStatus.UNDER_REVIEW_L1)
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1", "ADMIN")) {
            proceedings.setStatus(ProceedingsStatus.UNDER_REVIEW_L2);
        } else if (current == ProceedingsStatus.UNDER_REVIEW_L2 && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2", "ADMIN")) {
            proceedings.setStatus(ProceedingsStatus.READY_FOR_POSTING);
        } else {
            throw new SecurityException("You are not allowed to approve this proceedings at status " + current);
        }

        ConferenceProceedings saved = repository.save(proceedings);
        addSubmissionLog(saved, currentUser.getUsername(), "APPROVED", current, saved.getStatus(), normalizedComments);
        return saved;
    }

    @Transactional
    public ConferenceProceedings reject(Long id, String username, String comments) {
        ConferenceProceedings proceedings = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        String normalizedComments = requireComments(comments, "Rejection comments are required");

        ProceedingsStatus current = proceedings.getStatus();
        if ((current == ProceedingsStatus.SUBMITTED || current == ProceedingsStatus.UNDER_REVIEW_L1)
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1", "ADMIN")) {
            proceedings.setStatus(ProceedingsStatus.REJECTED_L1);
        } else if (current == ProceedingsStatus.UNDER_REVIEW_L2 && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2", "ADMIN")) {
            proceedings.setStatus(ProceedingsStatus.REJECTED_L2);
        } else {
            throw new SecurityException("You are not allowed to reject this proceedings at status " + current);
        }

        ConferenceProceedings saved = repository.save(proceedings);
        addSubmissionLog(saved, currentUser.getUsername(), "REJECTED", current, saved.getStatus(), normalizedComments);
        return saved;
    }

    @Transactional
    public ConferenceProceedings acceptByDhet(Long id, String username, String comments) {
        ConferenceProceedings proceedings = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        String normalizedComments = requireComments(comments, "DHET acceptance comments are required");

        if (proceedings.getStatus() != ProceedingsStatus.READY_FOR_POSTING) {
            throw new IllegalStateException("Proceedings can only be marked as accepted by DHET from READY_FOR_POSTING status");
        }

        if (!currentUserService.hasAnyRole(currentUser, "ADMIN", "REVIEWER_LEVEL_2")) {
            throw new SecurityException("Only ADMIN or REVIEWER_LEVEL_2 can mark proceedings as accepted by DHET");
        }

        ProceedingsStatus previous = proceedings.getStatus();
        proceedings.setStatus(ProceedingsStatus.ACCEPTED_BY_DHET);
        ConferenceProceedings saved = repository.save(proceedings);
        addSubmissionLog(saved, currentUser.getUsername(), "ACCEPTED_BY_DHET", previous, saved.getStatus(), normalizedComments);
        return saved;
    }

    @Transactional
    public ConferenceProceedings transitionStatus(Long id, ProceedingsStatus newStatus, String username) {
        ConferenceProceedings proceedings = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        ProceedingsStatus current = proceedings.getStatus();

        if (current == newStatus) {
            return proceedings;
        }

        List<ProceedingsStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(current, List.of());
        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException("Invalid status transition from " + current + " to " + newStatus);
        }

        // Enforce strict roles on two-level statuses
        if ((newStatus == ProceedingsStatus.UNDER_REVIEW_L2 || newStatus == ProceedingsStatus.REJECTED_L1)
                && !currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1", "ADMIN")) {
            throw new SecurityException("Only REVIEWER_LEVEL_1 or ADMIN can set status to " + newStatus);
        }
        if ((newStatus == ProceedingsStatus.READY_FOR_POSTING || newStatus == ProceedingsStatus.REJECTED_L2)
                && !currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2", "ADMIN")) {
            throw new SecurityException("Only REVIEWER_LEVEL_2 or ADMIN can set status to " + newStatus);
        }
        if (newStatus == ProceedingsStatus.ACCEPTED_BY_DHET
                && !currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2", "ADMIN")) {
            throw new SecurityException("Only REVIEWER_LEVEL_2 or ADMIN can set status to " + newStatus);
        }

        proceedings.setStatus(newStatus);
        return repository.save(proceedings);
    }

    @Transactional
    public ConferenceProceedings getById(Long id) {
        ConferenceProceedings proceedings = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conference Proceedings not found: " + id));
        initializeProceedingsGraph(proceedings);
        return proceedings;
    }

    @Transactional
    public List<ConferenceProceedings> findAll() {
        return repository.findAll();
    }

    @Transactional
    public List<ConferenceProceedings> findAll(Integer yearOfPublication, ProceedingsStatus status, Long facultyId) {
        return repository.search(yearOfPublication, status, facultyId);
    }

    @Transactional
    public List<ConferenceProceedingsListItemDto> findAllSummary(Integer yearOfPublication, ProceedingsStatus status, Long facultyId) {
        return repository.searchSummary(yearOfPublication, status, facultyId);
    }

    @Transactional
    public List<ConferenceProceedings> findAllForUser(String username) {
        return repository.findBySubmittedByUsername(username);
    }

    @Transactional
    public List<ConferenceProceedingsListItemDto> findAllSummaryForUser(String username) {
        return repository.findSummaryBySubmittedByUsername(username);
    }

    @Transactional
    public List<SubmissionLog> getTimeline(Long proceedingsId) {
        return submissionLogRepository.findByConferenceProceedingsIdOrderByTimestampAsc(proceedingsId);
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    public boolean existsByTitleOfContributionAndIssn(String titleOfContribution, String issn) {
        return repository.existsByTitleOfContributionAndIssn(titleOfContribution, issn);
    }

    private void validateBeforeSave(ConferenceProceedings proceedings) {
        if (proceedings.getAuthors() == null || proceedings.getAuthors().isEmpty()) {
            throw new IllegalArgumentException("At least one author is required");
        }

        boolean hasAffiliated = proceedings.getAuthors().stream().anyMatch(a -> Boolean.TRUE.equals(a.getAffiliation()));
        if (!hasAffiliated) {
            throw new IllegalArgumentException("At least one affiliated author is required");
        }

        for (Author author : proceedings.getAuthors()) {
            if (isBlank(author.getFirstName()) || isBlank(author.getSurname()) || isBlank(author.getEmail())) {
                throw new IllegalArgumentException("Author firstName, surname and email are required");
            }
        }
    }

    private void linkGraph(ConferenceProceedings proceedings) {
        if (proceedings.getAuthors() != null) {
            proceedings.getAuthors().forEach(author -> {
                author.setConferenceProceedings(proceedings);
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
    }

    private void enforceEditable(ConferenceProceedings existing, User currentUser) {
        ProceedingsStatus status = existing.getStatus();

        if (status == ProceedingsStatus.READY_FOR_POSTING || status == ProceedingsStatus.ACCEPTED_BY_DHET) {
            throw new IllegalStateException("Proceedings is locked and cannot be edited at status " + status);
        }

        boolean isAdmin = currentUserService.hasAnyRole(currentUser, "ADMIN");
        if (isAdmin) {
            return;
        }

        boolean isReviewerL1 = currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1");
        boolean isReviewerL2 = currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2");

        if (isReviewerL1 || isReviewerL2) {
            boolean l1Stage = status == ProceedingsStatus.SUBMITTED || status == ProceedingsStatus.UNDER_REVIEW_L1;
            boolean l2Stage = status == ProceedingsStatus.UNDER_REVIEW_L2;

            if ((isReviewerL1 && l1Stage) || (isReviewerL2 && l2Stage)) {
                return;
            }

            throw new SecurityException("You can only edit proceedings assigned to your review level at status " + status);
        }

        if (!isOwner(existing, currentUser)) {
            throw new SecurityException("Only the requestor or assigned approver can edit this proceedings");
        }

        if (status != ProceedingsStatus.REJECTED
                && status != ProceedingsStatus.REJECTED_L1
                && status != ProceedingsStatus.REJECTED_L2) {
            throw new IllegalStateException("Requestor can only edit rejected proceedings. Current status is " + status);
        }
    }

    private boolean isOwner(ConferenceProceedings proceedings, User currentUser) {
        return proceedings.getSubmittedBy() != null
                && currentUser.getUsername() != null
                && currentUser.getUsername().equalsIgnoreCase(proceedings.getSubmittedBy().getUsername());
    }

    private void initializeProceedingsGraph(ConferenceProceedings proceedings) {
        if (proceedings.getSubmittedBy() != null) {
            proceedings.getSubmittedBy().getUsername();
        }

        if (proceedings.getAuthors() != null) {
            proceedings.getAuthors().forEach(author -> {
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
        return String.format("CP%04d", id);
    }

    private void addSubmissionLog(
            ConferenceProceedings proceedings,
            String performedBy,
            String action,
            ProceedingsStatus fromStatus,
            ProceedingsStatus toStatus,
            String comments
    ) {
        SubmissionLog log = new SubmissionLog();
        log.setTimestamp(LocalDateTime.now());
        log.setAction(action);
        log.setPerformedBy(performedBy);
        log.setFromStatus(fromStatus == null ? null : fromStatus.name());
        log.setToStatus(toStatus == null ? null : toStatus.name());
        log.setComments(comments == null ? null : comments.trim());
        log.setConferenceProceedings(proceedings);
        submissionLogRepository.save(log);
    }
}

