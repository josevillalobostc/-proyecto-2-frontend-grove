import { useState, useEffect } from 'react';
import { X, BookOpen, GitBranch, ChevronUp, ChevronDown, Maximize2 } from 'lucide-react';
import { getConceptDetail, getRelatedConcepts, setConfidenceLevel } from '../../api';
import type { ConceptDetailResponse, ConceptResponse } from '../../types';
import { TagBadge } from '../ui/Badge';
import Spinner from '../ui/Spinner';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Props {
  conceptId: string;
  onClose: () => void;
}

const CONFIDENCE_OPTIONS = [
  { label: 'Not Started', value: 0 },
  { label: 'Learning',    value: 25 },
  { label: 'Reviewing',   value: 50 },
  { label: 'High',        value: 85 },
  { label: 'Mastered',    value: 100 },
];

function getMasteryBadge(level: number | null) {
  if (level === null || level === 0) return { label: 'NOT STARTED', bg: 'rgba(107,114,128,0.2)', color: '#9CA3AF', border: 'rgba(107,114,128,0.3)' };
  if (level < 30)  return { label: 'BEGINNER',    bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' };
  if (level < 60)  return { label: 'LEARNING',    bg: 'rgba(249,115,22,0.15)',  color: '#fb923c', border: 'rgba(249,115,22,0.3)' };
  if (level < 85)  return { label: 'REVIEWING',   bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' };
  if (level < 100) return { label: 'HIGH',        bg: 'rgba(124,58,237,0.2)',   color: '#9D5FFF', border: 'rgba(124,58,237,0.4)' };
  return              { label: 'MASTERED',     bg: 'rgba(20,184,166,0.2)',   color: '#2dd4bf', border: 'rgba(20,184,166,0.4)' };
}

export default function NodeDetailPanel({ conceptId, onClose }: Props) {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ConceptDetailResponse | null>(null);
  const [related, setRelated] = useState<ConceptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [confidenceLoading, setConfidenceLoading] = useState(false);
  const [localConfidence, setLocalConfidence] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getConceptDetail(conceptId), getRelatedConcepts(conceptId)])
      .then(([d, r]) => { setDetail(d); setRelated(r.slice(0, 6)); setLocalConfidence(d.confidenceLevel); })
      .catch(() => toast.error('Failed to load concept details'))
      .finally(() => setLoading(false));
  }, [conceptId]);

  const handleSetConfidenceApi = async (level: number) => {
    setConfidenceLoading(true);
    try {
      const updated = await setConfidenceLevel(conceptId, level);
      setDetail(updated);
      toast.success('Confidence updated');
    } catch {
      toast.error('Failed to update confidence');
      setLocalConfidence(detail?.confidenceLevel ?? 0);
    } finally {
      setConfidenceLoading(false);
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

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Spinner size="md" />
    </div>
  );
  if (!detail) return null;

  const badge = getMasteryBadge(detail.confidenceLevel);
  const retention = detail.confidenceLevel ?? 0;

  return (
    <div className="flex flex-col h-full overflow-hidden animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-grove-border">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full tracking-wider"
            style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
          >
            {badge.label}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/concepts/${conceptId}`)}
              className="p-1.5 rounded-lg hover:bg-grove-border transition-colors"
              title="Open full page"
            >
              <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-grove-border transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
        <h2 className="text-white font-bold text-lg leading-tight">{detail.title}</h2>
        <p className="text-gray-400 text-sm mt-1.5 leading-relaxed line-clamp-3">{detail.content}</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <div className="text-3xl font-bold text-grove-green mb-0.5">{detail.connectionCount}</div>
            <div className="text-gray-500 text-xs font-semibold tracking-wider">CONNECTIONS</div>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <div className="text-3xl font-bold text-grove-green mb-0.5">{retention}%</div>
            <div className="text-gray-500 text-xs font-semibold tracking-wider">RETENTION</div>
          </div>
        </div>

        {/* Tags */}
        {(detail.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(detail.tags ?? []).map((t) => (
              <TagBadge key={t.id} name={t.name} color={t.color} />
            ))}
          </div>
        )}

        {/* Related Branches */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 tracking-wider mb-2.5">
              <GitBranch className="w-3 h-3" />
              RELATED BRANCHES
            </div>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/concepts/${r.id}`)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all hover:border-grove-green/40 hover:text-white"
                  style={{
                    background: 'var(--grove-dark)',
                    border: '1px solid var(--grove-border)',
                    color: '#9CA3AF',
                  }}
                >
                  {r.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {(detail.prerequisiteTitles ?? []).length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 tracking-wider mb-2">PREREQUISITES</div>
            <div className="space-y-1.5">
              {(detail.prerequisiteTitles ?? []).map((title, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: 'var(--grove-green)' }}
                  />
                  {title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence level picker */}
        <div>
          <div className="text-xs font-semibold text-gray-500 tracking-wider mb-2">CONFIDENCE LEVEL</div>
          <div className="flex items-center gap-2 mb-3">
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
            disabled={confidenceLoading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Footer — Review Node CTA */}
      <div className="p-4 border-t border-grove-border">
        <button
          onClick={() => navigate(`/flashcards?conceptId=${conceptId}`)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'transparent',
            border: '1px solid rgba(124,58,237,0.5)',
            color: '#A78BFA',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <BookOpen className="w-4 h-4" />
          Review Node
        </button>
      </div>
    </div>
  );
}
