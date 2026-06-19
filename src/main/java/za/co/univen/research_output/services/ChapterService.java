package za.co.univen.research_output.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.univen.research_output.entities.Author;
import za.co.univen.research_output.entities.Attachment;
import za.co.univen.research_output.entities.BookStatus;
import za.co.univen.research_output.entities.Chapter;
import za.co.univen.research_output.entities.ResearchAffiliation;
import za.co.univen.research_output.entities.SubmissionLog;
import za.co.univen.research_output.entities.UniversityAffiliation;
import za.co.univen.research_output.entities.User;
import za.co.univen.research_output.repositories.ChapterRepository;
import za.co.univen.research_output.repositories.SubmissionLogRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChapterService {

    private final ChapterRepository repository;
    private final CurrentUserService currentUserService;
    private final SubmissionLogRepository submissionLogRepository;

    public ChapterService(
            ChapterRepository repository,
            CurrentUserService currentUserService,
            SubmissionLogRepository submissionLogRepository
    ) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.submissionLogRepository = submissionLogRepository;
    }

    @Transactional(readOnly = true)
    public List<Chapter> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Chapter> findAllForUser(String username) {
        return repository.findBySubmittedByUsername(username);
    }

    @Transactional(readOnly = true)
    public Chapter getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chapter not found: " + id));
    }

    @Transactional
    public Chapter createOrUpdate(Chapter payload, String username) {
        User currentUser = currentUserService.getOrCreateUserByUsername(username);

        Chapter chapter = payload;
        if (chapter.getId() != null) {
            Chapter existing = getById(chapter.getId());
            enforceEditable(existing, currentUser);
            chapter.setSubmittedBy(existing.getSubmittedBy());
            if (chapter.getStatus() == null) {
                chapter.setStatus(existing.getStatus());
            }
        } else {
            chapter.setStatus(chapter.getStatus() == null ? BookStatus.SUBMITTED : chapter.getStatus());
            chapter.setSubmittedBy(currentUser);
        }

        validate(chapter);
        linkGraph(chapter);

        Chapter saved = repository.save(chapter);
        if (saved.getId() != null) {
            String mappedDhetNo = String.format("C%04d", saved.getId());
            if (!mappedDhetNo.equals(saved.getDhetNo())) {
                saved.setDhetNo(mappedDhetNo);
                saved = repository.save(saved);
            }
        }
        return saved;
    }

    @Transactional
    public Chapter submitForReview(Long id, String username, String comments) {
        Chapter chapter = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);

        if (!isOwner(chapter, currentUser)) {
            throw new SecurityException("Only the requestor can submit this chapter");
        }

        BookStatus current = chapter.getStatus();
        if (current != BookStatus.SUBMITTED
                && current != BookStatus.REJECTED_L1
                && current != BookStatus.REJECTED_L2
                && current != BookStatus.DRAFT) {
            throw new IllegalStateException("Chapter cannot be submitted from status " + current);
        }

        chapter.setStatus(BookStatus.UNDER_REVIEW_L1);
        Chapter saved = repository.save(chapter);
        addSubmissionLog(saved, currentUser.getUsername(), "SUBMITTED", current, saved.getStatus(), comments);
        return saved;
    }

    @Transactional
    public Chapter approve(Long id, String username, String comments) {
        Chapter chapter = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        String normalizedComments = requireComments(comments, "Approval comments are required");

        BookStatus current = chapter.getStatus();
        if ((current == BookStatus.SUBMITTED || current == BookStatus.UNDER_REVIEW_L1)
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1", "ADMIN")) {
            chapter.setStatus(BookStatus.UNDER_REVIEW_L2);
        } else if (current == BookStatus.UNDER_REVIEW_L2
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2", "ADMIN")) {
            chapter.setStatus(BookStatus.READY_FOR_POSTING);
        } else {
            throw new SecurityException("You are not allowed to approve this chapter at status " + current);
        }

        Chapter saved = repository.save(chapter);
        addSubmissionLog(saved, currentUser.getUsername(), "APPROVED", current, saved.getStatus(), normalizedComments);
        return saved;
    }

    @Transactional
    public Chapter reject(Long id, String username, String comments) {
        Chapter chapter = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        String normalizedComments = requireComments(comments, "Rejection comments are required");

        BookStatus current = chapter.getStatus();
        if ((current == BookStatus.SUBMITTED || current == BookStatus.UNDER_REVIEW_L1)
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1", "ADMIN")) {
            chapter.setStatus(BookStatus.REJECTED_L1);
        } else if (current == BookStatus.UNDER_REVIEW_L2
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2", "ADMIN")) {
            chapter.setStatus(BookStatus.REJECTED_L2);
        } else {
            throw new SecurityException("You are not allowed to reject this chapter at status " + current);
        }

        Chapter saved = repository.save(chapter);
        addSubmissionLog(saved, currentUser.getUsername(), "REJECTED", current, saved.getStatus(), normalizedComments);
        return saved;
    }

    @Transactional
    public Chapter acceptByDhet(Long id, String username, String comments) {
        Chapter chapter = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        String normalizedComments = requireComments(comments, "DHET acceptance comments are required");

        if (chapter.getStatus() != BookStatus.READY_FOR_POSTING) {
            throw new IllegalStateException("Chapter can only be marked as accepted by DHET from READY_FOR_POSTING status");
        }

        if (!currentUserService.hasAnyRole(currentUser, "ADMIN", "REVIEWER_LEVEL_2")) {
            throw new SecurityException("Only ADMIN or REVIEWER_LEVEL_2 can mark a chapter as accepted by DHET");
        }

        BookStatus previous = chapter.getStatus();
        chapter.setStatus(BookStatus.ACCEPTED_BY_DHET);
        Chapter saved = repository.save(chapter);
        addSubmissionLog(saved, currentUser.getUsername(), "ACCEPTED_BY_DHET", previous, saved.getStatus(), normalizedComments);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<SubmissionLog> getTimeline(Long chapterId) {
        return submissionLogRepository.findByChapterIdOrderByTimestampAsc(chapterId);
    }

    @Transactional(readOnly = true)
    public boolean existsByTitleAndIsbn(String title, String isbn, Long id) {
        if (id != null) {
            return repository.existsByTitleOfBookAndIsbnAndIdNot(title, isbn, id);
        }
        return repository.existsByTitleOfBookAndIsbn(title, isbn);
    }

    private void validate(Chapter chapter) {
        if (chapter.getTitleOfBook() == null || chapter.getTitleOfBook().isBlank()) {
            throw new IllegalArgumentException("Book title is required");
        }
        if (chapter.getIsbn() == null || chapter.getIsbn().isBlank()) {
            throw new IllegalArgumentException("ISBN is required");
        }
        if (chapter.getAuthors() == null || chapter.getAuthors().isEmpty()) {
            throw new IllegalArgumentException("At least one author is required");
        }
    }

    private void enforceEditable(Chapter existing, User currentUser) {
        BookStatus status = existing.getStatus();
        if (status == BookStatus.READY_FOR_POSTING || status == BookStatus.ACCEPTED_BY_DHET) {
            throw new IllegalStateException("Chapter is locked and cannot be edited at status " + status);
        }

        if (currentUserService.hasAnyRole(currentUser, "ADMIN")) {
            return;
        }

        boolean isReviewerL1 = currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1");
        boolean isReviewerL2 = currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2");

        if (isReviewerL1 || isReviewerL2) {
            boolean l1Stage = status == BookStatus.SUBMITTED || status == BookStatus.UNDER_REVIEW_L1;
            boolean l2Stage = status == BookStatus.UNDER_REVIEW_L2;

            if ((isReviewerL1 && l1Stage) || (isReviewerL2 && l2Stage)) {
                return;
            }

            throw new SecurityException("You can only edit chapters assigned to your review level at status " + status);
        }

        if (!isOwner(existing, currentUser)) {
            throw new SecurityException("Only the requestor or assigned approver can edit this chapter");
        }

        if (status != BookStatus.REJECTED_L1 && status != BookStatus.REJECTED_L2) {
            throw new IllegalStateException("Requestor can only edit rejected chapters. Current status is " + status);
        }
    }

    private boolean isOwner(Chapter chapter, User currentUser) {
        return chapter.getSubmittedBy() != null
                && currentUser.getUsername() != null
                && currentUser.getUsername().equalsIgnoreCase(chapter.getSubmittedBy().getUsername());
    }

    private String requireComments(String comments, String message) {
        if (comments == null || comments.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return comments.trim();
    }

    private void addSubmissionLog(
            Chapter chapter,
            String performedBy,
            String action,
            BookStatus fromStatus,
            BookStatus toStatus,
            String comments
    ) {
        SubmissionLog log = new SubmissionLog();
        log.setTimestamp(LocalDateTime.now());
        log.setAction(action);
        log.setPerformedBy(performedBy);
        log.setFromStatus(fromStatus == null ? null : fromStatus.name());
        log.setToStatus(toStatus == null ? null : toStatus.name());
        log.setComments(comments == null ? null : comments.trim());
        log.setChapter(chapter);
        submissionLogRepository.save(log);
    }

    private void linkGraph(Chapter chapter) {
        if (chapter.getAuthors() == null) {
            return;
        }

        for (Author author : chapter.getAuthors()) {
            author.setChapter(chapter);
            author.setBook(null);
            author.setJournal(null);
            author.setConferenceProceedings(null);

            if (author.getUniversityAffiliations() != null) {
                for (UniversityAffiliation universityAffiliation : author.getUniversityAffiliations()) {
                    universityAffiliation.setAuthor(author);
                }
            }

            if (author.getResearchAffiliations() != null) {
                for (ResearchAffiliation researchAffiliation : author.getResearchAffiliations()) {
                    researchAffiliation.setAuthor(author);
                }
            }
        }

        if (chapter.getAttachments() != null) {
            for (Attachment attachment : chapter.getAttachments()) {
                attachment.setChapter(chapter);
                attachment.setBook(null);
                attachment.setJournal(null);
                attachment.setConferenceProceedings(null);
            }
        }
    }
}


