package za.co.univen.research_output.controller;

import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.dto.JournalApprovalTimelineDto;
import za.co.univen.research_output.dto.JournalDecisionRequest;
import za.co.univen.research_output.dto.JournalStatusUpdateRequest;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.entities.JournalStatus;
import za.co.univen.research_output.repositories.JournalRepository;
import za.co.univen.research_output.services.CurrentUserService;
import za.co.univen.research_output.services.JournalExcelExportService;
import za.co.univen.research_output.services.JournalService;

import java.io.ByteArrayInputStream;
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
    public ResponseEntity<Journal> create(
            @Valid @RequestBody Journal dto,
            @RequestHeader("X-Username") String username
    ) {
        dto.setId(null);
        Journal saved = service.createOrUpdate(dto, username);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Journal> update(
            @PathVariable Long id,
            @Valid @RequestBody Journal dto,
            @RequestHeader("X-Username") String username
    ) {
        dto.setId(id);
        Journal saved = service.createOrUpdate(dto, username);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Journal> transitionStatus(
            @PathVariable Long id,
            @Valid @RequestBody JournalStatusUpdateRequest request,
            @RequestHeader("X-Username") String username
    ) {
        Journal updated = service.transitionStatus(id, request.getStatus(), username);
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
            @RequestParam(required = false) Long facultyId,
            @RequestParam(defaultValue = "false") boolean mine,
            @RequestParam(required = false) String username,
            @RequestHeader(value = "X-Username", required = false) String usernameHeader
    ) {
        if (mine) {
            String resolvedUsername = username;
            if (resolvedUsername == null || resolvedUsername.isBlank()) {
                resolvedUsername = usernameHeader;
            }
            if (resolvedUsername != null && !resolvedUsername.isBlank()) {
                String user = currentUserService.getOrCreateUserByUsername(resolvedUsername).getUsername();
                return ResponseEntity.ok(service.findAllForUser(user));
            }
        }
        return ResponseEntity.ok(service.findAll(year, status, facultyId));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(defaultValue = "false") boolean mine,
            @RequestHeader(value = "X-Username", required = false) String username
    ) {
        List<Journal> journals;
        if (mine) {
            String resolvedUsername = currentUserService.getOrCreateUserByUsername(username).getUsername();
            journals = service.findAllForUser(resolvedUsername);
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

    @GetMapping({"/{id}/export", "/export/{id}"})
    public ResponseEntity<byte[]> exportSingleJournalExcel(@PathVariable Long id) {
        Journal journal = service.getByIdForExport(id);
        ByteArrayInputStream in = excelExportService.exportToExcel(List.of(journal));
        byte[] bytes = in.readAllBytes();
        String fileName = (journal.getDhetNo() == null || journal.getDhetNo().isBlank())
                ? "journal-" + id + ".xlsx"
                : "journal-" + journal.getDhetNo() + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/exists")
    public boolean existsByTitleAndIssn(
            @RequestParam String title,
            @RequestParam String issn,
            @RequestParam(required = false) Long id
    ) {
        if (id != null) {
            return journalRepository.existsByTitleAndIssnAndIdNot(title, issn, id);
        }
        return journalRepository.existsByTitleAndIssn(title, issn);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Journal> submitForReview(
            @PathVariable Long id,
            @RequestBody(required = false) JournalDecisionRequest request,
            @RequestHeader("X-Username") String username
    ) {
        Journal updated = service.submitForReview(id, username, request == null ? null : request.getComments());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Journal> approve(
            @PathVariable Long id,
            @RequestBody(required = false) JournalDecisionRequest request,
            @RequestHeader("X-Username") String username
    ) {
        Journal updated = service.approve(id, username, extractRequiredComments(request, "Approval comments are required"));
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Journal> reject(
            @PathVariable Long id,
            @RequestBody(required = false) JournalDecisionRequest request,
            @RequestHeader("X-Username") String username
    ) {
        Journal updated = service.reject(id, username, extractRequiredComments(request, "Rejection comments are required"));
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<JournalApprovalTimelineDto>> getTimeline(@PathVariable Long id) {
        return ResponseEntity.ok(service.getApprovalTimeline(id));
    }

    private String extractRequiredComments(JournalDecisionRequest request, String message) {
        if (request == null || request.getComments() == null || request.getComments().isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return request.getComments().trim();
    }
}
