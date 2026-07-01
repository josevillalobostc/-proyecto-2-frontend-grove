import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import {
  Network, BookOpen, Route, LogOut, Layers,
  Archive, Plus, GitBranch, Sparkles, Sun, Moon, HelpCircle,
} from 'lucide-react';
import { getConcepts } from '../api';
import type { ConceptResponse } from '../types';
import { useTheme } from '../hooks/useTheme';

const NAV = [
  { to: '/graph',         icon: Network,   label: 'Knowledge Graph' },
  { to: '/clusters',      icon: GitBranch, label: 'Study Branches'  },
  { to: '/learning-path', icon: Route,     label: 'Learning Paths'  },
  { to: '/flashcards',    icon: BookOpen,  label: 'Flashcards'      },
  { to: '/concepts',      icon: Archive,   label: 'Archives'        },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [recentConcepts, setRecentConcepts] = useState<ConceptResponse[]>([]);

  useEffect(() => {
    getConcepts(0, 5, 'title,asc')
      .then((data) => setRecentConcepts(data.content))
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const userInitial = user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--grove-dark)', overflow: 'hidden' }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--grove-surface)',
        borderRight: '1px solid var(--grove-border)',
        overflow: 'hidden',
      }}>

        {/* Logo */}
        <div style={{ padding: '18px 14px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #7C3AED 0%, #9D5FFF 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
          }}>
            <Sparkles style={{ width: 14, height: 14, color: '#fff' }} />
          </div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>
            Grove
          </span>
          <button
            onClick={toggle}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            style={{
              marginLeft: 'auto', width: 26, height: 26, borderRadius: 6,
              background: 'var(--hover-bg)', border: '1px solid var(--grove-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--grove-accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            {theme === 'light'
              ? <Moon style={{ width: 12, height: 12 }} />
              : <Sun  style={{ width: 12, height: 12 }} />}
          </button>
        </div>

        {/* New Note CTA */}
        <div style={{ padding: '0 10px 10px' }}>
          <button
            onClick={() => navigate('/concepts')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--hover-bg)', border: '1px solid var(--grove-border)',
              color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(124,58,237,0.12)';
              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)';
              e.currentTarget.style.color = 'var(--grove-accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--hover-bg)';
              e.currentTarget.style.borderColor = 'var(--grove-border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            New note
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '0 6px', flex: 'none' }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '7px 10px', borderRadius: 7, margin: '1px 0',
                fontSize: 13.5, fontWeight: isActive ? 600 : 450,
                textDecoration: 'none',
                color: isActive ? 'var(--grove-accent)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(124,58,237,0.10)' : 'transparent',
                transition: 'all 0.12s',
              })}
              onMouseEnter={e => {
                const a = e.currentTarget as HTMLAnchorElement;
                if (!a.classList.contains('active')) {
                  a.style.background = 'var(--hover-bg)';
                  a.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                const a = e.currentTarget as HTMLAnchorElement;
                if (!a.getAttribute('aria-current')) {
                  a.style.background = '';
                  a.style.color = '';
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon style={{
                    width: 15, height: 15, flexShrink: 0,
                    color: isActive ? 'var(--grove-accent)' : 'var(--text-muted)',
                  }} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--grove-border)', margin: '10px 14px' }} />

        {/* Recent notes */}
        <div style={{ flex: 1, padding: '0 10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em',
            color: 'var(--text-muted)', marginBottom: 4, padding: '0 4px',
            textTransform: 'uppercase',
          }}>
            Recent
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {recentConcepts.length === 0 ? (
              <div style={{ padding: '6px 4px', fontSize: 12.5, color: 'var(--text-muted)' }}>
                No notes yet
              </div>
            ) : (
              recentConcepts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/concepts/${c.id}`)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '5px 8px',
                    borderRadius: 6, background: 'transparent', border: 'none',
                    cursor: 'pointer', display: 'block', marginBottom: 1,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    fontSize: 13, color: 'var(--text-secondary)', fontWeight: 450,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                    {c.connectionCount} connections
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--grove-border)', padding: '8px 6px' }}>
          {/* User info */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', marginBottom: 2 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--grove-accent)',
              }}>
                {userInitial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user.username}
                </div>
                <div style={{
                  fontSize: 11, color: 'var(--text-muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user.email || user.role?.replace('ROLE_', '') || 'Member'}
                </div>
              </div>
            </div>
          )}

          {/* Footer nav */}
          {[
            { icon: HelpCircle, label: 'Help', onClick: () => {} },
            { icon: LogOut, label: 'Sign out', onClick: handleLogout, danger: true },
          ].map(({ icon: Icon, label, onClick, danger }) => (
            <button
              key={label}
              onClick={onClick}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '7px 8px', borderRadius: 7, cursor: 'pointer',
                background: 'transparent', border: 'none',
                fontSize: 13, fontWeight: 450,
                color: danger ? '#f87171' : 'var(--text-muted)',
                transition: 'all 0.12s', textAlign: 'left',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'var(--hover-bg)';
                e.currentTarget.style.color = danger ? '#f87171' : 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = danger ? '#f87171' : 'var(--text-muted)';
              }}
            >
              <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
