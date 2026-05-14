'use client';

import { useState, useEffect, useRef } from 'react';

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

// phase: 'idle' | 'loading' | 'embedding' | 'ready'
export function useEmbeddings(items) {
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const embeddingsRef = useRef(null);
  const pipelineRef = useRef(null);

  useEffect(() => {
    if (!items || items.length === 0) return;

    let cancelled = false;

    async function init() {
      setPhase('loading');

      // Dynamic import keeps the ~23MB model out of the initial bundle
      const { pipeline } = await import('@xenova/transformers');
      if (cancelled) return;

      pipelineRef.current = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      if (cancelled) return;

      setPhase('embedding');
      setProgress({ done: 0, total: items.length });

      const embeddings = [];
      for (let i = 0; i < items.length; i++) {
        if (cancelled) return;
        const text = items[i].title + (items[i].summary ? '. ' + items[i].summary : '');
        const output = await pipelineRef.current(text, { pooling: 'mean', normalize: true });
        embeddings.push(Array.from(output.data));
        setProgress({ done: i + 1, total: items.length });
      }

      if (!cancelled) {
        embeddingsRef.current = embeddings;
        setPhase('ready');
      }
    }

    init();
    return () => { cancelled = true; };
  }, [items]);

  async function search(query, topK = 5) {
    if (!embeddingsRef.current || !pipelineRef.current || !items) return [];
    const output = await pipelineRef.current(query, { pooling: 'mean', normalize: true });
    const qVec = Array.from(output.data);
    return items
      .map((item, i) => ({ ...item, score: cosine(qVec, embeddingsRef.current[i]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  return { phase, progress, search };
}
