/** Shapes returned by GET /admin/overview (JSON-serialized). */

export type AdminOverviewResponse = {
  totals: {
    events: { total: number; draft: number; published: number; archived: number };
    ticketTiers: {
      total: number;
      active: number;
      inactive: number;
      soldOut: number;
    };
    registrations: {
      _id: null;
      originalAmountMinor: number;
      discountAmountMinor: number;
      finalAmountMinor: number;
      total: number;
      pending: number;
      confirmed: number;
      cancelled: number;
    };
    tickets: { total: number; active: number; used: number; cancelled: number };
    payments: {
      total: number;
      initiated: number;
      requiresAction: number;
      succeeded: number;
      failed: number;
      cancelled: number;
      refunded: number;
      amountMinor: number;
    };
    promoCodes: {
      total: number;
      active: number;
      influencer: number;
      community: number;
      usageCount: number;
    };
    influencerPayouts: {
      total: number;
      pending: number;
      approved: number;
      paid: number;
      payoutAmount: number;
    };
  };
  recent: {
    events: Array<{
      slug: string;
      name: string;
      status: string;
      tierCount: number;
      registrationCount: number;
      startsAt: string;
      endsAt: string;
    }>;
    ticketTiers: Array<{
      eventId: { slug: string; name: string; status: string };
      name: string;
      status: string;
      priceMinor: number;
      soldCount: number;
      capacity?: number;
    }>;
    registrations: Array<{
      eventId: { slug: string; name: string; status: string };
      tierId: { name: string; priceMinor: number; status: string };
      email: string;
      name?: string;
      quantity: number;
      status: string;
      finalAmount?: number;
      createdAt?: string;
    }>;
    transactions: Array<{
      eventId: { slug: string; name: string; status: string };
      tierId: { name: string; priceMinor: number; status: string };
      amountMinor: number;
      currency: string;
      providerCode: string;
      status: string;
      createdAt?: string;
    }>;
  };
};
