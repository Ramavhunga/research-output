package za.co.univen.research_output.services;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.dto.DashboardStatsDto;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.entities.JournalStatus;
import za.co.univen.research_output.repositories.JournalRepository;

import java.util.Arrays;
import java.util.List;

@Service
public class DashboardService {

    private final JournalRepository journalRepository;

    public DashboardService(JournalRepository journalRepository) {
        this.journalRepository = journalRepository;
    }

    /**
     * Get dashboard statistics for admin users (all journals)
     */
    @Transactional
    public DashboardStatsDto getDashboardStatsForAdmin() {
        // Fetch only the recent 8 journals for display
        List<Journal> allJournals = journalRepository.findAll();
        long totalCount = journalRepository.count();

        return buildDashboardStats(allJournals, totalCount);
    }

    /**
     * Get dashboard statistics for a specific user
     */
    @Transactional
    public DashboardStatsDto getDashboardStatsForUser(String username) {
        List<Journal> userJournals = journalRepository.findBySubmittedByUsername(username);
        return buildDashboardStats(userJournals, userJournals.size());
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

        return buildDashboardStats(deduplicated, deduplicated.size());
    }

    /**
     * Helper method to build dashboard stats from a list of journals
     */
    private DashboardStatsDto buildDashboardStats(List<Journal> journals, long totalCount) {
        if (journals == null || journals.isEmpty()) {
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

        // Calculate stats using optimized logic
        double totalUnits = 0;
        long approvedCount = 0;
        long pendingCount = 0;
        long rejectedCount = 0;
        long compliant = 0;

        for (Journal journal : journals) {
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

        // Count distinct researchers
        long activeResearchers = journals.stream()
            .map(j -> j.getSubmittedBy() != null ? j.getSubmittedBy().getUsername() : null)
            .distinct()
            .count();

        // Calculate compliance percentage
        int dhetCompliance = journals.size() > 0
            ? (int) Math.round((compliant * 100.0) / journals.size())
            : 0;

        // Get recent submissions (last 8)
        List<DashboardStatsDto.RecentSubmissionDto> recentSubmissions = journals.stream()
            .limit(8)
            .map(j -> DashboardStatsDto.RecentSubmissionDto.builder()
                .journalId(j.getId())
                .title(j.getTitle() != null ? j.getTitle() : "-")
                .type("Journal")
                .status(toDashboardStatus(j.getStatus()))
                .units(j.getUnits() != null && j.getUnits().getTotalUnitsClaimed() != null
                    ? j.getUnits().getTotalUnitsClaimed()
                    : 0)
                .build())
            .toList();

        return DashboardStatsDto.builder()
            .totalJournals(journals.size())
            .totalBooks(0)  // Can be extended later
            .totalConferences(0)  // Can be extended later
            .totalChapters(0)  // Can be extended later
            .totalUnits(Math.round(totalUnits * 100.0) / 100.0)
            .totalSubmissions(journals.size())
            .totalOutputs(journals.size())
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
}

