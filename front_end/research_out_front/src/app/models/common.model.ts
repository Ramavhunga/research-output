export interface Authors {
  id: number;
  studentEmployeeNo:string
  firstName: string;
  surname: string;
  initials: string;
  gender: string;
  populationGroup: string;
  dob: string; // yyyy-mm-dd
  orcid: string;
  countryOfBirth: string;
  saResidencyStatus: string;
  disability: boolean;
  highestQualification: string;
  employmentStatus: string;
  department: string;
  faculty: string;
  academicTitle: string;
}

export interface ClaimingAuthorsContribution {
  proportionOfAuthors?: number;
  authorUnitsClaimed?: number;
  additionalComments?: string;
}

export interface Units {
  maxUnitsForPublication: number;
  totalProportionOfAuthors: number;
  authorsCount: number;
  totalUnitsClaimed?: number;
  otherAuthorsNonAffiliates?: string;
  additionalComments?: string;
}

export interface AuthorAffiliation {
  id: number;
  dhetNo: string;
  year: string;
  title: string;
  publisher: string;
  index: string;
  comply: boolean;
  volume: number;
  issue: number;
  issn: string;
  eSsn: string;
  doi: string;
  authors?: Authors[];
  units?: Units;
}
