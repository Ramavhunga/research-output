package za.co.univen.research_output.services;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.entities.*;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JournalExcelExportService {

    private static final List<String> HEADERS = List.of(
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
            "Funder(s)",
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
            "Additional Comments (Author)",
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
            createHeader(sheet, workbook);

            int rowIdx = 1;
            for (Journal journal : journals) {
                List<Author> authors = journal.getAuthors() == null ? List.of() : journal.getAuthors();
                if (authors.isEmpty()) {
                    rowIdx = writeRow(sheet, rowIdx, journal, null);
                } else {
                    for (Author author : authors) {
                        rowIdx = writeRow(sheet, rowIdx, journal, author);
                    }
                }
            }

            for (int i = 0; i < HEADERS.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to export journal report to Excel", e);
        }
    }

    private void createHeader(Sheet sheet, Workbook workbook) {
        Row headerRow = sheet.createRow(0);
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);

        for (int i = 0; i < HEADERS.size(); i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(HEADERS.get(i));
            cell.setCellStyle(style);
        }
    }

    private int writeRow(Sheet sheet, int rowIndex, Journal journal, Author author) {
        Row row = sheet.createRow(rowIndex);

        List<UniversityAffiliation> universityAffiliations = author == null || author.getUniversityAffiliations() == null
                ? new ArrayList<>() : author.getUniversityAffiliations();
        List<ResearchAffiliation> researchAffiliations = author == null || author.getResearchAffiliations() == null
                ? new ArrayList<>() : author.getResearchAffiliations();

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

        List<String> values = List.of(
                str(journal.getDhetNo()),
                str(journal.getYear()),
                str(journal.getJournalTitle()),
                str(journal.getTitle()),
                str(journal.getPublisher()),
                str(journal.getIndex()),
                str(journal.getComply()),
                str(journal.getVolume()),
                str(journal.getIssue()),
                str(journal.getIssn()),
                str(journal.getEissn()),
                str(journal.getDoi()),
                str(journal.getUrls()),
                bool(journal.getOpenaccess()),
                str(journal.getFieldofsearch()),
                str(journal.getFunders()),
                str(author == null ? null : author.getSurname()),
                str(author == null ? null : author.getInitials()),
                str(author == null ? null : author.getFirstName()),
                str(author == null ? null : author.getGender()),
                str(author == null ? null : author.getPopulationGroup()),
                str(author == null ? null : author.getDob()),
                str(author == null ? null : author.getOrcid()),
                str(author == null ? null : author.getCountryOfBirth()),
                str(author == null ? null : author.getSaResidencyStatus()),
                bool(author == null ? null : author.getDisability()),
                str(author == null ? null : author.getHighestQualification()),
                str(author == null ? null : author.getEmploymentStatus()),
                str(author == null ? null : author.getStudentEmployeeNo()),
                str(author == null ? null : author.getDepartment()),
                str(author == null ? null : author.getFaculty()),
                str(author == null ? null : author.getAcademicTitle()),
                saUniversities,
                saInstitutions,
                internationalUniversities,
                num(author == null ? null : author.getAuthorShare()),
                num(author == null ? null : author.getTotalUnitsClaimed()),
                str(author == null ? null : author.getAdditionalComments()),
                num(journal.getUnits() == null ? null : journal.getUnits().getMaxUnitsForPublication()),
                num(journal.getUnits() == null ? null : journal.getUnits().getTotalProportionOfAuthors()),
                str(journal.getUnits() == null ? null : journal.getUnits().getAuthorCount()),
                num(journal.getUnits() == null ? null : journal.getUnits().getTotalUnitsClaimed()),
                str(journal.getUnits() == null ? null : journal.getUnits().getOtherAuthorsNonAffiliates()),
                str(journal.getAdditionalComments()),
                bool(journal.getDhetAccepted()),
                num(journal.getDhetUnitsAwarded()),
                str(journal.getDhetComments())
        );

        for (int i = 0; i < values.size(); i++) {
            row.createCell(i).setCellValue(values.get(i));
        }

        return rowIndex + 1;
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

