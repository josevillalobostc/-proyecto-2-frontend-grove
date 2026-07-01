import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Archive, Trash2, Hash, ChevronDown, FolderPlus, Globe, Lock } from 'lucide-react';
import {
  getConcepts, searchConcepts, createConcept, deleteConcept,
  getMyWorkspaces, createWorkspace,
} from '../api';
import type { ConceptResponse, PageResponse, WorkspaceResponse } from '../types';
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
  title: z.string().min(1, 'El título es requerido').max(200),
  content: z.string().min(1, 'El contenido es requerido'),
});
type ConceptForm = z.infer<typeof conceptSchema>;

// ── Workspace selector ─────────────────────────────────────────────
interface WorkspaceSelectorProps {
  value: string | null;
  onChange: (id: string) => void;
}

function WorkspaceSelector({ value, onChange }: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMyWorkspaces(0, 50)
      .then(r => {
        setWorkspaces(r.content);
        // Auto-select first workspace if none selected
        if (!value && r.content.length > 0) {
          onChange(r.content[0].id);
        }
      })
      .catch(() => toast.error('No se pudieron cargar los workspaces'))
      .finally(() => setLoading(false));
  }, []);

  const selected = workspaces.find(w => w.id === value);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const ws = await createWorkspace({ name: newName.trim(), isPublic });
      setWorkspaces(prev => [...prev, ws]);
      onChange(ws.id);
      setNewName('');
      setIsPublic(false);
      setOpen(false);
      toast.success(`Workspace "${ws.name}" creado`);
    } catch {
      toast.error('No se pudo crear el workspace');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px',
        border: '1px solid var(--grove-border)', borderRadius: 8, background: 'var(--grove-surface2)' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.3)',
          borderTopColor: 'var(--grove-accent)', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando workspaces…</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 13px', borderRadius: 8, cursor: 'pointer',
          background: 'var(--grove-surface2)', border: `1px solid ${open ? 'var(--grove-accent)' : 'var(--grove-border)'}`,
          color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: 14, textAlign: 'left', transition: 'border-color 0.15s',
          boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.14)' : 'none',
        }}
      >
        {selected ? (
          <>
            {selected.isPublic
              ? <Globe style={{ width: 14, height: 14, color: 'var(--grove-accent)', flexShrink: 0 }} />
              : <Lock  style={{ width: 14, height: 14, color: 'var(--text-muted)',    flexShrink: 0 }} />
            }
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.name}
            </span>
          </>
        ) : (
          <span style={{ flex: 1 }}>Selecciona un workspace…</span>
        )}
        <ChevronDown style={{
          width: 14, height: 14, flexShrink: 0, color: 'var(--text-muted)',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s',
        }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--grove-surface)', border: '1px solid var(--grove-border)',
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          animation: 'slideUp 0.15s ease both',
        }}>
          {/* Workspace list */}
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {workspaces.length === 0 ? (
              <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
                No tienes workspaces todavía
              </div>
            ) : (
              workspaces.map(ws => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => { onChange(ws.id); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: ws.id === value ? 'rgba(124,58,237,0.10)' : 'transparent',
                    color: ws.id === value ? 'var(--grove-accent)' : 'var(--text-primary)',
                    fontSize: 13.5, transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (ws.id !== value) e.currentTarget.style.background = 'var(--hover-bg)'; }}
                  onMouseLeave={e => { if (ws.id !== value) e.currentTarget.style.background = 'transparent'; }}
                >
                  {ws.isPublic
                    ? <Globe style={{ width: 13, height: 13, flexShrink: 0, color: 'var(--grove-accent)' }} />
                    : <Lock  style={{ width: 13, height: 13, flexShrink: 0, color: 'var(--text-muted)'   }} />
                  }
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ws.name}
                  </span>
                  {ws.isPublic && (
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0 }}>Público</span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--grove-border)' }} />

          {/* Create new workspace */}
          <div style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Crear workspace
            </div>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
              placeholder="Nombre del workspace…"
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 7, fontSize: 13.5,
                background: 'var(--grove-surface2)', border: '1px solid var(--grove-border)',
                color: 'var(--text-primary)', outline: 'none', marginBottom: 8,
                fontFamily: 'inherit',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--grove-accent)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'var(--grove-border)')}
              autoFocus
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Public toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <div
                  onClick={() => setIsPublic(p => !p)}
                  style={{
                    width: 32, height: 18, borderRadius: 99, cursor: 'pointer', transition: 'background 0.2s',
                    background: isPublic ? 'var(--grove-accent)' : 'var(--grove-border)',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    left: isPublic ? 16 : 2,
                  }} />
                </div>
                <span style={{ color: 'var(--text-secondary)', userSelect: 'none' }}>
                  {isPublic ? 'Público' : 'Privado'}
                </span>
              </label>

              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: newName.trim() ? 'var(--grove-accent)' : 'var(--grove-border)',
                  color: newName.trim() ? '#fff' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                  opacity: creating ? 0.6 : 1,
                  fontFamily: 'inherit',
                }}
              >
                <FolderPlus style={{ width: 13, height: 13 }} />
                {creating ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function ConceptsPage() {
  const navigate = useNavigate();
  const { page, size, setPage, setSize } = usePagination(20);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConceptResponse | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useFetch<PageResponse<ConceptResponse>>(
    (signal) => debouncedSearch.trim()
      ? searchConcepts(debouncedSearch, page, size, signal)
      : getConcepts(page, size, 'title,asc', signal),
    [page, size, debouncedSearch]
  );

  const form = useForm<ConceptForm>({ resolver: zodResolver(conceptSchema) });

  const handleCreate = async (formData: ConceptForm) => {
    if (!selectedWorkspaceId) {
      toast.error('Selecciona un workspace primero');
      return;
    }
    setCreating(true);
    try {
      await createConcept({ ...formData, workspaceId: selectedWorkspaceId });
      toast.success('Concepto creado');
      setShowCreate(false);
      form.reset();
      refetch();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'No se pudo crear el concepto'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConcept(deleteTarget.id);
      toast.success('Eliminado');
      setDeleteTarget(null);
      refetch();
    } catch { toast.error('No se pudo eliminar'); }
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
            placeholder="Buscar conceptos, tags, contenido…"
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '60%', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Archive style={{ width: 22, height: 22, color: 'var(--grove-accent)', opacity: 0.7 }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {search ? 'Sin resultados' : 'Sin conceptos todavía'}
              </p>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
                {search
                  ? `No se encontró nada para "${search}"`
                  : 'Crea tu primer concepto para comenzar.'}
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
              <button onClick={() => { setShowCreate(false); form.reset(); }} className="grove-btn-secondary">
                Cancelar
              </button>
              <button
                onClick={form.handleSubmit(handleCreate)}
                disabled={creating || !selectedWorkspaceId}
                className="grove-btn-primary"
                style={{ opacity: (creating || !selectedWorkspaceId) ? 0.55 : 1 }}
              >
                {creating ? 'Creando…' : 'Crear'}
              </button>
            </>
          }
        >
          <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Workspace selector */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500,
                color: 'var(--text-secondary)', marginBottom: 6 }}>
                Workspace
              </label>
              <WorkspaceSelector
                value={selectedWorkspaceId}
                onChange={setSelectedWorkspaceId}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500,
                color: 'var(--text-secondary)', marginBottom: 6 }}>
                Título
              </label>
              <input {...form.register('title')} placeholder="Nombre del concepto" className="grove-input" />
              {form.formState.errors.title && (
                <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500,
                color: 'var(--text-secondary)', marginBottom: 6 }}>
                Contenido
              </label>
              <textarea
                {...form.register('content')}
                placeholder="Describe este concepto…"
                rows={5}
                className="grove-input"
                style={{ resize: 'none' }}
              />
              {form.formState.errors.content && (
                <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                  {form.formState.errors.content.message}
                </p>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal
          title="Eliminar concepto"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button onClick={() => setDeleteTarget(null)} className="grove-btn-secondary">Cancelar</button>
              <button onClick={handleDelete} style={{
                padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)',
                background: 'rgba(239,68,68,0.08)', color: '#f87171',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                Eliminar
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            ¿Estás seguro de que quieres eliminar{' '}
            <strong style={{ color: 'var(--text-primary)' }}>"{deleteTarget.title}"</strong>?
            Esta acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  );
}

// ── Concept Card ───────────────────────────────────────────────────
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
        display: 'flex', flexDirection: 'column', gap: 10,
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.12s',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
        transform: hovered ? 'translateY(-1px)' : 'none',
        position: 'relative',
      }}
      onClick={onOpen}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{
          flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.4,
          color: hovered ? 'var(--grove-accent)' : 'var(--text-primary)',
          transition: 'color 0.12s',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {concept.title}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            padding: 5, borderRadius: 6, border: 'none', background: 'transparent',
            cursor: 'pointer', flexShrink: 0, opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s', color: 'var(--text-muted)',
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

      <p style={{
        fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, flex: 1,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
      }}>
        {concept.content}
      </p>

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
