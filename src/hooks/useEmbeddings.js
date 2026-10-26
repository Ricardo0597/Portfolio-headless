'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { itemText, rankItems, withTimeout } from '@/lib/search';

export const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

// 8-bit quantized weights (the ~23 MB model); the WASM default, pinned so a
// library update can't silently switch to a larger download.
export const MODEL_OPTIONS = { dtype: 'q8' };

// A stalled download must end in an error the visitor can retry, not an
// endless "Loading AI model…".
export const MODEL_TIMEOUT_MS = 60_000;

const EMBED_OPTIONS = { pooling: 'mean', normalize: true };

/**
 * Loads the embedding model in the browser and embeds the search items.
 *
 * phase: 'idle' | 'loading' | 'embedding' | 'ready' | 'error'
 */
export function useEmbeddings(items, { timeoutMs = MODEL_TIMEOUT_MS } = {}) {
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const embeddingsRef = useRef(null);
  const pipelineRef = useRef(null);

  useEffect(() => {
    if (!items || items.length === 0) return undefined;

    let cancelled = false;

    async function init() {
      setPhase('loading');
      setError(null);
      embeddingsRef.current = null;

      try {
        // Dynamic import keeps the library and the ~23 MB model out of the
        // initial bundle; the model is fetched from the Hugging Face CDN.
        const { pipeline } = await import('@huggingface/transformers');
        if (cancelled) return;

        pipelineRef.current = await withTimeout(
          pipeline('feature-extraction', MODEL_ID, MODEL_OPTIONS),
          timeoutMs,
          'The AI model took too long to load.',
        );
        if (cancelled) return;

        setPhase('embedding');
        setProgress({ done: 0, total: items.length });

        const embeddings = [];
        for (let i = 0; i < items.length; i++) {
          if (cancelled) return;
          const output = await pipelineRef.current(itemText(items[i]), EMBED_OPTIONS);
          embeddings.push(Array.from(output.data));
          setProgress({ done: i + 1, total: items.length });
        }

        if (!cancelled) {
          embeddingsRef.current = embeddings;
          setPhase('ready');
        }
      } catch (err) {
        if (cancelled) return;
        pipelineRef.current = null;
        setError(err?.message || 'The AI model could not be loaded.');
        setPhase('error');
      }
    }

    init();
    return () => { cancelled = true; };
  }, [items, attempt, timeoutMs]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  async function search(query, topK = 5) {
    if (!embeddingsRef.current || !pipelineRef.current || !items) return [];
    const output = await pipelineRef.current(query, EMBED_OPTIONS);
    return rankItems(Array.from(output.data), items, embeddingsRef.current, topK);
  }

  return { phase, progress, error, retry, search };
}
