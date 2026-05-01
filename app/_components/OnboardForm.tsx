"use client";

import { useFormState, useFormStatus } from "react-dom";
import { onboard, type OnboardState } from "@/app/actions/onboard";

const initial: OnboardState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-tracer hover:bg-tracer-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-5 py-3 transition"
    >
      {pending ? "Wird gespeichert…" : "Profil anlegen"}
    </button>
  );
}

export function OnboardForm() {
  const [state, formAction] = useFormState(onboard, initial);

  return (
    <form action={formAction} className="space-y-5" encType="multipart/form-data">
      <Field label="Brand-Name" hint="z.B. RNZ, ProRad München, Acme MedTech">
        <input
          type="text"
          name="brand_name"
          required
          maxLength={80}
          className="input"
        />
      </Field>

      <Field label="Kontakt-E-Mail" hint="Geht an dich für Approval-Mails.">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="input"
        />
      </Field>

      <Field
        label="Primärfarbe"
        hint="Hex-Wert (#0ea5a5). Wird als dezenter Akzent in den Bildern aufgenommen."
        optional
      >
        <input
          type="text"
          name="primary_color"
          placeholder="#0ea5a5"
          maxLength={7}
          className="input"
        />
      </Field>

      <Field
        label="Tonalität"
        hint="Wie wirkt euer Brand? z.B. fachlich-modern, kollegial-warm, technisch-präzise"
        optional
      >
        <input
          type="text"
          name="tone"
          maxLength={200}
          className="input"
        />
      </Field>

      <Field
        label="Themen-Schwerpunkte"
        hint={`Komma-getrennt — z.B. „Radiologie, Nuklearmedizin, KI in der Bildgebung".`}
        optional
      >
        <input
          type="text"
          name="focus_areas"
          className="input"
        />
      </Field>

      <Field label="Sprache">
        <select name="language" defaultValue="de" className="input">
          <option value="de">Deutsch</option>
          <option value="en">English</option>
          <option value="both">Beide</option>
        </select>
      </Field>

      <Field label="Logo (PNG/JPG, max 5 MB)" optional>
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/svg+xml"
          className="text-sm"
        />
      </Field>

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      ) : null}

      <div className="pt-2">
        <SubmitButton />
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #eceef2;
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          background: white;
          outline: none;
          font-size: 0.95rem;
        }
        .input:focus {
          border-color: #0ea5a5;
          box-shadow: 0 0 0 2px rgba(14, 165, 165, 0.2);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-900 mb-1.5">
        {label}
        {optional ? (
          <span className="text-ink-900/40 font-normal"> · optional</span>
        ) : null}
      </span>
      {children}
      {hint ? (
        <span className="block text-xs text-ink-900/50 mt-1">{hint}</span>
      ) : null}
    </label>
  );
}
