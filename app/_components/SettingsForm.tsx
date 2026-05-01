"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateBrand, type SettingsState } from "@/app/actions/settings";

const initial: SettingsState = { status: "idle" };

interface Initial {
  name: string;
  primary_color: string;
  tone: string;
  focus_areas: string;
  language: "de" | "en" | "both";
  logo_url: string | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-tracer hover:bg-tracer-dark disabled:opacity-60 text-white font-medium px-5 py-2.5 transition"
    >
      {pending ? "Speichert…" : "Speichern"}
    </button>
  );
}

export function SettingsForm({
  customerId,
  token,
  initial: initialValues,
}: {
  customerId: string;
  token: string;
  initial: Initial;
}) {
  const [state, formAction] = useFormState(updateBrand, initial);

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="token" value={token} />

      <Field label="Brand-Name">
        <input
          type="text"
          name="brand_name"
          required
          defaultValue={initialValues.name}
          maxLength={80}
          className="input"
        />
      </Field>

      <Field label="Primärfarbe (Hex)">
        <input
          type="text"
          name="primary_color"
          defaultValue={initialValues.primary_color}
          placeholder="#0ea5a5"
          maxLength={7}
          className="input"
        />
      </Field>

      <Field label="Tonalität">
        <input
          type="text"
          name="tone"
          defaultValue={initialValues.tone}
          maxLength={200}
          className="input"
        />
      </Field>

      <Field label="Themen-Schwerpunkte (komma-getrennt)">
        <input
          type="text"
          name="focus_areas"
          defaultValue={initialValues.focus_areas}
          className="input"
        />
      </Field>

      <Field label="Sprache">
        <select
          name="language"
          defaultValue={initialValues.language}
          className="input"
        >
          <option value="de">Deutsch</option>
          <option value="en">English</option>
          <option value="both">Beide</option>
        </select>
      </Field>

      <Field label="Logo (optional, ersetzt vorhandenes)">
        {initialValues.logo_url ? (
          <p className="text-xs text-ink-900/50 mb-2">
            Aktuell: <a href={initialValues.logo_url} target="_blank" rel="noreferrer" className="text-tracer hover:underline">vorhandenes Logo</a>
          </p>
        ) : null}
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/svg+xml"
          className="text-sm"
        />
      </Field>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      ) : null}
      {state.status === "saved" ? (
        <p className="text-sm text-green-700">Gespeichert.</p>
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
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-900 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
