/**
 * Onboarding-Mail-Sequenz — Day 0/1/3/7/14.
 * Inhalte sind absichtlich kurz und zeitlos. Personalisiert wird nur über
 * den Brand-Namen + Vorname (aus E-Mail-Local-Part als Heuristik).
 */
import { sendMail } from "@/lib/mail";
import { makeToken } from "@/lib/approve-token";

export interface MailContext {
  customerId: string;
  email: string;
  brandName: string;
}

export const DAYS = [0, 1, 3, 7, 14] as const;
export type OnboardingDay = (typeof DAYS)[number];

export async function sendOnboardingMail(
  day: OnboardingDay,
  ctx: MailContext,
): Promise<void> {
  const tpl = template(day, ctx);
  await sendMail({
    to: ctx.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
}

function template(
  day: OnboardingDay,
  ctx: MailContext,
): { subject: string; html: string; text: string } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tracer.molmed.eu";
  const settingsToken = makeToken("settings", ctx.customerId);
  const settingsUrl = `${siteUrl}/studio/settings?customer=${ctx.customerId}&t=${settingsToken}`;
  const dashboardToken = makeToken("customer", ctx.customerId);
  const dashboardUrl = `${siteUrl}/studio/dashboard?customer=${ctx.customerId}&t=${dashboardToken}`;

  const wrap = (subject: string, body: string, plainText: string) => ({
    subject,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#0b0f15;line-height:1.6;">${body}<hr style="border:none;border-top:1px solid #eceef2;margin:24px 0;"/><p style="font-size:13px;color:#666;">— Stephan & das Tracer-Team<br/><a href="${dashboardUrl}">Dashboard</a> · <a href="${settingsUrl}">Einstellungen</a></p></div>`,
    text: `${plainText}\n\n— Stephan & das Tracer-Team\n\nDashboard: ${dashboardUrl}\nEinstellungen: ${settingsUrl}`,
  });

  switch (day) {
    case 0:
      return wrap(
        `Willkommen bei Tracer Studio, ${ctx.brandName}`,
        `<h1 style="font-size:22px;">Willkommen, ${escapeHtml(ctx.brandName)}.</h1>
         <p>Schön, dass ihr dabei seid. In den nächsten Tagen siehst du:</p>
         <ul>
           <li><strong>Tag 1:</strong> Wie der wöchentliche Rhythmus läuft</li>
           <li><strong>Tag 3:</strong> Tipps zum Brand-Profil</li>
           <li><strong>Tag 7:</strong> Dein erstes Editorial</li>
           <li><strong>Tag 14:</strong> Feedback-Frage</li>
         </ul>
         <p>Direkt zum Dashboard: <a href="${dashboardUrl}">${dashboardUrl}</a></p>`,
        `Willkommen, ${ctx.brandName}.\n\nIn den nächsten Tagen siehst du wie der wöchentliche Rhythmus läuft, Tipps zum Brand-Profil, dein erstes Editorial.`,
      );
    case 1:
      return wrap(
        `So läuft die Woche bei Tracer Studio`,
        `<p>Hi ${escapeHtml(ctx.brandName)},</p>
         <p>Der Rhythmus ist simpel:</p>
         <ul>
           <li><strong>Mittwoch 09:00 UTC</strong>: Wir picken ein Thema aus aktuellen News, generieren Bild + Caption-Vorschlag.</li>
           <li><strong>Mittwoch–Freitag</strong>: Du bekommst eine Mail mit dem Editorial. Ein Klick = Freigabe.</li>
           <li><strong>Nach Freigabe</strong>: Asset liegt in deiner Library zum Download. Posten kannst du selbst, oder wir bauen Auto-Post in v2.</li>
         </ul>
         <p>Dein Brand-Profil bestimmt Stil und Themenwahl — schau es dir nochmal an: <a href="${settingsUrl}">Einstellungen</a>.</p>`,
        `Mittwoch generieren wir, Mittwoch-Freitag bekommst du das Editorial zur Freigabe per Mail.`,
      );
    case 3:
      return wrap(
        `Tipps zum Brand-Profil`,
        `<p>Drei Dinge, die unsere Output-Qualität merklich heben:</p>
         <ol>
           <li><strong>Tonalität konkret:</strong> Statt „professionell" schreib „nüchtern, kollegial, technisch präzise" — der Curator versteht Adjektiv-Triple besser als Buzzwords.</li>
           <li><strong>Themen-Schwerpunkte eng halten:</strong> 2–4 Felder. Mehr macht die Theme-Wahl unscharf.</li>
           <li><strong>Logo als PNG mit Transparenz:</strong> Wir blenden es dezent unten rechts ein — Hintergrund wird sonst zum Klotz.</li>
         </ol>
         <p>Anpassen: <a href="${settingsUrl}">Einstellungen</a></p>`,
        `Tipps: Tonalität konkret, Themen eng halten, Logo als transparentes PNG.`,
      );
    case 7:
      return wrap(
        `Dein erstes Editorial sollte da sein`,
        `<p>Hi ${escapeHtml(ctx.brandName)},</p>
         <p>Wenn alles glattlief, hast du heute oder gestern dein erstes Editorial in der Mailbox. Falls nicht: schau ins <a href="${dashboardUrl}">Dashboard</a> oder antworte einfach auf diese Mail.</p>
         <p>Was wir wirklich wissen wollen: <strong>passt der Stil?</strong> Wenn nein, ein Wort oder zwei genügt — wir tunen das Brand-Profil mit dir.</p>`,
        `Dein erstes Editorial sollte da sein. Antworte mir, ob der Stil passt.`,
      );
    case 14:
      return wrap(
        `Wie war's? — kurze Frage`,
        `<p>Zwei Wochen Tracer Studio. Eine Frage:</p>
         <blockquote style="border-left:3px solid #0ea5a5;padding-left:12px;color:#444;font-size:18px;">Würdest du es einer Kollegin empfehlen — und falls nein, was fehlt?</blockquote>
         <p>Antwort direkt auf diese Mail genügt. Wir lesen alles selbst, kein Marketing-Filter dazwischen.</p>`,
        `Würdest du Tracer einer Kollegin empfehlen — und falls nein, was fehlt?`,
      );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
