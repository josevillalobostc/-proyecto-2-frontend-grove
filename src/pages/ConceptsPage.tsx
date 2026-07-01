import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Archive, Trash2, Hash } from 'lucide-react';
import { getConcepts, searchConcepts, createConcept, deleteConcept, getPublicWorkspace, getMyWorkspaces, createWorkspace } from '../api';
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
    (signal) => debouncedSearch.trim()
      ? searchConcepts(debouncedSearch, page, size, signal)
      : getConcepts(page, size, 'title,asc', signal),
    [page, size, debouncedSearch]
  );

  const form = useForm<ConceptForm>({ resolver: zodResolver(conceptSchema) });

  const handleCreate = async (formData: ConceptForm) => {
    setCreating(true);
    try {
      let workspaceId: string | undefined;
      try {
        const myWs = await getMyWorkspaces();
        if (myWs.content?.length) workspaceId = myWs.content[0].id;
      } catch { /* fall through */ }
      if (!workspaceId) {
        const ws = await getPublicWorkspace();
        workspaceId = ws.content[0]?.id;
      }
      if (!workspaceId) {
        const newWs = await createWorkspace({ name: 'My Workspace', description: 'Default workspace', isPublic: true });
        workspaceId = newWs.id;
      }
      await createConcept({ ...formData, workspaceId });
      toast.success('Concept created');
      setShowCreate(false);
      form.reset();
      refetch();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create concept');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConcept(deleteTarget.id);
      toast.success('Deleted');
      setDeleteTarget(null);
      refetch();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 0',
        borderBottom: '1px solid var(--grove-border)',
        background: 'var(--grove-surface)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Archive style={{ width: 18, height: 18, color: 'var(--grove-accent)' }} />
            <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Concepts
            </h1>
            {data && (
              <span style={{
                fontSize: 12, padding: '1px 8px', borderRadius: 99,
                background: 'var(--hover-bg)', color: 'var(--text-muted)',
                border: '1px solid var(--grove-border)',
              }}>
                {data.totalElements}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="grove-btn-primary"
            style={{ padding: '7px 14px', fontSize: 13.5, gap: 6 }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            New concept
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 400, marginBottom: 14 }}>
          <Search style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            width: 14, height: 14, color: 'var(--text-muted)',
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search concepts, tags, content…"
            className="grove-input"
            style={{ paddingLeft: 34, height: 36, fontSize: 13.5 }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={refetch} />
        ) : data?.content.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Archive style={{ width: 22, height: 22, color: 'var(--grove-accent)', opacity: 0.7 }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {search ? 'No results found' : 'No concepts yet'}
              </p>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
                {search ? `No matches for "${search}"` : 'Create your first concept to get started.'}
              </p>
            </div>
            {!search && (
              <button onClick={() => setShowCreate(true)} className="grove-btn-primary" style={{ fontSize: 13.5 }}>
                <Plus style={{ width: 14, height: 14 }} /> New concept
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {data?.content.map((concept) => (
                <ConceptCard
                  key={concept.id}
                  concept={concept}
                  onOpen={() => navigate(`/concepts/${concept.id}`)}
                  onDelete={() => setDeleteTarget(concept)}
                />
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
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal
          title="New concept"
          onClose={() => { setShowCreate(false); form.reset(); }}
          footer={
            <>
              <button onClick={() => { setShowCreate(false); form.reset(); }} className="grove-btn-secondary">Cancel</button>
              <button onClick={form.handleSubmit(handleCreate)} disabled={creating} className="grove-btn-primary" style={{ opacity: creating ? 0.6 : 1 }}>
                {creating ? 'Creating…' : 'Create'}
              </button>
            </>
          }
        >
          <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Title</label>
              <input {...form.register('title')} placeholder="Concept title" className="grove-input" />
              {form.formState.errors.title && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{form.formState.errors.title.message}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Content</label>
              <textarea {...form.register('content')} placeholder="Describe this concept…" rows={5} className="grove-input" style={{ resize: 'none' }} />
              {form.formState.errors.content && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{form.formState.errors.content.message}</p>}
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal
          title="Delete concept"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button onClick={() => setDeleteTarget(null)} className="grove-btn-secondary">Cancel</button>
              <button onClick={handleDelete} style={{
                padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)',
                background: 'rgba(239,68,68,0.08)', color: '#f87171',
                cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
              }}>
                Delete
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>"{deleteTarget.title}"</strong>?
            This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

/* ── Concept Card ─────────────────────────────────────────────────── */
function ConceptCard({
  concept, onOpen, onDelete,
}: { concept: ConceptResponse; onOpen: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--grove-surface)',
        border: `1px solid ${hovered ? 'rgba(124,58,237,0.30)' : 'var(--grove-border)'}`,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.12s',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
        transform: hovered ? 'translateY(-1px)' : 'none',
        position: 'relative',
      }}
      onClick={onOpen}
    >
      {/* Title + delete */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{
          flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.4,
          color: hovered ? 'var(--grove-accent)' : 'var(--text-primary)',
          transition: 'color 0.12s',
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {concept.title}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            padding: 5, borderRadius: 6, border: 'none', background: 'transparent',
            cursor: 'pointer', flexShrink: 0, opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s, background 0.12s',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.10)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Trash2 style={{ width: 13, height: 13 }} />
        </button>
      </div>

      {/* Content preview */}
      <p style={{
        fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55,
        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        flex: 1,
      }}>
        {concept.content}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(concept.tags ?? []).slice(0, 2).map((t) => (
            <TagBadge key={t.id} name={t.name} color={t.color} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
          <Hash style={{ width: 11, height: 11 }} />
          {concept.connectionCount}
        </div>
      </div>
    </div>
  );
}
