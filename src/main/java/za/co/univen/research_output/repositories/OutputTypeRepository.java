package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.OutputType;

import java.util.Optional;

@Repository
public interface OutputTypeRepository extends JpaRepository<OutputType, Long> {

}
