package za.co.univen.research_output.controller;

import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.dto.JournalDto;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.repositories.JournalRepository;
import za.co.univen.research_output.services.JournalService;

import java.util.List;

@RestController
@RequestMapping("/api/journal")
@CrossOrigin("*")
public class JournalController {
    private final JournalService service;
    private final JournalRepository jounralrepository;
    private final ModelMapper modelMapper = new ModelMapper();

    public JournalController(JournalService service, JournalRepository jounralrepository) {
        this.service = service;
        this.jounralrepository = jounralrepository;
    }

    @PostMapping
    public ResponseEntity<Journal> create(@RequestBody Journal dto) {
        dto.setId(null);
        Journal saved = service.createOrUpdate(dto);
        return ResponseEntity.ok(saved);
    }
    @PutMapping("/{id}")
    public ResponseEntity<Journal> update(@PathVariable Long id, @RequestBody Journal dto) {
        dto.setId(id);
        Journal saved = service.createOrUpdate(dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Journal> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }
    @GetMapping
    public ResponseEntity<List<Journal>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }


    @GetMapping("/exists")
    public boolean existsByTitleAndIssn(
            @RequestParam String title,
            @RequestParam String issn
    ) {
        System.out.println("TITLE: " + title);
        System.out.println("ISSN: " + issn);
        return jounralrepository.existsByTitleOrIssn(title, issn);
    }
}
