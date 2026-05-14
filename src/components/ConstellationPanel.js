'use client';

export default function ConstellationPanel({ node, projects, onClose }) {
  const relatedProjects = node
    ? projects.filter((p) => p.stackIds.includes(node.id))
    : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: '40px', // below banner
        right: 0,
        width: '300px',
        height: 'calc(100vh - 40px)',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        padding: '1.25rem',
        overflowY: 'auto',
        transform: node ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.2s ease',
        zIndex: 50,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close panel"
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          background: 'none',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          width: '24px',
          height: '24px',
          lineHeight: '22px',
          textAlign: 'center',
          fontSize: '0.75rem',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        ×
      </button>

      {node && (
        <>
          <h2 style={{ color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '0.25rem', paddingRight: '2rem' }}>
            {node.name}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '1.25rem' }}>
            {node.category} · {node.projectCount} project{node.projectCount !== 1 ? 's' : ''} · level {node.skillLevel}
          </p>

          <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Related Projects
          </h3>

          {relatedProjects.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No projects.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {relatedProjects.map((p) => (
                <li
                  key={p.id}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    padding: '0.6rem 0.75rem',
                  }}
                >
                  <a
                    href={p.path}
                    style={{ color: 'var(--text)', fontSize: '0.8rem', display: 'block' }}
                  >
                    {p.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
