export type AdminAccount = {
  _id: string;
  email: string;
  name?: string;
  isActive: boolean;
  status?: 'account' | 'pending';
  canManageAdmins?: boolean;
  expiresAt?: string;
  sentAt?: string;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};
