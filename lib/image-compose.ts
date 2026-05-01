/**
 * Image-Composer — nimmt ein FLUX-Output (Buffer) und blendet ein Logo
 * dezent unten rechts ein. Output: 1200×627-PNG (LinkedIn Landscape, leicht
 * weiter als 16:9, daher Mini-Crop oben/unten via "cover").
 *
 * Defaults: Logo-Höhe 10% der Bildhöhe, 32px Padding, Opacity 0.9.
 * Stephan iteriert nach erstem Output.
 */
import sharp from "sharp";

export interface ComposeOptions {
  baseImage: Buffer;
  logoUrl?: string | null;
  outputWidth?: number;
  outputHeight?: number;
  logoHeightRatio?: number;
  logoPaddingPx?: number;
  logoOpacity?: number;
}

const LINKEDIN_W = 1200;
const LINKEDIN_H = 627;

export async function composeFinalImage(opts: ComposeOptions): Promise<Buffer> {
  const w = opts.outputWidth ?? LINKEDIN_W;
  const h = opts.outputHeight ?? LINKEDIN_H;

  const baseResized = await sharp(opts.baseImage)
    .resize(w, h, { fit: "cover", position: "center" })
    .toBuffer();

  if (!opts.logoUrl) {
    return await sharp(baseResized).png().toBuffer();
  }

  const logoBuf = await fetchLogo(opts.logoUrl);
  const logoHeight = Math.round(h * (opts.logoHeightRatio ?? 0.1));
  const padding = opts.logoPaddingPx ?? 32;
  const opacity = clamp01(opts.logoOpacity ?? 0.9);

  // Logo skalieren auf Zielhöhe + Alpha-Kanal sicherstellen.
  const scaled = sharp(logoBuf)
    .resize({ height: logoHeight, fit: "inside", withoutEnlargement: false })
    .ensureAlpha();

  // Opacity via linear-Transform auf den Alpha-Kanal: a' = a * opacity.
  // linear([R,G,B,A], [0,0,0,0]) — multipliziert pro Kanal mit dem ersten
  // Faktor und addiert den zweiten Bias.
  const logoFinal = await (opacity < 1
    ? scaled.linear([1, 1, 1, opacity], [0, 0, 0, 0])
    : scaled
  )
    .png()
    .toBuffer();

  const logoMeta = await sharp(logoFinal).metadata();
  const logoW = logoMeta.width ?? logoHeight * 3;
  const logoH = logoMeta.height ?? logoHeight;

  return await sharp(baseResized)
    .composite([
      {
        input: logoFinal,
        top: h - logoH - padding,
        left: w - logoW - padding,
      },
    ])
    .png()
    .toBuffer();
}

async function fetchLogo(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch logo: ${res.status} ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
