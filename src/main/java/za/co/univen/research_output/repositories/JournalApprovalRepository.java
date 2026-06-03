package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.univen.research_output.entities.JournalApproval;

import java.util.List;

public interface JournalApprovalRepository extends JpaRepository<JournalApproval, Long> {
    List<JournalApproval> findByJournalIdOrderByActionDateAsc(Long journalId);
}

