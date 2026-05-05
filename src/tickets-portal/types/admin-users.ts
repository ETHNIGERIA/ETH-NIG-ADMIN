export type AdminUser = {
  _id: string;
  email: string;
  name?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};
