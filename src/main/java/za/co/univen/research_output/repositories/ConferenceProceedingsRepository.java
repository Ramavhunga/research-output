package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.dto.ConferenceProceedingsListItemDto;
import za.co.univen.research_output.entities.ConferenceProceedings;
import za.co.univen.research_output.entities.ProceedingsStatus;

import java.util.List;

@Repository
public interface ConferenceProceedingsRepository extends JpaRepository<ConferenceProceedings, Long> {

    boolean existsByTitleOfContributionAndIssn(String titleOfContribution, String issn);

    List<ConferenceProceedings> findBySubmittedByUsername(String username);

    @Query("""
        SELECT new za.co.univen.research_output.dto.ConferenceProceedingsListItemDto(
            cp.id,
            cp.dhetNo,
            cp.yearOfPublication,
            cp.status,
            cp.titleOfContribution,
            cp.publisher,
            cp.isbn,
            cp.submittedBy.username,
            cp.updatedAt
        )
        FROM ConferenceProceedings cp
        WHERE cp.submittedBy.username = :username
        ORDER BY cp.id DESC
        """)
    List<ConferenceProceedingsListItemDto> findSummaryBySubmittedByUsername(@Param("username") String username);

    @Query("""
        SELECT DISTINCT cp
        FROM ConferenceProceedings cp
        LEFT JOIN cp.authors a
        WHERE (:yearOfPublication IS NULL OR cp.yearOfPublication = :yearOfPublication)
          AND (:status IS NULL OR cp.status = :status)
          AND (:facultyId IS NULL OR a.facultyId = :facultyId)
        ORDER BY cp.id DESC
        """)
    List<ConferenceProceedings> search(
            @Param("yearOfPublication") Integer yearOfPublication,
            @Param("status") ProceedingsStatus status,
            @Param("facultyId") Long facultyId
    );

    @Query("""
        SELECT new za.co.univen.research_output.dto.ConferenceProceedingsListItemDto(
            cp.id,
            cp.dhetNo,
            cp.yearOfPublication,
            cp.status,
            cp.titleOfContribution,
            cp.publisher,
            cp.isbn,
            cp.submittedBy.username,
            cp.updatedAt
        )
        FROM ConferenceProceedings cp
        WHERE (:yearOfPublication IS NULL OR cp.yearOfPublication = :yearOfPublication)
          AND (:status IS NULL OR cp.status = :status)
          AND (
            :facultyId IS NULL
            OR EXISTS (
              SELECT 1
              FROM Author a
              WHERE a.conferenceProceedings = cp
                AND a.facultyId = :facultyId
            )
          )
        ORDER BY cp.id DESC
        """)
    List<ConferenceProceedingsListItemDto> searchSummary(
            @Param("yearOfPublication") Integer yearOfPublication,
            @Param("status") ProceedingsStatus status,
            @Param("facultyId") Long facultyId
    );

}

