package za.co.univen.research_output.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.dto.DashboardStatsDto;
import za.co.univen.research_output.services.CurrentUserService;
import za.co.univen.research_output.services.DashboardService;

@RestController
@RequestMapping({"/api/dashboard", "/api/dashboards"})
public class DashboardController {

    private final DashboardService dashboardService;
    private final CurrentUserService currentUserService;

    public DashboardController(DashboardService dashboardService, CurrentUserService currentUserService) {
        this.dashboardService = dashboardService;
        this.currentUserService = currentUserService;
    }

    /**
     * Get optimized dashboard stats for the current user based on their role
     * - For ADMIN: returns all journals
     * - For REVIEWER: returns review queue
     * - For others: returns their own submissions
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestParam(value = "role", required = false) String roleParam
    ) {
        try {
            // Determine user role
            boolean isAdmin = currentUserService.hasAnyRole(currentUserService.getOrCreateUserByUsername(username), "ADMIN");
            boolean isReviewer = currentUserService.hasAnyRole(
                currentUserService.getOrCreateUserByUsername(username),
                "REVIEWER_LEVEL_1",
                "REVIEWER_LEVEL_2"
            );

            DashboardStatsDto stats;

            if (isAdmin) {
                stats = dashboardService.getDashboardStatsForAdmin();
            } else if (isReviewer) {
                stats = dashboardService.getDashboardStatsForReviewer();
            } else {
                stats = dashboardService.getDashboardStatsForUser(username);
            }

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            // Fallback to user's own data if role check fails
            return ResponseEntity.ok(dashboardService.getDashboardStatsForUser(username));
        }
    }

    /**
     * Get dashboard stats for admin view (all journals)
     */
    @GetMapping("/stats/admin")
    public ResponseEntity<DashboardStatsDto> getAdminDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStatsForAdmin());
    }

    /**
     * Get dashboard stats for reviewer view (review queue)
     */
    @GetMapping("/stats/reviewer")
    public ResponseEntity<DashboardStatsDto> getReviewerDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStatsForReviewer());
    }

    /**
     * Get dashboard stats for a specific user
     */
    @GetMapping("/stats/user/{username}")
    public ResponseEntity<DashboardStatsDto> getUserDashboardStats(@PathVariable String username) {
        return ResponseEntity.ok(dashboardService.getDashboardStatsForUser(username));
    }
}

