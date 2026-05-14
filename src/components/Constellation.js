'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function Constellation({ nodes, edges, selectedNode, onNodeClick }) {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const nodeSelRef = useRef(null);
  const labelSelRef = useRef(null);

  // Build graph — runs once when data changes.
  // Note: uses raw `edges` prop (string ids). simEdges has D3-mutated object refs; the highlight effect needs the raw prop.
  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;

    const { width, height } = svgRef.current.getBoundingClientRect();
    const w = width || window.innerWidth;
    const h = height || window.innerHeight - 40;

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(nodes, (d) => d.weight) || 1])
      .range([5, 22]);

    const strokeScale = d3.scaleLinear()
      .domain([1, d3.max(edges, (d) => d.strength) || 1])
      .range([1, 5]);

    const categories = [...new Set(nodes.map((n) => n.category))];
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(categories);

    // Clone node data so D3 can mutate x/y without affecting React state
    const simNodes = nodes.map((d) => ({ ...d }));
    const nodeById = new Map(simNodes.map((d) => [d.id, d]));
    const simEdges = edges
      .map((e) => ({ source: nodeById.get(e.source), target: nodeById.get(e.target), strength: e.strength }))
      .filter((e) => e.source && e.target);

    const svg = d3.select(svgRef.current);
    simulationRef.current?.stop();
    svg.selectAll('*').remove();

    // Background click resets selection
    svg.on('click', () => onNodeClick(null));

    const zoom = d3.zoom()
      .scaleExtent([0.2, 6])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const g = svg.append('g');

    // Edges
    const link = g.append('g')
      .selectAll('line')
      .data(simEdges)
      .join('line')
      .attr('stroke', '#2a2a2a')
      .attr('stroke-width', (d) => strokeScale(d.strength))
      .attr('stroke-opacity', 0.8);

    // Nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(simNodes)
      .join('circle')
      .attr('r', (d) => radiusScale(d.weight))
      .attr('fill', (d) => colorScale(d.category))
      .attr('cursor', 'pointer')
      .attr('stroke', 'none')
      .on('click', (event, d) => {
        event.stopPropagation();
        simulationRef.current?.alphaTarget(0);
        onNodeClick(d);
      })
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    // Labels for heavier nodes only
    const label = g.append('g')
      .selectAll('text')
      .data(simNodes.filter((d) => d.weight >= 3))
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => radiusScale(d.weight) + 11)
      .attr('fill', '#666')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('pointer-events', 'none')
      .text((d) => d.name);

    nodeSelRef.current = node;
    labelSelRef.current = label;

    simulationRef.current = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).distance((d) => 60 / d.strength).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collide', d3.forceCollide((d) => radiusScale(d.weight) + 4))
      .on('tick', () => {
        link
          .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
        node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
        label.attr('x', (d) => d.x).attr('y', (d) => d.y);
      });

    return () => simulationRef.current?.stop();
  }, [nodes, edges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight/fade when selectedNode changes — no simulation restart
  useEffect(() => {
    if (!nodeSelRef.current) return;

    if (!selectedNode) {
      nodeSelRef.current.attr('opacity', 1);
      labelSelRef.current?.attr('opacity', 1);
      return;
    }

    const connectedIds = new Set([selectedNode.id]);
    edges.forEach((e) => {
      if (e.source === selectedNode.id) connectedIds.add(e.target);
      if (e.target === selectedNode.id) connectedIds.add(e.source);
    });

    nodeSelRef.current.attr('opacity', (d) => (connectedIds.has(d.id) ? 1 : 0.12));
    labelSelRef.current?.attr('opacity', (d) => (connectedIds.has(d.id) ? 1 : 0.12));
  }, [selectedNode, edges]);

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '100%', display: 'block', background: 'var(--bg)' }}
    />
  );
}
