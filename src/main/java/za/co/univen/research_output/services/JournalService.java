package za.co.univen.research_output.services;

import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.dto.JournalDto;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.repositories.JournalRepository;

@Service
public class JournalService {

    private final ModelMapper modelMapper = new ModelMapper();
    private final JournalRepository repository;

    public JournalService(JournalRepository repository) {

        this.repository = repository;
    }

    @Transactional
    public JournalDto createOrUpdate(JournalDto dto) {

        Journal entity = modelMapper.map(dto, Journal.class);
        Journal saved = repository.save(entity);
        return modelMapper.map(entity, JournalDto.class);
    }


    public Journal getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Journal not found: " + id));
    }
}
