import {Attachment, AuthorAffiliation, Authors} from './common.model';

export interface ConferenceProceedings {
  titleOfContribution: string;
  compliesWith60Rule: 'Yes' | 'No' | 'N/A';
  editors?: number;
  publisher: string;              // from predefined data
  isbnIssn: string;               // from predefined data
  fieldOfResearch: string;
  startDate: string;              // yyyy-mm-dd
  endDate: string;                // yyyy-mm-dd
  city: string;
  country: string;
  funders: string;
  authors?: Authors[];
  attachments?: Attachment[];
  authorAffiliation :AuthorAffiliation[];

}
