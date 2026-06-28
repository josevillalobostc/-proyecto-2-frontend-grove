import { useState, useCallback, useEffect } from 'react';
import { Search, RefreshCw, ZoomOut, Plus, Minus, Pencil } from 'lucide-react';
import { getPublicGraph, getNeighborhoodGraph, searchConcepts } from '../api';
import type { GraphNode, GraphResponse, ConceptResponse } from '../types';
import { useFetch } from '../hooks/useFetch';
import { useDebounce } from '../hooks/useDebounce';
import KnowledgeGraph from '../components/graph/KnowledgeGraph';
import NodeDetailPanel from '../components/graph/NodeDetailPanel';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import { TagBadge } from '../components/ui/Badge';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function GraphPage() {
  const navigate = useNavigate();
  const { data: graph, loading, error, refetch } = useFetch<GraphResponse>(
    () => getPublicGraph()
  );

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [mergedGraph, setMergedGraph] = useState<GraphResponse | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ConceptResponse[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 400);
  useEffect(() => {
    if (!debouncedSearch.trim()) { setSearchResults(null); return; }
    setSearchLoading(true);
    const controller = new AbortController();
    searchConcepts(debouncedSearch, 0, 10, controller.signal)
      .then((res) => setSearchResults(res.content))
      .catch(() => {})
      .finally(() => setSearchLoading(false));
    return () => controller.abort();
  }, [debouncedSearch]);

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setSelectedNode(node);
    try {
      const sub = await getNeighborhoodGraph(node.id);
      setMergedGraph((prev) => {
        const base = prev || graph;
        if (!base) return sub;

        const nodeMap = new Map(base.nodes.map((n) => [n.id, n]));
        for (const n of sub.nodes) {
          if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
        }

        const edgeSet = new Set(base.edges.map((e) => `${e.source}→${e.target}`));
        const edges = [...base.edges];
        for (const e of sub.edges) {
          const key = `${e.source}→${e.target}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push(e);
          }
        }

        return { nodes: Array.from(nodeMap.values()), edges };
      });
      setIsExpanded(true);
    } catch {
      toast.error('Failed to load neighborhood');
    }
  }, [graph]);

  const activeGraph = mergedGraph || graph;

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--grove-dark)' }}>
      {/* Top search bar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--grove-border)', background: 'var(--surface-overlay-80)', backdropFilter: 'blur(8px)' }}
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts..."
            className="grove-input w-full pl-9 h-9 text-sm"
            style={{ borderRadius: '20px' }}
          />
          {(searchResults !== null || searchLoading) && searchQuery.trim() && (
            <div
              className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-20 max-h-64 overflow-y-auto"
              style={{
                background: 'var(--grove-surface)',
                border: '1px solid var(--grove-border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              }}
            >
              {searchLoading ? (
                <div className="p-3 text-center text-gray-500 text-sm">Searching...</div>
              ) : searchResults?.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-sm">No results found</div>
              ) : (
                searchResults?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      const node = graph?.nodes.find((n) => n.id === c.id);
                      if (node) handleNodeClick(node);
                      setSearchQuery('');
                      setSearchResults(null);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-grove-border transition-colors"
                    style={{ borderBottom: '1px solid rgba(38,30,79,0.5)' }}
                  >
                    <div className="text-sm text-white font-medium">{c.title}</div>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {(c.tags ?? []).slice(0, 2).map((t) => (
                        <TagBadge key={t.id} name={t.name} color={t.color} />
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Depth indicator (decorative) */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
          style={{ background: 'var(--grove-surface)', border: '1px solid var(--grove-border)' }}
        >
          <span className="text-gray-500 text-xs font-semibold">DEPTH</span>
          <span className="text-grove-green font-bold text-xs">∞</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {isExpanded && (
            <button
              onClick={() => { setMergedGraph(null); setIsExpanded(false); setSelectedNode(null); }}
              className="text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
              style={{ background: 'var(--grove-surface)', border: '1px solid var(--grove-border)', color: '#9CA3AF' }}
            >
              <ZoomOut className="w-3 h-3" />
              Reset Graph
            </button>
          )}
          <button
            onClick={refetch}
            className="p-2 rounded-lg hover:bg-grove-border transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Graph + panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Graph canvas */}
        <div className="flex-1 relative" style={{ background: 'var(--grove-dark)' }}>
          {/* Subtle radial gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.04) 0%, transparent 70%)',
            }}
          />

          {loading && <Spinner fullScreen />}
          {error && !loading && (
            <div className="flex items-center justify-center h-full">
              <ErrorMessage message={error} onRetry={refetch} />
            </div>
          )}

          {activeGraph && !loading && (
            <>
              {/* Stats overlay */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <div
                  className="px-3 py-1.5 text-xs rounded-full"
                  style={{ background: 'var(--surface-overlay-80)', border: '1px solid var(--grove-border)', backdropFilter: 'blur(4px)' }}
                >
                  <span className="text-white font-semibold">{activeGraph.nodes.length}</span>
                  <span className="text-gray-500 ml-1">nodes</span>
                </div>
                <div
                  className="px-3 py-1.5 text-xs rounded-full"
                  style={{ background: 'var(--surface-overlay-80)', border: '1px solid var(--grove-border)', backdropFilter: 'blur(4px)' }}
                >
                  <span className="text-white font-semibold">{activeGraph.edges.length}</span>
                  <span className="text-gray-500 ml-1">edges</span>
                </div>
                {isExpanded && (
                  <div
                    className="px-3 py-1.5 text-xs rounded-full"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', color: '#9D5FFF' }}
                  >
                    Expanded view
                  </div>
                )}
              </div>

              {/* Right: zoom controls */}
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1"
                style={{ transform: 'translateY(-50%)' }}
              >
                {[
                  { icon: <Plus className="w-4 h-4" />, title: 'Zoom in' },
                  { icon: <Minus className="w-4 h-4" />, title: 'Zoom out' },
                ].map((btn, i) => (
                  <button
                    key={i}
                    title={btn.title}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
                    style={{
                      background: 'var(--surface-overlay-80)',
                      border: '1px solid var(--grove-border)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {btn.icon}
                  </button>
                ))}
                <div style={{ height: '1px', background: 'var(--grove-border)', margin: '2px 0' }} />
                <button
                  title="Settings"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
                  style={{
                    background: 'var(--surface-overlay-80)',
                    border: '1px solid var(--grove-border)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <KnowledgeGraph
                nodes={activeGraph.nodes}
                edges={activeGraph.edges}
                onNodeClick={handleNodeClick}
                selectedId={selectedNode?.id}
              />
            </>
          )}

          {/* Capture Note floating button */}
          <div className="absolute bottom-6 left-1/2 z-10" style={{ transform: 'translateX(-50%)' }}>
            <button
              onClick={() => navigate('/concepts')}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'rgba(15,12,30,0.9)',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#C4B5FD',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <Pencil className="w-4 h-4" />
              Capture Note
            </button>
          </div>
        </div>

        {/* Node detail panel */}
        {selectedNode && (
          <div
            className="w-80 overflow-hidden"
            style={{ borderLeft: '1px solid var(--grove-border)', background: 'var(--grove-surface)' }}
          >
            <NodeDetailPanel
              conceptId={selectedNode.id}
              onClose={() => { setSelectedNode(null); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
