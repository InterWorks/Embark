import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onShowRegister: () => void;
}

export function LoginPage({ onShowRegister }: LoginPageProps) {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      login(usernameOrEmail, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-[4px] border-4 border-zinc-900 shadow-[4px_4px_0_0_#18181b] mb-4">
            <span className="text-2xl font-black text-zinc-900">E</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Embark</h1>
          <p className="text-zinc-400 mt-1 text-sm">Client onboarding, leveled up.</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-800 border-2 border-zinc-700 rounded-[4px] p-6 shadow-[4px_4px_0_0_#18181b]">
          <h2 className="text-lg font-bold text-white mb-5">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-900/50 border border-red-700 rounded-[4px] text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Username or email
              </label>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                required
                autoFocus
                className="w-full bg-zinc-900 border-2 border-zinc-600 rounded-[4px] px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="username or email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-900 border-2 border-zinc-600 rounded-[4px] px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-bold py-2.5 rounded-[4px] border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:shadow-[1px_1px_0_0_#18181b] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Sign in
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-400">
            Don't have an account?{' '}
            <button
              onClick={onShowRegister}
              className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
