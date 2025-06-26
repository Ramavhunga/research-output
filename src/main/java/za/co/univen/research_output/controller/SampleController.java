package za.co.univen.research_output.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.univen.research_output.entities.Institution;
import za.co.univen.research_output.repositories.InstitutionRepository;


import java.util.List;

@RestController
@RequestMapping("/api/research")
@CrossOrigin("*")
public class SampleController {

    private final InstitutionRepository institutionRepository;

    public SampleController(InstitutionRepository institutionRepository) {
        this.institutionRepository = institutionRepository;
    }

    @GetMapping
    public ResponseEntity<List<Institution>> getAll() {
        List<Institution> institutions = institutionRepository.findAll();
        System.out.println("Institutions: " + institutions);
        return ResponseEntity.ok(institutions);
    }

}
