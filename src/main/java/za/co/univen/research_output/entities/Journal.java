package za.co.univen.research_output.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "journals")
@Data
public class Journal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String dhetNo;
    private String year;
    private String title;
    private String articleTitle;
    private String publisher;

    @Column(name = "idx")
    private String index;

    private Boolean comply;
    private Integer volume;
    private Integer issue;
    private String issn;
    private String eSsn;
    private String doi;

    @OneToMany(mappedBy = "journal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Author> contributors = new ArrayList<>();

    @Embedded
    private Units units;

    @Embedded
    private ClaimingAuthorsContribution claimingAuthorsContribution;

}
