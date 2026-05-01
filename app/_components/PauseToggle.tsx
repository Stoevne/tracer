"use client";

import { useFormState, useFormStatus } from "react-dom";
import { togglePause, type SettingsState } from "@/app/actions/settings";

const initial: SettingsState = { status: "idle" };

function SubmitButton({ paused }: { paused: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        paused
          ? "bg-tracer hover:bg-tracer-dark text-white"
          : "border border-red-200 text-red-700 hover:bg-red-50"
      }`}
    >
      {pending ? "…" : paused ? "Wieder aktivieren" : "Pausieren"}
    </button>
  );
}

export function PauseToggle({
  customerId,
  token,
  paused,
}: {
  customerId: string;
  token: string;
  paused: boolean;
}) {
  const [state, formAction] = useFormState(togglePause, initial);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="token" value={token} />
      <input
        type="hidden"
        name="action"
        value={paused ? "resume" : "pause"}
      />
      <SubmitButton paused={paused} />
      {paused ? (
        <span className="text-sm text-ink-900/60">Aktuell pausiert.</span>
      ) : null}
      {state.status === "error" ? (
        <span role="alert" className="text-sm text-red-600">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
