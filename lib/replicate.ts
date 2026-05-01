/**
 * Replicate-Client für FLUX 1.1 Pro.
 *
 * Wir geben den Prompt rein und bekommen einen PNG-Buffer raus. Replicate
 * liefert für FLUX entweder eine URL (älteres SDK-Verhalten) oder ein
 * ReadableStream — wir normalisieren auf Buffer.
 */
import Replicate from "replicate";

const MODEL = "black-forest-labs/flux-1.1-pro";

export interface FluxOptions {
  prompt: string;
  aspectRatio?: "16:9" | "1:1" | "4:5" | "3:2" | "2:3" | "9:16";
  outputFormat?: "png" | "jpg" | "webp";
  safetyTolerance?: 1 | 2 | 3 | 4 | 5;
  promptUpsampling?: boolean;
}

export async function generateImage(opts: FluxOptions): Promise<Buffer> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("Missing REPLICATE_API_TOKEN");
  }

  const replicate = new Replicate({ auth: token });

  const output = await replicate.run(MODEL, {
    input: {
      prompt: opts.prompt,
      aspect_ratio: opts.aspectRatio ?? "16:9",
      output_format: opts.outputFormat ?? "png",
      output_quality: 90,
      safety_tolerance: opts.safetyTolerance ?? 2,
      prompt_upsampling: opts.promptUpsampling ?? true,
    },
  });

  return await normalizeOutput(output);
}

/**
 * Replicate kann je nach SDK-Version + Modell zurückgeben:
 *  - string (URL)
 *  - string[] (URLs, erstes Element nehmen)
 *  - ReadableStream<Uint8Array> (FLUX 1.1 Pro im neueren SDK)
 *  - Objekt mit url()-Methode (FileOutput)
 */
async function normalizeOutput(output: unknown): Promise<Buffer> {
  if (typeof output === "string") {
    return await fetchAsBuffer(output);
  }
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === "string") {
    return await fetchAsBuffer(output[0]);
  }
  if (output && typeof output === "object") {
    const o = output as { url?: () => string | URL; getReader?: () => unknown };
    if (typeof o.url === "function") {
      const u = o.url();
      return await fetchAsBuffer(typeof u === "string" ? u : u.toString());
    }
    if (typeof o.getReader === "function") {
      return await streamToBuffer(output as ReadableStream<Uint8Array>);
    }
  }
  throw new Error(`Unexpected Replicate output shape: ${typeof output}`);
}

async function fetchAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch Replicate output: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}
