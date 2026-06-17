package za.co.univen.research_output.services;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.dto.DashboardStatsDto;
import za.co.univen.research_output.entities.ConferenceProceedings;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.entities.JournalStatus;
import za.co.univen.research_output.entities.OutputStatus;
import za.co.univen.research_output.entities.ProceedingsStatus;
import za.co.univen.research_output.entities.ResearchOutput;
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
    private final ConferenceProceedingsRepository conferenceProceedingsRepository;
    private final ResearchOutputRepository researchOutputRepository;

    public DashboardService(
            JournalRepository journalRepository,
            ConferenceProceedingsRepository conferenceProceedingsRepository,
            ResearchOutputRepository researchOutputRepository
    ) {
        this.journalRepository = journalRepository;
        this.conferenceProceedingsRepository = conferenceProceedingsRepository;
        this.researchOutputRepository = researchOutputRepository;
    }

    /**
     * Get dashboard statistics for admin users (all journals)
     */
    @Transactional
    public DashboardStatsDto getDashboardStatsForAdmin() {
        List<Journal> allJournals = journalRepository.findAll();
        List<ConferenceProceedings> allProceedings = conferenceProceedingsRepository.findAll();
        List<ResearchOutput> allResearchOutputs = researchOutputRepository.findAll();
        return buildDashboardStats(allJournals, allProceedings, allResearchOutputs);
    }

    /**
     * Get dashboard statistics for a specific user
     */
    @Transactional
    public DashboardStatsDto getDashboardStatsForUser(String username) {
        List<Journal> userJournals = journalRepository.findBySubmittedByUsername(username);
        List<ConferenceProceedings> userProceedings = conferenceProceedingsRepository.findBySubmittedByUsername(username);
        List<ResearchOutput> userResearchOutputs = researchOutputRepository.findAllByCreatedBy(username);
        return buildDashboardStats(userJournals, userProceedings, userResearchOutputs);
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

        return buildDashboardStats(deduplicated, reviewerProceedings, reviewerResearchOutputs);
    }

    /**
     * Build dashboard stats from journals + proceedings + legacy research outputs.
     */
    private DashboardStatsDto buildDashboardStats(
            List<Journal> journals,
            List<ConferenceProceedings> proceedings,
            List<ResearchOutput> researchOutputs
    ) {
        List<Journal> safeJournals = journals == null ? List.of() : journals;
        List<ConferenceProceedings> safeProceedings = proceedings == null ? List.of() : proceedings;
        List<ResearchOutput> safeOutputs = researchOutputs == null ? List.of() : researchOutputs;

        if (safeJournals.isEmpty() && safeProceedings.isEmpty() && safeOutputs.isEmpty()) {
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

        long booksCount = safeOutputs.stream()
            .filter(output -> "BOOK".equals(normalizeOutputType(output.getOutputType())))
            .count();
        long chaptersCount = safeOutputs.stream()
            .filter(output -> "CHAPTER".equals(normalizeOutputType(output.getOutputType())))
            .count();
        long proceedingsCount = safeProceedings.size() + safeOutputs.stream()
            .filter(output -> "PROCEEDING".equals(normalizeOutputType(output.getOutputType())))
            .count();

        long totalSubmissions = safeJournals.size() + safeProceedings.size() + safeOutputs.size();

        long activeResearchers = Stream.concat(
                Stream.concat(
                    safeJournals.stream().map(j -> j.getSubmittedBy() != null ? j.getSubmittedBy().getUsername() : null),
                    safeProceedings.stream().map(p -> p.getSubmittedBy() != null ? p.getSubmittedBy().getUsername() : null)
                ),
                safeOutputs.stream().map(ResearchOutput::getCreatedBy)
            )
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

