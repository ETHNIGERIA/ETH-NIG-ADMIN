export interface AdminSite {
  _id: string;
  name: string;
  slug: string;
  domain: string;
  description?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
