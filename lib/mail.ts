/**
 * Transactional Mail über Resend (https://resend.com).
 *
 * Wir senden Owner-Approval-Mails und (KW8) Onboarding-Sequenzen.
 * Newsletter geht über Beehiiv, nicht hier.
 *
 * RESEND_API_KEY + RESEND_FROM müssen in Vercel gesetzt sein. RESEND_FROM
 * sollte eine verifizierte Sender-Domain sein (z.B. "Tracer <noreply@tracer.molmed.eu>").
 */
const RESEND_URL = "https://api.resend.com/emails";

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendMail(input: MailInput): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    throw new Error("Mail not configured (RESEND_API_KEY/RESEND_FROM)");
  }

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as { id?: string };
  if (!json.id) {
    throw new Error("Resend response missing id");
  }
  return { id: json.id };
}
