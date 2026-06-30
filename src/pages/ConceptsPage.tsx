import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Map, Trash2 } from 'lucide-react';
import { getConcepts, searchConcepts, createConcept, deleteConcept, getPublicWorkspace, getWorkspaces, createWorkspace } from '../api';
import type { ConceptResponse, PageResponse } from '../types';
import { useFetch } from '../hooks/useFetch';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { TagBadge } from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const conceptSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
});

type ConceptForm = z.infer<typeof conceptSchema>;

export default function ConceptsPage() {
  const navigate = useNavigate();
  const { page, size, setPage, setSize } = usePagination(20);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConceptResponse | null>(null);

  const { data, loading, error, refetch } = useFetch<PageResponse<ConceptResponse>>(
    (signal) => {
      if (debouncedSearch.trim()) {
        return searchConcepts(debouncedSearch, page, size, signal);
      }
      return getConcepts(page, size, 'title,asc', signal);
    },
    [page, size, debouncedSearch]
  );

  const form = useForm<ConceptForm>({ resolver: zodResolver(conceptSchema) });

  const handleCreate = async (formData: ConceptForm) => {
    setCreating(true);
    try {
      let workspaceId: string | undefined;

      const userWs = await getWorkspaces();
      if (userWs.content && userWs.content.length > 0) {
        workspaceId = userWs.content[0].id;
      }

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

      await createConcept({ ...formData, workspaceId });
      toast.success('Concept created!');
      setShowCreate(false);
      form.reset();
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create concept';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConcept(deleteTarget.id);
      toast.success('Concept deleted');
      setDeleteTarget(null);
      refetch();
    } catch {
      toast.error('Failed to delete concept');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Map className="w-6 h-6 text-grove-green" />
          <div>
            <h1 className="text-xl font-bold text-white">Concepts</h1>
            {data && <p className="text-gray-400 text-sm">{data.totalElements} concepts total</p>}
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="grove-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Concept
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search concepts, tags, content..."
          className="grove-input w-full pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : data?.content.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {search ? 'No results found' : 'No concepts yet'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.content.map((concept) => (
              <div
                key={concept.id}
                className="bg-grove-surface border border-grove-border rounded-xl p-4 hover:border-grove-green/30 transition-all group flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <button
                    onClick={() => navigate(`/concepts/${concept.id}`)}
                    className="text-white font-semibold text-sm text-left group-hover:text-grove-green transition-colors line-clamp-2 flex-1"
                  >
                    {concept.title}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(concept)}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-gray-400 text-xs line-clamp-3 mb-3 flex-1">{concept.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(concept.tags ?? []).slice(0, 2).map((t) => (
                      <TagBadge key={t.id} name={t.name} color={t.color} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{concept.connectionCount} conn</span>
                </div>
              </div>
            ))}
          </div>
          {data && (
            <Pagination
              page={page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              size={size}
              onPageChange={setPage}
              onSizeChange={setSize}
            />
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal
          title="New Concept"
          onClose={() => { setShowCreate(false); form.reset(); }}
          footer={
            <>
              <button onClick={() => { setShowCreate(false); form.reset(); }} className="grove-btn-secondary">Cancel</button>
              <button
                onClick={form.handleSubmit(handleCreate)}
                disabled={creating}
                className="grove-btn-primary disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </>
          }
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
              <input {...form.register('title')} placeholder="Concept title" className="grove-input w-full" />
              {form.formState.errors.title && (
                <p className="text-red-400 text-xs mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Content</label>
              <textarea
                {...form.register('content')}
                placeholder="Describe this concept..."
                rows={5}
                className="grove-input w-full resize-none"
              />
              {form.formState.errors.content && (
                <p className="text-red-400 text-xs mt-1">{form.formState.errors.content.message}</p>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal
          title="Delete Concept"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button onClick={() => setDeleteTarget(null)} className="grove-btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium">
                Delete
              </button>
            </>
          }
        >
          <p className="text-gray-300">
            Are you sure you want to delete <span className="text-white font-semibold">"{deleteTarget.title}"</span>?
            This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
