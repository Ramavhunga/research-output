package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "users")
public class User implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;
    @Column(unique = true)
    private String username;
    @JsonIgnore
    private String password;
    private String email;
    private String role; // ADMIN, RESEARCHER, REVIEWER

    public User(String jdoe, String password, String mail, String researcher) {
        this.username = jdoe;
        this.password = password;
        this.email = mail;
        this.role = researcher;
    }
    public User() {
        // Default constructor
    }
}
