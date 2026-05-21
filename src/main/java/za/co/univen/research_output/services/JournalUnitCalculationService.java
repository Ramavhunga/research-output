package za.co.univen.research_output.services;

import org.springframework.stereotype.Service;
import za.co.univen.research_output.entities.*;

import java.util.ArrayList;
import java.util.List;

@Service
public class JournalUnitCalculationService {

    public void recalculate(Journal journal) {
        if (journal.getUnits() == null) {
            journal.setUnits(new Units());
        }

        Units units = journal.getUnits();
        double maxUnits = valueOrDefault(units.getMaxUnitsForPublication(), 1d);
        double totalProportion = valueOrDefault(units.getTotalProportionOfAuthors(), 1d);
        double totalUnits = maxUnits * totalProportion;

        List<Author> authors = journal.getAuthors() == null ? new ArrayList<>() : journal.getAuthors();
        int totalAuthors = authors.size();
        int nonAffiliatedCount = 0;
        double authorShare = totalAuthors == 0 ? 0d : totalUnits / totalAuthors;
        double univenTotalClaimed = 0d;

        for (Author author : authors) {
            boolean affiliated = Boolean.TRUE.equals(author.getAffiliation());
            if (!affiliated) {
                nonAffiliatedCount++;
                author.setAuthorShare(authorShare);
                author.setTotalUnitsClaimed(0d);
                continue;
            }

            List<UniversityAffiliation> universities = author.getUniversityAffiliations();
            if (universities == null) {
                universities = new ArrayList<>();
                author.setUniversityAffiliations(universities);
            }
            List<ResearchAffiliation> researchAffiliations = author.getResearchAffiliations();
            if (researchAffiliations == null) {
                researchAffiliations = new ArrayList<>();
                author.setResearchAffiliations(researchAffiliations);
            }

            ensureUnivenDefault(universities);

            boolean hasUniven = universities.stream().anyMatch(u -> Boolean.TRUE.equals(u.getIsUniven()));
            boolean hasInternational = universities.stream().anyMatch(u -> Boolean.TRUE.equals(u.getIsInternationalUniversity()));
            boolean hasResearch = !researchAffiliations.isEmpty();
            int universityCount = universities.size();

            double claim;
            if (hasInternational) {
                claim = authorShare;
            } else if (hasUniven && hasResearch && universityCount == 1) {
                claim = authorShare;
            } else if (universityCount > 1) {
                double unitPerUniv = authorShare / universityCount;
                claim = universities.stream()
                        .filter(u -> Boolean.TRUE.equals(u.getIsUniven()))
                        .mapToDouble(u -> unitPerUniv)
                        .sum();
            } else if (hasUniven && universityCount == 1) {
                claim = authorShare;
            } else {
                claim = 0d;
            }

            author.setAuthorShare(authorShare);
            author.setTotalUnitsClaimed(claim);
            univenTotalClaimed += claim;
        }

        units.setAuthorCount(totalAuthors);
        units.setOtherAuthorsNonAffiliates(nonAffiliatedCount);
        units.setTotalUnitsClaimed(univenTotalClaimed);
    }

    private void ensureUnivenDefault(List<UniversityAffiliation> universities) {
        boolean hasUniven = universities.stream().anyMatch(u -> Boolean.TRUE.equals(u.getIsUniven()));
        if (!hasUniven) {
            UniversityAffiliation univen = new UniversityAffiliation();
            univen.setUniversityCode("UNIVEN");
            univen.setUniversityName("UNIVEN");
            univen.setIsUniven(true);
            univen.setIsInternationalUniversity(false);
            universities.add(0, univen);
        }
    }

    private double valueOrDefault(Double value, double fallback) {
        return value == null ? fallback : value;
    }
}

