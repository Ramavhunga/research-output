package za.co.univen.research_output.entities;

import jakarta.persistence.Embeddable;
import lombok.Data;

@Embeddable
@Data
public class ClaimingAuthorAffiliation {
    private String studentEmployeeNo;
    private String employmentStatus;
    private String academicTitle;
    private String otherAffiliationsSaHeis;
    private String otherAffiliationsSaInstitutions;
    private String otherAffiliationsInternationalInstitutions;
}
