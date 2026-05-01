/**
 * Anthropic-Client für den Brief-Curator (Claude Sonnet 4.6).
 * Nutzt prompt caching auf den System-Prompt — bei Test-Runs spart das,
 * der wöchentliche Production-Run ist eh nur einmal.
 */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

let cached: Anthropic | null = null;

function client(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }
  cached = new Anthropic({ apiKey });
  return cached;
}

export interface CuratorInput {
  language: "de" | "en";
  kw: number;
  year: number;
  items: Array<{
    title: string;
    url: string;
    snippet: string | null;
    publishedAt: string | null;
  }>;
}

const SYSTEM_PROMPT = `Du bist Curator für "Tracer Brief", einen wöchentlichen Newsletter für Radiologen, Nuklearmediziner und Medizintechnik-Verantwortliche im DACH-Raum.

Aufgabe: Aus einer Liste von News-Items der letzten Woche die 5–7 relevantesten auswählen und in der angeforderten Sprache zusammenfassen.

Auswahlkriterien:
- klinische Relevanz für Radiologie/Nuklearmedizin/MedTech > generische KI-News
- inhaltliche Diversität (keine 3 Artikel zum gleichen Thema)
- Aktualität × Glaubwürdigkeit der Quelle
- bevorzuge Items die konkret etwas Neues sagen — keine reinen Meinungsstücke

Output-Format: striktes JSON, schema:
{
  "items": [
    {
      "url": "<exakt aus Input>",
      "headline": "<eigene 6–12-Wort-Headline in Zielsprache>",
      "summary_md": "<2–4 Sätze Markdown, keine Listen, kein H-Tag>"
    }
  ],
  "intro_md": "<1–2 Sätze Markdown — was diese Woche prägt>",
  "outro_md": "<1 Satz Markdown — Ausblick / kuratorischer Hinweis>"
}

Schreibstil: nüchtern, kollegial, fachlich präzise. Keine Emojis. Kein Marketing-Sprech. Kein "wir freuen uns".`;

export interface CuratorOutput {
  items: Array<{ url: string; headline: string; summary_md: string }>;
  intro_md: string;
  outro_md: string;
}

export async function curateBrief(input: CuratorInput): Promise<CuratorOutput> {
  const c = client();
  const itemsList = input.items
    .map(
      (i, idx) =>
        `[${idx + 1}] ${i.title}\nURL: ${i.url}\nPublished: ${i.publishedAt ?? "?"}\nSnippet: ${(i.snippet ?? "").slice(0, 600)}`,
    )
    .join("\n\n");

  const langLabel = input.language === "de" ? "Deutsch" : "English";
  const userMessage = `Zielsprache: ${langLabel}
KW ${input.kw}, ${input.year}

News-Items dieser Woche (${input.items.length}):

${itemsList}

Wähle die 5–7 relevantesten und antworte ausschließlich mit dem JSON-Schema.`;

  const res = await c.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Curator returned no text block");
  }
  const text = block.text.trim();
  // Versuche JSON aus markdown-code-fences zu extrahieren falls Claude welche reinlegt
  const jsonText = extractJson(text);
  let parsed: CuratorOutput;
  try {
    parsed = JSON.parse(jsonText) as CuratorOutput;
  } catch (err) {
    throw new Error(
      `Curator returned non-JSON: ${(err as Error).message}\n\nRaw: ${text.slice(0, 500)}`,
    );
  }
  if (!parsed.items || !Array.isArray(parsed.items)) {
    throw new Error("Curator response missing items[]");
  }
  return parsed;
}

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) return fence[1];
  // Sonst: alles ab dem ersten { bis zum letzten }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text;
}
