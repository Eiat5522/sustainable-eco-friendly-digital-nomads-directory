export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export type ReportReason =
  | 'inappropriate_content'
  | 'false_information'
  | 'spam'
  | 'not_eco_friendly'
  | 'misleading_sustainability_claims'
  | 'other';

export interface Report {
  id: string;
  listingId: string;
  reporterId?: string; // Optional for anonymous reports
  reason: ReportReason;
  description: string;
  evidence?: string;
  status: ModerationStatus;
  createdAt: Date;
  updatedAt: Date;
  moderatorId?: string;
  moderatorNotes?: string;
}

export interface ModerationAction {
  id: string;
  listingId: string;
  moderatorId: string;
  action: 'approve' | 'reject' | 'flag' | 'request_changes';
  reason: string;
  changes?: {
    field: string;
    currentValue: string;
    suggestedValue: string;
    reason: string;
  }[];
  createdAt: Date;
}

export interface ContentGuidelines {
  id: string;
  category: string;
  rules: {
    title: string;
    description: string;
    examples: {
      good: string[];
      bad: string[];
    };
  }[];
  lastUpdated: Date;
}
