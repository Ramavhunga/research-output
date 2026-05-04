package za.co.univen.research_output.controller;

import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.entities.ConferenceProceedings;
import za.co.univen.research_output.repositories.ConferenceProceedingsRepository;
import za.co.univen.research_output.services.ConferenceProceedingsService;

import java.util.List;

@RestController
@RequestMapping("/api/conference-proceedings")
@CrossOrigin("*")
public class ConferenceProceedingsController {

    private final ConferenceProceedingsService service;
    private final ConferenceProceedingsRepository repository;
    private final ModelMapper modelMapper = new ModelMapper();

    public ConferenceProceedingsController(ConferenceProceedingsService service, ConferenceProceedingsRepository repository) {
        this.service = service;
        this.repository = repository;
    }

    @PostMapping()
    public ResponseEntity<ConferenceProceedings> create(@RequestBody ConferenceProceedings dto) {
        dto.setId(null);
        ConferenceProceedings saved = service.createOrUpdate(dto);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConferenceProceedings> update(@PathVariable Long id, @RequestBody ConferenceProceedings dto) {
        dto.setId(id);
        ConferenceProceedings saved = service.createOrUpdate(dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConferenceProceedings> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<ConferenceProceedings>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/exists")
    public boolean existsByTitleOfContributionAndIssn(
            @RequestParam String titleOfContribution,
            @RequestParam String issn
    ) {
        System.out.println("TITLE: " + titleOfContribution);
        System.out.println("ISSN: " + issn);
        return repository.existsByTitleOfContributionAndIssn(titleOfContribution, issn);
    }

}

