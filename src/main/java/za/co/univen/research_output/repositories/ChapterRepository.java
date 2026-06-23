package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.BookStatus;
import za.co.univen.research_output.entities.Chapter;

import java.util.List;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    boolean existsByTitleOfBookAndIsbn(String titleOfBook, String isbn);

    boolean existsByTitleOfBookAndIsbnAndIdNot(String titleOfBook, String isbn, Long id);

    List<Chapter> findBySubmittedByUsername(String username);

    @Query("""
        SELECT DISTINCT c
        FROM Chapter c
        WHERE (:status IS NULL OR c.status = :status)
        ORDER BY c.id DESC
        """)
    List<Chapter> search(@Param("status") BookStatus status);
}

