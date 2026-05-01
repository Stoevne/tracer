import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Tracer — Editorial Automation für Radiologie & Bildgebung";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #f6f7f9 0%, #e8f5f5 70%, #d1ecec 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="15"
              stroke="#0ea5a5"
              strokeOpacity="0.18"
              strokeWidth="1.5"
              fill="none"
            />
            <circle
              cx="16"
              cy="16"
              r="9.5"
              stroke="#0ea5a5"
              strokeOpacity="0.4"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="16" cy="16" r="3.5" fill="#0ea5a5" />
          </svg>
          <span style={{ fontSize: 36, fontWeight: 600, color: "#0b0f15" }}>
            Tracer
          </span>
        </div>

        <div>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 600,
              color: "#0b0f15",
              lineHeight: 1.1,
              margin: 0,
              fontFamily: "ui-serif, Georgia, serif",
            }}
          >
            Editorial Automation für Radiologie &amp; Bildgebung.
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: "#0b0f15",
            fontSize: 22,
          }}
        >
          <span>Studio · Brief · DE/EN</span>
          <span style={{ color: "#0ea5a5", fontWeight: 600 }}>
            tracer.molmed.eu
          </span>
        </div>
      </div>
    ),
    size,
  );
}
