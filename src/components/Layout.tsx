import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import {
  Network, BookOpen, Route, LogOut, Layers,
  Archive, HelpCircle, Plus, GitBranch, Sparkles,
  Sun, Moon,
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
    getConcepts(0, 3, 'title,asc')
      .then((data) => setRecentConcepts(data.content))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-grove-dark overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="w-64 flex flex-col shrink-0"
        style={{
          background: 'var(--grove-surface)',
          borderRight: '1px solid var(--grove-border)',
        }}
      >
        {/* Logo + theme toggle */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #9D5FFF)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#fff' }} />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Grove</span>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="ml-auto p-2 rounded-xl transition-all"
            style={{
              background: 'var(--hover-bg)',
              border: '1px solid var(--grove-border)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--grove-green)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
          >
            {theme === 'light'
              ? <Moon className="w-3.5 h-3.5" />
              : <Sun  className="w-3.5 h-3.5" />
            }
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-grove-green/15 text-grove-green border border-grove-green/20'
                    : 'text-gray-400 hover:text-white hover:bg-grove-border'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-grove-green' : ''}`} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Recent Notes */}
        <div className="flex-1 px-4 pt-5 overflow-hidden flex flex-col min-h-0">
          <div
            className="text-xs font-semibold tracking-widest mb-3"
            style={{ color: 'rgba(124,58,237,0.55)' }}
          >
            RECENT NOTES
          </div>
          <div className="space-y-0.5 overflow-y-auto">
            {recentConcepts.map((concept) => (
              <button
                key={concept.id}
                onClick={() => navigate(`/concepts/${concept.id}`)}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-grove-border transition-colors group"
              >
                <div className="text-sm text-gray-300 group-hover:text-white transition-colors truncate font-medium">
                  {concept.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {concept.connectionCount} connections
                </div>
              </button>
            ))}
            {recentConcepts.length === 0 && (
              <p className="text-xs text-gray-500 px-2">No notes yet</p>
            )}
          </div>
        </div>

        {/* New Atomic Note CTA */}
        <div className="px-4 pb-4 pt-3">
          <button
            onClick={() => navigate('/concepts')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #9D5FFF)',
              boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
              color: '#ffffff',
            }}
          >
            <Plus className="w-4 h-4" />
            New Atomic Note
          </button>
        </div>

        {/* Footer */}
        <div
          className="px-3 py-3 space-y-0.5"
          style={{ borderTop: '1px solid var(--grove-border)' }}
        >
          {user && (
            <div className="px-3 py-2 mb-1">
              <div className="text-sm text-white font-medium truncate">{user.username}</div>
              <div className="text-xs text-gray-500 truncate">{user.email || 'Member'}</div>
            </div>
          )}
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-grove-green transition-colors">
            <HelpCircle className="w-4 h-4 shrink-0" />
            Help
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
