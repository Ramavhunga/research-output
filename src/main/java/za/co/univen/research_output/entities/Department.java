package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "departments")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;   // e.g. "CS"

    @Column(nullable = false, length = 255)
    private String name;   // e.g. "Department of Computer Science"

    @Column(name = "faculty_id", nullable = false)
    private Long facultyId;

}
