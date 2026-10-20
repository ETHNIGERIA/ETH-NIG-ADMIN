"use server";
import { unstable_rethrow } from "next/navigation";
import { ticketsApiPost } from "@/tickets-portal/lib/tickets-api.server";
export async function checkInEventTicket(
  eventId: string,
  rawCode: string,
  dayKey: string,
): Promise<{ message?: string; error?: string }> {
  const code = rawCode
    .trim()
    .replace(/^lbw-ticket:v1:/i, "")
    .toUpperCase();
  if (!/^[A-Z0-9-]{6,80}$/.test(code) || !dayKey)
    return { error: "Enter a valid ticket code and choose an event day." };
  try {
    await ticketsApiPost(
      `/admin/events/${encodeURIComponent(eventId)}/tickets/${encodeURIComponent(code)}/check-in`,
      { dayKey },
    );
    return { message: `Ticket ${code} admitted for the selected day.` };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: error instanceof Error ? error.message : "Check-in failed",
    };
  }
}
