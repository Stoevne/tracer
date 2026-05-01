/**
 * Cron-Auth — Vercel-Cron sendet `Authorization: Bearer $CRON_SECRET`.
 * Manuell triggerbar mit demselben Header.
 */
export function checkCronAuth(req: Request): { ok: true } | { ok: false; status: number; error: string } {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return { ok: false, status: 500, error: "CRON_SECRET unset" };
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  return { ok: true };
}
