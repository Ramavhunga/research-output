import {AuthorAffiliation, Authors, ClaimingAuthorsContribution, Units} from './common.model';

export interface Journal {
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
  units?: Units[];
  authorAffiliation :AuthorAffiliation;
  claimingAuthorsContribution :ClaimingAuthorsContribution
}


