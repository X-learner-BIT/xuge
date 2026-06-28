import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  Bookmark,
  RotateCcw,
  BookOpen,
  Lightbulb,
  CheckCircle,
  XCircle,
  Zap,
  Flame,
  BarChart3,
  FileText,
  Clock,
  Target,
  Award,
} from 'lucide-react';
import { RadarChartComponent } from '@/components/RadarChart';
import { useReview } from '@/hooks/useReview';

export function ReportPage() {
  const navigate = useNavigate();
  const { report, trends, wrongQuestions, fetchReport, fetchTrends, fetchWrongQuestions } = useReview();

  useEffect(() => {
    fetchReport();
    fetchTrends();
    fetchWrongQuestions();
  }, [fetchReport, fetchTrends, fetchWrongQuestions]);

  const totalScore = report?.totalScore ?? 0;
  const totalQuestions = report?.totalQuestions ?? 0;
  const correctCount = report?.correctCount ?? 0;
  const noteCount = report?.noteCount ?? 0;
  const streakDays = report?.streakDays ?? 0;

  const kpStats = report?.knowledgePointStats ?? { total: 0, mastered: 0, improving: 0, weak: 0 };
  const typeStats = report?.questionTypeStats ?? { choice: { total: 0, correct: 0 }, fill: { total: 0, correct: 0 } };
  const recentRecords = report?.recentRecords ?? [];

  const reportRadarData =
    report?.domainMastery.map((d) => ({
      domain: d.domain,
      current: d.mastery,
    })) ?? [];

  const weakPoints = report?.weakPoints ?? [];
  const wrongList = wrongQuestions ?? [];
  const trendData = trends.length > 0 ? trends : [];
  const maxTrend = Math.max(1, ...trendData.map((t) => t.mastery));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const pct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const grade = pct >= 90 ? '优秀' : pct >= 70 ? '良好' : pct >= 60 ? '一般' : '需努力';
  const gradeColor =
    pct >= 90 ? 'text-green-600' : pct >= 70 ? 'text-blue-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500';
  const gradeBg =
    pct >= 90 ? 'bg-green-50' : pct >= 70 ? 'bg-blue-50' : pct >= 60 ? 'bg-yellow-50' : 'bg-red-50';

  // 数据概览卡片
  const statCards = [
    { icon: BookOpen, value: noteCount, label: '笔记', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    { icon: Lightbulb, value: kpStats.total, label: '知识点', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
    { icon: Target, value: totalQuestions, label: '答题', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
    { icon: Award, value: `${pct}%`, label: '正确率', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { icon: Zap, value: kpStats.mastered, label: '已掌握', color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { icon: Flame, value: streakDays, label: '连续天数', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ];

  return (
    <div className="space-y-5">
      {/* 顶部综合评分 */}
      <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* 左侧大分数 */}
          <div className="flex items-center gap-5">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
              <div className="text-center">
                <div className="text-3xl font-extrabold">{totalScore}</div>
                <div className="text-[10px] opacity-80">综合评分</div>
              </div>
              <div className="absolute -right-1.5 -top-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold shadow-sm" style={{ color: 'var(--primary)' }}>
                {grade}
              </div>
            </div>
            <div>
              <div className="text-lg font-bold">掌握度报告</div>
              <div className="mt-1 text-sm text-text-secondary">
                基于 <strong className="text-text-primary">{totalQuestions}</strong> 道题的答题表现
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${gradeBg} ${gradeColor}`}>
                  <TrendingUp className="h-3 w-3" /> {grade}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                  {correctCount} 题正确
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-text-muted">
                  {totalQuestions - correctCount} 题错误
                </span>
              </div>
            </div>
          </div>

          {/* 右侧6个数据卡片 */}
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
            {statCards.map((card, i) => (
              <div
                key={i}
                className={`flex flex-col items-center rounded-xl border ${card.border} ${card.bg} p-2.5 text-center transition-all hover:shadow-sm`}
              >
                <card.icon className={`h-4 w-4 ${card.color}`} />
                <div className={`mt-1 text-base font-bold ${card.color}`}>{card.value}</div>
                <div className="text-[10px] text-text-muted">{card.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 第一行：雷达图 + 知识点分布 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-1 flex items-center gap-2 text-base font-semibold">
            <Brain className="h-5 w-5 text-primary" />
            各领域掌握度
          </h3>
          <p className="mb-4 text-xs text-text-muted">不同知识领域的答题正确率分布</p>
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              {reportRadarData.length > 0 ? (
                <RadarChartComponent data={reportRadarData} />
              ) : (
                <div className="flex h-[280px] items-center justify-center text-sm text-text-muted">
                  暂无领域数据，请先完成复习答题
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-1 flex items-center gap-2 text-base font-semibold">
            <Lightbulb className="h-5 w-5 text-secondary" />
            知识点掌握分布
          </h3>
          <p className="mb-4 text-xs text-text-muted">已掌握 / 待加强 / 薄弱 的数量占比</p>
          {kpStats.total > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">已掌握（≥80%）</span>
                    <span className="font-semibold text-green-600">{kpStats.mastered}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(kpStats.mastered / kpStats.total) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-100">
                  <Zap className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">待加强（50%-79%）</span>
                    <span className="font-semibold text-yellow-600">{kpStats.improving}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-yellow-500 transition-all" style={{ width: `${(kpStats.improving / kpStats.total) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">薄弱（&lt;50%）</span>
                    <span className="font-semibold text-red-500">{kpStats.weak}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${(kpStats.weak / kpStats.total) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center text-sm text-text-secondary">
                共 <strong className="text-text-primary">{kpStats.total}</strong> 个知识点 ·
                <strong className="ml-1 text-green-600">{Math.round((kpStats.mastered / kpStats.total) * 100)}%</strong> 已掌握
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-text-muted">
              暂无知识点数据，请先上传笔记并等待 AI 分析
            </div>
          )}
        </div>
      </div>

      {/* 第二行：趋势 + 题型正确率 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-1 flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-5 w-5 text-secondary" />
            近7天掌握趋势
          </h3>
          <p className="mb-4 text-xs text-text-muted">每日答题数量与正确率变化</p>
          {trendData.length > 0 ? (
            <div className="flex h-[200px] items-end justify-between gap-2">
              {trendData.map((t, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-medium text-text-secondary">{t.count}题</span>
                    <span className="text-[10px] font-bold text-primary">{t.mastery}%</span>
                    <div
                      className="w-full min-w-[16px] rounded-t-md bg-gradient-to-t from-primary/80 to-primary/30"
                      style={{ height: `${(t.mastery / maxTrend) * 120}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-text-muted">{t.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-text-muted">
              暂无趋势数据，开始答题后将自动统计
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-1 flex items-center gap-2 text-base font-semibold">
            <BarChart3 className="h-5 w-5 text-accent" />
            题型正确率对比
          </h3>
          <p className="mb-4 text-xs text-text-muted">选择题与简答题的答题表现对比</p>
          {typeStats.choice.total > 0 || typeStats.fill.total > 0 ? (
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">选择题</div>
                      <div className="text-xs text-text-muted">
                        {typeStats.choice.correct}/{typeStats.choice.total} 正确
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {typeStats.choice.total > 0 ? Math.round((typeStats.choice.correct / typeStats.choice.total) * 100) : 0}%
                  </div>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all"
                    style={{
                      width: `${typeStats.choice.total > 0 ? (typeStats.choice.correct / typeStats.choice.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                      <FileText className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">简答题</div>
                      <div className="text-xs text-text-muted">
                        {typeStats.fill.correct}/{typeStats.fill.total} 正确
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-secondary">
                    {typeStats.fill.total > 0 ? Math.round((typeStats.fill.correct / typeStats.fill.total) * 100) : 0}%
                  </div>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-secondary to-secondary/70 transition-all"
                    style={{
                      width: `${typeStats.fill.total > 0 ? (typeStats.fill.correct / typeStats.fill.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-text-muted">
              暂无题型数据，完成复习后将自动统计
            </div>
          )}
        </div>
      </div>

      {/* 第三行：薄弱知识点 + 最近答题 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="flex h-[420px] flex-col rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                薄弱知识点
              </h3>
              <p className="mt-0.5 text-xs text-text-muted">掌握度低于 50% 的知识点</p>
            </div>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
              {weakPoints.length} 项
            </span>
          </div>
          {weakPoints.length > 0 ? (
            <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
              {weakPoints.map((wp) => (
                <li key={wp.name} className="space-y-1.5 rounded-xl border border-slate-50 bg-slate-50/50 p-3 transition-all hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{wp.name}</div>
                      <div className="text-xs text-text-muted">{wp.domain || '通用'}</div>
                    </div>
                    <div className="text-sm font-semibold text-red-500">{wp.mastery}%</div>
                  </div>
                  <div className="ml-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${wp.mastery}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-text-muted">
              <CheckCircle className="h-8 w-8 text-green-400" />
              暂无薄弱知识点，继续保持！
            </div>
          )}
        </div>

        <div className="flex h-[420px] flex-col rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Clock className="h-5 w-5 text-primary" />
                最近答题记录
              </h3>
              <p className="mt-0.5 text-xs text-text-muted">最近完成的题目与结果</p>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
              {recentRecords.length} 条
            </span>
          </div>
          {recentRecords.length > 0 ? (
            <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
              {recentRecords.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-50 bg-slate-50/50 p-3 transition-all hover:bg-slate-50"
                >
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      r.isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {r.isCorrect ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm text-text-primary">{r.questionText}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">{r.domain}</span>
                      <span>·</span>
                      <span>{r.questionType === 'choice' ? '选择题' : '简答题'}</span>
                      <span>·</span>
                      <span>{formatDate(r.createdAt)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-text-muted">
              <Clock className="h-8 w-8 text-text-muted/40" />
              暂无答题记录，快去复习吧！
            </div>
          )}
        </div>
      </div>

      {/* 错题本 */}
      <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Bookmark className="h-5 w-5 text-red-500" />
              错题本
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">答错次数较多的题目汇总</p>
          </div>
          <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
            {wrongList.length} 道错题
          </span>
        </div>
        {wrongList.length > 0 ? (
          <>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {wrongList.map((wq) => (
                <li
                  key={wq.id}
                  className="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-3 transition-all hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{wq.name}</div>
                    <div className="text-xs text-text-muted">
                      {wq.domain} · 答错 <strong className="text-red-500">{wq.wrongCount}</strong> 次
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/review')}
                    className="ml-2 shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-all hover:border-primary-light hover:text-primary hover:bg-primary/[0.04]"
                  >
                    重做
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/review')}
              className="mt-4 w-full rounded-xl bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary/10"
            >
              <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> 重新做全部错题
            </button>
          </>
        ) : (
          <div className="flex h-[120px] flex-col items-center justify-center gap-2 text-sm text-text-muted">
            <CheckCircle className="h-8 w-8 text-green-400" />
            暂无错题记录，太棒了！
          </div>
        )}
      </div>
    </div>
  );
}
