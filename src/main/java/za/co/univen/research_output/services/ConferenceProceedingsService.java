package za.co.univen.research_output.services;

import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.entities.ConferenceProceedings;
import za.co.univen.research_output.repositories.ConferenceProceedingsRepository;

import java.util.List;

@Service
public class ConferenceProceedingsService {

    private final ModelMapper modelMapper = new ModelMapper();
    private final ConferenceProceedingsRepository repository;

    public ConferenceProceedingsService(ConferenceProceedingsRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ConferenceProceedings createOrUpdate(ConferenceProceedings dto) {
        /* IMPORTANT: link authors to conference proceedings */
        if (dto.getAuthors() != null) {
            dto.getAuthors().forEach(author -> author.setConferenceProceedings(dto));
        }

        ConferenceProceedings saved = repository.save(dto);
        return saved;
    }

    public ConferenceProceedings getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conference Proceedings not found: " + id));
    }

    @Transactional
    public List<ConferenceProceedings> findAll() {
        return repository.findAll();
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

}

