package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.ConferenceProceedings;

@Repository
public interface ConferenceProceedingsRepository extends JpaRepository<ConferenceProceedings, Long> {

    boolean existsByTitleOfContributionAndIssn(String titleOfContribution, String issn);

}

