package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Entity
@Data
public class Citation  implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;

    private String source; // e.g., Scopus, Web of Science
    private int citationCount;
    private String citationUrl;

    @JsonIgnore
    @ManyToOne
    private ResearchOutput researchOutput;
}
