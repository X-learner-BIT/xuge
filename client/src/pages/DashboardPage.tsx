import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Play,
  CloudUpload,
  Brain,
} from 'lucide-react';
import { RadarChartComponent } from '@/components/RadarChart';
import { ProgressBar } from '@/components/ProgressBar';
import { useReview } from '@/hooks/useReview';

const statCards = [
  {
    icon: BookOpen,
    value: '12',
    label: '笔记总数',
    change: '+3 本周',
    changeColor: 'text-green-600',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: Lightbulb,
    value: '86',
    label: '知识点',
    change: '+12 本周',
    changeColor: 'text-green-600',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
  },
  {
    icon: CheckCircle,
    value: '347',
    label: '复习题完成',
    change: '+28 本周',
    changeColor: 'text-green-600',
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-600',
  },
  {
    icon: AlertTriangle,
    value: '3',
    label: '薄弱领域',
    change: '需要关注',
    changeColor: 'text-red-500',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
  },
];

const radarData = [
  { domain: '经济学', current: 32, previous: 28 },
  { domain: '计算机', current: 54, previous: 48 },
  { domain: '管理学', current: 61, previous: 58 },
  { domain: '数据结构', current: 78, previous: 72 },
  { domain: '数据库', current: 85, previous: 80 },
  { domain: 'AI', current: 45, previous: 40 },
];

const weakAreas = [
  { name: '经济学', points: '边际效应递减、凯恩斯主义', score: 32, color: 'bg-red-500', textColor: 'text-red-500' },
  { name: '计算机科学', points: '二叉树遍历、动态规划', score: 54, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { name: '管理学', points: 'SWOT 分析、波特五力', score: 61, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { name: '数据结构', points: '数组、链表、栈与队列', score: 78, color: 'bg-green-500', textColor: 'text-green-600' },
  { name: '数据库', points: 'SQL、索引、事务', score: 85, color: 'bg-green-500', textColor: 'text-green-600' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { fetchDomainMastery } = useReview();

  useEffect(() => {
    fetchDomainMastery();
  }, [fetchDomainMastery]);

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
            >
              <card.icon className="h-5 w-5" />
            </div>
            <div className="text-[28px] font-bold tracking-tight">{card.value}</div>
            <div className="mt-1 text-[13px] text-text-secondary">{card.label}</div>
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${card.changeColor}`}>
              {card.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          {/* Radar Chart */}
          <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Brain className="h-5 w-5 text-primary" />
                知识全景图
              </h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                今日更新
              </span>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <RadarChartComponent data={radarData} showPrevious />
              </div>
            </div>
          </div>

          {/* Progress & Trend Row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <CheckCircle className="h-5 w-5 text-secondary" />
                  今日复习进度
                </h3>
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-700">
                  3/10 题
                </span>
              </div>
              <ProgressBar value={3} max={10} />
              <p className="mt-3 text-[13px] text-text-secondary">
                今日已完成 <strong>3</strong> 题，剩余 <strong>7</strong> 题
              </p>
              <button
                onClick={() => navigate('/review')}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
              >
                <Play className="h-3.5 w-3.5" /> 继续复习
              </button>
            </div>

            <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
                <Lightbulb className="h-5 w-5 text-accent" />
                掌握趋势
              </h3>
              <div className="flex h-[180px] items-end justify-between gap-2">
                {[58, 60, 62, 59, 65, 68, 72].map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary/80 to-primary/30 transition-all duration-500"
                      style={{ height: `${v * 1.8}px` }}
                    />
                    <span className="text-[10px] text-text-muted">
                      {['6/17', '6/18', '6/19', '6/20', '6/21', '6/22', '6/23'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weak Areas */}
        <div className="h-fit rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              薄弱领域
            </h3>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
              3 项
            </span>
          </div>
          <ul className="space-y-3">
            {weakAreas.map((area) => (
              <li key={area.name} className="flex items-center gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div className={`h-2 w-2 shrink-0 rounded-full ${area.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{area.name}</div>
                  <div className="truncate text-xs text-text-muted">知识点：{area.points}</div>
                </div>
                <div className={`text-sm font-semibold ${area.textColor}`}>{area.score}%</div>
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/report')}
            className="mt-3 w-full rounded-xl bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary/10"
          >
            查看完整报告
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-8 py-3.5 text-[15px] font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
        >
          <CloudUpload className="h-5 w-5" /> 上传笔记
        </button>
        <button
          onClick={() => navigate('/review')}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-8 py-3.5 text-[15px] font-semibold text-text-secondary transition-all duration-300 hover:border-primary-light hover:text-primary hover:bg-primary/[0.04]"
        >
          <Brain className="h-5 w-5" /> 开始复习
        </button>
      </div>
    </div>
  );
}
