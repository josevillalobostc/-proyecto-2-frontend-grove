import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 12, padding: '48px 24px', textAlign: 'center',
      animation: 'fadeIn 0.2s ease both',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AlertTriangle style={{ width: 20, height: 20, color: '#f87171' }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 320, lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.22)',
            color: 'var(--grove-accent)', fontSize: 13.5, fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
        >
          <RefreshCw style={{ width: 13, height: 13 }} />
          Try again
        </button>
      )}
    </div>
  );
}
