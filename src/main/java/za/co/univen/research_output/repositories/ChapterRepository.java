package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.Chapter;

import java.util.List;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    boolean existsByTitleOfBookAndIsbn(String titleOfBook, String isbn);

    boolean existsByTitleOfBookAndIsbnAndIdNot(String titleOfBook, String isbn, Long id);

    List<Chapter> findBySubmittedByUsername(String username);
}

