'use client';

import { useState } from 'react';

const phaseLabel = {
  idle: 'Initialising…',
  loading: 'Loading AI model…',
  embedding: null, // rendered inline with progress
  ready: 'Ready — ask anything about my portfolio.',
  error: null, // rendered with the error message and a retry button
};

const inputStyle = {
  flex: 1,
  background: '#111',
  border: '1px solid #333',
  color: '#fff',
  padding: '0.6rem 0.8rem',
  fontSize: '0.875rem',
  fontFamily: 'JetBrains Mono, monospace',
  outline: 'none',
};

const btnStyle = {
  background: '#00ff87',
  border: 'none',
  color: '#000',
  padding: '0.6rem 1.2rem',
  fontSize: '0.875rem',
  fontFamily: 'JetBrains Mono, monospace',
  fontWeight: 700,
  cursor: 'pointer',
};

const retryStyle = {
  background: 'none',
  border: '1px solid #ff4444',
  color: '#ff4444',
  padding: '0.2rem 0.6rem',
  marginLeft: '0.6rem',
  fontSize: '0.7rem',
  fontFamily: 'JetBrains Mono, monospace',
  cursor: 'pointer',
};

export default function SearchBox({
  phase,
  progress,
  search,
  error = null,
  onRetry = undefined,
  statusOverride = undefined,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim() || phase !== 'ready' || running) return;
    setRunning(true);
    setResults([]);
    setSearchError(null);
    try {
      setResults(await search(query.trim()));
      setSearched(true);
    } catch (err) {
      setSearchError(err?.message || 'Search failed.');
    } finally {
      setRunning(false);
    }
  }

  const statusText = statusOverride
    ?? (phase === 'embedding'
      ? `Building knowledge base… (${progress.done}/${progress.total})`
      : (phaseLabel[phase] ?? ''));

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#00ff87', marginBottom: '0.4rem' }}>
        Ask My Portfolio
      </h1>
      {phase === 'error' && statusOverride === undefined ? (
        <p role="alert" style={{ color: '#ff4444', fontSize: '0.75rem', marginBottom: '2rem', minHeight: '1.2em' }}>
          Search is unavailable: {error || 'the AI model could not be loaded.'}
          {onRetry && (
            <button type="button" onClick={onRetry} style={retryStyle}>
              Try again
            </button>
          )}
        </p>
      ) : (
        <p aria-live="polite" style={{ color: '#666', fontSize: '0.75rem', marginBottom: '2rem', minHeight: '1.2em' }}>
          {statusText}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 0 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={phase === 'ready' ? 'What have you built with PHP?' : (phase === 'error' ? 'Unavailable' : 'Loading…')}
          disabled={phase !== 'ready'}
          aria-label="Search question"
          style={inputStyle}
        />
        <button type="submit" disabled={phase !== 'ready' || running} style={btnStyle}>
          {running ? '…' : 'Search'}
        </button>
      </form>

      {searchError && (
        <p role="alert" style={{ color: '#ff4444', fontSize: '0.75rem', marginTop: '1rem' }}>
          Search failed: {searchError}
        </p>
      )}

      {searched && !running && !searchError && results.length === 0 && (
        <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '1rem' }}>No matches.</p>
      )}

      {results.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {results.map((r) => (
            <li
              key={r.id}
              style={{ background: '#111', border: '1px solid #1a1a1a', padding: '1rem 1.25rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#00ff87', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {r.type}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#555' }}>
                  {(r.score * 100).toFixed(1)}% match
                </span>
              </div>
              <a href={r.path} style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                {r.title}
              </a>
              {r.summary && (
                <p style={{ color: '#666', fontSize: '0.78rem', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {r.summary}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
