package za.co.univen.research_output.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Author {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String orcid;
    private String affiliation;

    public Author(String name, String orcid, String affiliation ) {
        this.name = name;
        this.orcid = orcid;
        this.affiliation = affiliation;
    }

    public Author() {

    }
}
