export type PromoCodeDiscountType = 'percentage' | 'fixed';

export type AdminPromoCode = {
  _id: string;
  code: string;
  discountType: PromoCodeDiscountType;
  discountValue: number;
  trackingRef: string;
  usageCount: number;
  maxUses?: number;
  isActive: boolean;
  /** null / missing = global promo */
  eventId?: string | null;
  influencerId?: string | null;
  communityId?: string | null;
  /** @deprecated legacy rows only */
  type?: 'influencer' | 'community';
  /** @deprecated legacy rows only */
  assignedTo?: string;
  /** Confirmed tickets and revenue (minor units) from registrations using this code */
  sales?: { ticketsSold: number; revenueMinor: number };
  /** Name of the scoped event (null for global codes) */
  eventName?: string | null;
  /** Slug of the scoped event (null for global codes) */
  eventSlug?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
