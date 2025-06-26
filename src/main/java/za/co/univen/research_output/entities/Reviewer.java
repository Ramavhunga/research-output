package za.co.univen.research_output.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Entity
@Data
public class Reviewer implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;

    private String fullName;
    private String email;

    @ManyToOne
    private Department department;
}