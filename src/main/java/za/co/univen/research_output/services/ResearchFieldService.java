package za.co.univen.research_output.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.entities.ResearchField;
import za.co.univen.research_output.repositories.ResearchFieldRepository;

import java.util.List;
@Service
public class ResearchFieldService {

    @Autowired
    private ResearchFieldRepository repository;

    public List<ResearchField> search(String search) {
        if (search == null || search.trim().isEmpty()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public List<ResearchField> autocomplete(String search) {
        return repository.findTop10ByNameStartingWithIgnoreCase(search);
    }

}
