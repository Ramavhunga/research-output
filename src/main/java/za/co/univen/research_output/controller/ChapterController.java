package za.co.univen.research_output.controller;

 import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.co.univen.research_output.dto.BookStatusUpdateRequest;
import za.co.univen.research_output.dto.ProceedingsDecisionRequest;
import za.co.univen.research_output.entities.BookStatus;
import za.co.univen.research_output.entities.Chapter;
import za.co.univen.research_output.entities.SubmissionLog;
import za.co.univen.research_output.services.ChapterExcelExportService;
import za.co.univen.research_output.services.ChapterService;
import za.co.univen.research_output.services.CurrentUserService;

import java.io.ByteArrayInputStream;
import java.util.List;

@RestController
@RequestMapping({"/api/chapters", "/api/chapter"})
public class ChapterController {

    private final ChapterService service;
    private final CurrentUserService currentUserService;
    private final ChapterExcelExportService excelExportService;

    public ChapterController(
            ChapterService service,
            CurrentUserService currentUserService,
            ChapterExcelExportService excelExportService
    ) {
        this.service = service;
        this.currentUserService = currentUserService;
        this.excelExportService = excelExportService;
    }

    @GetMapping
    public ResponseEntity<List<Chapter>> getAll(
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
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportExcel() {
        List<Chapter> chapters = service.findAll(BookStatus.READY_FOR_POSTING);
        ByteArrayInputStream in = excelExportService.exportToExcel(chapters);
        byte[] bytes = in.readAllBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=dhet-book-chapters.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Chapter> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<Chapter> create(
            @RequestBody Chapter dto,
            @RequestHeader("X-Username") String username
    ) {
        dto.setId(null);
        return ResponseEntity.ok(service.createOrUpdate(dto, username));
    }

    @PutMapping("/{id:\\d+}")
    public ResponseEntity<Chapter> update(
            @PathVariable Long id,
            @RequestBody Chapter dto,
            @RequestHeader("X-Username") String username
    ) {
        dto.setId(id);
        return ResponseEntity.ok(service.createOrUpdate(dto, username));
    }

    @PatchMapping("/{id:\\d+}/status")
    public ResponseEntity<Chapter> transitionStatus(
            @PathVariable Long id,
            @RequestBody BookStatusUpdateRequest request,
            @RequestHeader("X-Username") String username
    ) {
        Chapter updated = service.transitionStatus(id, request.getStatus(), username);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id:\\d+}/submit")
    public ResponseEntity<Chapter> submitForReview(
            @PathVariable Long id,
            @RequestBody(required = false) ProceedingsDecisionRequest request,
            @RequestHeader("X-Username") String username
    ) {
        Chapter updated = service.submitForReview(id, username, request == null ? null : request.getComments());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id:\\d+}/approve")
    public ResponseEntity<Chapter> approve(
            @PathVariable Long id,
            @RequestBody(required = false) ProceedingsDecisionRequest request,
            @RequestHeader("X-Username") String username
    ) {
        Chapter updated = service.approve(id, username, extractRequiredComments(request, "Approval comments are required"));
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id:\\d+}/reject")
    public ResponseEntity<Chapter> reject(
            @PathVariable Long id,
            @RequestBody(required = false) ProceedingsDecisionRequest request,
            @RequestHeader("X-Username") String username
    ) {
        Chapter updated = service.reject(id, username, extractRequiredComments(request, "Rejection comments are required"));
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id:\\d+}/accept-dhet")
    public ResponseEntity<Chapter> acceptByDhet(
            @PathVariable Long id,
            @RequestBody(required = false) ProceedingsDecisionRequest request,
            @RequestHeader("X-Username") String username
    ) {
        Chapter updated = service.acceptByDhet(id, username, extractRequiredComments(request, "DHET acceptance comments are required"));
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

    @GetMapping("/exists")
    public boolean existsByTitleAndIsbn(
            @RequestParam String title,
            @RequestParam String isbn,
            @RequestParam(required = false) Long id
    ) {
        return service.existsByTitleAndIsbn(title, isbn, id);
    }

    private String extractRequiredComments(ProceedingsDecisionRequest request, String message) {
        if (request == null || request.getComments() == null || request.getComments().isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return request.getComments().trim();
    }
}

