import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Network, BookOpen, GitBranch } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'At least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const FEATURES = [
  {
    icon: Network,
    title: 'Knowledge Graphs',
    desc: 'Visualize connections between concepts with interactive graph maps.',
  },
  {
    icon: BookOpen,
    title: 'Spaced Repetition',
    desc: 'Master knowledge faster with SM-2 flashcard scheduling.',
  },
  {
    icon: GitBranch,
    title: 'Concept Clusters',
    desc: 'Organize ideas into semantic clusters and learning paths.',
  },
];

export default function LoginPage() {
  const { login, register, token, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  if (token) return <Navigate to="/graph" replace />;

  const handleLogin = async (data: LoginForm) => {
    try {
      await login(data.username, data.password);
      toast.success('Welcome back!');
      navigate('/graph');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid credentials';
      toast.error(msg);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    try {
      await register(data.username, data.email, data.password);
      toast.success('Account created — please sign in.');
      setMode('login');
      loginForm.setValue('username', data.username);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--grove-dark)',
    }}>
      {/* ── Left panel ─────────────────────────────────── */}
      <div className="login-hero">
        {/* Background glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 20% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #7C3AED, #9D5FFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
          }}>
            <Sparkles style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Grove
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 36, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.04em',
          color: 'var(--text-primary)', marginBottom: 14,
        }}>
          Your second brain,<br />
          <span style={{ color: 'var(--grove-accent)' }}>connected.</span>
        </h1>
        <p style={{ fontSize: 15.5, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 380, marginBottom: 48 }}>
          Build a personal knowledge graph. Connect ideas, track mastery, and learn with intelligent spaced repetition.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 15, height: 15, color: 'var(--grove-accent)' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px 40px',
        flexShrink: 0,
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Mobile logo — only visible when hero panel is hidden */}
          <div className="login-mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, #7C3AED, #9D5FFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles style={{ width: 15, height: 15, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Grove
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 6 }}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                style={{
                  color: 'var(--grove-accent)', fontWeight: 600, cursor: 'pointer',
                  background: 'none', border: 'none', fontSize: 14, padding: 0,
                }}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Username
                </label>
                <input
                  {...loginForm.register('username')}
                  placeholder="your_username"
                  autoComplete="username"
                  className="grove-input"
                />
                {loginForm.formState.errors.username && (
                  <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{loginForm.formState.errors.username.message}</p>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Password
                </label>
                <input
                  {...loginForm.register('password')}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="grove-input"
                />
                {loginForm.formState.errors.password && (
                  <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="grove-btn-primary"
                style={{ marginTop: 4, width: '100%', padding: '11px 18px', fontSize: 14.5 }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { name: 'username' as const, label: 'Username', placeholder: 'your_username', type: 'text', auto: 'username' },
                { name: 'email'    as const, label: 'Email',    placeholder: 'you@example.com', type: 'email', auto: 'email' },
                { name: 'password' as const, label: 'Password', placeholder: '••••••••',       type: 'password', auto: 'new-password' },
              ].map(({ name, label, placeholder, type, auto }) => (
                <div key={name}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {label}
                  </label>
                  <input
                    {...registerForm.register(name)}
                    type={type}
                    placeholder={placeholder}
                    autoComplete={auto}
                    className="grove-input"
                  />
                  {registerForm.formState.errors[name] && (
                    <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                      {registerForm.formState.errors[name]!.message}
                    </p>
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={loading}
                className="grove-btn-primary"
                style={{ marginTop: 4, width: '100%', padding: '11px 18px', fontSize: 14.5 }}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)' }}>
            By continuing you agree to Grove's terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
