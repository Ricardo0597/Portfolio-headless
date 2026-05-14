'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function Constellation({ nodes, edges, selectedNode, onNodeClick }) {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const nodeSelRef = useRef(null);
  const labelSelRef = useRef(null);
  const zoomRef = useRef(null);

  // Build graph — runs once when data changes.
  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight - 40;

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(nodes, (d) => d.weight) || 1])
      .range([6, 28]);

    const strokeScale = d3.scaleLinear()
      .domain([1, d3.max(edges, (d) => d.strength) || 1])
      .range([1, 4]);

    const categories = [...new Set(nodes.map((n) => n.category))];
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(categories);

    const simNodes = nodes.map((d) => ({ ...d }));
    const nodeById = new Map(simNodes.map((d) => [d.id, d]));
    const simEdges = edges
      .map((e) => ({ source: nodeById.get(e.source), target: nodeById.get(e.target), strength: e.strength }))
      .filter((e) => e.source && e.target);

    const svg = d3.select(svgRef.current);
    simulationRef.current?.stop();
    svg.selectAll('*').remove();

    svg.on('click', () => onNodeClick(null));

    const zoom = d3.zoom()
      .scaleExtent([0.15, 8])
      .on('zoom', (event) => g.attr('transform', event.transform));
    zoomRef.current = zoom;
    svg.call(zoom);

    // SVG filter for node glow
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'node-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '3').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');

    const link = g.append('g')
      .selectAll('line')
      .data(simEdges)
      .join('line')
      .attr('stroke', '#2e2e2e')
      .attr('stroke-width', (d) => strokeScale(d.strength))
      .attr('stroke-opacity', 0.9);

    const node = g.append('g')
      .selectAll('circle')
      .data(simNodes)
      .join('circle')
      .attr('r', (d) => radiusScale(d.weight))
      .attr('fill', (d) => colorScale(d.category))
      .attr('cursor', 'pointer')
      .attr('stroke', (d) => d3.color(colorScale(d.category)).brighter(0.8))
      .attr('stroke-width', 1)
      .attr('filter', 'url(#node-glow)')
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

    const label = g.append('g')
      .selectAll('text')
      .data(simNodes.filter((d) => d.weight >= 1))
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => radiusScale(d.weight) + 13)
      .attr('fill', '#aaa')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('pointer-events', 'none')
      .text((d) => d.name);

    nodeSelRef.current = node;
    labelSelRef.current = label;

    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges)
        .distance((d) => Math.max(80, 200 / (d.strength || 1)))
        .strength(0.4))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('x', d3.forceX(w / 2).strength(0.04))
      .force('y', d3.forceY(h / 2).strength(0.04))
      .force('collide', d3.forceCollide((d) => radiusScale(d.weight) + 5))
      .on('tick', () => {
        link
          .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
        node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
        label.attr('x', (d) => d.x).attr('y', (d) => d.y);
      })
      .on('end', () => {
        // Zoom to fit all nodes with padding after simulation settles
        const padding = 60;
        const bbox = g.node().getBBox();
        if (!bbox.width || !bbox.height) return;
        const scale = Math.min(
          (w - padding * 2) / bbox.width,
          (h - padding * 2) / bbox.height,
          1.2
        );
        const tx = (w - scale * bbox.width) / 2 - scale * bbox.x;
        const ty = (h - scale * bbox.height) / 2 - scale * bbox.y;
        svg.transition().duration(900).call(
          zoom.transform,
          d3.zoomIdentity.translate(tx, ty).scale(scale)
        );
      });

    simulationRef.current = sim;
    return () => sim.stop();
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
