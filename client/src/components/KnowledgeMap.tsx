import { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BookOpen, Lightbulb, TrendingUp, Award } from 'lucide-react';
import type { DomainMasteryItem } from '@/types';
import type { Note } from '@/types';

interface Props {
  domains: DomainMasteryItem[];
  notes: Note[];
  selectedNoteId: string;
  onSelectNote: (noteId: string) => void;
}

function getMasteryColor(mastery: number) {
  if (mastery >= 80) return { main: '#10b981', bg: '#ecfdf5', bar: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' };
  if (mastery >= 60) return { main: '#3b82f6', bg: '#eff6ff', bar: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50' };
  if (mastery >= 40) return { main: '#f59e0b', bg: '#fffbeb', bar: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50' };
  return { main: '#ef4444', bg: '#fef2f2', bar: 'bg-rose-500', text: 'text-rose-700', light: 'bg-rose-50' };
}

function getMasteryLabel(mastery: number) {
  if (mastery >= 80) return '精通';
  if (mastery >= 60) return '良好';
  if (mastery >= 40) return '一般';
  return '薄弱';
}

export function KnowledgeMap({ domains, notes, selectedNoteId, onSelectNote }: Props) {
  const completedNotes = notes.filter((n) => n.status === 'completed');

  const totalMastery = useMemo(() => {
    if (domains.length === 0) return 0;
    return Math.round(domains.reduce((sum, d) => sum + d.mastery, 0) / domains.length);
  }, [domains]);

  const radarData = useMemo(
    () => domains.map((d) => ({ domain: d.domain, current: d.mastery })),
    [domains]
  );

  const pieData = useMemo(() => {
    const high = domains.filter((d) => d.mastery >= 70).length;
    const mid = domains.filter((d) => d.mastery >= 40 && d.mastery < 70).length;
    const low = domains.filter((d) => d.mastery < 40).length;
    return [
      { name: '精通', value: high, color: '#10b981' },
      { name: '良好', value: mid, color: '#3b82f6' },
      { name: '薄弱', value: low, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [domains]);

  const totalPoints = useMemo(() => domains.reduce((sum, d) => sum + d.pointCount, 0), [domains]);

  return (
    <div className="space-y-5">
      {/* 笔记选择器 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-text-secondary">选择笔记</span>
        </div>
        <select
          value={selectedNoteId}
          onChange={(e) => onSelectNote(e.target.value)}
          className="rounded-xl border border-border bg-white px-4 py-2 text-sm text-text-primary outline-none transition-all focus:border-primary-light focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
        >
          <option value="">全部笔记（汇总）</option>
          {completedNotes.map((note) => (
            <option key={note.id} value={note.id}>
              {note.title}
            </option>
          ))}
        </select>
      </div>

      {domains.length === 0 ? (
        <div className="flex h-[320px] flex-col items-center justify-center rounded-2xl bg-slate-50 text-sm text-text-muted">
          <Lightbulb className="mb-3 h-10 w-10 text-text-muted/30" />
          暂无领域数据，请先上传笔记
        </div>
      ) : (
        <>
          {/* 顶部概览区 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* 总体掌握度大圆环 */}
            <div className="rounded-2xl border border-border/60 bg-bg-card p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                <Award className="h-4 w-4 text-primary" />
                总体掌握度
              </div>
              <div className="flex items-center gap-4">
                <div className="relative h-[120px] w-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { value: totalMastery },
                          { value: 100 - totalMastery },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={54}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                        dataKey="value"
                      >
                        <Cell fill={getMasteryColor(totalMastery).main} />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-text-primary">{totalMastery}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getMasteryColor(totalMastery).light} ${getMasteryColor(totalMastery).text}`}>
                    {getMasteryLabel(totalMastery)}
                  </div>
                  <div className="text-xs text-text-muted">
                    覆盖 <strong className="text-text-primary">{domains.length}</strong> 个领域
                  </div>
                  <div className="text-xs text-text-muted">
                    共 <strong className="text-text-primary">{totalPoints}</strong> 个知识点
                  </div>
                </div>
              </div>
            </div>

            {/* 领域分布饼图 */}
            <div className="rounded-2xl border border-border/60 bg-bg-card p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                <TrendingUp className="h-4 w-4 text-secondary" />
                领域分布
              </div>
              <div className="flex items-center gap-3">
                <div className="h-[100px] w-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={46}
                        stroke="none"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-text-secondary">{item.name}</span>
                      <span className="ml-auto text-xs font-semibold text-text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 雷达图 */}
            <div className="rounded-2xl border border-border/60 bg-bg-card p-5 shadow-card sm:col-span-1">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                <Lightbulb className="h-4 w-4 text-accent" />
                能力雷达
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <RadarChart cx="50%" cy="55%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="rgba(0,0,0,0.05)" />
                  <PolarAngleAxis
                    dataKey="domain"
                    tick={{ fontSize: 9, fontWeight: 500, fill: '#64748b' }}
                  />
                  <Radar
                    name="掌握度"
                    dataKey="current"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="#6366f1"
                    fillOpacity={0.15}
                    dot={{ r: 3, fill: '#6366f1', stroke: '#fff', strokeWidth: 1.5 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 领域卡片网格 */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <BookOpen className="h-4 w-4 text-primary" />
              各领域详情
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {domains
                .sort((a, b) => b.mastery - a.mastery)
                .map((domain) => {
                  const colors = getMasteryColor(domain.mastery);
                  return (
                    <div
                      key={domain.domain}
                      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg"
                    >
                      {/* 左侧色条 */}
                      <div
                        className="absolute left-0 top-0 h-full w-1 transition-all group-hover:w-1.5"
                        style={{ backgroundColor: colors.main }}
                      />

                      <div className="pl-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-[15px] font-bold text-text-primary">{domain.domain}</div>
                            <div className="mt-0.5 text-xs text-text-muted">{domain.pointCount} 个知识点</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-extrabold" style={{ color: colors.main }}>
                              {domain.mastery}%
                            </div>
                            <div className={`text-[11px] font-medium ${colors.text}`}>
                              {getMasteryLabel(domain.mastery)}
                            </div>
                          </div>
                        </div>

                        {/* 进度条 */}
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${domain.mastery}%`,
                              backgroundColor: colors.main,
                            }}
                          />
                        </div>

                        {/* 底部标签 */}
                        <div className="mt-3 flex items-center gap-2">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ backgroundColor: colors.bg, color: colors.main }}
                          >
                            {domain.mastery >= 80 ? '✅ 已掌握' : domain.mastery >= 60 ? '📈 进步中' : domain.mastery >= 40 ? '🔔 待加强' : '⚠️ 需重点关注'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
