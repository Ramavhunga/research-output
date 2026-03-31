package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.co.univen.research_output.entities.Department;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    //List<Department> findAllByFaculty_id(Long facultyId);

    List<Department> findDepartmentByFacultyId(Long facultyId);


}
