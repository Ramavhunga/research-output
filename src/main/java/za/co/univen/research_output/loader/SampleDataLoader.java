package za.co.univen.research_output.loader;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import za.co.univen.research_output.repositories.*;
import za.co.univen.research_output.entities.*;

import java.util.List;

@Component
public class SampleDataLoader implements CommandLineRunner {


    private final ResearchOutputRepository researchOutputRepo;

    public SampleDataLoader( ResearchOutputRepository researchOutputRepo) {

        this.researchOutputRepo = researchOutputRepo;
    }

    @Override
    public void run(String... args) {
       System.out.println("Loading sample data............................................");
       try {

           Author author1 = new Author("Alice Smith", "0000-0001-2345-6789", "University of Venda");
           Outlet outlet1 = new Outlet("Journal of Science", "1234-5678", "978-3-16-148410-0", "12", "3", "45-67", "2024-06-01");
           researchOutputRepo.save(new ResearchOutput("AI in Public Sector", "This paper explores AI adoption in government services.", 2024, "10.1234/ai.ps.2024", OutputStatus.APPROVED, "Journal Article", outlet1, List.of(author1)));


           Author author2 = new Author("Bob Johnson", "0000-0002-3456-7890", "Institute of Research");
           Outlet outlet2 = new Outlet("Tech Review", "8765-4321", "978-1-23-456789-7", "5", "1", "10-20", "2023-12-15");
           researchOutputRepo.save(new ResearchOutput("Quantum Computing Advances", "This paper discusses breakthroughs in quantum computing.", 2023, "10.5678/qc.adv.2023", OutputStatus.APPROVED, "Conference Paper", outlet2, List.of(author2)));

           Author author3 = new Author("Carol Lee", "0000-0003-4567-8901", "Venda College");
           Outlet outlet3 = new Outlet("Medical Advances", "1122-3344", "978-0-12-345678-9", "8", "2", "100-120", "2022-09-10");
           researchOutputRepo.save(new ResearchOutput("Nanotechnology Applications", "This chapter explores nanotechnology in medicine.", 2022, "10.7890/nano.med.2022", OutputStatus.APPROVED, "Book Chapter", outlet3, List.of(author3)));
        } catch (Exception e) {
            System.err.println("Error occurred while loading sample data: " + e.getMessage());
        }
    }
}
