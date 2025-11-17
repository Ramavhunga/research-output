package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.univen.research_output.entities.Journal;

public interface JournalRepository extends JpaRepository<Journal, Long> {
}
