import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  maxWidth?: number;
}

export default function Modal({ title, children, onClose, footer, maxWidth = 480 }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeIn 0.15s ease both',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(7, 5, 18, 0.72)',
          backdropFilter: 'blur(6px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--grove-surface)',
        border: '1px solid var(--grove-border)',
        borderRadius: 12,
        width: '100%', maxWidth,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.18s ease both',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--grove-border)',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--hover-bg)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px' }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--grove-border)',
            display: 'flex', justifyContent: 'flex-end', gap: 8,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
