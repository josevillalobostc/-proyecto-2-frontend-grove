interface SpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Spinner({ fullScreen, size = 'md' }: SpinnerProps) {
  const dim = { sm: 20, md: 32, lg: 44 }[size];
  const thickness = { sm: 2, md: 3, lg: 3 }[size];

  const spinner = (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        border: `${thickness}px solid rgba(124,58,237,0.18)`,
        borderTopColor: 'var(--grove-accent)',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--grove-dark)',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {spinner}
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px 0' }}>
      {spinner}
    </div>
  );
}
