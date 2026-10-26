'use client';

import { useMemo } from 'react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { useEmbeddings } from '@/hooks/useEmbeddings';
import SearchBox from '@/components/SearchBox';
import InfoBadge from '@/components/InfoBadge';
import LoadError from '@/components/LoadError';

export default function SearchPage() {
  const { data, loading, error, reload } = usePortfolioData();

  // Pass empty array while loading to keep useEmbeddings in idle phase
  const searchItems = useMemo(() => data?.searchItems ?? [], [data]);
  const { phase, progress, error: modelError, retry, search } = useEmbeddings(searchItems);

  if (error) {
    return <LoadError message={error} onRetry={reload} />;
  }

  // While Drupal data loads, or when there is nothing to search, the model
  // phase is not the story.
  const empty = !loading && searchItems.length === 0;
  const effectivePhase = loading || empty ? 'idle' : phase;
  const statusOverride = loading
    ? 'Fetching content…'
    : (empty ? 'No published content to search yet.' : undefined);

  return (
    <div style={{ paddingTop: '5rem', paddingBottom: '4rem', minHeight: 'calc(100vh - 40px)' }}>
      <SearchBox
        phase={effectivePhase}
        progress={progress}
        search={search}
        error={modelError}
        onRetry={retry}
        statusOverride={statusOverride}
      />
      <InfoBadge>
        Rendering: CSR · Content from Drupal JSON:API · Embeddings computed in your browser · No external AI service, no cost.
      </InfoBadge>
    </div>
  );
}
