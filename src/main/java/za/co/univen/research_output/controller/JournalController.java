package za.co.univen.research_output.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.dto.JournalDto;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.services.JournalService;

@RestController
@RequestMapping("/api/journal")
@CrossOrigin("*")
public class JournalController {
    private final JournalService service;

    public JournalController(JournalService service) {
        this.service = service;
    }
    @PostMapping
    public ResponseEntity<JournalDto> create(@RequestBody JournalDto dto) {
        JournalDto saved = service.createOrUpdate(dto);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JournalDto> update(@PathVariable Long id, @RequestBody JournalDto dto) {
        dto.setId(id);
        JournalDto saved = service.createOrUpdate(dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Journal> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }
}
