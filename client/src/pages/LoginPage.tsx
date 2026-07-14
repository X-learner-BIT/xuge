import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Feather, ArrowRight, UserPlus, Phone, Mail, Lock, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register, loading, error } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const [loginAccount, setLoginAccount] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'login') {
      const ok = await login({ account: loginAccount, password: loginPassword });
      if (ok) navigate('/dashboard');
    } else {
      if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
      }
      const ok = await register({ phone, password, confirmPassword, nickname, email });
      if (ok) navigate('/dashboard');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 gradient-flow" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-[15%] -top-[10%] h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl animate-blob" />
        <div className="absolute -bottom-[15%] -left-[10%] h-[400px] w-[400px] rounded-full bg-white/10 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute left-[30%] top-[40%] h-[250px] w-[250px] rounded-full bg-white/5 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        <div className="absolute right-[30%] bottom-[30%] h-[150px] w-[150px] rounded-full bg-primary-300/20 blur-2xl animate-float" />
        <div className="absolute left-[20%] top-[20%] h-[100px] w-[100px] rounded-full bg-accent-300/20 blur-2xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div
        className={`relative z-10 w-[420px] max-w-[90vw] transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-10 shadow-glow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
          
          <div className="relative">
            <div className="mb-8 text-center">
              <div className="group mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow transition-all duration-300 hover:shadow-glow-md hover:scale-105">
                <Feather className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {tab === 'login' ? '欢迎回来' : '加入栩格'}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                把你的知识管起来，让遗忘有据可查
              </p>
            </div>

            <div className="mb-7 flex rounded-xl bg-white/10 p-1 backdrop-blur-sm">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all duration-300 ${
                  tab === 'login'
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all duration-300 ${
                  tab === 'register'
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                注册
              </button>
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-red-500/20 border border-red-400/30 px-4 py-3 text-sm text-red-200 backdrop-blur-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'login' ? (
                <>
                  <div className="group">
                    <label className="mb-2 block text-xs font-semibold text-white/60 uppercase tracking-wider">
                      手机号 / 邮箱
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white/70" />
                      <input
                        type="text"
                        value={loginAccount}
                        onChange={(e) => setLoginAccount(e.target.value)}
                        placeholder="手机号或邮箱"
                        required
                        className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-primary-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.3)]"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="mb-2 block text-xs font-semibold text-white/60 uppercase tracking-wider">
                      密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white/70" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="请输入密码"
                        required
                        className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-primary-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.3)]"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="group">
                    <label className="mb-2 block text-xs font-semibold text-white/60 uppercase tracking-wider">
                      手机号 <span className="text-red-300">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white/70" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="请输入手机号"
                        required
                        className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-primary-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.3)]"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="mb-2 block text-xs font-semibold text-white/60 uppercase tracking-wider">
                      昵称
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white/70" />
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="你的名字"
                        className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-primary-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.3)]"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="mb-2 block text-xs font-semibold text-white/60 uppercase tracking-wider">
                      邮箱（可选）
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white/70" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-primary-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.3)]"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="mb-2 block text-xs font-semibold text-white/60 uppercase tracking-wider">
                      密码 <span className="text-red-300">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white/70" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="至少4位"
                        required
                        minLength={4}
                        className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-primary-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.3)]"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="mb-2 block text-xs font-semibold text-white/60 uppercase tracking-wider">
                      确认密码 <span className="text-red-300">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white/70" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入密码"
                        required
                        className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-primary-400 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.3)]"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-white/20 to-white/10 px-6 py-4 text-base font-semibold text-white backdrop-blur-sm border border-white/30 shadow-lg transition-all duration-300 hover:bg-white/30 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : tab === 'login' ? (
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

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/50">
              <Sparkles className="h-3 w-3" />
              <span>使用手机号 18962574183，密码 xl040207 进行测试</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
