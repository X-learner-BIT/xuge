import { useState } from 'react';
import { User, Bell, SlidersHorizontal, Download, Trash2, Feather } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
        on ? 'bg-primary' : 'bg-slate-300'
      }`}
    >
      <div
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
          on ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        {/* Profile */}
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <User className="h-5 w-5 text-primary" />
            个人资料
          </h3>
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-light to-accent text-xl font-semibold text-white">
              {user?.nickname?.[0] || user?.phone?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div>
              <div className="font-semibold">{user?.nickname || '用户'}</div>
              <div className="text-[13px] text-text-muted">{user?.phone || user?.email || '未绑定'}</div>
            </div>
            <button className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-primary-light hover:text-primary">
              更换头像
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                昵称
              </label>
              <input
                type="text"
                defaultValue={user?.nickname || ''}
                className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                邮箱
              </label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                readOnly
                className="w-full rounded-xl border border-border bg-slate-100 px-4 py-2.5 text-sm text-text-muted outline-none"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover">
              保存修改
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Bell className="h-5 w-5 text-secondary" />
            通知设置
          </h3>
          <div className="space-y-4">
            {[
              { label: '每日复习提醒', desc: '每天固定时间提醒你完成复习', on: true },
              { label: '薄弱领域提醒', desc: '当某领域掌握度显著下降时通知', on: true },
              { label: '邮件报告', desc: '每周日发送掌握度周报', on: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-text-muted">{item.desc}</div>
                </div>
                <Toggle defaultOn={item.on} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Review Preferences */}
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <SlidersHorizontal className="h-5 w-5 text-accent" />
            复习偏好
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">每日题量</div>
                <div className="text-xs text-text-muted">每天自动生成的题目数量</div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={30}
                  defaultValue={10}
                  className="h-1.5 w-32 appearance-none rounded-full bg-border outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow"
                />
                <span className="min-w-[24px] text-sm font-semibold">10</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">优先出题领域</div>
                <div className="text-xs text-text-muted">薄弱知识点优先</div>
              </div>
              <Toggle defaultOn />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">复习提醒时间</div>
              <select className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-primary-light">
                <option>早上 08:00</option>
                <option>中午 12:30</option>
                <option>晚上 20:00</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Download className="h-5 w-5 text-primary" />
            数据管理
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-text-secondary">导出你的掌握度报告和错题本</div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-primary-light hover:text-primary hover:bg-primary/[0.04]">
                <Download className="h-3.5 w-3.5" /> 导出 PDF 报告
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-primary-light hover:text-primary hover:bg-primary/[0.04]">
                <Download className="h-3.5 w-3.5" /> 导出 Excel
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> 清除所有数据
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03] p-5 text-center">
          <p className="text-[13px] text-text-muted">
            <Feather className="mr-1 inline h-4 w-4 text-primary" />
            栩格 v1.0 · 把你的知识管起来，让遗忘有据可查
          </p>
        </div>
      </div>
    </div>
  );
}
