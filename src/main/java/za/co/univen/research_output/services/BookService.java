package za.co.univen.research_output.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.univen.research_output.entities.Author;
import za.co.univen.research_output.entities.Attachment;
import za.co.univen.research_output.entities.Book;
import za.co.univen.research_output.entities.BookStatus;
import za.co.univen.research_output.entities.ResearchAffiliation;
import za.co.univen.research_output.entities.SubmissionLog;
import za.co.univen.research_output.entities.UniversityAffiliation;
import za.co.univen.research_output.entities.User;
import za.co.univen.research_output.repositories.BookRepository;
import za.co.univen.research_output.repositories.SubmissionLogRepository;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class BookService {

    private final BookRepository repository;
    private final CurrentUserService currentUserService;
    private final SubmissionLogRepository submissionLogRepository;

    private static final Map<BookStatus, List<BookStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(BookStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(BookStatus.DRAFT, List.of(BookStatus.SUBMITTED));
        ALLOWED_TRANSITIONS.put(BookStatus.SUBMITTED, List.of(BookStatus.UNDER_REVIEW_L1));
        ALLOWED_TRANSITIONS.put(BookStatus.UNDER_REVIEW_L1, List.of(BookStatus.UNDER_REVIEW_L2, BookStatus.REJECTED_L1));
        ALLOWED_TRANSITIONS.put(BookStatus.UNDER_REVIEW_L2, List.of(BookStatus.READY_FOR_POSTING, BookStatus.REJECTED_L2));
        ALLOWED_TRANSITIONS.put(BookStatus.REJECTED_L1, List.of(BookStatus.UNDER_REVIEW_L1));
        ALLOWED_TRANSITIONS.put(BookStatus.REJECTED_L2, List.of(BookStatus.UNDER_REVIEW_L1));
        ALLOWED_TRANSITIONS.put(BookStatus.READY_FOR_POSTING, List.of(BookStatus.ACCEPTED_BY_DHET));
        ALLOWED_TRANSITIONS.put(BookStatus.ACCEPTED_BY_DHET, List.of());
    }

    public BookService(
            BookRepository repository,
            CurrentUserService currentUserService,
            SubmissionLogRepository submissionLogRepository
    ) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.submissionLogRepository = submissionLogRepository;
    }

    @Transactional(readOnly = true)
    public List<Book> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Book> findAll(BookStatus status) {
        return repository.search(status);
    }

    @Transactional(readOnly = true)
    public List<Book> findAllForUser(String username) {
        return repository.findBySubmittedByUsername(username);
    }

    @Transactional(readOnly = true)
    public Book getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found: " + id));
    }

    @Transactional
    public Book createOrUpdate(Book payload, String username) {
        User currentUser = currentUserService.getOrCreateUserByUsername(username);

        Book book = payload;
        if (book.getId() != null) {
            Book existing = getById(book.getId());
            enforceEditable(existing, currentUser);
            book.setSubmittedBy(existing.getSubmittedBy());
            if (book.getStatus() == null) {
                book.setStatus(existing.getStatus());
            }
        } else {
            book.setStatus(book.getStatus() == null ? BookStatus.SUBMITTED : book.getStatus());
            book.setSubmittedBy(currentUser);
        }

        validate(book);
        linkGraph(book);

        Book saved = repository.save(book);
        if (saved.getId() != null) {
            String mappedDhetNo = String.format("B%04d", saved.getId());
            if (!mappedDhetNo.equals(saved.getDhetNo())) {
                saved.setDhetNo(mappedDhetNo);
                saved = repository.save(saved);
            }
        }
        return saved;
    }

    @Transactional
    public Book submitForReview(Long id, String username, String comments) {
        Book book = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);

        if (!isOwner(book, currentUser)) {
            throw new SecurityException("Only the requestor can submit this book");
        }

        BookStatus current = book.getStatus();
        if (current != BookStatus.SUBMITTED
                && current != BookStatus.REJECTED_L1
                && current != BookStatus.REJECTED_L2
                && current != BookStatus.DRAFT) {
            throw new IllegalStateException("Book cannot be submitted from status " + current);
        }

        book.setStatus(BookStatus.UNDER_REVIEW_L1);
        Book saved = repository.save(book);
        addSubmissionLog(saved, currentUser.getUsername(), "SUBMITTED", current, saved.getStatus(), comments);
        return saved;
    }

    @Transactional
    public Book approve(Long id, String username, String comments) {
        Book book = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        String normalizedComments = requireComments(comments, "Approval comments are required");

        BookStatus current = book.getStatus();
        if ((current == BookStatus.SUBMITTED || current == BookStatus.UNDER_REVIEW_L1)
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1", "ADMIN")) {
            book.setStatus(BookStatus.UNDER_REVIEW_L2);
        } else if (current == BookStatus.UNDER_REVIEW_L2
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2", "ADMIN")) {
            book.setStatus(BookStatus.READY_FOR_POSTING);
        } else {
            throw new SecurityException("You are not allowed to approve this book at status " + current);
        }

        Book saved = repository.save(book);
        addSubmissionLog(saved, currentUser.getUsername(), "APPROVED", current, saved.getStatus(), normalizedComments);
        return saved;
    }

    @Transactional
    public Book reject(Long id, String username, String comments) {
        Book book = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        String normalizedComments = requireComments(comments, "Rejection comments are required");

        BookStatus current = book.getStatus();
        if ((current == BookStatus.SUBMITTED || current == BookStatus.UNDER_REVIEW_L1)
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1", "ADMIN")) {
            book.setStatus(BookStatus.REJECTED_L1);
        } else if (current == BookStatus.UNDER_REVIEW_L2
                && currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2", "ADMIN")) {
            book.setStatus(BookStatus.REJECTED_L2);
        } else {
            throw new SecurityException("You are not allowed to reject this book at status " + current);
        }

        Book saved = repository.save(book);
        addSubmissionLog(saved, currentUser.getUsername(), "REJECTED", current, saved.getStatus(), normalizedComments);
        return saved;
    }

    @Transactional
    public Book acceptByDhet(Long id, String username, String comments) {
        Book book = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        String normalizedComments = requireComments(comments, "DHET acceptance comments are required");

        if (book.getStatus() != BookStatus.READY_FOR_POSTING) {
            throw new IllegalStateException("Book can only be marked as accepted by DHET from READY_FOR_POSTING status");
        }

        if (!currentUserService.hasAnyRole(currentUser, "ADMIN", "REVIEWER_LEVEL_2")) {
            throw new SecurityException("Only ADMIN or REVIEWER_LEVEL_2 can mark a book as accepted by DHET");
        }

        BookStatus previous = book.getStatus();
        book.setStatus(BookStatus.ACCEPTED_BY_DHET);
        Book saved = repository.save(book);
        addSubmissionLog(saved, currentUser.getUsername(), "ACCEPTED_BY_DHET", previous, saved.getStatus(), normalizedComments);
        return saved;
    }

    @Transactional
    public Book transitionStatus(Long id, BookStatus newStatus, String username) {
        Book book = getById(id);
        User currentUser = currentUserService.getOrCreateUserByUsername(username);
        BookStatus current = book.getStatus();

        if (current == newStatus) {
            return book;
        }

        if (currentUserService.hasAnyRole(currentUser, "ADMIN")) {
            book.setStatus(newStatus);
            return repository.save(book);
        }

        List<BookStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(current, List.of());
        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException("Invalid status transition from " + current + " to " + newStatus);
        }

        if ((newStatus == BookStatus.UNDER_REVIEW_L2 || newStatus == BookStatus.REJECTED_L1)
                && !currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_1")) {
            throw new SecurityException("Only REVIEWER_LEVEL_1 can set status to " + newStatus);
        }

        if ((newStatus == BookStatus.READY_FOR_POSTING
                || newStatus == BookStatus.REJECTED_L2
                || newStatus == BookStatus.ACCEPTED_BY_DHET)
                && !currentUserService.hasAnyRole(currentUser, "REVIEWER_LEVEL_2")) {
            throw new SecurityException("Only REVIEWER_LEVEL_2 can set status to " + newStatus);
        }

        book.setStatus(newStatus);
        return repository.save(book);
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<SubmissionLog> getTimeline(Long bookId) {
        return submissionLogRepository.findByBookIdOrderByTimestampAsc(bookId);
    }

    @Transactional(readOnly = true)
    public boolean existsByTitleAndIsbn(String title, String isbn, Long id) {
        if (id != null) {
            return repository.existsByTitleOfBookAndIsbnAndIdNot(title, isbn, id);
        }
        return repository.existsByTitleOfBookAndIsbn(title, isbn);
    }

    private void validate(Book book) {
        if (book.getTitleOfBook() == null || book.getTitleOfBook().isBlank()) {
            throw new IllegalArgumentException("Book title is required");
        }
        if (book.getIsbn() == null || book.getIsbn().isBlank()) {
            throw new IllegalArgumentException("ISBN is required");
        }
        if (book.getAuthors() == null || book.getAuthors().isEmpty()) {
            throw new IllegalArgumentException("At least one author is required");
        }
    }

    private void enforceEditable(Book existing, User currentUser) {
        BookStatus status = existing.getStatus();
        if (status == BookStatus.READY_FOR_POSTING || status == BookStatus.ACCEPTED_BY_DHET) {
            throw new IllegalStateException("Book is locked and cannot be edited at status " + status);
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

            throw new SecurityException("You can only edit books assigned to your review level at status " + status);
        }

        if (!isOwner(existing, currentUser)) {
            throw new SecurityException("Only the requestor or assigned approver can edit this book");
        }

        if (status != BookStatus.REJECTED_L1 && status != BookStatus.REJECTED_L2) {
            throw new IllegalStateException("Requestor can only edit rejected books. Current status is " + status);
        }
    }

    private boolean isOwner(Book book, User currentUser) {
        return book.getSubmittedBy() != null
                && currentUser.getUsername() != null
                && currentUser.getUsername().equalsIgnoreCase(book.getSubmittedBy().getUsername());
    }

    private String requireComments(String comments, String message) {
        if (comments == null || comments.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return comments.trim();
    }

    private void addSubmissionLog(
            Book book,
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
        log.setBook(book);
        submissionLogRepository.save(log);
    }

    private void linkGraph(Book book) {
        if (book.getAuthors() == null) {
            return;
        }

        for (Author author : book.getAuthors()) {
            author.setBook(book);
            author.setChapter(null);
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

        if (book.getAttachments() != null) {
            for (Attachment attachment : book.getAttachments()) {
                attachment.setBook(book);
                attachment.setChapter(null);
                attachment.setJournal(null);
                attachment.setConferenceProceedings(null);
            }
        }
    }
}


