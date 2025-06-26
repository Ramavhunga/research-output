package za.co.univen.research_output.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Publisher  implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;

    private String name;
    private String country;

    public Publisher(String elsevier, String netherlands) {
        this.name = elsevier;
        this.country = netherlands;
    }
    public Publisher() {
        // Default constructor
    }
}
