import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Search, ChevronRight } from 'lucide-react';
import { getTags, getConceptsByCluster } from '../api';
import type { Tag, ConceptResponse, PageResponse } from '../types';
import { useFetch } from '../hooks/useFetch';
import { usePagination } from '../hooks/usePagination';
import { TagBadge } from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Pagination from '../components/ui/Pagination';
import { useNavigate } from 'react-router-dom';

export default function ClustersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTagId = searchParams.get('tagId');
  const navigate = useNavigate();
  const { page, size, setPage, setSize } = usePagination(25);

  const { data: tagsData, loading: tagsLoading } = useFetch<PageResponse<Tag>>(
    () => getTags(0, 100)
  );

  const [concepts, setConcepts] = useState<PageResponse<ConceptResponse> | null>(null);
  const [conceptsLoading, setConceptsLoading] = useState(false);
  const [conceptsError, setConceptsError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTagId) { setConcepts(null); return; }
    setConceptsLoading(true);
    getConceptsByCluster(selectedTagId, page, size)
      .then(setConcepts)
      .catch(() => setConceptsError('Failed to load concepts for this cluster'))
      .finally(() => setConceptsLoading(false));
  }, [selectedTagId, page, size]);

  const tags = tagsData?.content || [];
  const selectedTag = tags.find((t) => t.id === selectedTagId);

  return (
    <div className="h-full flex">
      {/* Sidebar: tag list */}
      <div className="w-64 border-r border-grove-border bg-grove-surface overflow-y-auto shrink-0">
        <div className="p-4 border-b border-grove-border">
          <div className="flex items-center gap-2 text-white font-semibold mb-3">
            <Layers className="w-4 h-4 text-grove-green" />
            Clusters
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              placeholder="Filter clusters..."
              className="grove-input w-full pl-8 text-xs h-8"
            />
          </div>
        </div>
        {tagsLoading ? (
          <Spinner size="sm" />
        ) : (
          <div className="p-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  setSearchParams({ tagId: tag.id });
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                  tag.id === selectedTagId
                    ? 'bg-grove-green/10 text-grove-green border border-grove-green/20'
                    : 'text-gray-400 hover:text-white hover:bg-grove-dark'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color || '#4ade80' }}
                  />
                  <span className="truncate">{tag.name}</span>
                </div>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main: concepts grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedTagId ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <Layers className="w-16 h-16 text-gray-700" />
            <h2 className="text-xl font-semibold text-white">Select a Cluster</h2>
            <p className="text-gray-400 max-w-xs">Choose a knowledge cluster from the sidebar to explore its concepts.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TagBadge name={selectedTag?.name || ''} color={selectedTag?.color} />
                </div>
                <h1 className="text-2xl font-bold text-white">{selectedTag?.name}</h1>
                {concepts && (
                  <p className="text-gray-400 text-sm mt-1">{concepts.totalElements} concepts in this cluster</p>
                )}
              </div>
            </div>

            {conceptsLoading ? (
              <Spinner />
            ) : conceptsError ? (
              <ErrorMessage message={conceptsError} />
            ) : concepts?.content.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No concepts in this cluster yet</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {concepts?.content.map((concept) => (
                    <button
                      key={concept.id}
                      onClick={() => navigate(`/concepts/${concept.id}`)}
                      className="bg-grove-surface border border-grove-border rounded-xl p-4 text-left hover:border-grove-green/40 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-semibold text-sm group-hover:text-grove-green transition-colors line-clamp-2">
                          {concept.title}
                        </h3>
                        <span className="text-xs text-gray-500 bg-grove-dark rounded px-1.5 py-0.5 shrink-0">
                          {concept.connectionCount} conn
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-3 mb-3">{concept.content}</p>
                      <div className="flex flex-wrap gap-1">
                        {(concept.tags ?? []).slice(0, 3).map((t) => (
                          <TagBadge key={t.id} name={t.name} color={t.color} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
                {concepts && (
                  <Pagination
                    page={page}
                    totalPages={concepts.totalPages}
                    totalElements={concepts.totalElements}
                    size={size}
                    onPageChange={setPage}
                    onSizeChange={setSize}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
