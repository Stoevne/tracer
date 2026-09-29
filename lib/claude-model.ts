/**
 * Neuestes Claude-Modell je Familie, damit keine Version fest im Code steht
 * (Stephans Vorgabe: immer das aktuellste Modell, 27.09.2026).
 * Fragt die Models-API einmal je Server-Instanz und merkt sich das Ergebnis 24 h.
 * Scheitert die Abfrage, gilt der letzte bekannte Wert, sonst der Notwert.
 */
import Anthropic from "@anthropic-ai/sdk";

export type Familie = "opus" | "sonnet" | "haiku";

const NOTWERT: Record<Familie, string> = {
  opus: "claude-opus-5-5", // modell-fest: Notwert, nur wenn die Models-API nicht antwortet
  sonnet: "claude-sonnet-5", // modell-fest: Notwert
  haiku: "claude-haiku-4-5", // modell-fest: Notwert
};
const GUELTIG_MS = 24 * 3600 * 1000;
const gemerkt = new Map<Familie, { id: string; zeit: number }>();

export async function neuestesModell(client: Anthropic, familie: Familie): Promise<string> {
  const alt = gemerkt.get(familie);
  if (alt && Date.now() - alt.zeit < GUELTIG_MS) return alt.id;
  try {
    // Nur schlichte Versionen wie claude-sonnet-5 oder claude-haiku-4-5-20251001
    const muster = new RegExp(`^claude-${familie}-\\d+(-\\d+)?(-\\d{8})?$`);
    let bestes: { id: string; created_at: string } | null = null;
    for await (const m of client.models.list()) {
      if (muster.test(m.id) && (!bestes || m.created_at > bestes.created_at)) bestes = m;
    }
    if (!bestes) throw new Error(`kein ${familie}-Modell in der Models-API`);
    gemerkt.set(familie, { id: bestes.id, zeit: Date.now() });
    return bestes.id;
  } catch (err) {
    const ersatz = alt?.id ?? NOTWERT[familie];
    console.warn(`[claude-model] Abfrage gescheitert, nehme ${ersatz}:`, err);
    return ersatz;
  }
}
