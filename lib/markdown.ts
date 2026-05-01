/**
 * Minimaler Markdown→HTML Konverter ohne externe Dep.
 *
 * Nicht CommonMark-vollständig — deckt ab, was der Curator produziert:
 * H1/H2/H3, Absätze, Bold/Italic, Inline-Code, Links, horizontale Linien,
 * Block-Code-Fences. Reicht für Newsletter, kein Markdown-Editor-Use-Case.
 *
 * Wenn wir später richtige Komplexität brauchen, swap-in `marked` oder
 * `micromark` — der Aufruferkontext (mdToHtml) bleibt stabil.
 */

export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  let inCode = false;
  let codeLang = "";
  let codeBuf: string[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length === 0) return;
    out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith("```")) {
      if (inCode) {
        out.push(
          `<pre><code${codeLang ? ` class="language-${codeLang}"` : ""}>${escape(codeBuf.join("\n"))}</code></pre>`,
        );
        inCode = false;
        codeLang = "";
        codeBuf = [];
      } else {
        flushPara();
        inCode = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(raw);
      continue;
    }

    if (line === "") {
      flushPara();
      continue;
    }
    if (line === "---" || line === "***") {
      flushPara();
      out.push("<hr/>");
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      continue;
    }
    para.push(line);
  }
  flushPara();
  if (inCode) {
    out.push(`<pre><code>${escape(codeBuf.join("\n"))}</code></pre>`);
  }

  return out.join("\n");
}

function inline(s: string): string {
  let out = escape(s);
  // Links [text](url) — escape erst, dann replace
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, t, u) => {
    return `<a href="${u}">${t}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
