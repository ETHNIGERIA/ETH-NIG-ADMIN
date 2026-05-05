export type AdminDiscountType = 'percentage' | 'fixed';

export type AdminDiscount = {
  _id: string;
  code: string;
  type: AdminDiscountType;
  value: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  eventId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
