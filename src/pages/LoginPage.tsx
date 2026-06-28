import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

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
      toast.success('Account created! Please log in.');
      setMode('login');
      loginForm.setValue('username', data.username);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-grove-dark flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 bg-gradient-to-br from-grove-dark to-grove-surface border-r border-grove-border">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #9D5FFF)' }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-3xl font-bold">Grove</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
          Knowledge graphs<br />
          <span className="text-grove-green">reimagined.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-sm">
          Explore interconnected concepts, track your learning progress, and master knowledge through spaced repetition.
        </p>
        <div className="mt-12 grid grid-cols-3 gap-4">
          {[
            { label: 'Concepts', value: '∞' },
            { label: 'Flashcards', value: 'SRS' },
            { label: 'Paths', value: 'AI' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-grove-surface border border-grove-border rounded-xl p-4 text-center">
              <div className="text-grove-green text-2xl font-bold">{value}</div>
              <div className="text-gray-400 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #9D5FFF)' }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-2xl font-bold">Grove</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? 'Sign in to Grove' : 'Create your account'}
          </h2>
          <p className="text-gray-400 mb-8">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-grove-green hover:underline font-medium"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
                <input
                  {...loginForm.register('username')}
                  placeholder="your_username"
                  className="grove-input w-full"
                />
                {loginForm.formState.errors.username && (
                  <p className="text-red-400 text-xs mt-1">{loginForm.formState.errors.username.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <input
                  {...loginForm.register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="grove-input w-full"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-red-400 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full grove-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
                <input
                  {...registerForm.register('username')}
                  placeholder="your_username"
                  className="grove-input w-full"
                />
                {registerForm.formState.errors.username && (
                  <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.username.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input
                  {...registerForm.register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="grove-input w-full"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <input
                  {...registerForm.register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="grove-input w-full"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full grove-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
