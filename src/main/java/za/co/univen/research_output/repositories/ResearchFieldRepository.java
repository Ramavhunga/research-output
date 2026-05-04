package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.ResearchField;

import java.util.List;

@Repository
public interface ResearchFieldRepository extends JpaRepository<ResearchField, String> {


    @Query("SELECT r FROM ResearchField r " +
                "WHERE LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(r.code) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<ResearchField> search(@Param("search") String search);

    // Autocomplete (top 10)
    List<ResearchField> findTop10ByNameStartingWithIgnoreCase(String name);

}
