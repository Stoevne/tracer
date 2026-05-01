export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Tracer-Mark: konzentrische Ringe als Anspielung an einen
            radioaktiven Tracer / ein Bildgebungs-Target. */}
        <circle cx="16" cy="16" r="15" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="9.5" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="3.5" fill="currentColor" />
      </svg>
      <span className="text-xl font-semibold tracking-tight text-ink-900">
        Tracer
      </span>
    </div>
  );
}
