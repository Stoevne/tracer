import { OnboardForm } from "@/app/_components/OnboardForm";
import { Wordmark } from "@/app/_components/Wordmark";

export const metadata = {
  title: "Onboarding — Tracer Studio",
  description: "Registriere dein Brand-Profil für Tracer Studio.",
};

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-ink-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Wordmark className="text-tracer mb-10" />

        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-ink-900 mb-3">
          Studio-Onboarding
        </h1>
        <p className="text-ink-900/70 mb-8 leading-relaxed">
          Sag uns kurz, wer ihr seid und in welchem Stil eure
          LinkedIn-Editorials klingen sollen. Du kannst alles später wieder
          ändern.
        </p>

        <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-sm">
          <OnboardForm />
        </div>
      </div>
    </main>
  );
}
