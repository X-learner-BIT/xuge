import { Outlet, useLocation } from 'react-router-dom';
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
  const user = useAuthStore((s) => s.user);
  const [title, subtitle] = pageTitles[location.pathname] || ['页面', ''];

  return (
    <div className="flex min-h-screen bg-bg font-sans text-text-primary">
      <Sidebar />
      <div className="ml-[72px] min-h-screen flex-1">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-transparent bg-bg/80 px-9 py-5 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <span className="ml-2 border-l border-border pl-3 text-sm text-text-secondary">
                {subtitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-border bg-bg-card px-3.5 py-2 transition-all duration-300 focus-within:border-primary-light focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]">
              <Search className="h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="搜索笔记、知识点…"
                className="ml-2 w-[200px] border-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary-light to-accent text-sm font-semibold text-white transition-transform duration-300 hover:scale-105 cursor-pointer">
              {user?.nickname?.[0] || user?.phone?.[0] || user?.email?.[0] || 'U'}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="px-9 pb-9 pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
