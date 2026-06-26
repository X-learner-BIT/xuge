import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Feather, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register, loading } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('demo@xuge.ai');
  const [password, setPassword] = useState('123456');
  const [nickname, setNickname] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'login') {
      const ok = await login({ email, password });
      if (ok) navigate('/dashboard');
    } else {
      const ok = await register({ email, password, nickname });
      if (ok) navigate('/dashboard');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      {/* Background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-white/10" />
        <div className="absolute left-[10%] top-[40%] h-[200px] w-[200px] rounded-full bg-white/10" />
      </div>

      <div className="relative z-10 w-[420px] max-w-[90vw] animate-[loginFadeIn_0.6s_ease]">
        <div className="rounded-3xl bg-white/95 px-10 py-12 shadow-2xl backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-2xl font-extrabold text-white">
              <Feather className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {tab === 'login' ? '欢迎回到栩格' : '加入栩格'}
            </h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              把你的知识管起来，让遗忘有据可查
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === 'login'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === 'register'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                  昵称
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="你的名字"
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6位"
                required
                className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-[15px] font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover disabled:opacity-60"
            >
              {tab === 'login' ? (
                <>
                  <ArrowRight className="h-4 w-4" /> 进入栩格
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> 注册并进入
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
