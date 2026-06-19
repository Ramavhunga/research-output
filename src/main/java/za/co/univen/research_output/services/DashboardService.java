package za.co.univen.research_output.services;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.dto.DashboardStatsDto;
import za.co.univen.research_output.entities.Book;
import za.co.univen.research_output.entities.BookStatus;
import za.co.univen.research_output.entities.Chapter;
import za.co.univen.research_output.entities.ConferenceProceedings;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.entities.JournalStatus;
import za.co.univen.research_output.entities.OutputStatus;
import za.co.univen.research_output.entities.ProceedingsStatus;
import za.co.univen.research_output.entities.ResearchOutput;
import za.co.univen.research_output.repositories.BookRepository;
import za.co.univen.research_output.repositories.ChapterRepository;
import za.co.univen.research_output.repositories.ConferenceProceedingsRepository;
import za.co.univen.research_output.repositories.JournalRepository;
import za.co.univen.research_output.repositories.ResearchOutputRepository;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
public class DashboardService {

    private final JournalRepository journalRepository;
    private final BookRepository bookRepository;
    private final ChapterRepository chapterRepository;
    private final ConferenceProceedingsRepository conferenceProceedingsRepository;
    private final ResearchOutputRepository researchOutputRepository;

    public DashboardService(
            JournalRepository journalRepository,
            BookRepository bookRepository,
            ChapterRepository chapterRepository,
            ConferenceProceedingsRepository conferenceProceedingsRepository,
            ResearchOutputRepository researchOutputRepository
    ) {
        this.journalRepository = journalRepository;
        this.bookRepository = bookRepository;
        this.chapterRepository = chapterRepository;
        this.conferenceProceedingsRepository = conferenceProceedingsRepository;
        this.researchOutputRepository = researchOutputRepository;
    }

    /**
     * Get dashboard statistics for admin users (all journals)
     */
    @Transactional
    public DashboardStatsDto getDashboardStatsForAdmin() {
        List<Journal> allJournals = journalRepository.findAll();
        List<Book> allBooks = bookRepository.findAll();
        List<Chapter> allChapters = chapterRepository.findAll();
        List<ConferenceProceedings> allProceedings = conferenceProceedingsRepository.findAll();
        List<ResearchOutput> allResearchOutputs = researchOutputRepository.findAll();
        return buildDashboardStats(allJournals, allBooks, allChapters, allProceedings, allResearchOutputs);
    }

    /**
     * Get dashboard statistics for a specific user
     */
    @Transactional
    public DashboardStatsDto getDashboardStatsForUser(String username) {
        List<Journal> userJournals = journalRepository.findBySubmittedByUsername(username);
        List<Book> userBooks = bookRepository.findBySubmittedByUsername(username);
        List<Chapter> userChapters = chapterRepository.findBySubmittedByUsername(username);
        List<ConferenceProceedings> userProceedings = conferenceProceedingsRepository.findBySubmittedByUsername(username);
        List<ResearchOutput> userResearchOutputs = researchOutputRepository.findAllByCreatedBy(username);
        return buildDashboardStats(userJournals, userBooks, userChapters, userProceedings, userResearchOutputs);
    }

    /**
     * Get dashboard statistics for reviewers (review queue)
     */
    @Transactional
    public DashboardStatsDto getDashboardStatsForReviewer() {
        // Review statuses - much more efficient than 11 separate API calls
        List<JournalStatus> reviewStatuses = Arrays.asList(
            JournalStatus.SUBMITTED,
            JournalStatus.UNDER_REVIEW_L1,
            JournalStatus.UNDER_REVIEW_L2,
            JournalStatus.REJECTED_L1,
            JournalStatus.REJECTED_L2,
            JournalStatus.READY_FOR_POSTING,
            // Legacy statuses
            JournalStatus.UNDER_REVIEW,
            JournalStatus.REVISION_REQUIRED,
            JournalStatus.APPROVED,
            JournalStatus.REJECTED
        );

        List<Journal> reviewQueue = journalRepository.findReviewQueue(reviewStatuses);

        // Remove duplicates by ID since we might have both old and new status versions
        List<Journal> deduplicated = reviewQueue.stream()
            .distinct()
            .toList();

        List<BookStatus> reviewBookStatuses = Arrays.asList(
            BookStatus.SUBMITTED,
            BookStatus.UNDER_REVIEW_L1,
            BookStatus.UNDER_REVIEW_L2,
            BookStatus.REJECTED_L1,
            BookStatus.REJECTED_L2,
            BookStatus.READY_FOR_POSTING
        );

        List<Book> reviewerBooks = bookRepository.findAll().stream()
            .filter(book -> book.getStatus() != null && reviewBookStatuses.contains(book.getStatus()))
            .toList();

        List<Chapter> reviewerChapters = chapterRepository.findAll().stream()
            .filter(chapter -> chapter.getStatus() != null && reviewBookStatuses.contains(chapter.getStatus()))
            .toList();

        List<ProceedingsStatus> reviewProceedingsStatuses = Arrays.asList(
            ProceedingsStatus.SUBMITTED,
            ProceedingsStatus.UNDER_REVIEW_L1,
            ProceedingsStatus.UNDER_REVIEW_L2,
            ProceedingsStatus.REJECTED_L1,
            ProceedingsStatus.REJECTED_L2,
            ProceedingsStatus.READY_FOR_POSTING,
            ProceedingsStatus.UNDER_REVIEW,
            ProceedingsStatus.REVISION_REQUIRED,
            ProceedingsStatus.APPROVED,
            ProceedingsStatus.REJECTED
        );

        List<ConferenceProceedings> reviewerProceedings = conferenceProceedingsRepository.findAll().stream()
            .filter(cp -> cp.getStatus() != null && reviewProceedingsStatuses.contains(cp.getStatus()))
            .toList();

        List<ResearchOutput> reviewerResearchOutputs = researchOutputRepository.findAllByStatus(OutputStatus.SUBMITTED);

        return buildDashboardStats(deduplicated, reviewerBooks, reviewerChapters, reviewerProceedings, reviewerResearchOutputs);
    }

    /**
     * Build dashboard stats from journals + proceedings + legacy research outputs.
     */
    private DashboardStatsDto buildDashboardStats(
            List<Journal> journals,
            List<Book> books,
            List<Chapter> chapters,
            List<ConferenceProceedings> proceedings,
            List<ResearchOutput> researchOutputs
    ) {
        List<Journal> safeJournals = journals == null ? List.of() : journals;
        List<Book> safeBooks = books == null ? List.of() : books;
        List<Chapter> safeChapters = chapters == null ? List.of() : chapters;
        List<ConferenceProceedings> safeProceedings = proceedings == null ? List.of() : proceedings;
        List<ResearchOutput> safeOutputs = researchOutputs == null ? List.of() : researchOutputs;

        if (safeJournals.isEmpty() && safeBooks.isEmpty() && safeChapters.isEmpty() && safeProceedings.isEmpty() && safeOutputs.isEmpty()) {
            return DashboardStatsDto.builder()
                .totalJournals(0)
                .totalBooks(0)
                .totalConferences(0)
                .totalChapters(0)
                .totalUnits(0)
                .totalSubmissions(0)
                .totalOutputs(0)
                .activeResearchers(0)
                .approvedCount(0)
                .pendingCount(0)
                .rejectedCount(0)
                .dhetCompliancePercentage(0)
                .recentSubmissions(List.of())
                .build();
        }

        double totalUnits = 0;
        long approvedCount = 0;
        long pendingCount = 0;
        long rejectedCount = 0;
        long compliant = 0;

        for (Journal journal : safeJournals) {
            totalUnits += journal.getUnits() != null && journal.getUnits().getTotalUnitsClaimed() != null
                ? journal.getUnits().getTotalUnitsClaimed()
                : 0;

            JournalStatus status = journal.getStatus();
            if (status == JournalStatus.READY_FOR_POSTING || status == JournalStatus.APPROVED) {
                approvedCount++;
            } else if (status == JournalStatus.REJECTED || status == JournalStatus.REJECTED_L1 || status == JournalStatus.REJECTED_L2) {
                rejectedCount++;
            } else {
                pendingCount++;
            }

            if (Boolean.TRUE.equals(journal.getComply())) {
                compliant++;
            }
        }

        for (ConferenceProceedings conferenceProceedings : safeProceedings) {
            totalUnits += conferenceProceedings.getUnits() != null && conferenceProceedings.getUnits().getTotalUnitsClaimed() != null
                ? conferenceProceedings.getUnits().getTotalUnitsClaimed()
                : 0;

            String status = toDashboardStatus(conferenceProceedings.getStatus());
            if ("APPROVED".equals(status)) {
                approvedCount++;
            } else if ("REJECTED".equals(status)) {
                rejectedCount++;
            } else {
                pendingCount++;
            }
        }

        for (Book book : safeBooks) {
            totalUnits += book.getTotalUnitsClaimed() != null ? book.getTotalUnitsClaimed() : 0;

            String status = toDashboardStatus(book.getStatus());
            if ("APPROVED".equals(status)) {
                approvedCount++;
            } else if ("REJECTED".equals(status)) {
                rejectedCount++;
            } else {
                pendingCount++;
            }
        }

        for (Chapter chapter : safeChapters) {
            totalUnits += chapter.getTotalUnitsClaimed() != null ? chapter.getTotalUnitsClaimed() : 0;

            String status = toDashboardStatus(chapter.getStatus());
            if ("APPROVED".equals(status)) {
                approvedCount++;
            } else if ("REJECTED".equals(status)) {
                rejectedCount++;
            } else {
                pendingCount++;
            }
        }

        for (ResearchOutput researchOutput : safeOutputs) {
            String status = toDashboardStatus(researchOutput.getStatus());
            if ("APPROVED".equals(status)) {
                approvedCount++;
            } else if ("REJECTED".equals(status)) {
                rejectedCount++;
            } else {
                pendingCount++;
            }
        }

        long booksCount = safeBooks.size() + safeOutputs.stream()
            .filter(output -> "BOOK".equals(normalizeOutputType(output.getOutputType())))
            .count();
        long chaptersCount = safeChapters.size() + safeOutputs.stream()
            .filter(output -> "CHAPTER".equals(normalizeOutputType(output.getOutputType())))
            .count();
        long proceedingsCount = safeProceedings.size() + safeOutputs.stream()
            .filter(output -> "PROCEEDING".equals(normalizeOutputType(output.getOutputType())))
            .count();

        long totalSubmissions = safeJournals.size() + safeBooks.size() + safeChapters.size() + safeProceedings.size() + safeOutputs.size();

        long activeResearchers = Stream.of(
                safeJournals.stream().map(j -> j.getSubmittedBy() != null ? j.getSubmittedBy().getUsername() : null),
                safeBooks.stream().map(b -> b.getSubmittedBy() != null ? b.getSubmittedBy().getUsername() : null),
                safeChapters.stream().map(c -> c.getSubmittedBy() != null ? c.getSubmittedBy().getUsername() : null),
                safeProceedings.stream().map(p -> p.getSubmittedBy() != null ? p.getSubmittedBy().getUsername() : null),
                safeOutputs.stream().map(ResearchOutput::getCreatedBy)
            )
            .flatMap(stream -> stream)
            .filter(username -> username != null && !username.isBlank())
            .distinct()
            .count();

        int dhetCompliance = safeJournals.size() > 0
            ? (int) Math.round((compliant * 100.0) / safeJournals.size())
            : 0;

        List<SubmissionCandidate> candidates = new ArrayList<>();

        for (Journal j : safeJournals) {
            candidates.add(new SubmissionCandidate(
                DashboardStatsDto.RecentSubmissionDto.builder()
                    .journalId(j.getId())
                    .title(j.getTitle() != null ? j.getTitle() : "-")
                    .type("Journal")
                    .status(toDashboardStatus(j.getStatus()))
                    .units(j.getUnits() != null && j.getUnits().getTotalUnitsClaimed() != null
                        ? j.getUnits().getTotalUnitsClaimed()
                        : 0)
                    .build(),
                toEpochMillis(j.getUpdatedAt(), j.getCreatedAt())
            ));
        }

        for (ConferenceProceedings cp : safeProceedings) {
            candidates.add(new SubmissionCandidate(
                DashboardStatsDto.RecentSubmissionDto.builder()
                    .journalId(cp.getId())
                    .title(cp.getTitleOfContribution() != null ? cp.getTitleOfContribution() : "-")
                    .type("Proceeding")
                    .status(toDashboardStatus(cp.getStatus()))
                    .units(cp.getUnits() != null && cp.getUnits().getTotalUnitsClaimed() != null
                        ? cp.getUnits().getTotalUnitsClaimed()
                        : 0)
                    .build(),
                toEpochMillis(cp.getUpdatedAt(), cp.getCreatedAt())
            ));
        }

        for (Book b : safeBooks) {
            candidates.add(new SubmissionCandidate(
                DashboardStatsDto.RecentSubmissionDto.builder()
                    .journalId(b.getId())
                    .title(b.getTitleOfBook() != null ? b.getTitleOfBook() : "-")
                    .type("Book")
                    .status(toDashboardStatus(b.getStatus()))
                    .units(b.getTotalUnitsClaimed() != null ? b.getTotalUnitsClaimed() : 0)
                    .build(),
                toEpochMillis(b.getUpdatedAt(), b.getCreatedAt())
            ));
        }

        for (Chapter c : safeChapters) {
            candidates.add(new SubmissionCandidate(
                DashboardStatsDto.RecentSubmissionDto.builder()
                    .journalId(c.getId())
                    .title(c.getTitleOfContribution() != null ? c.getTitleOfContribution() : (c.getTitleOfBook() != null ? c.getTitleOfBook() : "-"))
                    .type("Chapter")
                    .status(toDashboardStatus(c.getStatus()))
                    .units(c.getTotalUnitsClaimed() != null ? c.getTotalUnitsClaimed() : 0)
                    .build(),
                toEpochMillis(c.getUpdatedAt(), c.getCreatedAt())
            ));
        }

        for (ResearchOutput ro : safeOutputs) {
            String normalizedType = normalizeOutputType(ro.getOutputType());
            String type = switch (normalizedType) {
                case "BOOK" -> "Book";
                case "CHAPTER" -> "Chapter";
                case "PROCEEDING" -> "Proceeding";
                default -> "Research Output";
            };

            candidates.add(new SubmissionCandidate(
                DashboardStatsDto.RecentSubmissionDto.builder()
                    .journalId(ro.getId())
                    .title(ro.getTitle() != null ? ro.getTitle() : "-")
                    .type(type)
                    .status(toDashboardStatus(ro.getStatus()))
                    .units(0)
                    .build(),
                ro.getCreatedDate() != null ? ro.getCreatedDate().getTime() : 0L
            ));
        }

        List<DashboardStatsDto.RecentSubmissionDto> recentSubmissions = candidates.stream()
            .sorted(Comparator.comparingLong(SubmissionCandidate::getSortEpochMillis).reversed())
            .limit(8)
            .map(SubmissionCandidate::getItem)
            .toList();

        return DashboardStatsDto.builder()
            .totalJournals(safeJournals.size())
            .totalBooks(booksCount)
            .totalConferences(proceedingsCount)
            .totalChapters(chaptersCount)
            .totalUnits(Math.round(totalUnits * 100.0) / 100.0)
            .totalSubmissions(totalSubmissions)
            .totalOutputs(totalSubmissions)
            .activeResearchers(activeResearchers)
            .approvedCount(approvedCount)
            .pendingCount(pendingCount)
            .rejectedCount(rejectedCount)
            .dhetCompliancePercentage(dhetCompliance)
            .recentSubmissions(recentSubmissions)
            .build();
    }

    private String toDashboardStatus(JournalStatus status) {
        if (status == JournalStatus.READY_FOR_POSTING || status == JournalStatus.APPROVED) {
            return "APPROVED";
        }
        if (status == JournalStatus.REJECTED || status == JournalStatus.REJECTED_L1 || status == JournalStatus.REJECTED_L2) {
            return "REJECTED";
        }
        return "PENDING";
    }

    private String toDashboardStatus(ProceedingsStatus status) {
        if (status == ProceedingsStatus.READY_FOR_POSTING || status == ProceedingsStatus.APPROVED) {
            return "APPROVED";
        }
        if (status == ProceedingsStatus.REJECTED || status == ProceedingsStatus.REJECTED_L1 || status == ProceedingsStatus.REJECTED_L2) {
            return "REJECTED";
        }
        return "PENDING";
    }

    private String toDashboardStatus(BookStatus status) {
        if (status == BookStatus.READY_FOR_POSTING || status == BookStatus.ACCEPTED_BY_DHET) {
            return "APPROVED";
        }
        if (status == BookStatus.REJECTED_L1 || status == BookStatus.REJECTED_L2) {
            return "REJECTED";
        }
        return "PENDING";
    }

    private String toDashboardStatus(OutputStatus status) {
        if (status == OutputStatus.APPROVED) {
            return "APPROVED";
        }
        return "PENDING";
    }

    private String normalizeOutputType(String outputType) {
        String normalized = outputType == null ? "" : outputType.trim().toUpperCase();
        if (normalized.contains("CHAPTER")) {
            return "CHAPTER";
        }
        if (normalized.contains("BOOK")) {
            return "BOOK";
        }
        if (normalized.contains("PROCEED") || normalized.contains("CONFERENCE")) {
            return "PROCEEDING";
        }
        return "OTHER";
    }

    private long toEpochMillis(LocalDateTime primary, LocalDateTime fallback) {
        LocalDateTime value = primary != null ? primary : fallback;
        if (value == null) {
            return 0L;
        }
        return value.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    private static class SubmissionCandidate {
        private final DashboardStatsDto.RecentSubmissionDto item;
        private final long sortEpochMillis;

        private SubmissionCandidate(DashboardStatsDto.RecentSubmissionDto item, long sortEpochMillis) {
            this.item = item;
            this.sortEpochMillis = sortEpochMillis;
        }

        private DashboardStatsDto.RecentSubmissionDto getItem() {
            return item;
        }

        private long getSortEpochMillis() {
            return sortEpochMillis;
        }
    }
}

