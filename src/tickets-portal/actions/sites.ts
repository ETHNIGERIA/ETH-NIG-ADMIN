'use server';

import { revalidatePath } from 'next/cache';
import {
  ticketsApiDelete,
  ticketsApiGet,
  ticketsApiPatch,
  ticketsApiPost,
} from '@/tickets-portal/lib/tickets-api.server';
import type { AdminSite } from '@/tickets-portal/types/admin-sites';

export type ActionState = { error?: string; success?: boolean } | undefined;

export async function fetchAdminSites(): Promise<AdminSite[]> {
  try {
    return await ticketsApiGet<AdminSite[]>('/admin/sites');
  } catch (err) {
    console.error('[fetchAdminSites error]', err);
    return [];
  }
}

export async function createSiteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const domain = String(formData.get('domain') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  if (!name || !slug || !domain) {
    return { error: 'Site name, slug, and domain are required.' };
  }

  try {
    await ticketsApiPost<AdminSite>('/admin/sites', {
      name,
      slug,
      domain,
      ...(description ? { description } : {}),
      isActive: true,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not create site.' };
  }

  revalidatePath('/tickets-command/sites');
  revalidatePath('/tickets-command/blogs/new');
  return { success: true };
}

export async function updateSiteAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const domain = String(formData.get('domain') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const isActive = formData.get('isActive') === 'true';

  try {
    await ticketsApiPatch<AdminSite>(`/admin/sites/${id}`, {
      ...(name ? { name } : {}),
      domain,
      description,
      isActive,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not update site.' };
  }

  revalidatePath('/tickets-command/sites');
  return { success: true };
}

export async function deleteSiteAction(id: string): Promise<ActionState> {
  try {
    await ticketsApiDelete(`/admin/sites/${id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not delete site.' };
  }

  revalidatePath('/tickets-command/sites');
  return { success: true };
}
