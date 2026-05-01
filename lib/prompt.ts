/**
 * Prompt-Crafter — verdichtet Brand-Kontext + Wochenthema in einen
 * FLUX-Image-Prompt. Wir nutzen ein OpenAI-Modell (gpt-4o-mini reicht), damit
 * der Prompt-Stil konsistent bleibt und nicht jeder Aufruf eine neue
 * Bild-Ästhetik produziert.
 *
 * Output-Vertrag: ein einzelner englischer Prompt-String, ≤ 500 Zeichen,
 * keine Anführungszeichen, kein "Image of …"-Vorspann.
 */
import OpenAI from "openai";

const SYSTEM_PROMPT = `You craft prompts for FLUX 1.1 Pro to produce LinkedIn editorial illustrations for radiology, nuclear medicine and medical imaging companies.

Style constraints (apply to every prompt):
- editorial illustration, conceptual, modern, clean
- abstract or metaphorical — never photographs of patients, never identifiable people
- visual metaphors from imaging: cross-sections, scan slices, tracer trails, contrast gradients, particles, waveforms, isolines
- restrained color palette (1–2 accent colors at most), generous negative space, leave the right and lower edges visually quiet so a logo can sit there
- no text, no letters, no numbers, no UI elements, no medical equipment with manufacturer logos, no people
- 16:9 landscape composition

Output: a single line of plain English prompt text, max ~80 words, no quotes, no preamble. Incorporate the brand tone and accent color softly when given.`;

export interface PromptCraftInput {
  theme: string;
  brand: {
    name?: string;
    primary_color?: string;
    tone?: string;
    focus_areas?: string[];
  };
  language: "de" | "en";
}

export async function craftImagePrompt(
  input: PromptCraftInput,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const client = new OpenAI({ apiKey });

  const userMsg = [
    `Theme: ${input.theme}`,
    input.brand.name ? `Brand: ${input.brand.name}` : null,
    input.brand.tone ? `Brand tone: ${input.brand.tone}` : null,
    input.brand.primary_color
      ? `Primary brand color (use as accent only): ${input.brand.primary_color}`
      : null,
    input.brand.focus_areas?.length
      ? `Brand focus: ${input.brand.focus_areas.join(", ")}`
      : null,
    `Audience language: ${input.language === "de" ? "German-speaking medical professionals" : "English-speaking medical professionals"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  const prompt = res.choices[0]?.message?.content?.trim();
  if (!prompt) {
    throw new Error("Prompt-Crafter returned empty response");
  }
  return prompt;
}
