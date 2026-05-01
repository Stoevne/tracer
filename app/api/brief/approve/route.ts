/**
 * GET /api/brief/approve?issue=<uuid>&t=<token>&action=approve|reject
 *
 * Magic-Link-Endpoint. Token = HMAC(APPROVAL_SECRET, "brief:<issueId>").
 * Setzt Status auf approved bzw. rejected.
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyToken } from "@/lib/approve-token";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const issueId = url.searchParams.get("issue");
  const token = url.searchParams.get("t");
  const action = (url.searchParams.get("action") ?? "approve").toLowerCase();

  if (!issueId || !token) {
    return htmlResponse(400, "Ungültiger Link — issue oder token fehlt.");
  }
  if (!verifyToken("brief", issueId, token)) {
    return htmlResponse(403, "Token ungültig oder abgelaufen.");
  }

  const supabase = supabaseAdmin();
  const newStatus = action === "reject" ? "rejected" : "approved";
  const ts = new Date().toISOString();

  const { data, error } = await supabase
    .from("brief_issue")
    .update({
      status: newStatus,
      approved_at: newStatus === "approved" ? ts : null,
    })
    .eq("id", issueId)
    .select("kw, year, language, status")
    .single();

  if (error || !data) {
    return htmlResponse(500, `Datenbank-Fehler: ${error?.message ?? "unknown"}`);
  }

  const langLabel = data.language === "de" ? "DE" : "EN";
  if (newStatus === "approved") {
    return htmlResponse(
      200,
      `<h1>✓ Freigegeben</h1><p>Tracer Brief KW ${data.kw}/${data.year} (${langLabel}) ist freigegeben. Versand erfolgt automatisch Montag 06:00 UTC.</p>`,
    );
  }
  return htmlResponse(
    200,
    `<h1>Verworfen</h1><p>Tracer Brief KW ${data.kw}/${data.year} (${langLabel}) wurde verworfen. Kein Versand.</p>`,
  );
}

function htmlResponse(status: number, bodyHtml: string): Response {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"/><title>Tracer Brief</title><style>body{font-family:ui-sans-serif,system-ui,sans-serif;max-width:640px;margin:64px auto;padding:0 24px;color:#0b0f15;line-height:1.5}h1{font-size:24px;margin-bottom:8px;color:#0ea5a5}</style></head><body>${bodyHtml}</body></html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
