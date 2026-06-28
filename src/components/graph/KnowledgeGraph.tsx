import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphEdge } from '../../types';

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (node: GraphNode) => void;
  selectedId?: string | null;
}

const PALETTES = [
  { fill: 'rgba(124,58,237,0.18)',  stroke: '#9D5FFF', glow: 'rgba(124,58,237,0.5)' },
  { fill: 'rgba(37,99,235,0.18)',   stroke: '#60A5FA', glow: 'rgba(37,99,235,0.5)' },
  { fill: 'rgba(5,150,105,0.18)',   stroke: '#34D399', glow: 'rgba(5,150,105,0.5)' },
  { fill: 'rgba(217,119,6,0.18)',   stroke: '#FCD34D', glow: 'rgba(217,119,6,0.5)' },
  { fill: 'rgba(219,39,119,0.18)',  stroke: '#F472B6', glow: 'rgba(219,39,119,0.5)' },
  { fill: 'rgba(8,145,178,0.18)',   stroke: '#22D3EE', glow: 'rgba(8,145,178,0.5)' },
  { fill: 'rgba(124,45,18,0.18)',   stroke: '#FB923C', glow: 'rgba(124,45,18,0.5)' },
  { fill: 'rgba(79,70,229,0.18)',   stroke: '#818CF8', glow: 'rgba(79,70,229,0.5)' },
];

const SELECTED = { fill: 'rgba(20,184,166,0.22)', stroke: '#14B8A6', glow: 'rgba(20,184,166,0.7)' };

export default function KnowledgeGraph({ nodes, edges, onNodeClick, selectedId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
  const tagColorMap = useRef<Map<string, number>>(new Map());

  const getPaletteIndex = useCallback((tag?: string) => {
    if (!tag) return 0;
    if (!tagColorMap.current.has(tag)) {
      tagColorMap.current.set(tag, tagColorMap.current.size % PALETTES.length);
    }
    return tagColorMap.current.get(tag)!;
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.08, 5])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    // Defs — glow filter + arrowhead
    const defs = svg.append('defs');

    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const filterSel = defs.append('filter').attr('id', 'glow-selected');
    filterSel.append('feGaussianBlur').attr('stdDeviation', '7').attr('result', 'blur');
    const feMergeSel = filterSel.append('feMerge');
    feMergeSel.append('feMergeNode').attr('in', 'blur');
    feMergeSel.append('feMergeNode').attr('in', 'SourceGraphic');

    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .style('fill', 'var(--edge-color)');

    // Simulation data
    type SimNode = GraphNode & d3.SimulationNodeDatum;
    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
    const nodeById = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks = edges
      .map((e) => ({ source: nodeById.get(e.source), target: nodeById.get(e.target) }))
      .filter((e) => e.source && e.target) as d3.SimulationLinkDatum<SimNode>[];

    simRef.current = d3.forceSimulation(simNodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(simLinks).id((d: d3.SimulationNodeDatum) => (d as SimNode).id).distance(130))
      .force('charge', d3.forceManyBody().strength(-450))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(32));

    // Links
    g.append('g')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .style('stroke', 'var(--edge-color)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '0')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('opacity', 0.7);

    // Nodes group
    const node = g.append('g')
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simRef.current?.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) simRef.current?.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on('click', (_event, d) => onNodeClick(d));

    // Each node: outer glow ring + filled circle + text label
    node.each(function(d) {
      const el = d3.select(this);
      const isSelected = d.id === selectedId;
      const tag = (d.tags ?? [])[0];
      const palette = isSelected ? SELECTED : PALETTES[getPaletteIndex(tag)];
      const r = Math.max(16, Math.min(28, 14 + (d.connectionCount || 0) * 0.9));
      const label = d.title.length > 2 ? d.title.slice(0, 2).toUpperCase() : d.title.toUpperCase();

      // Outer glow ring (only visible on hover / selected)
      el.append('circle')
        .attr('class', 'node-glow')
        .attr('r', r + 6)
        .attr('fill', 'none')
        .attr('stroke', palette.glow)
        .attr('stroke-width', 1.5)
        .attr('opacity', isSelected ? 0.8 : 0)
        .attr('filter', isSelected ? 'url(#glow-selected)' : null);

      // Main circle
      el.append('circle')
        .attr('class', 'node-circle')
        .attr('r', r)
        .attr('fill', palette.fill)
        .attr('stroke', palette.stroke)
        .attr('stroke-width', isSelected ? 2.5 : 1.5);

      // Label inside circle
      el.append('text')
        .attr('class', 'node-inner-label')
        .text(label)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', palette.stroke)
        .attr('font-size', r > 20 ? '10px' : '8px')
        .attr('font-weight', '700')
        .attr('pointer-events', 'none')
        .attr('font-family', 'Inter, system-ui, sans-serif');

      // Title label below
      el.append('text')
        .attr('class', 'node-title')
        .text(d.title.length > 22 ? d.title.slice(0, 22) + '…' : d.title)
        .attr('dy', r + 16)
        .attr('text-anchor', 'middle')
        .style('fill', 'var(--node-label-color)')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('pointer-events', 'none')
        .attr('font-family', 'Inter, system-ui, sans-serif');
    });

    // Hover effect
    node
      .on('mouseenter', function(_, d) {
        const el = d3.select(this);
        const isSelected = d.id === selectedId;
        el.select('.node-glow').transition().duration(150).attr('opacity', isSelected ? 1 : 0.6);
        el.select('.node-title').transition().duration(150).style('fill', '#9D5FFF');
        el.select('.node-circle').transition().duration(150).attr('stroke-width', 2.5);
      })
      .on('mouseleave', function(_, d) {
        const el = d3.select(this);
        const isSelected = d.id === selectedId;
        el.select('.node-glow').transition().duration(150).attr('opacity', isSelected ? 0.8 : 0);
        el.select('.node-title').transition().duration(150).style('fill', 'var(--node-label-color)');
        el.select('.node-circle').transition().duration(150).attr('stroke-width', isSelected ? 2.5 : 1.5);
      });

    const link = g.selectAll<SVGLineElement, d3.SimulationLinkDatum<SimNode>>('line');

    simRef.current.on('tick', () => {
      link
        .attr('x1', (d) => ((d.source as SimNode).x ?? 0))
        .attr('y1', (d) => ((d.source as SimNode).y ?? 0))
        .attr('x2', (d) => ((d.target as SimNode).x ?? 0))
        .attr('y2', (d) => ((d.target as SimNode).y ?? 0));
      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { simRef.current?.stop(); };
  }, [nodes, edges, selectedId, getPaletteIndex, onNodeClick]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
}
