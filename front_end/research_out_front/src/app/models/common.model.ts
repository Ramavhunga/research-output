export interface AuthorAffiliationDetail {
  universityCode: string;
  universityName: string;
  isUniven: boolean; // true if University of Venda
  isInternationalUniversity: boolean; // true if international university (not UNIVEN)
}

export interface AuthorResearchAffiliation {
  companyName: string;
  companyType: 'RESEARCH_COMPANY' | 'OTHER'; // research company or other
}

export interface Authors {
  id: number|null;
  affiliation: boolean|null;
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

  // Unit calculation fields
  universityAffiliations?: AuthorAffiliationDetail[]; // e.g., [UNIVEN, UNISA]
  researchAffiliations?: AuthorResearchAffiliation[]; // e.g., [Research Company ABC]
  authorShare?: number; // calculated: total units / num affiliated authors
  unitsPerUniversity?: { [key: string]: number }; // breakdown by university
  totalUnitsClaimed?: number; // total claimed by this author (may be split across universities)
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

export interface Attachment {
  formguid?: string;
  id?: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  file?: File; // for new uploads
  fileData?: string; // base64 string for existing attachments
  url?: string; // for existing attachments
  description?: string;
}
