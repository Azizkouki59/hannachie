import { useEffect, useState } from "react";

// Phone/WhatsApp availability: Mon–Sat 08:00–18:00 (Europe/Berlin).
const OPEN_MIN = 8 * 60;
const CLOSE_MIN = 18 * 60;
const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

type Status = { open: boolean; label: string };

function berlinNow(): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function getAvailability(): Status {
  const { day, minutes } = berlinNow();
  const isWorkday = day >= 1 && day <= 6;
  if (isWorkday && minutes >= OPEN_MIN && minutes < CLOSE_MIN) {
    return { open: true, label: "Jetzt erreichbar · bis 18:00 Uhr" };
  }
  if (isWorkday && minutes < OPEN_MIN) {
    return { open: false, label: "Heute ab 08:00 Uhr erreichbar" };
  }
  // After closing or Sunday: next workday.
  let next = (day + 1) % 7;
  if (next === 0) next = 1;
  const when = next === (day + 1) % 7 ? "Morgen" : DAY_NAMES[next];
  return { open: false, label: `${when} ab 08:00 Uhr erreichbar · WhatsApp jederzeit` };
}

export default function AvailabilityBadge({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const update = () => setStatus(getAvailability());
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!status) return null;
  const text = tone === "dark" ? (status.open ? "text-emerald-300" : "text-white/75") : status.open ? "text-emerald-700 dark:text-emerald-400" : "text-ink-muted";
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${text} ${className}`} role="status">
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${status.open ? "bg-emerald-400" : "bg-slate-400"}`}
      />
      {status.label}
    </span>
  );
}
