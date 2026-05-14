export default function InfoBadge({ children }) {
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '0.6rem 0.8rem',
        fontSize: '0.65rem',
        color: 'var(--text-muted)',
        maxWidth: '260px',
        lineHeight: 1.5,
        zIndex: 100,
      }}
    >
      {children}
    </div>
  );
}
