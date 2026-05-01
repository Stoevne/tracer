/**
 * Voyage AI — Embeddings via HTTP API.
 * Modell: voyage-3 (1024 dim, multilingual).
 *
 * Wir batchen pro Aufruf bis zu 128 Dokumente. Voyage limitiert die
 * Token-Anzahl pro Request (~120k tokens), daher kürzen wir lange Texte
 * vor dem Encode auf ~4000 chars.
 */
const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3";
const MAX_CHARS = 4000;
const MAX_BATCH = 64;

export async function embedTexts(
  texts: string[],
  inputType: "document" | "query" = "document",
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VOYAGE_API_KEY");
  }
  if (texts.length === 0) return [];

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const slice = texts.slice(i, i + MAX_BATCH).map((t) => truncate(t, MAX_CHARS));
    const res = await fetch(VOYAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: slice,
        input_type: inputType,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Voyage embed failed (${res.status}): ${text.slice(0, 500)}`);
    }
    const json = (await res.json()) as {
      data: { embedding: number[]; index: number }[];
    };
    json.data
      .sort((a, b) => a.index - b.index)
      .forEach((d) => out.push(d.embedding));
  }
  return out;
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n);
}
