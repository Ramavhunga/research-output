package za.co.univen.research_output.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.entities.ResearchField;
import za.co.univen.research_output.services.ResearchFieldService;

import java.util.List;

@RestController
@RequestMapping("/api/research-fields")
@CrossOrigin(origins = "*") // allow Angular

public class ResearchFieldController {
    @Autowired
    private ResearchFieldService service;


    // General search
    @GetMapping
    public List<ResearchField> search(
            @RequestParam(required = false) String search) {
        return service.search(search);
    }

    // Autocomplete
    @GetMapping("/autocomplete")
    public List<ResearchField> autocomplete(
            @RequestParam String search) {
        return service.autocomplete(search);
    }


}
