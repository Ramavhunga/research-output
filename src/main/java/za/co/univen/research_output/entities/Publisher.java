package za.co.univen.research_output.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "publishers")
@Data
public class Publisher {

    @Id
    @GeneratedValue
    private Long id;
    private String name;
}
