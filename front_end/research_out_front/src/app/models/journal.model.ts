import { Authors, ClaimingAuthorsContribution, Units, Attachment } from './common.model';

export interface Journal {

  id: number|null;
  duplicateJournal:false|null,
  /** Core DHET Info */
  dhetNo: string; // Must start with J
  year: string;
  status?: string;
  journalTitle: string;
  title: string;
  publisher: string;
  index: string;
  comply: 'N/A' | 'Yes' | 'No';

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

  /** Attachments */
  attachments?: Attachment[];

  /** Notes */
  additionalComments?: string;

  /** Workflow metadata */
  submittedBy?: {
    username?: string;
  };

}
