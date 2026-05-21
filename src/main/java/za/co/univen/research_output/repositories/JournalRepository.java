package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.entities.JournalStatus;

import java.util.List;

public interface JournalRepository extends JpaRepository<Journal, Long> {

    boolean existsByTitle(String title);

    boolean existsByTitleAndIssn(String title, String issn);

    List<Journal> findBySubmittedByUsername(String username);

    @Query("""
        SELECT DISTINCT j
        FROM Journal j
        LEFT JOIN j.authors a
        WHERE (:year IS NULL OR j.year = :year)
          AND (:status IS NULL OR j.status = :status)
          AND (:facultyId IS NULL OR a.facultyId = :facultyId)
        """)
    List<Journal> search(
            @Param("year") String year,
            @Param("status") JournalStatus status,
            @Param("facultyId") Long facultyId
    );
}
