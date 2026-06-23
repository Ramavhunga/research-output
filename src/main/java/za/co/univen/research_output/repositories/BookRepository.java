 package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.Book;
import za.co.univen.research_output.entities.BookStatus;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    boolean existsByTitleOfBookAndIsbn(String titleOfBook, String isbn);

    boolean existsByTitleOfBookAndIsbnAndIdNot(String titleOfBook, String isbn, Long id);

    List<Book> findBySubmittedByUsername(String username);

    @Query("""
        SELECT DISTINCT b
        FROM Book b
        LEFT JOIN b.authors a
        WHERE (:status IS NULL OR b.status = :status)
        ORDER BY b.id DESC
        """)
    List<Book> search(@Param("status") BookStatus status);
}

