package za.co.univen.research_output.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class OutputType  implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;

    private String name; // e.g., Journal Article, Book, Chapter, Dataset

    public OutputType(String name) {
        this.name = name;
    }
    public OutputType() {
        // Default constructor
    }
}
