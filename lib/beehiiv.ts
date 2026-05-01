/**
 * Beehiiv API v2 — Post erstellen + Veröffentlichen.
 *
 * Endpoint laut https://developers.beehiiv.com/api-reference/posts/create —
 * falls Beehiiv ihre API ändert, hier zentral anpassen. Wir senden Markdown
 * als content_html (server-rendered) damit Beehiiv keine eigene Konvertierung
 * versucht; alternative `body_content` mit Beehiiv-Markdown ginge auch.
 */
const BASE = "https://api.beehiiv.com/v2";

interface CreatePostInput {
  publicationId: string;
  apiKey: string;
  title: string;
  subtitle?: string;
  contentHtml: string;
  /** Beehiiv-Status: "confirmed" → live, "draft" → bleibt im Editor */
  status?: "confirmed" | "draft";
  /** Newsletter-Versand auslösen? Nur sinnvoll bei status="confirmed". */
  sendEmail?: boolean;
}

interface CreatePostResult {
  postId: string;
  webUrl: string | null;
}

export async function createBeehiivPost(
  input: CreatePostInput,
): Promise<CreatePostResult> {
  const url = `${BASE}/publications/${input.publicationId}/posts`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title,
      subtitle: input.subtitle ?? "",
      content: { html: input.contentHtml },
      status: input.status ?? "confirmed",
      email_settings: {
        send_email: input.sendEmail ?? true,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Beehiiv create-post failed (${res.status}): ${text.slice(0, 500)}`,
    );
  }
  const json = (await res.json()) as {
    data?: { id?: string; web_url?: string | null };
    id?: string;
    web_url?: string | null;
  };
  const data = json.data ?? json;
  if (!data.id) {
    throw new Error("Beehiiv response missing post ID");
  }
  return { postId: data.id, webUrl: data.web_url ?? null };
}
