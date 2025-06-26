package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Researcher  implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;

    private String fullName;
    private String orcidId;
    private String nrfRating;
    private String designation;

    @JsonIgnore
    @ManyToOne
    private Department department;

    @JsonIgnore
    @OneToOne
    private User user;

    public Researcher(String johnDoe, String s, String c1, String seniorLecturer, Department dept, User user) {
        this.fullName = johnDoe;
        this.orcidId = s;
        this.nrfRating = c1;
        this.designation = seniorLecturer;
        this.department = dept;
        this.user = user;
    }
    public Researcher() {
        // Default constructor
    }
}

