export type EventStatus = 'draft' | 'published' | 'archived';

export type AdminEvent = {
  _id: string;
  slug: string;
  name: string;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  allowedOrigins: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};
