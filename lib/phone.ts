/** Nigerian mobile for Squad SMS: 080XXXXXXXX (11 digits). */
export function normalizeNigerianPhone(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("234")) d = `0${d.slice(3)}`;
  if (d.length === 10 && !d.startsWith("0")) d = `0${d}`;
  if (d.length === 11 && d.startsWith("0")) return d;
  return null;
}
