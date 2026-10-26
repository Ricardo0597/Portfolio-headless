'use client';

/** Shown when Drupal's JSON:API cannot be reached; offers a retry. */
export default function LoadError({ message, onRetry }) {
  return (
    <div role="alert" style={{ padding: '2rem', color: '#ff4444' }}>
      Error loading portfolio data: {message || 'Unknown error'}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginLeft: '0.75rem',
            background: 'none',
            border: '1px solid #ff4444',
            color: '#ff4444',
            padding: '0.2rem 0.6rem',
            fontFamily: 'JetBrains Mono, monospace',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
