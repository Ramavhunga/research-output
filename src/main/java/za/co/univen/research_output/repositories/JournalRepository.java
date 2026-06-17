package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.co.univen.research_output.dto.JournalListItemDto;
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
        SELECT new za.co.univen.research_output.dto.JournalListItemDto(
            j.id,
            j.dhetNo,
            j.year,
            j.status,
            j.title,
            j.publisher,
            j.doi,
            j.submittedBy.username,
            j.updatedAt
        )
        FROM Journal j
        WHERE j.submittedBy.username = :username
        ORDER BY j.id DESC
        """)
    List<JournalListItemDto> findSummaryBySubmittedByUsername(@Param("username") String username);

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

    @Query("""
        SELECT new za.co.univen.research_output.dto.JournalListItemDto(
            j.id,
            j.dhetNo,
            j.year,
            j.status,
            j.title,
            j.publisher,
            j.doi,
            j.submittedBy.username,
            j.updatedAt
        )
        FROM Journal j
        WHERE (:year IS NULL OR j.year = :year)
          AND (:status IS NULL OR j.status = :status)
          AND (
            :facultyId IS NULL
            OR EXISTS (
              SELECT 1
              FROM Author a
              WHERE a.journal = j
                AND a.facultyId = :facultyId
            )
          )
        ORDER BY j.id DESC
        """)
    List<JournalListItemDto> searchSummary(
            @Param("year") String year,
            @Param("status") JournalStatus status,
            @Param("facultyId") Long facultyId
    );

    @Query("""
        SELECT new za.co.univen.research_output.dto.JournalListItemDto(
            j.id,
            j.dhetNo,
            j.year,
            j.status,
            j.title,
            j.publisher,
            j.doi,
            j.submittedBy.username,
            j.updatedAt
        )
        FROM Journal j
        WHERE j.status IN :statuses
          AND (:statusFilter IS NULL OR j.status = :statusFilter)
          AND (
            :searchTerm IS NULL
            OR LOWER(j.title) LIKE :searchTerm
            OR LOWER(j.dhetNo) LIKE :searchTerm
            OR LOWER(j.publisher) LIKE :searchTerm
            OR LOWER(j.submittedBy.username) LIKE :searchTerm
          )
        """)
    Page<JournalListItemDto> findReviewQueueSummary(
            @Param("statuses") List<JournalStatus> statuses,
            @Param("statusFilter") JournalStatus statusFilter,
            @Param("searchTerm") String searchTerm,
            Pageable pageable
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
        WHERE j.comply = 'Yes'
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
