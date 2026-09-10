export function toUTCISO(value: string): string {
  if (!value || typeof value !== "string") return value;
  const s = value.trim();
  if (s.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s}T12:00:00.000Z`;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString();
}

export function utcISOToLocalDateString(iso: string | null | undefined): string | undefined {
  if (iso == null || typeof iso !== "string") return undefined;
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function utcISOToLocalDateTimeString(iso: string | null | undefined): string | undefined {
  if (iso == null || typeof iso !== "string") return undefined;
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function formatDateBR(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, day] = iso.split("-");
      return `${day}/${m}/${y}`;
    }
    return iso;
  }
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTimeBR(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Ex.: segunda-feira, 04/09/2026 16:00 */
export function formatWeekdayDateTimeBR(value?: Date | string | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const date = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${weekday}, ${date} ${time}`;
}
