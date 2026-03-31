export interface ConfrenceProceedings {
  dhetNo: string;
  originalOrPhotocopy: 'Original' | 'O' | 'Photocopy' | 'P';
  evidenceOfPeerReview: 'Yes' | 'Y' | 'No' | 'N';
  typeOfEvidence?: string;
  yearOfPublication: number;
  titleOfBook: string;
  editors?: string;
  publisher: string;
  isbn: string;
  fieldOfResearch: string;
  funders?: string;
  totalNoPages: number;
  startPage: number;
  endPage: number;
  totalPagesClaimed: number;
  maxUnitsForPublication?: number;
  totalProportionOfAuthors: number;
  authorCount: number;
  totalUnitsClaimed: number;
  otherAuthors?: string;
  additionalComments?: string;
}
