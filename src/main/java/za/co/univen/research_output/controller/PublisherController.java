package za.co.univen.research_output.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.univen.research_output.repositories.PublisherRepository;
import za.co.univen.research_output.services.UserService;

@RestController
@RequestMapping("/api/publisher")
public class PublisherController {
    private final PublisherRepository repository;

    public PublisherController(PublisherRepository repository)
    {
        this.repository = repository;
    }

    @RequestMapping("/all")
    public Iterable<za.co.univen.research_output.entities.Publisher> getAll()
    {
        return repository.findAll();
    }
}
