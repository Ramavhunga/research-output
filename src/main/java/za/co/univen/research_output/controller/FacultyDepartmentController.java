package za.co.univen.research_output.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.entities.Department;
import za.co.univen.research_output.entities.Faculty;
import za.co.univen.research_output.repositories.DepartmentRepository;
import za.co.univen.research_output.repositories.FacultyRepository;

import java.util.List;

@RestController
@RequestMapping("/api/facultydepartment")
@CrossOrigin("*")
public class FacultyDepartmentController {

    private final FacultyRepository facultyRepository;
    private  final DepartmentRepository departmentRepository;

    public FacultyDepartmentController(FacultyRepository facultyRepository, DepartmentRepository departmentRepository) {
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping("/faculties")
    public ResponseEntity<List<Faculty>> getAll() {
        return ResponseEntity.ok(facultyRepository.findAll());
    }

    @GetMapping("/faculties/{facultyId}/departments")
    public ResponseEntity<List<Department>> getByFaculty(@PathVariable Long facultyId) {
        return ResponseEntity.ok(departmentRepository.getDepartmentByFaculty_Id(facultyId));
    }


}
