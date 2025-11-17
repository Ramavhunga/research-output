package za.co.univen.research_output.entities;


import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.Id;

@Entity
@Table(name = "journal_contributors")
@Data
public class JournalContributor {

    @jakarta.persistence.Id

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer authorOrder;    // 1,2,3,...

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_id")
    private Journal journal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private Author author;
}
