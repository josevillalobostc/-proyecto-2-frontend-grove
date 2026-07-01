import { useState, useEffect } from 'react';
import { Route, ChevronRight, Lock, CheckCircle } from 'lucide-react';
import { getPublicWorkspace, getMyWorkspaces, createWorkspace, getLearningPath } from '../api';
import type { ConceptResponse } from '../types';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import { TagBadge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LearningPathPage() {
  const navigate = useNavigate();
  const [concepts, setConcepts] = useState<ConceptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const fetchPath = async () => {
      let workspaceId: string | undefined;

      // Try user's own workspaces first (member-guaranteed)
      try {
        const myWs = await getMyWorkspaces();
        if (myWs.content && myWs.content.length > 0) {
          workspaceId = myWs.content[0].id;
        }
      } catch { /* fall through */ }

      if (!workspaceId) {
        const ws = await getPublicWorkspace();
        workspaceId = ws.content[0]?.id;
      }

      if (!workspaceId) {
        const newWs = await createWorkspace({
          name: 'My Workspace',
          description: 'Default workspace',
          isPublic: true,
        });
        workspaceId = newWs.id;
      }

      if (!workspaceId) throw new Error('No workspace could be found or created');
      const concepts = await getLearningPath(workspaceId);
      setConcepts(concepts);
    };

    fetchPath()
      .catch((err) => {
        if (!controller.signal.aborted) {
          const msg = err?.response?.data?.message || err?.message || 'Failed to load learning path';
          setError(msg);
          toast.error(msg);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (loading) return <Spinner fullScreen />;
  if (error) return (
    <div className="flex items-center justify-center h-full">
      <ErrorMessage message={error} onRetry={() => window.location.reload()} />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-grove-green/10 border border-grove-green/20 flex items-center justify-center">
          <Route className="w-5 h-5 text-grove-green" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Learning Path</h1>
          <p className="text-gray-400 text-sm">
            {concepts.length} concepts, topologically ordered from fundamentals to advanced
          </p>
        </div>
      </div>

      {concepts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No concepts in this workspace yet</div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-grove-border" />

          <div className="space-y-4">
            {concepts.map((concept, index) => {
              const hasPrereqs = (concept.prerequisiteIds ?? []).length > 0;
              const isFirst = index === 0;

              return (
                <div key={concept.id} className="relative flex gap-4">
                  {/* Step marker */}
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                    isFirst
                      ? 'bg-grove-green border-grove-green'
                      : hasPrereqs
                      ? 'bg-grove-surface border-grove-border'
                      : 'bg-blue-500/10 border-blue-500/40'
                  }`}>
                    {isFirst ? (
                      <CheckCircle className="w-5 h-5 text-grove-dark" />
                    ) : hasPrereqs ? (
                      <Lock className="w-4 h-4 text-gray-500" />
                    ) : (
                      <span className="text-xs font-bold text-blue-400">{index + 1}</span>
                    )}
                  </div>

                  {/* Card */}
                  <button
                    onClick={() => navigate(`/concepts/${concept.id}`)}
                    className="flex-1 bg-grove-surface border border-grove-border rounded-xl p-4 text-left hover:border-grove-green/40 transition-all group mb-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 font-mono">#{index + 1}</span>
                          {!hasPrereqs && (
                            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                              Foundation
                            </span>
                          )}
                        </div>
                        <h3 className="text-white font-semibold group-hover:text-grove-green transition-colors">
                          {concept.title}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{concept.content}</p>

                        {hasPrereqs && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            <span>Requires:</span>
                            {(concept.prerequisiteTitles ?? []).slice(0, 2).map((t, i) => (
                              <span key={i} className="bg-grove-dark px-1.5 py-0.5 rounded text-gray-400">{t}</span>
                            ))}
                            {(concept.prerequisiteTitles ?? []).length > 2 && (
                              <span>+{(concept.prerequisiteTitles ?? []).length - 2} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {(concept.tags ?? []).slice(0, 2).map((t) => (
                            <TagBadge key={t.id} name={t.name} color={t.color} />
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>{concept.connectionCount} connections</span>
                          <ChevronRight className="w-3 h-3 group-hover:text-grove-green transition-colors" />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
