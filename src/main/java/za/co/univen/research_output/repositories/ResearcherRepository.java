package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.Researcher;

import java.util.Optional;

@Repository
public interface ResearcherRepository extends JpaRepository<Researcher, Long> {

}
