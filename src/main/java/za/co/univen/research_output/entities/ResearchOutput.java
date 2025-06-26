package za.co.univen.research_output.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
public class ResearchOutput implements java.io.Serializable {
    @Id
    @GeneratedValue
    private Long id;

    private String title;
    private String abstractText;
    private int year;
    private String doi;
    private boolean dhETApproved;

    @Enumerated(EnumType.STRING)
    private OutputStatus status; // DRAFT, SUBMITTED, APPROVED

    @ManyToOne
    private OutputType outputType;

    @ManyToOne
    private Publisher publisher;

    @ManyToMany
    @JoinTable(
            name = "researcher_output",
            joinColumns = @JoinColumn(name = "output_id"),
            inverseJoinColumns = @JoinColumn(name = "researcher_id")
    )
    private List<Researcher> authors;

    @OneToMany(mappedBy = "researchOutput", cascade = CascadeType.ALL)
    private List<Attachment> attachments;

    @OneToMany(mappedBy = "researchOutput", cascade = CascadeType.ALL)
    private List<Citation> citations;

    @OneToMany(mappedBy = "researchOutput", cascade = CascadeType.ALL)
    private List<SubmissionLog> submissionLogs;

    @Override
    public String toString() {
        return "ResearchOutput{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", abstractText='" + abstractText + '\'' +
                ", year=" + year +
                ", doi='" + doi + '\'' +
                ", dhETApproved=" + dhETApproved +
                ", status=" + status +
                ", outputType=" + outputType +
                ", publisher=" + publisher +
                ", authors=" + authors +
                ", attachments=" + attachments +
                ", citations=" + citations +
                ", submissionLogs=" + submissionLogs +
                '}';
    }

    public ResearchOutput(String aiInPublicSector, String s, int i, String s1, boolean b, OutputStatus outputStatus, OutputType outputType, Publisher publisher, List<Researcher> researcher) {
        this.title = aiInPublicSector;
        this.abstractText = s;
        this.year = i;
        this.doi = s1;
        this.dhETApproved = b;
        this.status = outputStatus;
        this.outputType = outputType;
        this.publisher = publisher;
        this.authors = researcher;
    }
    public ResearchOutput() {
        // Default constructor
    }
}