package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.entities.JournalStatus;

import java.util.List;
import java.util.Optional;

public interface JournalRepository extends JpaRepository<Journal, Long> {

    boolean existsByTitle(String title);

    boolean existsByTitleAndIssn(String title, String issn);

    boolean existsByTitleAndIssnAndIdNot(String title, String issn, Long id);

    List<Journal> findBySubmittedByUsername(String username);

    @Query("""
        SELECT DISTINCT j
        FROM Journal j
        LEFT JOIN j.authors a
        WHERE (:year IS NULL OR j.year = :year)
          AND (:status IS NULL OR j.status = :status)
          AND (:facultyId IS NULL OR a.facultyId = :facultyId)
        ORDER BY j.id DESC
        """)
    List<Journal> search(
            @Param("year") String year,
            @Param("status") JournalStatus status,
            @Param("facultyId") Long facultyId
    );

    // Optimized query for dashboard - fetches only necessary fields for multiple statuses
    @Query("""
        SELECT j FROM Journal j
        WHERE j.status IN :statuses
        ORDER BY j.id DESC
        LIMIT 1000
        """)
    List<Journal> findByStatusIn(@Param("statuses") List<JournalStatus> statuses);

    // Optimized query for user's review queue
    @Query("""
        SELECT j FROM Journal j
        WHERE j.status IN :statuses
        ORDER BY j.id DESC
        """)
    List<Journal> findReviewQueue(@Param("statuses") List<JournalStatus> statuses);

    // Dashboard stats - count by status
    @Query("""
        SELECT COUNT(DISTINCT j) FROM Journal j
        WHERE j.status = :status
        """)
    long countByStatus(@Param("status") JournalStatus status);

    // Recent submissions for a user
    @Query(value = """
        SELECT j FROM Journal j
        WHERE j.submittedBy.username = :username
        ORDER BY j.id DESC
        LIMIT :limit
        """)
    List<Journal> findRecentByUsername(@Param("username") String username, @Param("limit") int limit);

    // Count compliance - journals marked as compliant
    @Query("""
        SELECT COUNT(j) FROM Journal j
        WHERE j.comply = true
        """)
    long countCompliant();

    // Count distinct submitted by users
    @Query("""
        SELECT COUNT(DISTINCT j.submittedBy.username) FROM Journal j
        """)
    long countActiveResearchers();

    // Sum total units claimed
    @Query("""
        SELECT COALESCE(SUM(j.units.totalUnitsClaimed), 0.0) FROM Journal j
        """)
    double sumTotalUnitsClaimed();
}
