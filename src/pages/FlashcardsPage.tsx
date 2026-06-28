import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RotateCcw, ArrowLeft, Timer, BookOpen, Check, Zap, Rocket, ExternalLink } from 'lucide-react';
import { getStudySession, getSessionByConcept, reviewFlashcard } from '../api';
import type { StudySessionResponse, FlashcardStudyResponse } from '../types';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import toast from 'react-hot-toast';

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

interface RatingButtonProps {
  rating: 1 | 2 | 3 | 4;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  onClick: () => void;
  disabled: boolean;
  enabled: boolean;
}

function RatingButton({ label, sublabel, icon, color, bgColor, borderColor, onClick, disabled, enabled }: RatingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || !enabled}
      style={{
        borderColor: enabled ? borderColor : 'var(--grove-border)',
        background: enabled ? bgColor : 'transparent',
      }}
      className={`flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        enabled ? 'hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-30'
      }`}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
        style={{ background: enabled ? bgColor : 'rgba(255,255,255,0.04)', color: enabled ? color : '#6B7280' }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{sublabel}</div>
      </div>
    </button>
  );
}

export default function FlashcardsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const conceptId = params.get('conceptId');
  const timer = useTimer();

  const [session, setSession] = useState<StudySessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = conceptId
        ? await getSessionByConcept(conceptId)
        : await getStudySession();
      setSession(data);
      setCurrentIndex(0);
      setReviewed(0);
      setFlipped(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load session';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [conceptId]);

  useEffect(() => { loadSession(); }, [loadSession]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); if (!flipped) setFlipped(true); }
      if (!flipped) return;
      if (e.key === '1') handleRating(1);
      if (e.key === '2') handleRating(2);
      if (e.key === '3') handleRating(3);
      if (e.key === '4') handleRating(4);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipped]);

  const currentCard: FlashcardStudyResponse | undefined = session?.flashcards[currentIndex];
  const isFinished = session && currentIndex >= session.flashcards.length;
  const progress = session ? (reviewed / session.total) * 100 : 0;
  const phase = (currentCard?.reviewCount ?? 0) > 0 ? 'REVIEW PHASE' : 'LEARNING PHASE';

  const handleRating = async (rating: 1 | 2 | 3 | 4) => {
    if (!currentCard || ratingLoading || !flipped) return;
    setRatingLoading(true);
    try {
      await reviewFlashcard({ flashcardId: currentCard.id, rating });
      setReviewed((r) => r + 1);
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) return <Spinner fullScreen />;
  if (error) return (
    <div className="flex items-center justify-center h-full">
      <ErrorMessage message={error} onRetry={loadSession} />
    </div>
  );

  if (!session || session.total === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
      >
        <BookOpen className="w-10 h-10 text-grove-green" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">No cards due</h2>
        <p className="text-gray-400 text-sm">Great job! Check back later for your next session.</p>
      </div>
      <button onClick={() => navigate('/graph')} className="grove-btn-primary">
        Back to Graph
      </button>
    </div>
  );

  if (isFinished) return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse-glow"
        style={{ background: 'rgba(124,58,237,0.15)', border: '2px solid var(--grove-green)' }}
      >
        <Check className="w-10 h-10 text-grove-green" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
        <p className="text-gray-400">
          Reviewed <span className="text-grove-green font-semibold">{reviewed}</span> cards in {timer}
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={loadSession} className="grove-btn-secondary flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          New Session
        </button>
        <button onClick={() => navigate('/graph')} className="grove-btn-primary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Graph
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-grove-dark">
      {/* Session header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500 font-semibold tracking-widest mb-1">SESSION PROGRESS</div>
            <div className="text-2xl font-bold text-white">
              {reviewed}<span className="text-gray-500">/{session.total}</span>
              <span className="text-sm font-normal text-gray-400 ml-2">reviewed</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(124,58,237,0.2)',
                color: '#9D5FFF',
                border: '1px solid rgba(124,58,237,0.35)',
              }}
            >
              {phase}
            </span>
            <div
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full"
              style={{ background: 'var(--grove-surface)', border: '1px solid var(--grove-border)' }}
            >
              <Timer className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-mono text-white font-medium">{timer}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--grove-border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #7C3AED, #9D5FFF)',
            }}
          />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        <div className="w-full max-w-2xl">
          {/* Card */}
          <div
            className="card-flip-container w-full mb-6"
            onClick={() => !flipped && setFlipped(true)}
            style={{ cursor: flipped ? 'default' : 'pointer' }}
          >
            <div className={`card-inner w-full ${flipped ? 'flipped' : ''}`}>

              {/* Front face */}
              <div
                className="card-face w-full rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--grove-surface)',
                  border: '1px solid var(--grove-border)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: '1px solid var(--grove-border)' }}
                >
                  <div className="flex items-center gap-2">
                    {currentCard?.conceptTag && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(124,58,237,0.15)',
                          color: '#A78BFA',
                          border: '1px solid rgba(124,58,237,0.25)',
                        }}
                      >
                        {currentCard.conceptTag.toUpperCase()}
                      </span>
                    )}
                    <span className="text-sm text-gray-400 font-medium">{currentCard?.conceptTitle}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/concepts/${currentCard?.id}`); }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-grove-green transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Note
                  </button>
                </div>

                {/* Question */}
                <div className="px-8 py-10 flex flex-col items-center justify-center min-h-64">
                  <p className="text-white text-2xl font-semibold text-center leading-relaxed">
                    {currentCard?.front}
                  </p>
                  {currentCard?.hint && (
                    <div
                      className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                      style={{
                        background: 'rgba(124,58,237,0.1)',
                        border: '1px solid rgba(124,58,237,0.2)',
                        color: '#A78BFA',
                      }}
                    >
                      <span className="text-xs">◈</span>
                      CONCEPT: {currentCard.hint.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Click hint */}
                <div className="px-5 py-3 text-center" style={{ borderTop: '1px solid var(--grove-border)' }}>
                  <span className="text-xs text-gray-600">Click or press Space to reveal answer</span>
                </div>
              </div>

              {/* Back face */}
              <div
                className="card-face card-back w-full rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--grove-surface)',
                  border: '1px solid rgba(124,58,237,0.35)',
                  boxShadow: '0 20px 60px rgba(124,58,237,0.15)',
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: '1px solid rgba(124,58,237,0.2)' }}
                >
                  <div className="flex items-center gap-2">
                    {currentCard?.conceptTag && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(124,58,237,0.2)',
                          color: '#A78BFA',
                          border: '1px solid rgba(124,58,237,0.35)',
                        }}
                      >
                        {currentCard.conceptTag.toUpperCase()}
                      </span>
                    )}
                    <span className="text-sm text-gray-400 font-medium">{currentCard?.conceptTitle}</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ color: '#9D5FFF', background: 'rgba(124,58,237,0.15)' }}
                  >
                    ANSWER
                  </span>
                </div>

                {/* Answer */}
                <div className="px-8 py-10 flex flex-col items-center justify-center min-h-64">
                  <p className="text-white text-xl text-center leading-relaxed">{currentCard?.back}</p>
                </div>

                <div className="px-5 py-3 text-center" style={{ borderTop: '1px solid rgba(124,58,237,0.2)' }}>
                  <span className="text-xs text-gray-500">Use keys 1–4 or click a rating below</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rating buttons */}
          <div className="grid grid-cols-4 gap-3">
            <RatingButton
              rating={1}
              label="Again"
              sublabel="< 1 min"
              icon={<RotateCcw className="w-5 h-5" />}
              color="#f87171"
              bgColor="rgba(239,68,68,0.12)"
              borderColor="rgba(239,68,68,0.3)"
              onClick={() => handleRating(1)}
              disabled={ratingLoading}
              enabled={flipped}
            />
            <RatingButton
              rating={2}
              label="Hard"
              sublabel="< 10 min"
              icon={<Zap className="w-5 h-5" />}
              color="#fb923c"
              bgColor="rgba(249,115,22,0.12)"
              borderColor="rgba(249,115,22,0.3)"
              onClick={() => handleRating(2)}
              disabled={ratingLoading}
              enabled={flipped}
            />
            <RatingButton
              rating={3}
              label="Good"
              sublabel="1–4 days"
              icon={<Check className="w-5 h-5" />}
              color="#9D5FFF"
              bgColor="rgba(124,58,237,0.15)"
              borderColor="rgba(124,58,237,0.4)"
              onClick={() => handleRating(3)}
              disabled={ratingLoading}
              enabled={flipped}
            />
            <RatingButton
              rating={4}
              label="Easy"
              sublabel="> 1 week"
              icon={<Rocket className="w-5 h-5" />}
              color="#4ade80"
              bgColor="rgba(74,222,128,0.12)"
              borderColor="rgba(74,222,128,0.3)"
              onClick={() => handleRating(4)}
              disabled={ratingLoading}
              enabled={flipped}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
