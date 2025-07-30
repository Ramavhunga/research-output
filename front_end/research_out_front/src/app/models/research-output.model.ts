export interface OutputType {
  id: number;
  name: string;
}

export interface Publisher {
  id: number;
  name: string;
  country: string;
}

export interface Author {
  id: number;
  fullName: string;
  orcidId: string;
  nrfRating: string;
  designation: string;
}

export interface ResearchOutput {
  id: number;
  title: string;
  abstractText: string;
  year: number;
  doi: string;
  dhETApproved: boolean;
  status: string;
  outputType: OutputType;
  publisher: Publisher;
  authors: Author[];
  attachments: any[];
  citations: any[];
  submissionLogs: any[];
}