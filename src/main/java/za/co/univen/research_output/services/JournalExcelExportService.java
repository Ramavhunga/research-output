package za.co.univen.research_output.services;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.entities.*;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class JournalExcelExportService {

    private static final List<String> BASE_HEADERS = List.of(
            "DHET No.",
            "Year of Publication",
            "Journal Title",
            "Article Title",
            "Publisher",
            "Index",
            "Complies with 75% rule?",
            "Volume",
            "Issue",
            "ISSN",
            "e-ISSN",
            "DOI",
            "Handle / URL",
            "Open Access Journal?",
            "Field of Research",
            "Funder(s)"
    );

    private static final List<String> AUTHOR_FIELD_HEADERS = List.of(
            "Surname",
            "Initials",
            "First name(s)",
            "Gender",
            "Population Group",
            "DOB",
            "OrcID",
            "Country of Birth",
            "SA Residency Status",
            "Disability",
            "Highest Qualification",
            "Employment status",
            "Student / employee No.",
            "Department",
            "FACULTY",
            "Academic Title",
            "Other Affiliations (Only SA HEIs)",
            "Other Affiliations (Other SA Institutions)",
            "Other Affiliations (International Institutions)",
            "Proportion of Author",
            "Author Units Claimed",
            "Additional Comments (Author)"
    );

    private static final List<String> TAIL_HEADERS = List.of(
            "Max Units for Publication",
            "Total Proportion of authors",
            "Author Count",
            "Total Units claimed",
            "Other Authors (non-affiliated)",
            "Additional Comments",
            "DHET: Accepted",
            "DHET: Units Awarded",
            "DHET: Comments"
    );

    public ByteArrayInputStream exportToExcel(List<Journal> journals) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("DHET Report");
            List<Journal> readyForPostingJournals = journals == null ? List.of() : journals.stream()
                    .filter(journal -> journal != null && journal.getStatus() == JournalStatus.READY_FOR_POSTING)
                    .toList();

            List<List<Journal>> groupedJournals = groupJournalsForExport(readyForPostingJournals);

            int maxAffiliatedAuthors = Math.max(1, groupedJournals.stream()
                    .mapToInt(this::countAffiliatedAuthors)
                    .max()
                    .orElse(0));

            List<String> headers = buildHeaders(maxAffiliatedAuthors);
            createHeader(sheet, workbook, headers);

            int rowIdx = 1;
            for (List<Journal> journalGroup : groupedJournals) {
                rowIdx = writeRow(sheet, rowIdx, journalGroup, maxAffiliatedAuthors);
            }

            for (int i = 0; i < headers.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to export journal report to Excel", e);
        }
    }

    private void createHeader(Sheet sheet, Workbook workbook, List<String> headers) {
        Row headerRow = sheet.createRow(0);
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);

        for (int i = 0; i < headers.size(); i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers.get(i));
            cell.setCellStyle(style);
        }
    }

    private int writeRow(Sheet sheet, int rowIndex, List<Journal> journalGroup, int maxAffiliatedAuthors) {
        Row row = sheet.createRow(rowIndex);
        Journal journal = journalGroup.get(0);
        List<Author> affiliatedAuthors = getAffiliatedAuthors(journalGroup);

        List<String> values = new ArrayList<>();
        values.add(str(journal.getDhetNo()));
        values.add(str(journal.getYear()));
        values.add(str(journal.getJournalTitle()));
        values.add(str(journal.getTitle()));
        values.add(str(journal.getPublisher()));
        values.add(str(journal.getIndex()));
        values.add(str(journal.getComply()));
        values.add(str(journal.getVolume()));
        values.add(str(journal.getIssue()));
        values.add(str(journal.getIssn()));
        values.add(str(journal.getEissn()));
        values.add(str(journal.getDoi()));
        values.add(str(journal.getUrls()));
        values.add(bool(journal.getOpenaccess()));
        values.add(str(journal.getFieldofsearch()));
        values.add(str(journal.getFunders()));

        for (int authorIndex = 0; authorIndex < maxAffiliatedAuthors; authorIndex++) {
            Author author = authorIndex < affiliatedAuthors.size() ? affiliatedAuthors.get(authorIndex) : null;
            values.addAll(buildAuthorValues(author));
        }

        values.add(num(journal.getUnits() == null ? null : journal.getUnits().getMaxUnitsForPublication()));
        values.add(num(journal.getUnits() == null ? null : journal.getUnits().getTotalProportionOfAuthors()));
        values.add(str(journal.getUnits() == null ? null : journal.getUnits().getAuthorCount()));
        values.add(num(journal.getUnits() == null ? null : journal.getUnits().getTotalUnitsClaimed()));
        values.add(nonAffiliatedAuthorsSummary(journalGroup));
        values.add(str(journal.getAdditionalComments()));
        values.add(bool(journal.getDhetAccepted()));
        values.add(num(journal.getDhetUnitsAwarded()));
        values.add(str(journal.getDhetComments()));

        for (int i = 0; i < values.size(); i++) {
            row.createCell(i).setCellValue(values.get(i));
        }

        return rowIndex + 1;
    }

    private List<String> buildHeaders(int maxAffiliatedAuthors) {
        List<String> headers = new ArrayList<>(BASE_HEADERS);
        for (int authorIndex = 1; authorIndex <= maxAffiliatedAuthors; authorIndex++) {
            for (String authorFieldHeader : AUTHOR_FIELD_HEADERS) {
                headers.add("Affiliated Author " + authorIndex + " - " + authorFieldHeader);
            }
        }
        headers.addAll(TAIL_HEADERS);
        return headers;
    }

    private List<List<Journal>> groupJournalsForExport(List<Journal> journals) {
        Map<String, List<Journal>> grouped = new LinkedHashMap<>();
        int syntheticCounter = 0;

        for (Journal journal : journals) {
            String dhetNo = str(journal.getDhetNo()).trim();
            String key;
            if (!dhetNo.isBlank()) {
                key = "DHET:" + dhetNo;
            } else if (journal.getId() != null) {
                key = "ID:" + journal.getId();
            } else {
                key = "ROW:" + syntheticCounter++;
            }
            grouped.computeIfAbsent(key, ignored -> new ArrayList<>()).add(journal);
        }

        return new ArrayList<>(grouped.values());
    }

    private int countAffiliatedAuthors(List<Journal> journalGroup) {
        return getAffiliatedAuthors(journalGroup).size();
    }

    private List<Author> getAffiliatedAuthors(Journal journal) {
        return journal == null ? List.of() : getAffiliatedAuthors(List.of(journal));
    }

    private List<Author> getAffiliatedAuthors(List<Journal> journalGroup) {
        Map<String, Author> distinctAuthors = new LinkedHashMap<>();
        for (Journal journal : journalGroup) {
            if (journal == null || journal.getAuthors() == null) {
                continue;
            }
            for (Author author : journal.getAuthors()) {
                if (author == null || !Boolean.TRUE.equals(author.getAffiliation())) {
                    continue;
                }
                distinctAuthors.putIfAbsent(authorKey(author), author);
            }
        }
        return new ArrayList<>(distinctAuthors.values());
    }

    private String nonAffiliatedAuthorsSummary(Journal journal) {
        return journal == null ? "" : nonAffiliatedAuthorsSummary(List.of(journal));
    }

    private String nonAffiliatedAuthorsSummary(List<Journal> journalGroup) {
        Map<String, String> names = new LinkedHashMap<>();
        for (Journal journal : journalGroup) {
            if (journal == null || journal.getAuthors() == null) {
                continue;
            }
            for (Author author : journal.getAuthors()) {
                if (author == null || Boolean.TRUE.equals(author.getAffiliation())) {
                    continue;
                }
                String formatted = formatInitialsAndSurname(author);
                if (!formatted.isBlank()) {
                    names.putIfAbsent(authorKey(author), formatted);
                }
            }
        }

        if (!names.isEmpty()) {
            return String.join("; ", names.values());
        }

        Journal primary = journalGroup.isEmpty() ? null : journalGroup.get(0);
        return str(primary == null || primary.getUnits() == null ? null : primary.getUnits().getOtherAuthorsNonAffiliates());
    }

    private String formatInitialsAndSurname(Author author) {
        String initials = str(author.getInitials()).trim();
        String surname = str(author.getSurname()).trim();
        if (!initials.isBlank() && !surname.isBlank()) {
            return initials + " " + surname;
        }
        if (!surname.isBlank()) {
            return surname;
        }
        return initials;
    }

    private String authorKey(Author author) {
        return (str(author.getInitials()) + "|" + str(author.getSurname()) + "|" + str(author.getFirstName()) + "|" + str(author.getStudentEmployeeNo())).toLowerCase();
    }

    private List<String> buildAuthorValues(Author author) {
        if (author == null) {
            List<String> blanks = new ArrayList<>();
            for (int i = 0; i < AUTHOR_FIELD_HEADERS.size(); i++) {
                blanks.add("");
            }
            return blanks;
        }

        List<UniversityAffiliation> universityAffiliations = author.getUniversityAffiliations() == null
                ? List.of() : author.getUniversityAffiliations();
        List<ResearchAffiliation> researchAffiliations = author.getResearchAffiliations() == null
                ? List.of() : author.getResearchAffiliations();

        String saUniversities = universityAffiliations.stream()
                .filter(u -> !Boolean.TRUE.equals(u.getIsInternationalUniversity()))
                .map(UniversityAffiliation::getUniversityName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining("; "));

        String internationalUniversities = universityAffiliations.stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsInternationalUniversity()))
                .map(UniversityAffiliation::getUniversityName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining("; "));

        String saInstitutions = researchAffiliations.stream()
                .map(ResearchAffiliation::getCompanyName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining("; "));

        return List.of(
                str(author.getSurname()),
                str(author.getInitials()),
                str(author.getFirstName()),
                str(author.getGender()),
                str(author.getPopulationGroup()),
                str(author.getDob()),
                str(author.getOrcid()),
                str(author.getCountryOfBirth()),
                str(author.getSaResidencyStatus()),
                bool(author.getDisability()),
                str(author.getHighestQualification()),
                str(author.getEmploymentStatus()),
                str(author.getStudentEmployeeNo()),
                str(author.getDepartment()),
                str(author.getFaculty()),
                str(author.getAcademicTitle()),
                saUniversities,
                saInstitutions,
                internationalUniversities,
                num(author.getAuthorShare()),
                num(author.getTotalUnitsClaimed()),
                str(author.getAdditionalComments())
        );
    }

    private String str(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String bool(Boolean value) {
        return value == null ? "" : (value ? "Yes" : "No");
    }

    private String num(Number value) {
        if (value == null) {
            return "";
        }
        if (value instanceof Integer || value instanceof Long) {
            return String.valueOf(value);
        }
        return String.format("%.4f", value.doubleValue());
    }
}

