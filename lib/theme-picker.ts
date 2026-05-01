/**
 * Theme-Picker: aus brand_profile + aktuellen news_items wählen wir das
 * Wochen-Thema fürs Studio-Editorial.
 *
 * Pipeline:
 *  1. Brand-Profile + focus_areas → Embedding-Query bauen
 *  2. semantic_news RPC liefert Top-15 thematisch passende news_items
 *  3. Claude pickt eines + formuliert ein einzeiliges Theme
 */
import Anthropic from "@anthropic-ai/sdk";
import { embedTexts } from "@/lib/voyage";
import { supabaseAdmin } from "@/lib/supabase";

const MODEL = "claude-haiku-4-5-20251001"; // Theme-Pick ist klein → Haiku reicht

export interface ThemePickInput {
  brand: {
    name?: string;
    tone?: string | null;
    focus_areas?: string[];
  };
  language: "de" | "en";
}

export interface PickedTheme {
  theme: string;
  rationale: string;
  sourceUrls: string[];
}

export async function pickTheme(input: ThemePickInput): Promise<PickedTheme> {
  const focus = (input.brand.focus_areas ?? []).join(", ");
  const queryText =
    `${input.brand.name ?? "Brand"} — focus: ${focus || "Radiologie, Bildgebung, MedTech"}. tone: ${input.brand.tone ?? "fachlich"}.`;

  const [embedding] = await embedTexts([queryText], "query");

  const supabase = supabaseAdmin();
  const { data: items, error } = await supabase.rpc("semantic_news", {
    query_embedding: embedding as unknown as string,
    lang: input.language,
    n: 15,
  });
  if (error) {
    throw new Error(`semantic_news rpc failed: ${error.message}`);
  }
  const rows = (items ?? []) as Array<{
    id: string;
    title: string;
    url: string;
    content: string | null;
    published_at: string | null;
    distance: number;
  }>;

  if (rows.length === 0) {
    throw new Error("No relevant news_items found for theme picking");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });

  const itemsList = rows
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\nSnippet: ${(r.content ?? "").slice(0, 400)}`,
    )
    .join("\n\n");

  const lang = input.language === "de" ? "Deutsch" : "English";
  const sysPrompt = `Du bist Themen-Picker für Tracer Studio, einen Service der LinkedIn-Editorials für Radiologie/Nuklearmedizin/MedTech generiert. Aus einer Liste relevanter News der letzten zwei Wochen wählst du EIN Thema, zu dem ein Brand auf LinkedIn posten sollte.

Output: striktes JSON.
{
  "theme": "<einzelner Satz, ${lang}, 8–18 Wörter, konkret>",
  "rationale": "<1 Satz: warum dieses Thema, warum jetzt>",
  "source_urls": ["<URL aus Input>", ...]
}

Wähle das Thema, das (a) zu Brand und Tonalität passt, (b) gerade aktuell ist, (c) auf LinkedIn diskussionswürdig ist. Vermeide reine Produkt-PR und Marktforschungs-Banalitäten.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: [{ type: "text", text: sysPrompt, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Brand: ${input.brand.name ?? "—"}\nTon: ${input.brand.tone ?? "—"}\nFokus: ${focus || "—"}\n\nNews-Kandidaten:\n\n${itemsList}\n\nAntworte ausschließlich mit dem JSON.`,
      },
    ],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Theme picker returned no text");
  }
  const json = extractJson(block.text);
  let parsed: { theme?: string; rationale?: string; source_urls?: string[] };
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(
      `Theme picker non-JSON: ${(err as Error).message}\n${block.text.slice(0, 300)}`,
    );
  }
  if (!parsed.theme) throw new Error("Theme picker missing theme");
  return {
    theme: parsed.theme,
    rationale: parsed.rationale ?? "",
    sourceUrls: parsed.source_urls ?? [],
  };
}

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) return fence[1];
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text;
}
