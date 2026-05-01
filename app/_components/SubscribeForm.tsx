"use client";

import { useFormState, useFormStatus } from "react-dom";
import { subscribe, type SubscribeState } from "@/app/actions/subscribe";

const initial: SubscribeState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-tracer hover:bg-tracer-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-5 py-3 transition"
    >
      {pending ? "Wird gesendet…" : "Anmelden"}
    </button>
  );
}

export function SubscribeForm() {
  const [state, formAction] = useFormState(subscribe, initial);

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-tracer/40 bg-tracer/5 p-6">
        <p className="text-sm font-medium uppercase tracking-wider text-tracer mb-2">
          Eingetragen
        </p>
        <p className="text-ink-900/80">
          Danke! Du bekommst Tracer Brief, sobald die erste Ausgabe rausgeht.
          {state.email ? <> Bestätigung an <strong>{state.email}</strong>.</> : null}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="dein@beispiel.de"
          aria-label="E-Mail-Adresse"
          className="flex-1 rounded-lg border border-ink-100 bg-white px-4 py-3 outline-none focus:border-tracer focus:ring-2 focus:ring-tracer/20"
        />
        <SubmitButton />
      </div>

      <fieldset className="flex items-center gap-4 text-xs text-ink-900/60">
        <legend className="sr-only">Sprache</legend>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" name="language" value="de" defaultChecked className="accent-tracer" />
          Deutsch
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" name="language" value="en" className="accent-tracer" />
          English
        </label>
      </fieldset>

      {/* Honeypot — bleibt für Menschen unsichtbar, Bots füllen es trotzdem. */}
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
    </form>
  );
}
