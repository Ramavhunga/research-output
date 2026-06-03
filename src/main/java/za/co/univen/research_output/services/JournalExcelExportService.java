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
            "Complies with 75% rule",
            "Volume / Issue",
            "ISSN / eISSN",
            "DOI / URL",
            "Open Access",
            "Field of Research",
            "Author Type",
            "Surname",
            "Initials",
            "First Name",
            "SA Universities",
            "SA Institutions",
            "International Universities",
            "Author Share",
            "Author Units Claimed",
            "Journal Total Units Claimed",
            "DHET Accepted",
            "DHET Units Awarded",
            "DHET Comments"
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
                bool(journal.getComply()),
                volumeIssue(journal),
                issn(journal),
                doiUrl(journal),
                bool(journal.getOpenaccess()),
                str(journal.getFieldofsearch()),
                authorType(author),
                str(author == null ? null : author.getSurname()),
                str(author == null ? null : author.getInitials()),
                str(author == null ? null : author.getFirstName()),
                saUniversities,
                saInstitutions,
                internationalUniversities,
                num(author == null ? null : author.getAuthorShare()),
                num(author == null ? null : author.getTotalUnitsClaimed()),
                num(journal.getUnits() == null ? null : journal.getUnits().getTotalUnitsClaimed()),
                bool(journal.getDhetAccepted()),
                num(journal.getDhetUnitsAwarded()),
                str(journal.getDhetComments())
        );

        for (int i = 0; i < values.size(); i++) {
            row.createCell(i).setCellValue(values.get(i));
        }

        return rowIndex + 1;
    }

    private String volumeIssue(Journal journal) {
        return (journal.getVolume() == null ? "" : journal.getVolume()) +
                " / " +
                (journal.getIssue() == null ? "" : journal.getIssue());
    }

    private String issn(Journal journal) {
        return str(journal.getIssn()) + " / " + str(journal.getEissn());
    }

    private String doiUrl(Journal journal) {
        return str(journal.getDoi()) + " / " + str(journal.getUrls());
    }

    private String str(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String bool(Boolean value) {
        return value == null ? "" : (value ? "Yes" : "No");
    }

    private String num(Double value) {
        return value == null ? "" : String.format("%.4f", value);
    }

    private String authorType(Author author) {
        if (author == null || author.getAffiliation() == null) {
            return "";
        }
        return Boolean.TRUE.equals(author.getAffiliation()) ? "Affiliated" : "Non-Affiliated";
    }
}

