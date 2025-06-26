package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.Reviewer;

@Repository
public interface ReviewerRepository extends JpaRepository<Reviewer, Long> {}
