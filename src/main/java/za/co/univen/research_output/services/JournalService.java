package za.co.univen.research_output.services;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.entities.Attachment;
import za.co.univen.research_output.entities.Author;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.entities.JournalStatus;
import za.co.univen.research_output.entities.User;
import za.co.univen.research_output.repositories.JournalRepository;

import java.security.Principal;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class JournalService {

    private final JournalRepository repository;
    private final CurrentUserService currentUserService;
    private final JournalUnitCalculationService unitCalculationService;

    private static final Map<JournalStatus, List<JournalStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(JournalStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(JournalStatus.DRAFT, List.of(JournalStatus.SUBMITTED));
        ALLOWED_TRANSITIONS.put(JournalStatus.SUBMITTED, List.of(JournalStatus.UNDER_REVIEW));
        ALLOWED_TRANSITIONS.put(JournalStatus.UNDER_REVIEW, List.of(JournalStatus.REVISION_REQUIRED, JournalStatus.APPROVED, JournalStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(JournalStatus.REVISION_REQUIRED, List.of(JournalStatus.SUBMITTED));
        ALLOWED_TRANSITIONS.put(JournalStatus.APPROVED, List.of());
        ALLOWED_TRANSITIONS.put(JournalStatus.REJECTED, List.of());
    }

    public JournalService(
            JournalRepository repository,
            CurrentUserService currentUserService,
            JournalUnitCalculationService unitCalculationService
    ) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.unitCalculationService = unitCalculationService;
    }

    @Transactional
    public Journal createOrUpdate(Journal payload, Principal principal) {
        User currentUser = currentUserService.getLoggedInUser(principal);

        Journal journal = payload;
        if (journal.getId() != null) {
            Journal existing = getById(journal.getId());
            enforceEditable(existing, currentUser);
            journal.setSubmittedBy(existing.getSubmittedBy());
            if (journal.getStatus() == null) {
                journal.setStatus(existing.getStatus());
            }
        } else {
            journal.setStatus(journal.getStatus() == null ? JournalStatus.DRAFT : journal.getStatus());
        }

        journal.setSubmittedBy(currentUser);
        validateBeforeSave(journal);
        unitCalculationService.recalculate(journal);
        linkGraph(journal);
        return repository.save(journal);
    }

    @Transactional
    public Journal transitionStatus(Long id, JournalStatus newStatus, Principal principal) {
        Journal journal = getById(id);
        User currentUser = currentUserService.getLoggedInUser(principal);
        JournalStatus current = journal.getStatus();

        if (current == newStatus) {
            return journal;
        }

        List<JournalStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(current, List.of());
        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException("Invalid status transition from " + current + " to " + newStatus);
        }

        if (requiresReviewerOrAdmin(newStatus) && !isReviewerOrAdmin(currentUser)) {
            throw new SecurityException("Only REVIEWER or ADMIN can set status to " + newStatus);
        }

        journal.setStatus(newStatus);
        return repository.save(journal);
    }

    public Journal getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Journal not found: " + id));
    }

    @Transactional
    public List<Journal> findAll(String year, JournalStatus status, Long facultyId) {
        return repository.search(year, status, facultyId);
    }

    @Transactional
    public List<Journal> findAllForUser(String username) {
        return repository.findBySubmittedByUsername(username);
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
        if (status == JournalStatus.APPROVED) {
            throw new IllegalStateException("Approved journals cannot be edited");
        }
        if (status == JournalStatus.SUBMITTED && !isReviewerOrAdmin(currentUser) && !isOwner(existing, currentUser)) {
            throw new SecurityException("Only owner/reviewer/admin can edit submitted journals");
        }
    }

    private boolean isOwner(Journal journal, User currentUser) {
        return journal.getSubmittedBy() != null
                && currentUser.getUsername() != null
                && currentUser.getUsername().equalsIgnoreCase(journal.getSubmittedBy().getUsername());
    }

    private boolean requiresReviewerOrAdmin(JournalStatus status) {
        return status == JournalStatus.UNDER_REVIEW
                || status == JournalStatus.REVISION_REQUIRED
                || status == JournalStatus.APPROVED
                || status == JournalStatus.REJECTED;
    }

    private boolean isReviewerOrAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        String role = user.getRole().toUpperCase(Locale.ROOT);
        return "ADMIN".equals(role) || "REVIEWER".equals(role);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
