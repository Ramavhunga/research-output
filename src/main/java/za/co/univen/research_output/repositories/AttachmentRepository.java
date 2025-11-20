package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.Attachment;
import za.co.univen.research_output.entities.Department;
import za.co.univen.research_output.entities.Faculty;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {}

