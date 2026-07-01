import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Plus, BookOpen, GitBranch } from 'lucide-react';
import {
  getConceptDetail, getRelatedConcepts, getFlashcardsForConcept, getAllPrerequisites,
  updateConcept, addFlashcardToConcept, setConfidenceLevel, getRootComments, createComment, deleteComment,
} from '../api';
import type { ConceptDetailResponse, ConceptResponse, FlashcardResponse, CommentResponse, PageResponse } from '../types';
import { getConfidenceBadge } from '../types';
import { useFetch } from '../hooks/useFetch';
import { ConfidenceLevelBadge, TagBadge } from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const flashcardSchema = z.object({
  front: z.string().min(1, 'Question is required'),
  back: z.string().min(1, 'Answer is required'),
  hint: z.string().optional(),
  difficulty: z.coerce.number().min(1).max(5),
});

type FlashcardForm = z.infer<typeof flashcardSchema>;

export default function ConceptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: detail, loading, error, refetch } = useFetch<ConceptDetailResponse>(
    () => getConceptDetail(id!), [id]
  );
  
  const [localConfidence, setLocalConfidence] = useState<number | null>(null);

  useEffect(() => {
    if (detail) setLocalConfidence(detail.confidenceLevel);
  }, [detail]);

  const { data: related } = useFetch<ConceptResponse[]>(() => getRelatedConcepts(id!), [id]);
  const { data: prerequisites } = useFetch<ConceptResponse[]>(() => getAllPrerequisites(id!), [id]);
  const { data: flashcards, refetch: refetchFlashcards } = useFetch<FlashcardResponse[]>(() => getFlashcardsForConcept(id!), [id]);
  const { data: commentsPage, refetch: refetchComments } = useFetch<PageResponse<CommentResponse>>(() => getRootComments(id!), [id]);
  const comments = commentsPage?.content;

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [showAddFlashcard, setShowAddFlashcard] = useState(false);
  const [addingFlashcard, setAddingFlashcard] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const flashcardForm = useForm<FlashcardForm>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: { difficulty: 2 },
  });

  const handleEdit = () => {
    if (!detail) return;
    setEditTitle(detail.title);
    setEditContent(detail.content);
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      await updateConcept(id!, { title: editTitle, content: editContent });
      toast.success('Concept updated');
      setEditing(false);
      refetch();
    } catch {
      toast.error('Failed to update concept');
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddFlashcard = async (data: FlashcardForm) => {
    setAddingFlashcard(true);
    try {
      await addFlashcardToConcept(id!, data);
      toast.success('Flashcard added!');
      setShowAddFlashcard(false);
      flashcardForm.reset({ difficulty: 2 });
      refetchFlashcards();
    } catch {
      toast.error('Failed to add flashcard');
    } finally {
      setAddingFlashcard(false);
    }
  };

  const handleSetConfidenceApi = async (level: number) => {
    try {
      await setConfidenceLevel(id!, level);
      toast.success('Confidence updated');
    } catch {
      toast.error('Failed to update confidence');
      setLocalConfidence(detail?.confidenceLevel ?? 0);
    }
  };

  const handleConfidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalConfidence(Number(e.target.value));
  };

  const handleConfidenceCommit = () => {
    if (localConfidence !== null && localConfidence !== detail?.confidenceLevel) {
      handleSetConfidenceApi(localConfidence);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      await createComment({ content: commentText, conceptId: id! });
      setCommentText('');
      refetchComments();
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      refetchComments();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  if (loading) return <Spinner fullScreen />;
  if (error || !detail) return (
    <div className="flex items-center justify-center h-full">
      <ErrorMessage message={error || 'Concept not found'} onRetry={refetch} />
    </div>
  );

  const badge = getConfidenceBadge(detail.confidenceLevel);

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & header */}
          <div className="bg-grove-surface border border-grove-border rounded-xl p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                {!editing ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <ConfidenceLevelBadge badge={badge} />
                      {(detail.tags ?? []).map((t) => (
                        <TagBadge key={t.id} name={t.name} color={t.color} />
                      ))}
                    </div>
                    <h1 className="text-2xl font-bold text-white">{detail.title}</h1>
                  </>
                ) : (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="grove-input w-full text-xl font-bold mb-2"
                  />
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {editing ? (
                  <>
                    <button onClick={() => setEditing(false)} className="p-2 rounded hover:bg-grove-border transition-colors">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={editSaving}
                      className="p-2 rounded bg-grove-green/10 border border-grove-green/30 hover:bg-grove-green/20 transition-colors"
                    >
                      <Save className="w-4 h-4 text-grove-green" />
                    </button>
                  </>
                ) : (
                  <button onClick={handleEdit} className="p-2 rounded hover:bg-grove-border transition-colors">
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {!editing ? (
              <p className="text-gray-300 leading-relaxed">{detail.content}</p>
            ) : (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="grove-input w-full resize-none"
              />
            )}
          </div>

          {/* Flashcards */}
          <div className="bg-grove-surface border border-grove-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-grove-green" />
                <h2 className="text-white font-semibold">Flashcards</h2>
                <span className="text-xs text-gray-500 bg-grove-dark px-2 py-0.5 rounded-full border border-grove-border">
                  {flashcards?.length || 0}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/flashcards?conceptId=${id}`)}
                  className="grove-btn-secondary text-xs flex items-center gap-1.5 py-1.5"
                >
                  <BookOpen className="w-3 h-3" />
                  Study
                </button>
                <button
                  onClick={() => setShowAddFlashcard(true)}
                  className="grove-btn-primary text-xs flex items-center gap-1.5 py-1.5"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
            </div>
            {flashcards?.length === 0 ? (
              <p className="text-gray-400 text-sm">No flashcards yet. Add some to start studying!</p>
            ) : (
              <div className="space-y-2">
                {flashcards?.slice(0, 3).map((fc) => (
                  <div key={fc.id} className="bg-grove-dark rounded-lg p-3 border border-grove-border">
                    <p className="text-white text-sm font-medium">{fc.front}</p>
                    <p className="text-gray-400 text-xs mt-1">{fc.back}</p>
                  </div>
                ))}
                {(flashcards?.length || 0) > 3 && (
                  <p className="text-gray-400 text-xs text-center">+{(flashcards?.length || 0) - 3} more flashcards</p>
                )}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-grove-surface border border-grove-border rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Comments</h2>
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-grove-green/20 border border-grove-green/30 flex items-center justify-center text-xs text-grove-green font-bold shrink-0">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="grove-input w-full resize-none text-sm"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || commentLoading}
                  className="mt-2 grove-btn-primary text-xs py-1.5 disabled:opacity-50"
                >
                  {commentLoading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-grove-border flex items-center justify-center text-xs text-gray-400 font-bold shrink-0">
                    {comment.authorUsername?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 bg-grove-dark rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-300">{comment.authorUsername}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        {comment.authorId === user?.id && (
                          <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-gray-600 hover:text-red-400 ml-1">×</button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
              {comments?.length === 0 && (
                <p className="text-gray-400 text-sm">No comments yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-grove-surface border border-grove-border rounded-xl p-4">
            <h3 className="text-gray-400 text-xs font-semibold mb-3">STATS</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-grove-green">{detail.connectionCount}</div>
                <div className="text-xs text-gray-400">Connections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-grove-green">{(detail.prerequisiteIds ?? []).length}</div>
                <div className="text-xs text-gray-400">Prerequisites</div>
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-grove-surface border border-grove-border rounded-xl p-4">
            <h3 className="text-gray-400 text-xs font-semibold mb-3">CONFIDENCE LEVEL</h3>
            <div className="flex items-center gap-2 mb-3">
              <ConfidenceLevelBadge badge={badge} />
              {localConfidence !== null && (
                <span className="text-gray-400 text-sm">{localConfidence}%</span>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={localConfidence ?? 0}
              onChange={handleConfidenceChange}
              onMouseUp={handleConfidenceCommit}
              onTouchEnd={handleConfidenceCommit}
              className="w-full accent-grove-green"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>

          {/* Prerequisites */}
          {prerequisites && prerequisites.length > 0 && (
            <div className="bg-grove-surface border border-grove-border rounded-xl p-4">
              <h3 className="text-gray-400 text-xs font-semibold mb-3">PREREQUISITES</h3>
              <div className="space-y-2">
                {prerequisites.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/concepts/${p.id}`)}
                    className="w-full text-left flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    <span className="text-xs text-gray-600 w-4 shrink-0">{i + 1}</span>
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Related */}
          {related && related.length > 0 && (
            <div className="bg-grove-surface border border-grove-border rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold mb-3">
                <GitBranch className="w-3 h-3" />
                RELATED BRANCHES
              </div>
              <div className="flex flex-wrap gap-2">
                {related.slice(0, 8).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/concepts/${r.id}`)}
                    className="text-xs px-2 py-1 bg-grove-dark border border-grove-border rounded-full text-gray-300 hover:text-white hover:border-grove-green/40 transition-colors"
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={() => navigate(`/flashcards?conceptId=${id}`)}
            className="w-full grove-btn-primary flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Review Node
          </button>
        </div>
      </div>

      {/* Add Flashcard Modal */}
      {showAddFlashcard && (
        <Modal
          title="Add Flashcard"
          onClose={() => { setShowAddFlashcard(false); flashcardForm.reset({ difficulty: 2 }); }}
          footer={
            <>
              <button onClick={() => { setShowAddFlashcard(false); flashcardForm.reset({ difficulty: 2 }); }} className="grove-btn-secondary">Cancel</button>
              <button
                onClick={flashcardForm.handleSubmit(handleAddFlashcard)}
                disabled={addingFlashcard}
                className="grove-btn-primary disabled:opacity-50"
              >
                {addingFlashcard ? 'Adding...' : 'Add Flashcard'}
              </button>
            </>
          }
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Question (Front)</label>
              <textarea {...flashcardForm.register('front')} rows={3} className="grove-input w-full resize-none" placeholder="What is...?" />
              {flashcardForm.formState.errors.front && (
                <p className="text-red-400 text-xs mt-1">{flashcardForm.formState.errors.front.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Answer (Back)</label>
              <textarea {...flashcardForm.register('back')} rows={3} className="grove-input w-full resize-none" placeholder="It is..." />
              {flashcardForm.formState.errors.back && (
                <p className="text-red-400 text-xs mt-1">{flashcardForm.formState.errors.back.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Hint (optional)</label>
              <input {...flashcardForm.register('hint')} className="grove-input w-full" placeholder="Think about..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Difficulty (1–5)</label>
              <input {...flashcardForm.register('difficulty')} type="number" min={1} max={5} className="grove-input w-24" />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
