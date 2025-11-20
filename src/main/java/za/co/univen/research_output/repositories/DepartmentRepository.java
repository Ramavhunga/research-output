package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.univen.research_output.entities.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {}
