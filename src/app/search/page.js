'use client';

import { useMemo } from 'react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { useEmbeddings } from '@/hooks/useEmbeddings';
import SearchBox from '@/components/SearchBox';
import InfoBadge from '@/components/InfoBadge';

export default function SearchPage() {
  const { data, loading, error } = usePortfolioData();

  // Pass empty array while loading to keep useEmbeddings in idle phase
  const searchItems = useMemo(() => data?.searchItems ?? [], [data]);
  const { phase, progress, search } = useEmbeddings(searchItems);

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#ff4444' }}>
        Error loading portfolio data: {typeof error === 'string' ? error : error?.message ?? 'Unknown error'}
      </div>
    );
  }

  // Show "Fetching content…" while usePortfolioData is loading
  const effectivePhase = loading ? 'idle' : phase;
  const statusOverride = loading ? 'Fetching content…' : undefined;

  return (
    <div style={{ paddingTop: '5rem', paddingBottom: '4rem', minHeight: 'calc(100vh - 40px)' }}>
      <SearchBox
        phase={effectivePhase}
        progress={progress}
        search={search}
        statusOverride={statusOverride}
      />
      <InfoBadge>
        Rendering: CSR · Embeddings computed in your browser · No API calls, no server, no cost.
      </InfoBadge>
    </div>
  );
}
