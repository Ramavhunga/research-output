package za.co.univen.research_output.repositories;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.ResearchOutput;

import java.util.Optional;

@Repository
public interface ResearchOutputRepository extends JpaRepository<ResearchOutput, Long> {

}