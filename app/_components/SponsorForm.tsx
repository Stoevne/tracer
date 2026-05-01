"use client";

import { useFormState, useFormStatus } from "react-dom";
import { bookSponsorSlot, type SponsorState } from "@/app/actions/sponsor";

const initial: SponsorState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-tracer hover:bg-tracer-dark disabled:opacity-60 text-white font-medium px-5 py-3 transition w-full"
    >
      {pending ? "Wird vorbereitet…" : "Slot buchen → Zahlung"}
    </button>
  );
}

export function SponsorForm() {
  const [state, formAction] = useFormState(bookSponsorSlot, initial);

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Sponsor / Firma">
        <input type="text" name="sponsor_name" required maxLength={120} className="input" />
      </Field>

      <Field label="Kontakt-E-Mail" hint="Rechnung + Reportings gehen hier hin.">
        <input type="email" name="contact_email" required className="input" />
      </Field>

      <Field label="Website" optional>
        <input type="url" name="website_url" placeholder="https://" className="input" />
      </Field>

      <Field
        label="Werbetext (Markdown)"
        hint={`50–1500 Zeichen. Wird als „Anzeige" in der Mitte der Ausgabe platziert.`}
      >
        <textarea
          name="copy_md"
          required
          rows={6}
          maxLength={1500}
          className="input"
        />
      </Field>

      <Field label="CTA-Link" optional hint="Worauf der Button verweisen soll.">
        <input type="url" name="cta_url" placeholder="https://" className="input" />
      </Field>

      <Field label="Sprache der Ausgabe">
        <select name="language" defaultValue="de" className="input">
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
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

      <SubmitButton />

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #eceef2;
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          background: white;
          outline: none;
          font-size: 0.95rem;
          font-family: inherit;
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
