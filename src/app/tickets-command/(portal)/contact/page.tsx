import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { CONTACT_MESSAGE_STATUSES, type ContactMessagePage } from '@/tickets-portal/types/admin-contact';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { ContactMessagesManager } from '@/tickets-portal/components/contact/ContactMessagesManager';
import { Pagination } from '@/tickets-portal/components/ui/Pagination';
import {
  ADMIN_PAGE_SIZE,
  parseListParams,
  redirectIfPastLastPage,
  toQuery,
  type ListSearchParams,
} from '@/tickets-portal/lib/list-params';

export const dynamic = 'force-dynamic';

export default async function ContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<ListSearchParams>;
}) {
  const params = parseListParams(await searchParams, CONTACT_MESSAGE_STATUSES);
  let page: ContactMessagePage | null = null;
  let loadError: string | null = null;
  try {
    page = await ticketsApiGet<ContactMessagePage>(
      `/admin/contact-messages${toQuery({ page: params.page, limit: ADMIN_PAGE_SIZE, status: params.status })}`,
    );
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load messages';
  }

  if (page) {
    redirectIfPastLastPage('/tickets-command/contact', params.page, ADMIN_PAGE_SIZE, page.total, {
      status: params.status,
    });
  }

  const items = (page?.items ?? []).map((m) => ({
    ...m,
    _id: normalizeDocumentId(m._id),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">
          Contact messages
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-stone-600">
          Submissions from the site&apos;s contact form.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
          <p className="font-semibold">Could not load messages</p>
          <p className="mt-2 text-[14px]">{loadError}</p>
        </div>
      ) : (
        <>
          <ContactMessagesManager
            items={items}
            total={page?.total ?? 0}
            filtered={Boolean(params.status)}
          />
          <Pagination
            basePath="/tickets-command/contact"
            page={params.page}
            limit={ADMIN_PAGE_SIZE}
            total={page?.total ?? 0}
            params={{ status: params.status }}
          />
        </>
      )}
    </div>
  );
}
