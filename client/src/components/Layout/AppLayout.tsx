import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const pageTitles: Record<string, [string, string]> = {
  '/dashboard': ['工作台', '今日概览'],
  '/notes': ['笔记', '所有笔记'],
  '/upload': ['上传笔记', 'PDF / Word / 文字'],
  '/review': ['复习中心', '今日目标 10 题'],
  '/report': ['报告中心', '综合掌握度'],
  '/settings': ['设置', '个性化配置'],
};

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isDark = useAuthStore((s) => s.isDark);
  const [title, subtitle] = pageTitles[location.pathname] || ['页面', ''];
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    if (location.pathname === '/notes') {
      navigate(`/notes?search=${encodeURIComponent(q)}`, { replace: true });
    } else {
      navigate(`/notes?search=${encodeURIComponent(q)}`);
    }
    setSearchQuery('');
  };

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
      <Sidebar />
      <div className="ml-[72px] min-h-screen flex-1">
        <div className={`sticky top-0 z-40 flex items-center justify-between px-9 py-5 backdrop-blur-xl border-b transition-all duration-300 ${isDark ? 'bg-background-dark/80 border-border-dark/40' : 'bg-white/80 border-border/40'}`}>
          <div className="flex items-center gap-3">
            <h1 className={`text-[24px] font-bold tracking-tight ${isDark ? 'text-text-darkPrimary' : 'text-text-primary'}`}>
              {title}
            </h1>
            {subtitle && (
              <span className={`ml-3 border-l px-3 text-sm ${isDark ? 'border-border-dark/40 text-text-darkSecondary' : 'border-border/60 text-text-secondary'}`}>
                {subtitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center rounded-xl border px-4 py-2.5 transition-all duration-300 focus-within:border-primary-400 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] ${isDark ? 'border-border-dark/40 bg-background-cardDark/50' : 'border-border/40 bg-white/60'}`}>
              <Search className={`h-4 w-4 ${isDark ? 'text-text-darkMuted' : 'text-text-muted'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索笔记、知识点…"
                className={`ml-2 w-[200px] border-none bg-transparent text-sm outline-none placeholder:text-text-muted ${isDark ? 'text-text-darkPrimary' : 'text-text-primary'}`}
              />
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-semibold text-white shadow-glow transition-transform duration-300 hover:scale-105 cursor-pointer">
              {user?.nickname?.[0] || user?.phone?.[0] || user?.email?.[0] || 'U'}
            </div>
          </div>
        </div>

        <main className="px-9 pb-9 pt-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
