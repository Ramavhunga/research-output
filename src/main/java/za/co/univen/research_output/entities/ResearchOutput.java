package za.co.univen.research_output.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
public class ResearchOutput implements java.io.Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String title;
    private String outputType;
    private String otherType;
    private OutputStatus status;
    private Integer year;
    @Column(unique = true)
    private String doi;
    private String url;

    @OneToMany(cascade = CascadeType.ALL)
    private List<Author> authors;

    @OneToOne(cascade = CascadeType.ALL)
    private Outlet outlet;

    @OneToOne(cascade = CascadeType.ALL)
    private Access access;

    @OneToOne(cascade = CascadeType.ALL)
    private Funding funding;

    @ElementCollection
    private List<String> keywords;

    @Column(length = 2000)
    private String abstractText;


    public ResearchOutput(String aiInPublicSector, String s, int i, String s1, OutputStatus outputStatus, String outputType, Outlet outlet, List<Author> authors) {
        this.title = aiInPublicSector;
        this.abstractText = s;
        this.year = i;
        this.doi = s1;
        this.status = outputStatus;
        this.outputType = outputType;
        this.outlet = outlet;
        this.authors = authors;
    }
    public ResearchOutput() {
        // Default constructor
    }
}