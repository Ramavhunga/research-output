package za.co.univen.research_output.controller;

import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.dto.JournalStatusUpdateRequest;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.entities.JournalStatus;
import za.co.univen.research_output.repositories.JournalRepository;
import za.co.univen.research_output.services.CurrentUserService;
import za.co.univen.research_output.services.JournalExcelExportService;
import za.co.univen.research_output.services.JournalService;

import java.io.ByteArrayInputStream;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping({"/api/journals", "/api/journal"})
@CrossOrigin("*")
public class JournalController {
    private final JournalService service;
    private final JournalRepository journalRepository;
    private final JournalExcelExportService excelExportService;
    private final CurrentUserService currentUserService;

    public JournalController(
            JournalService service,
            JournalRepository journalRepository,
            JournalExcelExportService excelExportService,
            CurrentUserService currentUserService
    ) {
        this.service = service;
        this.journalRepository = journalRepository;
        this.excelExportService = excelExportService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public ResponseEntity<Journal> create(@Valid @RequestBody Journal dto, Principal principal) {
        dto.setId(null);
        Journal saved = service.createOrUpdate(dto, principal);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Journal> update(@PathVariable Long id, @Valid @RequestBody Journal dto, Principal principal) {
        dto.setId(id);
        Journal saved = service.createOrUpdate(dto, principal);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Journal> transitionStatus(
            @PathVariable Long id,
            @Valid @RequestBody JournalStatusUpdateRequest request,
            Principal principal
    ) {
        Journal updated = service.transitionStatus(id, request.getStatus(), principal);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Journal> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<Journal>> getAll(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) JournalStatus status,
            @RequestParam(required = false) Long facultyId
    ) {
        return ResponseEntity.ok(service.findAll(year, status, facultyId));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(defaultValue = "false") boolean mine,
            Principal principal
    ) {
        List<Journal> journals;
        if (mine) {
            String username = currentUserService.getLoggedInUser(principal).getUsername();
            journals = service.findAllForUser(username);
        } else {
            journals = service.findAll(null, null, null);
        }

        ByteArrayInputStream in = excelExportService.exportToExcel(journals);
        byte[] bytes = in.readAllBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=dhet-journals.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/exists")
    public boolean existsByTitleAndIssn(
            @RequestParam String title,
            @RequestParam String issn
    ) {
        return journalRepository.existsByTitleAndIssn(title, issn);
    }
}
