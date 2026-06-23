package za.co.univen.research_output.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.dto.ConferenceProceedingsListItemDto;
import za.co.univen.research_output.dto.ProceedingsDecisionRequest;
import za.co.univen.research_output.dto.ProceedingsStatusUpdateRequest;
import za.co.univen.research_output.entities.ConferenceProceedings;
import za.co.univen.research_output.entities.ProceedingsStatus;
import za.co.univen.research_output.entities.SubmissionLog;
import za.co.univen.research_output.repositories.ConferenceProceedingsRepository;
import za.co.univen.research_output.services.ConferenceProceedingsExcelExportService;
import za.co.univen.research_output.services.ConferenceProceedingsService;
import za.co.univen.research_output.services.CurrentUserService;

import java.io.ByteArrayInputStream;
import java.util.List;

@RestController
@RequestMapping({"/api/conference-proceedings", "/api/proceedings"})
public class ConferenceProceedingsController {

    private final ConferenceProceedingsService service;
    private final ConferenceProceedingsRepository repository;
    private final ConferenceProceedingsExcelExportService excelExportService;
    private final CurrentUserService currentUserService;

    public ConferenceProceedingsController(
            ConferenceProceedingsService service,
            ConferenceProceedingsRepository repository,
            ConferenceProceedingsExcelExportService excelExportService,
            CurrentUserService currentUserService
    ) {
        this.service = service;
        this.repository = repository;
        this.excelExportService = excelExportService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public ResponseEntity<ConferenceProceedings> create(
            @Valid @RequestBody ConferenceProceedings dto,
            @RequestHeader("X-Username") String username
    ) {
        dto.setId(null);
        ConferenceProceedings saved = service.createOrUpdate(dto, username);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportExcel() {
        List<ConferenceProceedings> proceedings = service.findAll(null, ProceedingsStatus.READY_FOR_POSTING, null);
        ByteArrayInputStream in = excelExportService.exportToExcel(proceedings);
        byte[] bytes = in.readAllBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=dhet-conference-proceedings.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/exists")
    public boolean existsByTitleOfContributionAndIssn(
            @RequestParam String titleOfContribution,
            @RequestParam String issn
    ) {
        return service.existsByTitleOfContributionAndIssn(titleOfContribution, issn);
    }

    @GetMapping
    public ResponseEntity<List<?>> getAll(
            @RequestParam(required = false) Integer yearOfPublication,
            @RequestParam(required = false) ProceedingsStatus status,
            @RequestParam(required = false) Long facultyId,
            @RequestParam(defaultValue = "false") boolean mine,
            @RequestParam(defaultValue = "false") boolean summary,
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
                if (summary) {
                    return ResponseEntity.ok(service.findAllSummaryForUser(user));
                }
                return ResponseEntity.ok(service.findAllForUser(user));
            }
        }
        if (summary) {
            return ResponseEntity.ok(service.findAllSummary(yearOfPublication, status, facultyId));
        }
        return ResponseEntity.ok(service.findAll(yearOfPublication, status, facultyId));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ConferenceProceedings> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ConferenceProceedings> update(
            @PathVariable Long id,
            @Valid @RequestBody ConferenceProceedings dto,
            @RequestHeader("X-Username") String username
    ) {
        dto.setId(id);
        ConferenceProceedings saved = service.createOrUpdate(dto, username);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id:\\d+}/status")
    public ResponseEntity<ConferenceProceedings> transitionStatus(
            @PathVariable Long id,
            @Valid @RequestBody ProceedingsStatusUpdateRequest request,
            @RequestHeader("X-Username") String username
    ) {
        ConferenceProceedings updated = service.transitionStatus(id, request.getStatus(), username);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id:\\d+}/submit")
    public ResponseEntity<ConferenceProceedings> submitForReview(
            @PathVariable Long id,
            @RequestBody(required = false) ProceedingsDecisionRequest request,
            @RequestHeader("X-Username") String username
    ) {
        ConferenceProceedings updated = service.submitForReview(id, username, request == null ? null : request.getComments());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id:\\d+}/approve")
    public ResponseEntity<ConferenceProceedings> approve(
            @PathVariable Long id,
            @RequestBody(required = false) ProceedingsDecisionRequest request,
            @RequestHeader("X-Username") String username
    ) {
        ConferenceProceedings updated = service.approve(id, username, extractRequiredComments(request, "Approval comments are required"));
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id:\\d+}/reject")
    public ResponseEntity<ConferenceProceedings> reject(
            @PathVariable Long id,
            @RequestBody(required = false) ProceedingsDecisionRequest request,
            @RequestHeader("X-Username") String username
    ) {
        ConferenceProceedings updated = service.reject(id, username, extractRequiredComments(request, "Rejection comments are required"));
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id:\\d+}/accept-dhet")
    public ResponseEntity<ConferenceProceedings> acceptByDhet(
            @PathVariable Long id,
            @RequestBody(required = false) ProceedingsDecisionRequest request,
            @RequestHeader("X-Username") String username
    ) {
        ConferenceProceedings updated = service.acceptByDhet(id, username, extractRequiredComments(request, "DHET acceptance comments are required"));
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id:\\d+}/timeline")
    public ResponseEntity<List<SubmissionLog>> getTimeline(@PathVariable Long id) {
        return ResponseEntity.ok(service.getTimeline(id));
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    private String extractRequiredComments(ProceedingsDecisionRequest request, String message) {
        if (request == null || request.getComments() == null || request.getComments().isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return request.getComments().trim();
    }
}

