export type AdminCareer = {
  _id: string;
  partnerId?: string;
  partnerName: string;
  partnerLogo?: string;
  title: string;
  location: string;
  workType: string;
  category: string;
  description: string;
  applyUrl: string;
  featured?: boolean;
  isActive: boolean;
  postedAt: string;
};

export type AdminCareerPage = { data: AdminCareer[]; total: number; page: number; limit: number };
