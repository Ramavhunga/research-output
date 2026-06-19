import {Attachment, Authors} from './common.model';

export interface ConferenceProceedings {
  id: number;
  dhetNo: string;
  status?: string;
  updatedAt?: string;
  submittedBy?: { username?: string };
  authors: Authors[];
  attachments?:Attachment[];
  originalOrPhotocopy: 'Original' | 'O' | 'Photocopy' | 'P';
  evidenceOfPeerReview: boolean | 'Yes' | 'Y' | 'No' | 'N';
  typeOfEvidence?: string;
  yearOfPublication: number;
  titleOfConferenceProceedings: string;
  titleOfContribution: string;
  editors?: string;
  publisher: string;
  isbn: string;
  fieldOfResearch: string;
  funders?: string;
  maxUnitsForPublication?: number;
  totalProportionOfAuthors: number;
  otherAuthorsNonAffiliated?: string;
  authorCount: number;
  totalUnitsClaimed: number;
  additionalComments?: string;
  compliesWith60Rule: 'Yes' | 'No' | 'N/A';
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  city: string;
  country: string;
}
