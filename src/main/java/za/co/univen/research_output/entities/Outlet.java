package za.co.univen.research_output.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Outlet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String issn;
    private String isbn;
    private String volume;
    private String issue;
    private String pages;
    private String publicationDate;

    public Outlet(String name, String issn, String isbn, String volume, String issue, String pages, String publicationDate) {
        this.name = name;
        this.issn = issn;
        this.isbn = isbn;
        this.volume = volume;
        this.issue = issue;
        this.pages = pages;
        this.publicationDate = publicationDate;
    }

    public Outlet() {

    }
}
