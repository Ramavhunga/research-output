package za.co.univen.research_output.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Access {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String openAccess;
    private String embargoEndDate;
    private Boolean peerReviewed;

    @OneToOne(cascade = CascadeType.ALL)
    private Indexing indexing;

    private String dhetYear;
}

