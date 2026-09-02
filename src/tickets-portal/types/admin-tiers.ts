export type TicketTierStatus = 'active' | 'inactive' | 'sold_out';
export type TicketPurchaseType = 'all_days' | 'single_day';

export type AdminTicketTier = {
  _id: string;
  name: string;
  nameKey: string;
  description?: string;
  benefits: string[];
  isFree: boolean;
  priceMinor: number;
  currency?: string;
  status: TicketTierStatus;
  capacity?: number;
  soldCount: number;
  sortOrder: number;
  earlyBirdEndsAt?: string;
  earlyBirdPriceMinor?: number;
  earlyBirdCapacity?: number;
  createdAt?: string;
  updatedAt?: string;
  purchaseType?: TicketPurchaseType;
  volumeDiscounts?: Array<{ minimumQuantity: number; percentage: number }>;
};
