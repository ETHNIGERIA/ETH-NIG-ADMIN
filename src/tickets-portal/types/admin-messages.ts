export const MESSAGE_TARGETS = ['speaker', 'sponsor', 'partner', 'contact'] as const;
export type MessageTarget = (typeof MESSAGE_TARGETS)[number];

/** Mirror the API's SendAdminMessageDto limits. */
export const MESSAGE_SUBJECT_MAX = 160;
export const MESSAGE_BODY_MAX = 10000;

export interface AdminMessageRow {
  _id: string;
  kind: 'message' | 'approval_confirmation';
  to: string;
  subject: string;
  body: string;
  sentByEmail?: string;
  /** queued | processing | retryable_failed | accepted | permanent_failed | outcome_unknown */
  status: string;
  attempts: number;
  acceptedAt?: string;
  lastError?: string;
  createdAt: string;
}
