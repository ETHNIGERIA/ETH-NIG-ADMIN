"use client";
import { useCallback, useEffect, useState } from "react";
import {
  campaignCommand,
  loadCampaigns,
  type Campaign,
  type CampaignPreview,
  type Recipient,
} from "@/tickets-portal/actions/communications";
const field =
  "w-full rounded-lg border border-stone-300 bg-white p-3 text-sm text-stone-900";
const button =
  "rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-50";
const defaultBody =
  "The event is near! Here are the tickets you purchased for easy access and entry. Your tickets are attached. Please present each ticket’s QR code at check-in. You can also open your tickets using the links below.";
export function CommunicationsManager({
  eventId,
  initial,
  initialCampaign,
  startNew = false,
}: {
  eventId: string;
  initialCampaign?: Campaign;
  startNew?: boolean;
  initial: { data: Campaign[]; total: number; pages: number };
}) {
  const [list, setList] = useState(initial);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Campaign | null>(initialCampaign??null);
  const [kind, setKind] = useState<"announcement" | "ticket_reminder">(
    initialCampaign?.kind??"announcement",
  );
  const [subject, setSubject] = useState(initialCampaign?.subject??"");
  const [body, setBody] = useState(initialCampaign?.body??"");
  const [free, setFree] = useState(initialCampaign?.includeFreeTickets??false);
  const [preview, setPreview] = useState<CampaignPreview | null>(null);
  const [recipients, setRecipients] = useState<{
    data: Recipient[];
    total: number;
    pages: number;
  }>({ data: [], total: 0, pages: 0 });
  const [recipientPage, setRecipientPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showEditor, setShowEditor] = useState(startNew||!!initialCampaign);
  const [requestKey, setRequestKey] = useState("");
  const refresh = useCallback(
    async (id?: string, peoplePage = recipientPage) => {
      const res = await loadCampaigns(eventId, page);
      setList(res);
      if (id) {
        const row = await campaignCommand(eventId, "load", id);
        if (row.error) throw Error(row.error);
        setSelected(row.data as Campaign);
        const people = await campaignCommand(
          eventId,
          "recipients",
          id,
          undefined,
          peoplePage,
        );
        if (people.error) throw Error(people.error);
        setRecipients(people.data as typeof recipients);
      }
    },
    [eventId, page, recipientPage],
  );
  useEffect(() => {setRequestKey(crypto.randomUUID());if(initialCampaign)void refresh(initialCampaign._id,1).catch(e=>setError(e.message));}, [initialCampaign]);
  useEffect(() => {
    if (
      !selected ||
      [
        "draft",
        "completed",
        "completed_with_errors",
        "cancelled",
        "failed",
      ].includes(selected.status)
    )
      return;
    const timer = setInterval(
      () => void refresh(selected._id).catch((e) => setError(e.message)),
      5000,
    );
    return () => clearInterval(timer);
  }, [selected, refresh]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  async function command(
    command: Parameters<typeof campaignCommand>[1],
    payload?: Record<string, unknown>,
  ) {
    const result = await campaignCommand(
      eventId,
      command,
      selected?._id,
      payload,
    );
    if (result.error) throw Error(result.error);
    return result.data;
  }
  async function open(row: Campaign) {
    await run(async () => {
      window.history.replaceState(null,"",`/tickets-command/events-v2/${eventId}/communications/${row._id}`);
      setSelected(row);
      setSubject(row.subject);
      setBody(row.body);
      setKind(row.kind);
      setFree(row.includeFreeTickets);
      setPreview(null);
      setShowEditor(true);
      setRecipientPage(1);
      setRequestKey(crypto.randomUUID());
      await refresh(row._id, 1);
    });
  }
  const draft = !selected || selected.status === "draft";
  const dirty =
    !!selected &&
    (subject !== selected.subject ||
      body !== selected.body ||
      free !== selected.includeFreeTickets);
  const change = () => setPreview(null);
  return (
    <div className="space-y-6 text-stone-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Event communications</h1>
          <p className="mt-2 text-sm text-stone-600">
            Send announcements or deliver purchased tickets with QR attachments
            before the event.
          </p>
        </div>
        <button
          className={button}
          onClick={() => {
            window.history.replaceState(null,"",`/tickets-command/events-v2/${eventId}/communications/new`);
            setSelected(null);
            setSubject("");
            setBody("");
            setFree(false);
            setKind("announcement");
            setPreview(null);
            setShowEditor(true);
            setRequestKey(crypto.randomUUID());
          }}
        >
          New message
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-4 text-sm text-green-800"
        >
          {notice}
        </p>
      )}
      {showEditor && (
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex justify-between gap-3">
            <h2 className="font-bold">
              {selected
                ? `${selected.status.replaceAll("_", " ")} · ${selected.kind.replaceAll("_", " ")}`
                : "Compose message"}
            </h2>
            <button className={button} onClick={() => setShowEditor(false)}>
              Close
            </button>
          </div>
          {!selected && (
            <label className="block text-sm">
              Message type
              <select
                className={field}
                value={kind}
                onChange={(e) => {
                  const next = e.target.value as typeof kind;
                  setKind(next);
                  setBody(next === "ticket_reminder" ? defaultBody : "");
                  setSubject(
                    next === "ticket_reminder"
                      ? "Your event is near — here are your tickets"
                      : "",
                  );
                  change();
                }}
              >
                <option value="announcement">General announcement</option>
                <option value="ticket_reminder">
                  Purchased-ticket reminder
                </option>
              </select>
            </label>
          )}
          <p className="text-sm text-stone-600">
            {kind === "announcement"
              ? "Audience: unique contacts with confirmed registrations, including free registrations."
              : "Audience: buyers with matching successful paid purchases. Existing tickets are reused; missing tickets are prepared before delivery. Each buyer receives only their own tickets."}
          </p>
          <label className="block text-sm">
            Subject
            <input
              maxLength={160}
              required
              disabled={!draft}
              className={field}
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                change();
              }}
            />
          </label>
          <label className="block text-sm">
            Message
            <textarea
              maxLength={20000}
              required
              disabled={!draft}
              rows={7}
              className={field}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                change();
              }}
            />
          </label>
          {kind === "ticket_reminder" && (
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                disabled={!draft}
                checked={free}
                onChange={(e) => {
                  setFree(e.target.checked);
                  change();
                }}
              />
              Also include confirmed free registrations
            </label>
          )}
          {draft && (
            <button
              disabled={busy || !subject.trim() || !body.trim()}
              className={button}
              onClick={() =>
                void run(async () => {
                  const record = (await command(selected ? "save" : "create", {
                    subject,
                    body,
                    includeFreeTickets: free,
                    ...(selected ? { revision: selected.revision } : { kind }),
                  })) as Campaign;
                  window.history.replaceState(null,"",`/tickets-command/events-v2/${eventId}/communications/${record._id}`);
                  setSelected(record);
                  setPreview(null);
                  setNotice(
                    "Draft saved. Preview the audience before sending.",
                  );
                  await refresh(record._id);
                })
              }
            >
              Save draft
            </button>
          )}
          {selected && (
            <div className="flex flex-wrap gap-2">
              <button
                disabled={busy || dirty}
                className={button}
                onClick={() =>
                  void run(async () => {
                    setPreview((await command("preview")) as CampaignPreview);
                  })
                }
              >
                Preview audience and email
              </button>
              <button
                disabled={busy || dirty}
                className={button}
                onClick={() =>
                  void run(async () => {
                    await command("test");
                    setNotice(
                      "Test submitted to your administrator email. It does not issue real tickets.",
                    );
                  })
                }
              >
                Send me a test
              </button>
              {selected.status === "draft" && (
                <button
                  disabled={
                    busy ||
                    dirty ||
                    !preview ||
                    preview.audience === 0 ||
                    (kind === "ticket_reminder" &&
                      !preview.ticketDeliveryEnabled)
                  }
                  className={`${button} bg-stone-900 text-white`}
                  onClick={() =>
                    void run(async () => {
                      if (
                        !window.confirm(
                          `Send “${subject}” to approximately ${preview?.audience} people for this event? The exact audience is frozen when sending starts.`,
                        )
                      )
                        return;
                      await command("send", {
                        revision: selected.revision,
                        requestKey,
                      });
                      setPreview(null);
                      await refresh(selected._id);
                      setNotice(
                        "Campaign queued. Progress survives page refresh.",
                      );
                    })
                  }
                >
                  Send to {preview?.audience ?? "…"} people
                </button>
              )}
              {selected.status === "completed_with_errors" && (
                <button
                  disabled={busy}
                  className={button}
                  onClick={() =>
                    void run(async () => {
                      await command("retry-failed");
                      await refresh(selected._id);
                    })
                  }
                >
                  Retry confirmed failed submissions
                </button>
              )}
              {["draft", "preparing", "sending"].includes(selected.status) && (
                <button
                  disabled={busy}
                  className={button}
                  onClick={() =>
                    void run(async () => {
                      if (
                        !window.confirm(
                          "Stop new submissions? Messages already accepted or in flight cannot be recalled.",
                        )
                      )
                        return;
                      await command("cancel");
                      await refresh(selected._id);
                    })
                  }
                >
                  Cancel campaign
                </button>
              )}
              <button
                disabled={busy}
                className={button}
                onClick={() => void run(() => refresh(selected._id))}
              >
                Refresh progress
              </button>
            </div>
          )}
          {preview && (
            <div className="space-y-3 rounded-lg bg-stone-50 p-4">
              <p className="font-semibold">
                {preview.audience} unique contacts · {preview.purchases}{" "}
                eligible registrations
              </p>
              {kind === "ticket_reminder" && !preview.ticketDeliveryEnabled && (
                <p className="text-amber-800">
                  Ticket campaigns are disabled until migration and entry
                  verification are complete.
                </p>
              )}
              <p className="text-sm">
                Excluded registrations:{" "}
                {Object.entries(preview.exclusions)
                  .map(([why, n]) => `${n} ${why}`)
                  .join("; ") || "None"}
              </p>
              <pre className="whitespace-pre-wrap text-sm">
                {preview.mail.text}
              </pre>
              {preview.samplePdfBase64 && (
                <a
                  className="inline-block text-sm underline"
                  download="TEST-NOT-VALID-FOR-ENTRY.pdf"
                  href={`data:application/pdf;base64,${preview.samplePdfBase64}`}
                >
                  Download sample QR ticket attachment
                </a>
              )}
              <p className="text-xs text-stone-600">
                Ticket reminders add each buyer’s tickets and QR bundle at send
                time. Preview does not generate tickets.
              </p>
            </div>
          )}
          {selected && selected.status !== "draft" && (
            <>
              <p className="text-sm">
                Recipients:{" "}
                {Object.entries(selected.counts ?? {})
                  .map(
                    ([status, count]) =>
                      `${count} ${status.replaceAll("_", " ")}`,
                  )
                  .join(" · ") || "Audience preparation pending"}
              </p>
              <p className="text-xs text-stone-600">
                “Accepted” means the email provider accepted submission; it does
                not prove inbox delivery.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="p-2">Buyer</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.data.map((r) => (
                      <tr key={r._id} className="border-t border-stone-200">
                        <td className="p-2">{r.email}</td>
                        <td>{r.status.replaceAll("_", " ")}</td>
                        <td className="p-2">
                          {r.reason}
                          {r.deliveries.map((d) => (
                            <div key={d._id} className="mt-1 text-xs">
                              Part {d.part}: {d.status.replaceAll("_", " ")}
                              {d.providerMessageId
                                ? ` · ${d.providerMessageId}`
                                : ""}
                              {d.status === "outcome_unknown" && (
                                <button
                                  className="ml-2 underline"
                                  disabled={busy}
                                  onClick={() =>
                                    void run(async () => {
                                      const outcome = window.prompt(
                                        "After checking provider records, enter accepted or confirmed_unsent.",
                                      );
                                      if (!outcome) return;
                                      if (
                                        ![
                                          "accepted",
                                          "confirmed_unsent",
                                        ].includes(outcome)
                                      )
                                        throw Error(
                                          "Choose accepted or confirmed_unsent",
                                        );
                                      const evidence = window.prompt(
                                        "Describe provider evidence (at least 10 characters).",
                                      );
                                      if (!evidence) return;
                                      await command("resolve", {
                                        deliveryId: d._id,
                                        outcome,
                                        evidence,
                                      });
                                      await refresh(selected._id);
                                    })
                                  }
                                >
                                  Record verified outcome
                                </button>
                              )}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <button
                  className={button}
                  disabled={busy || recipientPage <= 1}
                  onClick={() =>
                    void run(async () => {
                      const next = recipientPage - 1;
                      setRecipientPage(next);
                      const result = await campaignCommand(
                        eventId,
                        "recipients",
                        selected._id,
                        undefined,
                        next,
                      );
                      if (result.error) throw Error(result.error);
                      setRecipients(result.data as typeof recipients);
                    })
                  }
                >
                  Previous recipients
                </button>
                <span>
                  {recipientPage} / {Math.max(1, recipients.pages)}
                </span>
                <button
                  className={button}
                  disabled={busy || recipientPage >= recipients.pages}
                  onClick={() =>
                    void run(async () => {
                      const next = recipientPage + 1;
                      setRecipientPage(next);
                      const result = await campaignCommand(
                        eventId,
                        "recipients",
                        selected._id,
                        undefined,
                        next,
                      );
                      if (result.error) throw Error(result.error);
                      setRecipients(result.data as typeof recipients);
                    })
                  }
                >
                  Next recipients
                </button>
              </div>
            </>
          )}
        </section>
      )}
      <section className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="p-3">Subject</th>
              <th>Type</th>
              <th>State</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.data.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-stone-500">
                  No messages yet. Create your first announcement or ticket
                  reminder.
                </td>
              </tr>
            ) : (
              list.data.map((c) => (
                <tr key={c._id} className="border-t border-stone-200">
                  <td className="p-3">{c.subject}</td>
                  <td>{c.kind.replaceAll("_", " ")}</td>
                  <td>{c.status.replaceAll("_", " ")}</td>
                  <td>
                    <button
                      className={button}
                      disabled={busy}
                      onClick={() => void open(c)}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
      <div className="flex items-center gap-3">
        <button
          className={button}
          disabled={busy || page <= 1}
          onClick={() =>
            void run(async () => {
              const next = page - 1;
              setPage(next);
              setList(await loadCampaigns(eventId, next));
            })
          }
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.max(1, list.pages)} · {list.total} messages
        </span>
        <button
          className={button}
          disabled={busy || page >= list.pages}
          onClick={() =>
            void run(async () => {
              const next = page + 1;
              setPage(next);
              setList(await loadCampaigns(eventId, next));
            })
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}
