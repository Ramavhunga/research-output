package za.co.univen.research_output.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import za.co.univen.research_output.dto.DepartmentDeanDTO;
import za.co.univen.research_output.entities.DepartmentDean;
import za.co.univen.research_output.entities.Department;
import za.co.univen.research_output.repositories.DepartmentDeanRepository;
import za.co.univen.research_output.repositories.DepartmentRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DepartmentDeanService {
    private static final Logger logger = LoggerFactory.getLogger(DepartmentDeanService.class);

    @Autowired
    private DepartmentDeanRepository departmentDeanRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserService userService;

    public List<DepartmentDeanDTO> getAllDeans() {
        logger.info("Fetching all department deans");
        return departmentDeanRepository.findAll()
            .stream()
            .map(this::convertToDeanDTO)
            .collect(Collectors.toList());
    }

    public List<DepartmentDeanDTO> getDeansByDepartment(Long departmentId) {
        logger.info("Fetching deans for department: {}", departmentId);
        return departmentDeanRepository.findByDepartmentId(departmentId)
            .stream()
            .map(this::convertToDeanDTO)
            .collect(Collectors.toList());
    }

    public DepartmentDeanDTO assignDean(Long departmentId, String staffNo) {
        logger.info("Assigning dean - departmentId: {}, staffNo: {}", departmentId, staffNo);

        // Check if department exists
        Optional<Department> department = departmentRepository.findById(departmentId);
        if (department.isEmpty()) {
            throw new IllegalArgumentException("Department not found: " + departmentId);
        }

        // Check if already assigned
        if (departmentDeanRepository.existsByDepartmentIdAndStaffNo(departmentId, staffNo)) {
            throw new IllegalArgumentException("Dean already assigned to this department");
        }

        // Create new assignment
        DepartmentDean dean = new DepartmentDean();
        dean.setDepartmentId(departmentId);
        dean.setStaffNo(staffNo);

        DepartmentDean saved = departmentDeanRepository.save(dean);
        logger.info("Dean assigned successfully - id: {}", saved.getId());

        return convertToDeanDTO(saved);
    }

    public void deleteDean(Long departmentId, String staffNo) {
        logger.info("Deleting dean assignment - departmentId: {}, staffNo: {}", departmentId, staffNo);

        Optional<DepartmentDean> dean = departmentDeanRepository.findByDepartmentIdAndStaffNo(departmentId, staffNo);
        if (dean.isEmpty()) {
            throw new IllegalArgumentException("Dean assignment not found");
        }

        departmentDeanRepository.delete(dean.get());
        logger.info("Dean assignment deleted successfully");
    }

    public void deleteDeanById(Long id) {
        logger.info("Deleting dean assignment by id: {}", id);

        Optional<DepartmentDean> dean = departmentDeanRepository.findById(id);
        if (dean.isEmpty()) {
            throw new IllegalArgumentException("Dean assignment not found");
        }

        departmentDeanRepository.delete(dean.get());
        logger.info("Dean assignment deleted successfully");
    }

    private DepartmentDeanDTO convertToDeanDTO(DepartmentDean dean) {
        DepartmentDeanDTO dto = new DepartmentDeanDTO();
        dto.setId(dean.getId());
        dto.setDepartmentId(dean.getDepartmentId());
        dto.setStaffNo(dean.getStaffNo());
        dto.setCreatedAt(dean.getCreatedAt());
        dto.setUpdatedAt(dean.getUpdatedAt());

        // Fetch department details
        Optional<Department> department = departmentRepository.findById(dean.getDepartmentId());
        if (department.isPresent()) {
            dto.setDepartmentCode(department.get().getCode());
            dto.setDepartmentName(department.get().getName());
        }

        // Fetch staff details from UserService (this fetches from external system)
        try {
            var loginDTO = userService.loadLoginByStaffNo(dean.getStaffNo());
            if (loginDTO != null && loginDTO.getStaff() != null) {
                var staff = loginDTO.getStaff();
                dto.setTitle(staff.getTitle() != null ? staff.getTitle() : "");
                dto.setFirstname(staff.getFirstname() != null ? staff.getFirstname() : "");
                dto.setSurname(staff.getSurname() != null ? staff.getSurname() : "");
                dto.setFaculty(staff.getFaculty() != null ? staff.getFaculty() : "");
            }
        } catch (Exception e) {
            logger.warn("Could not fetch staff details for staff no: {}", dean.getStaffNo(), e);
            // Continue without staff details
        }

        return dto;
    }
}



