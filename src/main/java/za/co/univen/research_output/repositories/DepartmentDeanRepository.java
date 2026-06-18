package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.DepartmentDean;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentDeanRepository extends JpaRepository<DepartmentDean, Long> {
    List<DepartmentDean> findByDepartmentId(Long departmentId);

    Optional<DepartmentDean> findByDepartmentIdAndStaffNo(Long departmentId, String staffNo);

    boolean existsByDepartmentIdAndStaffNo(Long departmentId, String staffNo);

    void deleteByDepartmentIdAndStaffNo(Long departmentId, String staffNo);
}

