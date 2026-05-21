package za.co.univen.research_output.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Lob;
import lombok.Data;

@Entity
@Table(name = "attachments")
@Data
public class Attachment  implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;

    private String fileName;
    private String fileType;
    private String filePath;
    private String description;
    private Long fileSize;
    private String url;

    @Lob
    @Column(columnDefinition = "varbinary(max)")
    private byte[] fileData;

    @JsonIgnore
    @ManyToOne
    private ResearchOutput researchOutput;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_id")
    private Journal journal;
}
