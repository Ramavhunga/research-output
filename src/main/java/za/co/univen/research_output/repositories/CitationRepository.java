package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.Citation;
@Repository
public interface CitationRepository extends JpaRepository<Citation, Long> {
    // Additional query methods can be defined here if needed
}
