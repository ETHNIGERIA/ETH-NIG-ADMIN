'use server';

import { revalidatePath } from 'next/cache';
import { ticketsApiDelete, ticketsApiPatch, ticketsApiPost } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminCareer } from '@/tickets-portal/types/admin-careers';

export type CareerActionState = { error?: string; ok?: boolean } | undefined;
const categories = ['Engineering', 'Product', 'Design', 'Business Development', 'Community', 'Marketing', 'Legal/Compliance', 'Operations', 'Other'];
const locations = ['Lagos', 'Remote', 'Hybrid', 'Other'];
const workTypes = ['Full-time', 'Contract', 'Internship', 'Part-time'];

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function readCareer(formData: FormData) {
  const data = {
    partnerName: String(formData.get('partnerName') ?? '').trim(), partnerLogo: String(formData.get('partnerLogo') ?? '').trim(),
    title: String(formData.get('title') ?? '').trim(), location: String(formData.get('location') ?? '').trim(), workType: String(formData.get('workType') ?? '').trim(), category: String(formData.get('category') ?? '').trim(), description: String(formData.get('description') ?? '').trim(), applyUrl: String(formData.get('applyUrl') ?? '').trim(), featured: formData.get('featured') === 'on', isActive: formData.get('isActive') === 'on',
  };
  if (!data.partnerName || !data.title || !data.description || !data.applyUrl) return { error: 'Partner name, title, description, and apply URL are required.' } as const;
  if (!locations.includes(data.location) || !workTypes.includes(data.workType) || !categories.includes(data.category)) return { error: 'Invalid career category, location, or work type.' } as const;
  if (!isHttpUrl(data.applyUrl)) return { error: 'Apply URL must be a valid http(s) link.' } as const;
  if (data.partnerLogo && !isHttpUrl(data.partnerLogo)) return { error: 'Partner logo must be a valid http(s) link.' } as const;
  return { data } as const;
}

export async function createCareerAction(_prev: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const result = readCareer(formData); if ('error' in result) return result;
  try { await ticketsApiPost<AdminCareer>('/admin/careers', result.data); } catch (e) { return { error: e instanceof Error ? e.message : 'Could not create career.' }; }
  revalidatePath('/tickets-command/careers');
  return { ok: true };
}

export async function updateCareerAction(_prev: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const id = String(formData.get('careerId') ?? '').trim(); if (!id) return { error: 'Missing career opportunity.' };
  const result = readCareer(formData); if ('error' in result) return result;
  try { await ticketsApiPatch<AdminCareer>(`/admin/careers/${id}`, result.data); } catch (e) { return { error: e instanceof Error ? e.message : 'Could not update career.' }; }
  revalidatePath('/tickets-command/careers');
  return { ok: true };
}

export async function deleteCareerAction(_prev: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const id = String(formData.get('careerId') ?? '').trim(); if (!id) return { error: 'Missing career opportunity.' };
  try { await ticketsApiDelete(`/admin/careers/${id}`); } catch (e) { return { error: e instanceof Error ? e.message : 'Could not remove career.' }; }
  revalidatePath('/tickets-command/careers');
  return { ok: true };
}
