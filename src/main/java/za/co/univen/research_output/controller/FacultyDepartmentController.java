package za.co.univen.research_output.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.dto.DepartmentDeanDTO;
import za.co.univen.research_output.entities.Department;
import za.co.univen.research_output.entities.Faculty;
import za.co.univen.research_output.repositories.DepartmentRepository;
import za.co.univen.research_output.repositories.FacultyRepository;
import za.co.univen.research_output.services.DepartmentDeanService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facultydepartment")
public class FacultyDepartmentController {

    private final FacultyRepository facultyRepository;
    private  final DepartmentRepository departmentRepository;
    private final DepartmentDeanService departmentDeanService;

    public FacultyDepartmentController(FacultyRepository facultyRepository, DepartmentRepository departmentRepository, DepartmentDeanService departmentDeanService) {
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.departmentDeanService = departmentDeanService;
    }

    @GetMapping("/faculties")
    public ResponseEntity<List<Faculty>> getAll() {
        return ResponseEntity.ok(facultyRepository.findAll());
    }

    @GetMapping("/faculties/{facultyId}/departments")
    public ResponseEntity<List<Department>> getByFaculty(@PathVariable Long facultyId) {
        return ResponseEntity.ok(departmentRepository.findDepartmentByFacultyId(facultyId));
    }

    // Department Dean Assignment Endpoints

    @GetMapping("/deans")
    public ResponseEntity<List<DepartmentDeanDTO>> getAllDeans() {
        return ResponseEntity.ok(departmentDeanService.getAllDeans());
    }

    @GetMapping("/department/{departmentId}/deans")
    public ResponseEntity<List<DepartmentDeanDTO>> getDeansByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(departmentDeanService.getDeansByDepartment(departmentId));
    }

    @PostMapping("/department/{departmentId}/dean/{staffNo}")
    public ResponseEntity<Map<String, Object>> assignDean(@PathVariable Long departmentId, @PathVariable String staffNo) {
        try {
            DepartmentDeanDTO result = departmentDeanService.assignDean(departmentId, staffNo);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Dean assigned successfully");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/department/{departmentId}/dean/{staffNo}")
    public ResponseEntity<Map<String, Object>> deleteDean(@PathVariable Long departmentId, @PathVariable String staffNo) {
        try {
            departmentDeanService.deleteDean(departmentId, staffNo);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Dean assignment deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/dean/{id}")
    public ResponseEntity<Map<String, Object>> deleteDeanById(@PathVariable Long id) {
        try {
            departmentDeanService.deleteDeanById(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Dean assignment deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

}
