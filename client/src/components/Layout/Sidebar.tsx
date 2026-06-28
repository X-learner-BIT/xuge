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
  Shield,
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
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="fixed left-0 top-0 z-50 flex h-screen w-[72px] flex-col items-center border-r border-border/60 bg-white/80 py-5 backdrop-blur-xl transition-all duration-300 hover:bg-white/95">
      <NavLink
        to="/dashboard"
        className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg font-extrabold text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-primary/30"
        title="栩格"
      >
        <Feather className="h-5 w-5" />
      </NavLink>

      <div className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/30'
                  : 'text-text-muted hover:bg-primary/5 hover:text-primary'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-lg bg-text-primary px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 translate-x-[-4px]">
                {item.label}
              </span>
            </NavLink>
          );
        })}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={`group relative flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-all duration-300 ${
              location.pathname.startsWith('/admin')
                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/30'
                : 'text-text-muted hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Shield className="h-5 w-5" />
            <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-lg bg-text-primary px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 translate-x-[-4px]">
              管理中心
            </span>
          </NavLink>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-1">
        <button
          onClick={logout}
          className="group relative flex h-12 w-12 items-center justify-center rounded-xl text-text-muted transition-all duration-300 hover:bg-red-50 hover:text-red-500"
        >
          <LogOut className="h-5 w-5" />
          <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-lg bg-text-primary px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 translate-x-[-4px]">
            退出
          </span>
        </button>
      </div>
    </nav>
  );
}
