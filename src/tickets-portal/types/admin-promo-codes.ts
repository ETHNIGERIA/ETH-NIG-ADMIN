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
  createdAt?: string;
  updatedAt?: string;
};
