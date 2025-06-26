package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.univen.research_output.entities.Institution;

import java.util.Optional;

public interface InstitutionRepository extends JpaRepository<Institution, Long> {

}