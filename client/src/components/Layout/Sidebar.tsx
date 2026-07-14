import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  BookOpen,
  CloudUpload,
  Brain,
  PieChart,
  Settings,
  LogOut,
  Feather,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutGrid, label: '工作台' },
  { to: '/notes', icon: BookOpen, label: '笔记' },
  { to: '/upload', icon: CloudUpload, label: '上传' },
  { to: '/review', icon: Brain, label: '复习' },
  { to: '/report', icon: PieChart, label: '报告' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export function Sidebar() {
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const toggleDarkMode = useAuthStore((s) => s.toggleDarkMode);
  const isDark = useAuthStore((s) => s.isDark);

  return (
    <nav className="fixed left-0 top-0 z-50 flex h-screen w-[72px] flex-col items-center border-r border-border/40 bg-white/70 backdrop-blur-xl transition-all duration-300 hover:bg-white/90">
      <NavLink
        to="/dashboard"
        className="mb-8 mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 text-lg font-extrabold text-white shadow-glow transition-all duration-300 hover:scale-105 hover:shadow-glow-md"
        title="栩格"
      >
        <Feather className="h-6 w-6" />
      </NavLink>

      <div className="flex flex-1 flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-glow'
                  : 'text-text-muted hover:text-primary-600 hover:bg-primary-50'
              }`}
            >
              <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="pointer-events-none absolute left-[calc(100%+14px)] z-50 whitespace-nowrap rounded-xl bg-text-primary px-3 py-2 text-xs font-medium text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 translate-x-[-4px] shadow-lg">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1.5 pb-5">
        <button
          onClick={toggleDarkMode}
          className="group relative flex h-12 w-12 items-center justify-center rounded-xl text-text-muted transition-all duration-300 hover:text-primary-600 hover:bg-primary-50"
          title={isDark ? '切换到浅色模式' : '切换到深色模式'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="pointer-events-none absolute left-[calc(100%+14px)] z-50 whitespace-nowrap rounded-xl bg-text-primary px-3 py-2 text-xs font-medium text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 translate-x-[-4px] shadow-lg">
            {isDark ? '浅色模式' : '深色模式'}
          </span>
        </button>
        
        <button
          onClick={logout}
          className="group relative flex h-12 w-12 items-center justify-center rounded-xl text-text-muted transition-all duration-300 hover:text-red-500 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          <span className="pointer-events-none absolute left-[calc(100%+14px)] z-50 whitespace-nowrap rounded-xl bg-text-primary px-3 py-2 text-xs font-medium text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 translate-x-[-4px] shadow-lg">
            退出
          </span>
        </button>
      </div>
    </nav>
  );
}
