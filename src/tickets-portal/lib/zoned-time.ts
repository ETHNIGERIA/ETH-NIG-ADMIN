/**
 * Wall-clock time in an IANA zone ↔ ISO instant with that zone's offset.
 * The browser's own zone is never used, so an admin in another country
 * still schedules in the event's local time.
 */

function offsetMinutes(instant: Date, timeZone: string): number {
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(instant)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = name.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** Local date ("2026-11-12") and time ("10:00") of an instant in `timeZone`. */
export function isoToZonedWallTime(iso: string, timeZone: string): { date: string; time: string } {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return { date: '', time: '' };
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

/**
 * "2026-11-12" + "10:00" in `timeZone` → "2026-11-12T10:00:00+01:00".
 * Null when the input is malformed or the wall time does not exist (DST gap).
 */
export function zonedWallTimeToIso(date: string, time: string, timeZone: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const asUtc = Date.parse(`${date}T${time}:00Z`);
  if (Number.isNaN(asUtc)) return null;
  try {
    let offset = offsetMinutes(new Date(asUtc), timeZone);
    const corrected = offsetMinutes(new Date(asUtc - offset * 60_000), timeZone);
    if (corrected !== offset) offset = corrected;
    const instant = new Date(asUtc - offset * 60_000).toISOString();
    const back = isoToZonedWallTime(instant, timeZone);
    if (back.date !== date || back.time !== time) return null;
    return `${date}T${time}:00${formatOffset(offset)}`;
  } catch {
    return null; // unknown time zone
  }
}

/** "12 Nov 2026, 10:00" style formatting in the event's zone. */
export function formatInZone(iso: string | null | undefined, timeZone: string, withTime = true): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', {
      timeZone,
      dateStyle: 'medium',
      ...(withTime ? { timeStyle: 'short' } : {}),
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
