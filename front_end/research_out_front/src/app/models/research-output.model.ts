interface Author {
  name: string;
  orcid: string;
  affiliation: string;
}

interface Outlet {
  name: string;
  issn: string;
  isbn: string;
  volume: string;
  issue: string;
  pages: string;
  publicationDate: string;
}

interface Indexing {
  scopus: boolean;
  webOfScience: boolean;
  ibss: boolean;
  dhetAccredited: boolean;
}

interface Access {
  openAccess: boolean | null;
  embargoEndDate: string;
  peerReviewed: boolean;
  indexing: Indexing;
  dhetYear: string;
}

interface Funding {
  funder: string;
  grantNumber: string;
}

interface ResearchOutput {
  title: string;
  outputType: string;
  otherType: string;
  status: string;
  year: number | null;
  doi: string;
  url: string;
  authors: Author[];
  outlet: Outlet;
  access: Access;
  funding: Funding;
  keywords: string[];
  abstractText: string;
  attachment: File | null;
}
