package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.Journal;
@Repository
public interface JournalRepository extends JpaRepository<Journal, Long> {}
