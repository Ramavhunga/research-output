package za.co.univen.research_output.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {
    private long totalJournals;
    private long totalBooks;
    private long totalConferences;
    private long totalChapters;
    private double totalUnits;
    private long totalSubmissions;
    private long totalOutputs;
    private long activeResearchers;
    private long approvedCount;
    private long pendingCount;
    private long rejectedCount;
    private int dhetCompliancePercentage;
    private List<RecentSubmissionDto> recentSubmissions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentSubmissionDto {
        private Long journalId;
        private String title;
        private String type;
        private String status;
        private double units;
    }
}

