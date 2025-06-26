package za.co.univen.research_output.loader;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import za.co.univen.research_output.repositories.*;
import za.co.univen.research_output.entities.*;
import za.co.univen.research_output.repositories.InstitutionRepository;

import java.util.List;

@Component
public class SampleDataLoader implements CommandLineRunner {

    private final InstitutionRepository institutionRepo;
    private final DepartmentRepository departmentRepo;
    private final UserRepository userRepo;
    private final ResearcherRepository researcherRepo;
    private final OutputTypeRepository outputTypeRepo;
    private final PublisherRepository publisherRepo;
    private final ResearchOutputRepository researchOutputRepo;

    public SampleDataLoader(InstitutionRepository institutionRepo, DepartmentRepository departmentRepo, UserRepository userRepo, ResearcherRepository researcherRepo, OutputTypeRepository outputTypeRepo, PublisherRepository publisherRepo, ResearchOutputRepository researchOutputRepo) {
        this.institutionRepo = institutionRepo;
        this.departmentRepo = departmentRepo;
        this.userRepo = userRepo;
        this.researcherRepo = researcherRepo;
        this.outputTypeRepo = outputTypeRepo;
        this.publisherRepo = publisherRepo;
        this.researchOutputRepo = researchOutputRepo;
    }

    @Override
    public void run(String... args) {
        System.out.println("Loading sample data............................................");
       try {
           Institution inst = institutionRepo.save(new Institution("Mpumalanga University", "Mbombela, South Africa"));
           Department dept = departmentRepo.save(new Department("Computer Science", inst));
           User user = userRepo.save(new User("jdoe", "password", "jdoe@example.com", "RESEARCHER"));
           Researcher researcher = researcherRepo.save(new Researcher("John Doe", "0000-0001-2345-6789", "C1", "Senior Lecturer", dept, user));
           OutputType outputType = outputTypeRepo.save(new OutputType("Journal Article"));
           Publisher publisher = publisherRepo.save(new Publisher("Elsevier", "Netherlands"));
           researchOutputRepo.save(new ResearchOutput("AI in Public Sector", "This paper explores AI adoption in government services.", 2024, "10.1234/ai.ps.2024", true, OutputStatus.APPROVED, outputType, publisher, List.of(researcher)));

           Institution inst2 = institutionRepo.save(new Institution("University of Pretoria", "Pretoria, South Africa"));
           Department dept2 = departmentRepo.save(new Department("Mathematics", inst2));
           User user2 = userRepo.save(new User("asmith", "securepass", "asmith@example.com", "RESEARCHER"));
           Researcher researcher2 = researcherRepo.save(new Researcher("Alice Smith", "0000-0002-3456-7890", "B2", "Associate Professor", dept2, user2));
           OutputType outputType2 = outputTypeRepo.save(new OutputType("Conference Paper"));
           Publisher publisher2 = publisherRepo.save(new Publisher("Springer", "Germany"));
           researchOutputRepo.save(new ResearchOutput("Quantum Computing Advances", "This paper discusses breakthroughs in quantum computing.", 2023, "10.5678/qc.adv.2023", true, OutputStatus.APPROVED, outputType2, publisher2, List.of(researcher2)));

           Institution inst3 = institutionRepo.save(new Institution("Stellenbosch University", "Stellenbosch, South Africa"));
           Department dept3 = departmentRepo.save(new Department("Physics", inst3));
           User user3 = userRepo.save(new User("mjones", "mypassword", "mjones@example.com", "RESEARCHER"));
           Researcher researcher3 = researcherRepo.save(new Researcher("Michael Jones", "0000-0003-4567-8901", "A1", "Research Fellow", dept3, user3));
           OutputType outputType3 = outputTypeRepo.save(new OutputType("Book Chapter"));
           Publisher publisher3 = publisherRepo.save(new Publisher("Oxford University Press", "United Kingdom"));
           researchOutputRepo.save(new ResearchOutput("Nanotechnology Applications", "This chapter explores nanotechnology in medicine.", 2022, "10.7890/nano.med.2022", true, OutputStatus.APPROVED, outputType3, publisher3, List.of(researcher3)));
        } catch (Exception e) {
            System.err.println("Error occurred while loading sample data: " + e.getMessage());
        }
    }
}
