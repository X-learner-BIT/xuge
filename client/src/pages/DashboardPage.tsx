import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Play,
  CloudUpload,
  Brain,
  TrendingUp,
  Target,
  Zap,
  Sparkles,
} from 'lucide-react';
import { KnowledgeMap } from '@/components/KnowledgeMap';
import { ProgressBar } from '@/components/ProgressBar';
import { useReview } from '@/hooks/useReview';
import { useStats } from '@/hooks/useStats';
import { useNotes } from '@/hooks/useNotes';

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    startTime.current = null;
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

function StatCard({ icon: Icon, value, label, change, changeColor, iconBg, iconColor, delay = 0 }: {
  icon: React.ElementType;
  value: number;
  label: string;
  change: string;
  changeColor: string;
  iconBg: string;
  iconColor: string;
  delay?: number;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-white/60 backdrop-blur-xl p-6 shadow-glass transition-all duration-500 hover:-translate-y-1 hover:shadow-glass-lg hover:border-primary-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-accent-50/30 to-transparent" />
      </div>
      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} ${iconColor} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="relative mt-4 text-[32px] font-bold tracking-tight text-text-primary">
        <AnimatedNumber value={value} />
      </div>
      <div className="relative mt-1 text-sm text-text-secondary">{label}</div>
      <div className={`relative mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${changeColor}`}>
        <TrendingUp className="h-3 w-3" />
        {change}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { stats } = useStats();
  const { notes } = useNotes();
  const { domainMastery, trends, fetchDomainMastery, fetchTrends } = useReview();
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchDomainMastery(selectedNoteId || undefined);
    fetchTrends();
  }, [fetchDomainMastery, fetchTrends, selectedNoteId]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    {
      icon: BookOpen,
      value: stats?.noteCount ?? 0,
      label: '笔记总数',
      change: '实时统计',
      changeColor: 'text-green-600',
      iconBg: 'bg-gradient-to-br from-primary-100 to-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      icon: Lightbulb,
      value: stats?.knowledgePointCount ?? 0,
      label: '知识点',
      change: '实时统计',
      changeColor: 'text-green-600',
      iconBg: 'bg-gradient-to-br from-accent-100 to-accent-50',
      iconColor: 'text-accent-600',
    },
    {
      icon: CheckCircle,
      value: stats?.reviewRecordCount ?? 0,
      label: '复习题完成',
      change: '持续增长',
      changeColor: 'text-green-600',
      iconBg: 'bg-gradient-to-br from-secondary-100 to-secondary-50',
      iconColor: 'text-secondary-600',
    },
    {
      icon: AlertTriangle,
      value: stats?.weakDomainCount ?? 0,
      label: '薄弱领域',
      change: '需要关注',
      changeColor: 'text-orange-500',
      iconBg: 'bg-gradient-to-br from-orange-100 to-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  const weakAreas = domainMastery
    .filter((d) => d.mastery < 60)
    .sort((a, b) => a.mastery - b.mastery)
    .map((d) => ({
      name: d.domain,
      score: d.mastery,
      color: d.mastery < 40 ? 'bg-red-500' : 'bg-orange-500',
      textColor: d.mastery < 40 ? 'text-red-500' : 'text-orange-500',
      bgColor: d.mastery < 40 ? 'bg-red-50' : 'bg-orange-50',
    }));

  const todayCount = stats?.todayReviewCount ?? 0;
  const todayTarget = 10;

  const trendData = trends.length > 0 ? trends : [];
  const maxTrend = Math.max(1, ...trendData.map((t) => t.mastery));

  return (
    <div className="relative min-h-full">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-primary-300/20 via-accent-300/10 to-transparent blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-secondary-300/20 via-primary-300/10 to-transparent blur-3xl" />

      <div className="relative space-y-6">
        <div
          className={`space-y-2 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary-100 to-accent-100 px-3 py-1 text-xs font-medium text-primary-700">
              <Sparkles className="h-3 w-3" />
              今日学习
            </span>
          </div>
          <h1 className="text-[32px] font-bold text-text-primary">
            你好，<span className="gradient-text">学习达人</span>
          </h1>
          <p className="text-text-secondary">
            今天也要继续加油，掌握更多知识！
          </p>
        </div>

        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '100ms' }}
        >
          {statCards.map((card, i) => (
            <StatCard key={i} {...card} delay={i * 100} />
          ))}
        </div>

        <div
          className={`grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/60 backdrop-blur-xl p-6 shadow-glass">
              <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-primary-100/50 to-transparent" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">知识全景图</h3>
                    <p className="text-xs text-text-muted">掌握度分布</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  实时更新
                </span>
              </div>
              <KnowledgeMap
                domains={domainMastery}
                notes={notes}
                selectedNoteId={selectedNoteId}
                onSelectNote={setSelectedNoteId}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/60 backdrop-blur-xl p-6 shadow-glass">
                <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-secondary-200/50 to-transparent blur-2xl" />
                <div className="relative flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600">
                      <Target className="h-4.5 w-4.5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary">今日复习进度</h3>
                  </div>
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
                    {todayCount}/{todayTarget} 题
                  </span>
                </div>
                <ProgressBar value={todayCount} max={todayTarget} />
                <p className="mt-3 text-sm text-text-secondary">
                  今日已完成 <strong className="text-text-primary">{todayCount}</strong> 题，
                  剩余 <strong className="text-primary-600">{Math.max(0, todayTarget - todayCount)}</strong> 题
                </p>
                <button
                  onClick={() => navigate('/review')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:shadow-glow-md hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <Play className="h-4 w-4" />
                  继续复习
                </button>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/60 backdrop-blur-xl p-6 shadow-glass">
                <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-gradient-to-br from-accent-200/50 to-transparent blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600">
                      <TrendingUp className="h-4.5 w-4.5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary">掌握趋势</h3>
                  </div>
                  {trendData.length > 0 ? (
                    <div className="flex h-[160px] items-end justify-between gap-2">
                      {trendData.map((t, i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                          <div className="relative w-full">
                            <div
                              className="w-full rounded-t-xl bg-gradient-to-t from-primary-500/80 via-primary-400/60 to-primary-300/40 transition-all duration-700"
                              style={{
                                height: `${(t.mastery / maxTrend) * 120}px`,
                                transitionDelay: `${i * 50}ms`,
                              }}
                            />
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-lg bg-text-primary px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity duration-300 hover:opacity-100">
                              {t.mastery}%
                            </div>
                          </div>
                          <span className="text-[10px] text-text-muted">{t.date}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-[160px] items-center justify-center text-sm text-text-muted">
                      暂无趋势数据
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/60 backdrop-blur-xl p-6 shadow-glass h-fit">
            <div className="absolute top-0 left-0 h-32 w-32 bg-gradient-to-br from-orange-100/50 to-transparent" />
            <div className="relative flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                  <AlertTriangle className="h-4.5 w-4.5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-text-primary">薄弱领域</h3>
              </div>
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                {weakAreas.length} 项
              </span>
            </div>
            {weakAreas.length > 0 ? (
              <ul className="space-y-3">
                {weakAreas.map((area, i) => (
                  <li
                    key={area.name}
                    className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 hover:bg-white/50 ${area.bgColor}`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={`h-2 w-2 shrink-0 rounded-full ${area.color} animate-pulse-soft`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary">{area.name}</div>
                      <div className="text-xs text-text-muted">掌握度较低，建议加强复习</div>
                    </div>
                    <div className={`text-sm font-semibold ${area.textColor}`}>{area.score}%</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-50">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <p className="mt-3 text-sm text-text-secondary">暂无薄弱领域，继续保持！</p>
              </div>
            )}
            <button
              onClick={() => navigate('/report')}
              className="mt-4 w-full rounded-xl bg-primary-50/80 px-4 py-2.5 text-sm font-semibold text-primary-600 transition-all duration-300 hover:bg-primary-100 hover:shadow-sm"
            >
              查看完整报告
            </button>
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500 p-8 shadow-glow-lg transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '300ms' }}
        >
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col items-center text-center text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md mb-4">
              <Zap className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">准备好提升自己了吗？</h2>
            <p className="text-white/80 mb-6 max-w-md">
              上传你的笔记，AI帮你提炼知识点，智能出题检测掌握程度
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => navigate('/upload')}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
              >
                <CloudUpload className="h-5 w-5" />
                上传笔记
              </button>
              <button
                onClick={() => navigate('/review')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white/50 active:scale-[0.98]"
              >
                <Brain className="h-5 w-5" />
                开始复习
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
