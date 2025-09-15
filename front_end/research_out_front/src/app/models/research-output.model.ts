interface Author {
  id : number;
  name: string;
  orcid: string;
  affiliation: string;
}

interface Outlet {
  id : number;
  name: string;
  issn: string;
  isbn: string;
  volume: string;
  issue: string;
  pages: string;
  publicationDate: string;
}

interface Indexing {
  id : number;
  scopus: boolean;
  webOfScience: boolean;
  ibss: boolean;
  dhetAccredited: boolean;
}

interface Access {
  id : number;
  openAccess: string;
  embargoEndDate: string;
  peerReviewed: boolean;
  indexing: Indexing;
  dhetYear: string;
}

interface Funding {
  id : number;
  funder: string;
  grantNumber: string;
}

interface ResearchOutput {
  id : number;
  title: string;
  outputType: string;
  otherType: string;
  status: string;
  year: number | null;
  doi: string;
  url: string;
  authors: Author[];
  outlet: Outlet;
  indexing: Indexing;
  access: Access;
  funding: Funding;
  keywords: string[];
  abstractText: string;
  attachment: File | null;
  createdBy : string;
  createdDate : string;
}
