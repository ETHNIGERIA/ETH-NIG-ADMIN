"use server";
import { unstable_rethrow } from "next/navigation";
import {
  ticketsApiGet,
  ticketsApiPost,
  ticketsApiPatch,
} from "@/tickets-portal/lib/tickets-api.server";
import { normalizeDocumentId } from "@/tickets-portal/lib/mongo-json";
export type Campaign = {
  _id: string;
  kind: "announcement" | "ticket_reminder";
  subject: string;
  body: string;
  includeFreeTickets: boolean;
  revision: number;
  status: string;
  counts?: Record<string, number>;
  deliveryCounts?: Record<string, number>;
  createdAt?: string;
  lastError?: string;
};
export type CampaignPreview = {
  revision: number;
  audience: number;
  purchases: number;
  exclusions: Record<string, number>;
  ticketDeliveryEnabled: boolean;
  samplePdfBase64?: string;
  mail: { html: string; text: string };
};
export type Recipient = {
  _id: string;
  email: string;
  status: string;
  reason?: string;
  deliveries: {
    _id: string;
    part: number;
    status: string;
    providerMessageId?: string;
    lastError?: string;
  }[];
};
const base = (eventId: string) =>
  `/admin/events/${encodeURIComponent(eventId)}/communications`;
export async function loadCampaigns(eventId: string, page = 1) {
  const res = await ticketsApiGet<{
    data: Campaign[];
    total: number;
    pages: number;
  }>(`${base(eventId)}?page=${page}&limit=20`);
  return {
    ...res,
    data: res.data.map((c) => ({ ...c, _id: normalizeDocumentId(c._id) })),
  };
}
export async function campaignCommand(
  eventId: string,
  command:
    | "create"
    | "load"
    | "save"
    | "preview"
    | "test"
    | "send"
    | "cancel"
    | "retry-failed"
    | "recipients"
    | "resolve",
  id?: string,
  payload?: Record<string, unknown>,
  page = 1,
): Promise<{ data?: unknown; error?: string }> {
  try {
    const path = `${base(eventId)}${id ? `/${encodeURIComponent(id)}` : ""}`;
    let data: unknown;
    if (command === "load") data = await ticketsApiGet<Campaign>(path);
    else if (command === "create")
      data = await ticketsApiPost<Campaign>(path, payload);
    else if (command === "save")
      data = await ticketsApiPatch<Campaign>(path, payload);
    else if (command === "recipients")
      data = await ticketsApiGet(`${path}/recipients?page=${page}&limit=20`);
    else if (command === "resolve") {
      const { deliveryId, ...body } = payload ?? {};
      data = await ticketsApiPost(
        `${path}/deliveries/${encodeURIComponent(String(deliveryId))}/resolve`,
        body,
      );
    } else data = await ticketsApiPost(`${path}/${command}`, payload ?? {});
    return { data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    unstable_rethrow(error);
    return { error: error instanceof Error ? error.message : "Request failed" };
  }
}
