/**
 * GET /api/studio/approve?brief=<uuid>&t=<token>&action=approve|reject
 *
 * Magic-Link für Customer-Approval von content_brief.
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyToken } from "@/lib/approve-token";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const briefId = url.searchParams.get("brief");
  const token = url.searchParams.get("t");
  const action = (url.searchParams.get("action") ?? "approve").toLowerCase();

  if (!briefId || !token) {
    return htmlResponse(400, "Ungültiger Link.");
  }
  if (!verifyToken("brief_content", briefId, token)) {
    return htmlResponse(403, "Token ungültig.");
  }

  const supabase = supabaseAdmin();
  const newStatus = action === "reject" ? "rejected" : "approved";
  const ts = new Date().toISOString();

  const { error } = await supabase
    .from("content_brief")
    .update({
      status: newStatus,
      approved_at: newStatus === "approved" ? ts : null,
    })
    .eq("id", briefId);

  if (error) {
    return htmlResponse(500, `Datenbank-Fehler: ${error.message}`);
  }

  if (newStatus === "approved") {
    return htmlResponse(
      200,
      `<h1>✓ Freigegeben</h1><p>Das Editorial ist freigegeben und kann im Dashboard heruntergeladen werden.</p>`,
    );
  }
  return htmlResponse(
    200,
    `<h1>Verworfen</h1><p>Das Editorial wurde verworfen. Wir generieren nächste Woche ein neues.</p>`,
  );
}

function htmlResponse(status: number, bodyHtml: string): Response {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"/><title>Tracer Studio</title><style>body{font-family:ui-sans-serif,system-ui,sans-serif;max-width:640px;margin:64px auto;padding:0 24px;color:#0b0f15;line-height:1.5}h1{font-size:24px;margin-bottom:8px;color:#0ea5a5}</style></head><body>${bodyHtml}</body></html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
