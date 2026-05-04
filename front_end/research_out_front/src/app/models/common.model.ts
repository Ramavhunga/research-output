export interface Authors {
  id: number|null;
  affiliation: boolean|true;
  studentEmployeeNo:string
  firstName: string;
  surname: string;
  initials: string;
  gender: string;
  email:string
  populationGroup: string;
  dob: string; // yyyy-mm-dd
  orcid: string;
  countryOfBirth: string;
  saResidencyStatus: string;
  disability: boolean;
  highestQualification: string;
  employmentStatus: string;
  department: number;
  faculty: number;
  academicTitle: string;
}

export interface ClaimingAuthorsContribution {
  proportionOfAuthors?: number;
  authorUnitsClaimed?: number;
  additionalComments?: string;
}

export interface  Units {
  maxUnitsForPublication?: number;
  totalProportionOfAuthors?: number;
  authorsCount?: number;
  totalUnitsClaimed?: number;
  otherAuthorsNonAffiliates?: string;
  unitsAdditionalComments?: string;
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

export interface Faculty {
  id: number;
  code: string;
  name: string;
  // add any other fields you have in the entity
}

export interface Department {
  id: number;
  code: string;
  name: string;
  facultyId?: number; // optional, if you expose it
  // other fields if needed
}

export interface  Country{
  name: string
}

