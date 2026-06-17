package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.SubmissionLog;

import java.util.List;

@Repository
public interface SubmissionLogRepository extends JpaRepository<SubmissionLog, Long> {
	List<SubmissionLog> findByBookIdOrderByTimestampAsc(Long bookId);

	List<SubmissionLog> findByConferenceProceedingsIdOrderByTimestampAsc(Long proceedingsId);
}
