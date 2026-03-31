package za.co.univen.research_output.entities;

import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class Units {

    private Double maxUnitsForPublication;
    private Double totalUnitsClaimed;

}