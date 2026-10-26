'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchPortfolio } from '@/lib/portfolio';

/**
 * Loads projects and skills from Drupal's JSON:API once per mount.
 *
 * Returns { data, error, loading, reload }; `reload` tries again after an error.
 */
export function usePortfolioData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPortfolio()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Unknown error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { data, error, loading, reload };
}
