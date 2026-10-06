import { getTicketsApiBaseUrl } from '@/tickets-portal/auth/server-config';

export type ProgramBrand = {
  key: 'eth' | 'lbw';
  label: string;
  slug: string;
  baseUrl: string;
};

export function getProgramBrands(): ProgramBrand[] {
  const baseUrl = getTicketsApiBaseUrl();
  return [
    {
      key: 'eth',
      label: 'Ethereum Lagos 2026',
      slug: 'ethereum-lagos-2026',
      baseUrl,
    },
    {
      key: 'lbw',
      label: 'Lagos Blockchain Week 2026',
      slug: 'lagos-blockchain-week-2026',
      baseUrl,
    },
  ];
}

export function partnersForEventPath(slug: string): string {
  return `/partners/for_event?event=${encodeURIComponent(slug)}`;
}

export function sponsorsForEventPath(slug: string): string {
  return `/sponsors/for_event?event=${encodeURIComponent(slug)}`;
}

export function speakersForEventPath(slug: string): string {
  return `/speakers/for_event?event=${encodeURIComponent(slug)}`;
}

export function adminPartnerApplicationsPath(slug: string): string {
  return `/admin/partner-applications?event=${encodeURIComponent(slug)}`;
}

export function adminSponsorApplicationsPath(slug: string): string {
  return `/admin/sponsor-applications?event=${encodeURIComponent(slug)}`;
}

export function adminSpeakerApplicationsPath(slug: string): string {
  return `/admin/speaker-applications?event=${encodeURIComponent(slug)}`;
}
