'use client';

import { useState } from 'react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import Constellation from '@/components/Constellation';
import ConstellationPanel from '@/components/ConstellationPanel';
import InfoBadge from '@/components/InfoBadge';

export default function ConstellationPage() {
  const { data, loading, error } = usePortfolioData();
  const [selectedNode, setSelectedNode] = useState(null);

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>
        Loading constellation data…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#ff4444' }}>
        Error loading data: {typeof error === 'string' ? error : error?.message ?? 'Unknown error'}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ height: 'calc(100vh - 72px)', position: 'relative', overflow: 'hidden' }}>
      <Constellation
        nodes={data.nodes}
        edges={data.edges}
        selectedNode={selectedNode}
        onNodeClick={setSelectedNode}
      />
      <ConstellationPanel
        node={selectedNode}
        projects={data.projects}
        onClose={() => setSelectedNode(null)}
      />
      <InfoBadge>
        Rendering: CSR · All data fetched once from Drupal JSON:API · Filtered and visualised client-side.
      </InfoBadge>
    </div>
  );
}
