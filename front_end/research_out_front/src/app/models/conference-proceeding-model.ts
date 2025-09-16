import {AuthorAffiliation, Authors} from './common.model';

export interface ConferenceProceedings {
  titleOfContribution: string;
  compliesWith60Rule: boolean;
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
  authorAffiliation :AuthorAffiliation[];

}
