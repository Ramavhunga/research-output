import {Authors} from './common.model';

export interface Books {
  id: number;
  dhetNo: string;
  authors: Authors[];
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
  otherAuthorsNonAffiliated?: string;
  authorCount: number;
  totalUnitsClaimed: number;
  additionalComments?: string;
}

