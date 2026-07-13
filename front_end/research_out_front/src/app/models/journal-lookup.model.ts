export interface JournalLookupResult {
  eligible: boolean;
  reason?: string;

  dhetNo?: string;
  status?: string;

  journalTitle?: string;
  publisher?: string;
  index?: string;

  comply?: 'Yes' | 'No';

  issn?: string;
  eissn?: string;

  openaccess?: boolean;
  fieldofsearch?: string;

  source: 'DHET' | 'OpenAlex' | 'Crossref' | 'Merged';
}

export interface DhetJournalRecord {
  journalId?: string | null;
  nrfJournalId?: string | null;
  standardJournalTitle?: string | null;
  title?: string | null;
  publisher?: string | null;
  status?: string | null;
  index?: string | null;
  sourceIndexes?: string | null;
  issn?: string | null;
  eissn?: string | null;
  qualifyForSubsidy?: string | null;
}

