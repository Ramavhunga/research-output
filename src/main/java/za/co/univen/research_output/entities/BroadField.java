package za.co.univen.research_output.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class BroadField {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private String name;

    private Boolean requiresSpecification;

    @ManyToOne
    @JoinColumn(name="broad_field_id")
    private BroadField broadField;
}
