package za.co.univen.research_output.services;

import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.dto.JournalDto;
import za.co.univen.research_output.entities.Journal;
import za.co.univen.research_output.repositories.JournalRepository;

import java.util.List;

@Service
public class JournalService {

    private final ModelMapper modelMapper = new ModelMapper();
    private final JournalRepository repository;

    public JournalService(JournalRepository repository) {

        this.repository = repository;
    }

    @Transactional
    public Journal createOrUpdate(Journal dto) {

      //  Journal entity = modelMapper.map(dto, Journal.class);

        /* IMPORTANT: link authors to journal */
        if (dto.getAuthors() != null) {
            dto.getAuthors().forEach(author -> author.setJournal(dto));
        }

        Journal saved = repository.save(dto);

        return saved;
    }

    public Journal getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException(" Journal not found: " + id));
    }
    @Transactional()
    public List<Journal> findAll() {
        return repository.findAll();


    }

}
