package za.co.univen.research_output.services;

import org.springframework.stereotype.Service;
import za.co.univen.research_output.entities.OutputStatus;
import za.co.univen.research_output.repositories.ResearchOutputRepository;
import za.co.univen.research_output.entities.ResearchOutput;

import java.util.List;
import java.util.Optional;

@Service
public class ResearchOutputService {
    private final ResearchOutputRepository repository;

    public ResearchOutputService(ResearchOutputRepository repository) {
        this.repository = repository;
    }

    public List<ResearchOutput> findAll() {
        return repository.findAll();
    }

    public List<ResearchOutput> findAllByCreatedBy(String username) {
        return repository.findAllByCreatedBy(username);
    }

    public  List<ResearchOutput> findAllByStatus(OutputStatus status) {
        return repository.findAllByStatus(status);
    }

    public Optional<ResearchOutput> findById(Long id) {
        return repository.findById(id);
    }

    public ResearchOutput save(ResearchOutput output) {
        return repository.save(output);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
