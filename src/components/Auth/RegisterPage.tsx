import { useState, type FormEvent } from 'react';
import { useAuth, type RegisterData } from '../../context/AuthContext';

interface RegisterPageProps {
  onShowLogin: () => void;
}

function getPasswordStrength(password: string): 'weak' | 'ok' | 'strong' {
  if (password.length < 6) return 'weak';
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [password.length >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 3) return 'strong';
  if (score >= 2) return 'ok';
  return 'weak';
}

const strengthConfig = {
  weak: { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' },
  ok: { label: 'OK', color: 'bg-yellow-400', width: 'w-2/3' },
  strong: { label: 'Strong', color: 'bg-green-500', width: 'w-full' },
};

export function RegisterPage({ onShowLogin }: RegisterPageProps) {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', phone: '' });
  const [error, setError] = useState('');

  const strength = form.password ? getPasswordStrength(form.password) : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    const data: RegisterData = {
      username: form.username,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    };
    try {
      register(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

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
          <h2 className="text-lg font-bold text-white mb-5">Create your account</h2>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-900/50 border border-red-700 rounded-[4px] text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={set('username')}
                required
                autoFocus
                className="w-full bg-zinc-900 border-2 border-zinc-600 rounded-[4px] px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="your_username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                className="w-full bg-zinc-900 border-2 border-zinc-600 rounded-[4px] px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Phone <span className="text-zinc-500 text-xs">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                className="w-full bg-zinc-900 border-2 border-zinc-600 rounded-[4px] px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="+1 555 000 0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                className="w-full bg-zinc-900 border-2 border-zinc-600 rounded-[4px] px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="••••••••"
              />
              {strength && (
                <div className="mt-1.5">
                  <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strengthConfig[strength].color} ${strengthConfig[strength].width}`} />
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Strength: <span className={strength === 'strong' ? 'text-green-400' : strength === 'ok' ? 'text-yellow-400' : 'text-red-400'}>{strengthConfig[strength].label}</span>
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Confirm password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={form.confirm}
                onChange={set('confirm')}
                required
                className="w-full bg-zinc-900 border-2 border-zinc-600 rounded-[4px] px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-bold py-2.5 rounded-[4px] border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:shadow-[1px_1px_0_0_#18181b] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Create account
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <button
              onClick={onShowLogin}
              className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
