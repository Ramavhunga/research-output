package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.univen.research_output.entities.Department;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> getDepartmentByFaculty_Id(Long facultyId);
}
