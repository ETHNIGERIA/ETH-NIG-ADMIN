export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled';

export type TicketStatus = 'active' | 'used' | 'cancelled';

export type AdminRegistration = {
  _id: string;
  eventId: string;
  tierId: string;
  promoCodeId?: string;
  userId?: string;
  email: string;
  name?: string;
  quantity: number;
  discountCode?: string;
  discountAmount?: number;
  originalAmount?: number;
  finalAmount?: number;
  status: RegistrationStatus;
  formData: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminTicket = {
  _id: string;
  registrationId: string;
  eventId: string;
  tierId: string;
  code: string;
  attendeeName?: string;
  attendeeEmail?: string;
  status: TicketStatus;
  usedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};
