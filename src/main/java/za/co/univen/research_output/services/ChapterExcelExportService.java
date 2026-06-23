package za.co.univen.research_output.services;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import za.co.univen.research_output.entities.Author;
import za.co.univen.research_output.entities.BookStatus;
import za.co.univen.research_output.entities.Chapter;
import za.co.univen.research_output.entities.ResearchAffiliation;
import za.co.univen.research_output.entities.UniversityAffiliation;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class ChapterExcelExportService {

    private static final List<String> HEADERS = List.of(
            "DHET No.",
            "Original / Photocopy",
            "Evidence of peer review (Y/N)",
            "Type of Evidence",
            "Year of Publication",
            "Title of Book",
            "Title of Contribution",
            "Editor(s) if applicable",
            "Publisher",
            "ISBN/e-ISBN",
            "Field of Research",
            "Funder(s)",
            "Total No Pages in book",
            "Start Page",
            "End Page",
            "Total Pages Claimed",
            "Total Chapters in Book",
            "Surname",
            "Initials",
            "First name(s)",
            "Gender",
            "Population Group",
            "DOB",
            "OrcID",
            "Country of Birth",
            "SA Residency Status",
            "Disibility",
            "Highest Qualification",
            "Employment status",
            "Student / employee No.",
            "Department",
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
            "Other Authors (non-affiliated, semi-colon delimited)",
            "Additional Comments",
            "DHET: Accepted",
            "DHET: Units Awarded",
            "DHET: Comments"
    );

    public ByteArrayInputStream exportToExcel(List<Chapter> chaptersList) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("DHET Book Chapters Report");
            createHeader(sheet, workbook);

            List<Chapter> readyForPosting = chaptersList == null ? List.of() : chaptersList.stream()
                    .filter(item -> item != null && item.getStatus() == BookStatus.READY_FOR_POSTING)
                    .toList();

            int rowIdx = 1;
            for (Chapter chapter : readyForPosting) {
                List<Author> affiliatedAuthors = getAffiliatedAuthors(chapter);
                if (affiliatedAuthors.isEmpty()) {
                    rowIdx = writeRow(sheet, rowIdx, chapter, null);
                } else {
                    for (Author author : affiliatedAuthors) {
                        rowIdx = writeRow(sheet, rowIdx, chapter, author);
                    }
                }
            }

            for (int i = 0; i < HEADERS.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to export chapter report to Excel", e);
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

    private int writeRow(Sheet sheet, int rowIndex, Chapter chapter, Author author) {
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
                str(chapter.getDhetNo()),
                str(chapter.getOriginalOrPhotocopy()),
                yn(chapter.getEvidenceOfPeerReview()),
                str(chapter.getTypeOfEvidence()),
                str(chapter.getYearOfPublication()),
                str(chapter.getTitleOfBook()),
                str(chapter.getTitleOfContribution()),
                str(chapter.getEditors()),
                str(chapter.getPublisher()),
                str(chapter.getIsbn()),
                str(chapter.getFieldOfResearch()),
                str(chapter.getFunders()),
                str(chapter.getTotalNoPages()),
                str(chapter.getStartPage()),
                str(chapter.getEndPage()),
                str(chapter.getTotalPagesClaimed()),
                str(chapter.getTotalChaptersInBook()),
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
                str(author == null ? null : author.getAcademicTitle()),
                saUniversities,
                saInstitutions,
                internationalUniversities,
                num(author == null ? null : author.getAuthorShare()),
                num(author == null ? null : author.getTotalUnitsClaimed()),
                str(author == null ? null : author.getAdditionalComments()),
                num(chapter.getMaxUnitsForPublication()),
                num(chapter.getTotalProportionOfAuthors()),
                str(chapter.getAuthorCount()),
                num(chapter.getTotalUnitsClaimed()),
                nonAffiliatedAuthorsSummary(chapter),
                str(chapter.getAdditionalComments()),
                "",
                "",
                ""
        );

        for (int i = 0; i < values.size(); i++) {
            row.createCell(i).setCellValue(values.get(i));
        }

        return rowIndex + 1;
    }

    private List<Author> getAffiliatedAuthors(Chapter chapter) {
        if (chapter == null || chapter.getAuthors() == null) {
            return List.of();
        }
        return chapter.getAuthors().stream()
                .filter(author -> author != null && Boolean.TRUE.equals(author.getAffiliation()))
                .toList();
    }

    private String nonAffiliatedAuthorsSummary(Chapter chapter) {
        if (chapter == null || chapter.getAuthors() == null) {
            return "";
        }

        String fromAuthorRows = chapter.getAuthors().stream()
                .filter(author -> author != null && !Boolean.TRUE.equals(author.getAffiliation()))
                .map(this::formatInitialsAndSurname)
                .filter(value -> !value.isBlank())
                .collect(Collectors.joining("; "));

        if (!fromAuthorRows.isBlank()) {
            return fromAuthorRows;
        }
        return str(chapter.getOtherAuthorsNonAffiliated());
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

    private String str(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String bool(Boolean value) {
        return value == null ? "" : (value ? "Yes" : "No");
    }

    private String yn(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (normalized.equals("yes") || normalized.equals("y") || normalized.equals("true") || normalized.equals("1")) {
            return "Y";
        }
        if (normalized.equals("no") || normalized.equals("n") || normalized.equals("false") || normalized.equals("0")) {
            return "N";
        }
        return value.trim();
    }

    private String num(Number value) {
        if (value == null) {
            return "";
        }
        if (value instanceof Integer || value instanceof Long) {
            return String.valueOf(value);
        }
        return String.format(Locale.ROOT, "%.4f", value.doubleValue());
    }
}

