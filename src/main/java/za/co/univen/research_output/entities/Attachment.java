package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Entity
@Data
public class Attachment  implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;

    private String fileName;
    private String fileType;
    private String filePath;

    @JsonIgnore
    @ManyToOne
    private ResearchOutput researchOutput;
}
