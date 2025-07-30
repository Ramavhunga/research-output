import { Injectable } from '@angular/core';
import { ResearchOutput } from '../models/research-output.model';

@Injectable({
  providedIn: 'root'
})
export class ResearchOutputService {
  private output: ResearchOutput = {
    id: 1,
    title: 'AI in Public Sector',
    abstractText: 'This paper explores AI adoption in government services.',
    year: 2024,
    doi: '10.1234/ai.ps.2024',
    dhETApproved: true,
    status: 'APPROVED',
    outputType: {
      id: 1,
      name: 'Journal Article'
    },
    publisher: {
      id: 1,
      name: 'Elsevier',
      country: 'Netherlands'
    },
    authors: [
      {
        id: 1,
        fullName: 'John Doe',
        orcidId: '0000-0001-2345-6789',
        nrfRating: 'C1',
        designation: 'Senior Lecturer'
      }
    ],
    attachments: [],
    citations: [],
    submissionLogs: []
  };

  getResearchOutput(): ResearchOutput {
    return this.output;
  }
}