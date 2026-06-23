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
import za.co.univen.research_output.entities.Book;
import za.co.univen.research_output.entities.BookStatus;
import za.co.univen.research_output.entities.ResearchAffiliation;
import za.co.univen.research_output.entities.UniversityAffiliation;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookExcelExportService {

    private static final List<String> HEADERS = List.of(
            "DHET No.",
            "Original / Photocopy",
            "Evidence of peer review (Y/N)",
            "Type of Evidence",
            "Year of Publication",
            "Title of Book",
            "Editor(s) if applicable",
            "Publisher",
            "ISBN/e-ISBN",
            "Field of Research",
            "Funder(s)",
            "Total No Pages in book",
            "Start Page",
            "End Page",
            "Total Pages Claimed",
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

    public ByteArrayInputStream exportToExcel(List<Book> booksList) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("DHET Books Report");
            createHeader(sheet, workbook);

            List<Book> readyForPosting = booksList == null ? List.of() : booksList.stream()
                    .filter(item -> item != null && item.getStatus() == BookStatus.READY_FOR_POSTING)
                    .toList();

            int rowIdx = 1;
            for (Book book : readyForPosting) {
                List<Author> affiliatedAuthors = getAffiliatedAuthors(book);
                if (affiliatedAuthors.isEmpty()) {
                    rowIdx = writeRow(sheet, rowIdx, book, null);
                } else {
                    for (Author author : affiliatedAuthors) {
                        rowIdx = writeRow(sheet, rowIdx, book, author);
                    }
                }
            }

            for (int i = 0; i < HEADERS.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to export books report to Excel", e);
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

    private int writeRow(Sheet sheet, int rowIndex, Book book, Author author) {
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
                str(book.getDhetNo()),
                str(book.getOriginalOrPhotocopy()),
                str(book.getEvidenceOfPeerReview()),
                str(book.getTypeOfEvidence()),
                str(book.getYearOfPublication()),
                str(book.getTitleOfBook()),
                str(book.getEditors()),
                str(book.getPublisher()),
                str(book.getIsbn()),
                str(book.getFieldOfResearch()),
                str(book.getFunders()),
                str(book.getTotalNoPages()),
                str(book.getStartPage()),
                str(book.getEndPage()),
                str(book.getTotalPagesClaimed()),
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
                num(book.getMaxUnitsForPublication()),
                num(book.getTotalProportionOfAuthors()),
                str(book.getAuthorCount()),
                num(book.getTotalUnitsClaimed()),
                nonAffiliatedAuthorsSummary(book),
                str(book.getAdditionalComments()),
                "",
                "",
                ""
        );

        for (int i = 0; i < values.size(); i++) {
            row.createCell(i).setCellValue(values.get(i));
        }

        return rowIndex + 1;
    }

    private List<Author> getAffiliatedAuthors(Book book) {
        if (book == null || book.getAuthors() == null) {
            return List.of();
        }
        return book.getAuthors().stream()
                .filter(author -> author != null && Boolean.TRUE.equals(author.getAffiliation()))
                .toList();
    }

    private String nonAffiliatedAuthorsSummary(Book book) {
        if (book == null || book.getAuthors() == null) {
            return "";
        }
        return book.getAuthors().stream()
                .filter(author -> author != null && !Boolean.TRUE.equals(author.getAffiliation()))
                .map(this::formatInitialsAndSurname)
                .filter(value -> !value.isBlank())
                .collect(Collectors.joining("; "));
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





