"use client";
import { useEffect, useRef, useState } from "react";
import { checkInEventTicket } from "@/tickets-portal/actions/check-in";
type Scanner = {
  detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
export function EventCheckIn({
  eventId,
  days,
  timezone,
}: {
  eventId: string;
  days: { key: string; label: string; date: string }[];
  timezone: string;
}) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [day, setDay] = useState(
    days.find(
      (d) =>
        new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(d.date)) === today,
    )?.key ??
      days[0]?.key ??
      "",
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  function stop() {
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setScanning(false);
  }
  useEffect(
    () => () => {
      if (interval.current) clearInterval(interval.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  async function camera() {
    setError("");
    setMessage("");
    try {
      const Detector = (
        window as unknown as {
          BarcodeDetector?: new (options: { formats: string[] }) => Scanner;
        }
      ).BarcodeDetector;
      if (!Detector)
        throw Error(
          "Camera QR scanning is unavailable in this browser. Enter the printed ticket code below.",
        );
      if (!navigator.mediaDevices?.getUserMedia)
        throw Error(
          "Camera requires HTTPS and a supported browser. Enter the ticket code below.",
        );
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setScanning(true);
      if (!video.current) throw Error("Camera preview unavailable");
      video.current.srcObject = stream.current;
      await video.current.play();
      const detector = new Detector({ formats: ["qr_code"] });
      let detecting = false;
      interval.current = setInterval(() => {
        if (detecting || !video.current) return;
        detecting = true;
        void detector
          .detect(video.current)
          .then((rows) => {
            if (rows[0]?.rawValue) {
              setCode(rows[0].rawValue);
              setMessage(
                "Ticket captured. Review the event day, then confirm admission.",
              );
              stop();
            }
          })
          .catch(() => {})
          .finally(() => {
            detecting = false;
          });
      }, 350);
    } catch (e) {
      stop();
      setError(
        e instanceof Error
          ? e.message
          : "Unable to open camera. Enter the ticket code below.",
      );
    }
  }
  return (
    <section className="mx-auto max-w-2xl space-y-5 rounded-xl border border-stone-200 bg-white p-6 text-stone-900">
      <h1 className="text-2xl font-bold">Event check-in</h1>
      <p className="text-sm text-stone-600">
        Choose the day, scan a ticket or enter its code, then confirm admission.
        Viewing or scanning alone does not admit a ticket.
      </p>
      <label className="block text-sm">
        Event day
        <select
          className="mt-1 w-full rounded border border-stone-300 p-3"
          value={day}
          onChange={(e) => {
            setDay(e.target.value);
            setMessage("");
            setError("");
          }}
        >
          {days.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label} ·{" "}
              {new Date(d.date).toLocaleDateString("en-NG", {
                timeZone: timezone,
              })}
            </option>
          ))}
        </select>
      </label>
      <video
        ref={video}
        playsInline
        muted
        className={scanning ? "w-full rounded-lg" : "hidden"}
        aria-label="Ticket QR camera preview"
      />
      <button
        className="rounded border border-stone-300 px-4 py-2 text-sm font-semibold"
        onClick={() => (scanning ? stop() : void camera())}
        disabled={busy}
      >
        {scanning ? "Stop camera" : "Scan QR with camera"}
      </button>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          stop();
          setBusy(true);
          setError("");
          setMessage("");
          void checkInEventTicket(eventId, code, day)
            .then((result) => {
              if (result.error) setError(result.error);
              else {
                setMessage(result.message ?? "Ticket admitted");
                setCode("");
              }
            })
            .catch(() =>
              setError(
                "Check-in request failed. Verify the ticket before retrying.",
              ),
            )
            .finally(() => setBusy(false));
        }}
      >
        <label className="block text-sm">
          Ticket code
          <input
            className="mt-1 w-full rounded border border-stone-300 p-3 font-mono"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoComplete="off"
            placeholder="Printed code or scanned QR value"
          />
        </label>
        <button
          className="rounded bg-stone-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          disabled={busy || !code.trim() || !day}
        >
          {busy ? "Checking ticket…" : "Confirm admission"}
        </button>
      </form>
      {error && (
        <p role="alert" className="rounded bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded bg-green-50 p-4 text-green-900">
          {message}
        </p>
      )}
    </section>
  );
}
