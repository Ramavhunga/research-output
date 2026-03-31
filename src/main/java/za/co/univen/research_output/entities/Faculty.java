package za.co.univen.research_output.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "faculties")
@Data
public class Faculty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;   // e.g. "FNSM"?

    @Column(nullable = false, unique = true, length = 255)
    private String name;   // e.g. "Faculty of Science, Engineering and Agriculture"

//    @OneToMany(mappedBy = "faculty", cascade = CascadeType.ALL, orphanRemoval = true)
//    private List<Department> departments = new ArrayList<>();

}
