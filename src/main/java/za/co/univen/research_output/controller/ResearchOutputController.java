package za.co.univen.research_output.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import za.co.univen.research_output.services.ResearchOutputService;
import za.co.univen.research_output.entities.ResearchOutput;

import java.util.List;


@RestController
@RequestMapping("/api/research-outputs")
@CrossOrigin("*")
public class ResearchOutputController {

    private final ResearchOutputService service;

    public ResearchOutputController(ResearchOutputService service) {
        this.service = service;
    }

    @GetMapping
    public List<ResearchOutput> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResearchOutput> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("load/{username}")
    public List<ResearchOutput> findAllByUsername(@PathVariable String username) {
        return service.findAllByCreatedBy(username);
    }

    @PostMapping
    public ResearchOutput create(@RequestBody ResearchOutput output) {
        return service.save(output);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }


    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenericError(Exception ex) {
        return new ResponseEntity<>("Custom error message: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}