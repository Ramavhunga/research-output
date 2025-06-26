package za.co.univen.research_output.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Department  implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;
    @Column(unique = true)
    private String name;

    @ManyToOne
    private Institution institution;

    public Department(String computerScience, Institution inst) {
        this.name = computerScience;
        this.institution = inst;
    }

    public Department() {

    }
}
