package za.co.univen.research_output.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Institution implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;

    @Column(unique = true)
    private String name;
    private String address;

    @Override
    public String toString() {
        return "Institution{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", address='" + address + '\'' +
                '}';
    }

    // constructor with arguments
    public Institution(String name, String address) {
        this.name = name;
        this.address = address;
    }

    public Institution() {

    }
}
