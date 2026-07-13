export interface AdminJournalReference {
  id?: number;
  standardJournalTitle?: string | null;
  issn?: string | null;
  eissn?: string | null;
  status?: string | null;
  qualifyForSubsidy?: string | null;
  reason?: string | null;
  publisher?: string | null;
  nrfJournalId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AdminJournalUploadResponse {
  rowsInserted: number;
  message: string;
}

