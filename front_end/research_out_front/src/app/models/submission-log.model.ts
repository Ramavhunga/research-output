export interface SubmissionLog {
  id: number;
  timestamp?: string;
  action?: string;
  performedBy?: string;
  fromStatus?: string;
  toStatus?: string;
  comments?: string;
}

