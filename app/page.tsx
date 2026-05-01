export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-full bg-tracer flex items-center justify-center text-white font-semibold">
            T
          </div>
          <span className="text-2xl font-semibold tracking-tight">Tracer</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-serif font-semibold leading-tight mb-6">
          Editorial Automation für Radiologie, Nuklearmedizin & Bildgebung.
        </h1>

        <p className="text-lg text-ink-900/70 mb-10 leading-relaxed">
          Tracer Studio generiert wöchentliche LinkedIn-Editorials für Praxen
          und MedTech-Firmen. Tracer Brief kuratiert die wichtigsten Trends in
          KI und Bildgebung — jeden Montag, in deutscher und englischer Sprache.
        </p>

        <div className="rounded-xl border border-ink-100 bg-white p-6">
          <p className="text-sm font-medium uppercase tracking-wider text-tracer mb-2">
            Coming soon
          </p>
          <p className="text-ink-900/80">
            Wir öffnen demnächst die Beta. Trag dich für Tracer Brief ein und
            sei dabei, sobald Tracer Studio live geht.
          </p>
          <form className="mt-5 flex flex-col sm:flex-row gap-3" action="#" method="post">
            <input
              type="email"
              required
              placeholder="dein@beispiel.de"
              className="flex-1 rounded-lg border border-ink-100 bg-ink-50 px-4 py-3 outline-none focus:border-tracer"
            />
            <button
              type="submit"
              className="rounded-lg bg-tracer hover:bg-tracer-dark text-white font-medium px-5 py-3 transition"
            >
              Anmelden
            </button>
          </form>
          <p className="mt-3 text-xs text-ink-900/50">
            Wir versenden ausschließlich Tracer Brief und produktbezogene
            Updates. Kein Spam, jederzeit abbestellbar.
          </p>
        </div>

        <footer className="mt-16 text-xs text-ink-900/50">
          © {new Date().getFullYear()} Tracer · Imprint coming soon
        </footer>
      </div>
    </main>
  );
}
