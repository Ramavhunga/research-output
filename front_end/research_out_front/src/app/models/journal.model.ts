import { Authors, ClaimingAuthorsContribution, Units } from './common.model';

export interface Journal {

  id: number|null;
  duplicateJournal:false|null,
  /** Core DHET Info */
  dhetNo: string; // Must start with J
  year: string;
  journalTitle: string;
  title: string;
  publisher: string;
  index: string;
  comply: boolean;

  /** Publication Details */
  volume?: string;
  issue?: string;
  issn: string;
  eissn?: string;
  doi?: string;
  urls?: string; // semicolon separated from UI
  openaccess?: boolean;

  /** Research Classification */
  fieldofsearch: string;

  /** Fees & Funding */
  publicationfeedescription?: string;
  publishercurrency?: string;
  totalPublicationFeePublisherCurrency?: number;
  publicationfeearticle?: number;
  authorsContributionFee?: number;
  authorsContributionFeeZar?: number;
  funders?: string;

  /** DHET Units */
  units ?: Units;
  maxUnitsForPublication ?: number;
  /** Authors */
  authors: Authors[];
  otherAuthorsNonAffiliated?: string[];

  /** Contribution */
  claimingAuthorsContribution: ClaimingAuthorsContribution;

  /** Notes */
  additionalComments?: string;

}
