package za.co.univen.research_output;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"za.co.univen.research_output.loader",
		"za.co.univen.research_output.repositories",
		"za.co.univen.research_output.entities",
		"za.co.univen.research_output.controller",
		"za.co.univen.research_output.services"})
public class ResearchOutputApplication {
	public static void main(String[] args) {
		SpringApplication.run(ResearchOutputApplication.class, args);
	}
}