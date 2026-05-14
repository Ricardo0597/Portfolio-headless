'use client';

export default function Banner() {
  return (
    <>
      <style>{`
        @keyframes hl-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .hl-banner {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 0.4rem 1rem;
          text-align: center;
          font-size: 0.7rem;
          color: var(--accent);
          letter-spacing: 0.03em;
          animation: hl-pulse 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hl-banner { animation: none; opacity: 1; }
        }
      `}</style>
      <div className="hl-banner">
        You&apos;re in the headless layer — data served by Drupal JSON:API, rendered by Next.js.
      </div>
    </>
  );
}
