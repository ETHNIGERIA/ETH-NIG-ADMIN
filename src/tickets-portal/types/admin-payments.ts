/** Lean payment document from GET /admin/payments/:id (may include populated refs). */
export type AdminPaymentDetail = {
  _id: unknown;
  eventId: unknown;
  tierId: unknown;
  registrationId?: unknown;
  amountMinor: number;
  currency: string;
  providerCode: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};
