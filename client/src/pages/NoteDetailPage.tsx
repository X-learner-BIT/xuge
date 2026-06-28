import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, FileText, Tag, Trash2, Play, CheckCircle, Clock, AlertCircle, BookOpen, Sparkles, Lightbulb, RefreshCw, PenLine, Save, X } from 'lucide-react';
import { KnowledgePointCard } from '@/components/KnowledgePointCard';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/utils/formatDate';
import { notesApi } from '@/services/notes';
import { useNotes } from '@/hooks/useNotes';
import type { Note, KnowledgePoint } from '@/types';

type DetailTab = 'content' | 'ai';

export function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateNote } = useNotes();
  const [note, setNote] = useState<(Note & { knowledgePoints: KnowledgePoint[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('content');
  const [reanalyzing, setReanalyzing] = useState(false);

  // 编辑状态
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const loadNote = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await notesApi.getNote(id);
      setNote(data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || '获取笔记失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNote();
  }, [id]);

  // 分析中时轮询状态
  useEffect(() => {
    if (!note || note.status !== 'analyzing') return;
    const timer = setInterval(() => {
      loadNote();
    }, 3000);
    return () => clearInterval(timer);
  }, [note?.status, id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('确定要删除这篇笔记吗？')) return;
    try {
      await notesApi.deleteNote(id);
      navigate('/notes');
    } catch {
      alert('删除失败');
    }
  };

  const handleReanalyze = async () => {
    if (!id || !window.confirm('确定要重新分析这篇笔记吗？将清空现有分析结果。')) return;
    setReanalyzing(true);
    try {
      await notesApi.reanalyzeNote(id);
      setNote((prev) => (prev ? { ...prev, status: 'analyzing', aiSummary: null, tags: [], knowledgePoints: [] } : prev));
    } catch {
      alert('重新分析触发失败');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!id || !editTitle.trim()) return;
    setSaving(true);
    const updated = await updateNote(id, { title: editTitle.trim() });
    if (updated) {
      setNote(updated);
      setIsEditingTitle(false);
    } else {
      alert('保存失败');
    }
    setSaving(false);
  };

  const handleSaveContent = async () => {
    if (!id) return;
    setSaving(true);
    const updated = await updateNote(id, { content: editContent });
    if (updated) {
      setNote(updated);
      setIsEditingContent(false);
    } else {
      alert('保存失败');
    }
    setSaving(false);
  };

  const startEditTitle = () => {
    setEditTitle(note?.title || '');
    setIsEditingTitle(true);
  };

  const startEditContent = () => {
    setEditContent(note?.content || '');
    setIsEditingContent(true);
  };

  if (loading && !note) {
    return <div className="py-12 text-center text-sm text-text-muted">加载中…</div>;
  }

  if (error || !note) {
    return (
      <EmptyState
        title="笔记未找到"
        description={error || '该笔记不存在或已被删除'}
        action={
          <button
            onClick={() => navigate('/notes')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
          >
            返回笔记列表
          </button>
        }
      />
    );
  }

  const hasContent = !!note.content && note.content.trim().length > 0;
  const hasAiSummary = !!note.aiSummary && note.aiSummary.trim().length > 0;
  const hasKnowledgePoints = note.knowledgePoints && note.knowledgePoints.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="flex-1 rounded-xl border border-primary-light bg-white px-3 py-2 text-[22px] font-bold text-text-primary outline-none focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                disabled={saving || !editTitle.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-primary to-primary-dark px-3 py-2 text-xs font-semibold text-white shadow-primary transition-all hover:shadow-primary-hover disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" /> 保存
              </button>
              <button
                onClick={() => setIsEditingTitle(false)}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-secondary transition-all hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" /> 取消
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-[22px] font-bold">{note.title}</h2>
              <button
                onClick={startEditTitle}
                className="rounded-lg p-1.5 text-text-muted transition-all hover:bg-primary/10 hover:text-primary"
                title="修改标题"
              >
                <PenLine className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(note.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {note.contentType.toUpperCase()}
            </span>
            {note.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {note.tags.join('、')}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {note.status === 'completed' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <CheckCircle className="h-3 w-3" /> AI 分析完成
            </span>
          )}
          {note.status === 'analyzing' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
              <Clock className="h-3 w-3 animate-spin" /> AI 分析中…
            </span>
          )}
          {note.status === 'failed' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              <AlertCircle className="h-3 w-3" /> 分析失败
            </span>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {note.status === 'analyzing' && (
        <div className="flex items-center gap-3 rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <Clock className="h-4 w-4 animate-spin text-yellow-600" />
          <span>AI 正在分析笔记内容，请稍候… 页面会自动刷新结果。</span>
        </div>
      )}
      {note.status === 'failed' && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>AI 分析失败，可能是由于网络问题或内容格式不支持。</span>
          </div>
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-all hover:bg-red-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${reanalyzing ? 'animate-spin' : ''}`} />
            {reanalyzing ? '重新分析中…' : '重新分析'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab('content')}
          className={`relative px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'content'
              ? 'text-primary'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" /> 笔记内容
          </span>
          {activeTab === 'content' && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`relative px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'ai'
              ? 'text-primary'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> AI 分析
            {hasKnowledgePoints && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                {note.knowledgePoints.length}
              </span>
            )}
          </span>
          {activeTab === 'ai' && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t bg-primary" />
          )}
        </button>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <BookOpen className="h-4 w-4 text-primary" />
              原始内容
            </h3>
            <div className="flex items-center gap-2">
              {!isEditingContent && (
                <button
                  onClick={startEditContent}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-primary-light hover:text-primary"
                >
                  <PenLine className="h-3 w-3" /> 编辑内容
                </button>
              )}
              <button
                onClick={handleReanalyze}
                disabled={reanalyzing || note.status === 'analyzing'}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-primary-light hover:text-primary disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${reanalyzing || note.status === 'analyzing' ? 'animate-spin' : ''}`} />
                {note.status === 'analyzing'
                  ? 'AI 分析中…'
                  : reanalyzing
                  ? '重新分析中…'
                  : '重新分析'}
              </button>
            </div>
          </div>
          {isEditingContent ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={16}
                className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm leading-relaxed text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsEditingContent(false)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-4 py-2 text-xs font-medium text-text-secondary transition-all hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" /> 取消
                </button>
                <button
                  onClick={handleSaveContent}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-xs font-semibold text-white shadow-primary transition-all hover:shadow-primary-hover disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" /> {saving ? '保存中…' : '保存'}
                </button>
              </div>
            </div>
          ) : hasContent ? (
            <div className="max-h-[600px] overflow-auto rounded-xl bg-slate-50 p-5">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                {note.content}
              </pre>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-text-muted">
              {note.status === 'analyzing'
                ? 'AI 正在提取内容，请稍后再来查看…'
                : '暂无原始内容数据'}
            </div>
          )}
        </div>
      )}

      {/* AI Analysis Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-5">
          {/* AI Summary */}
          <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <Sparkles className="h-4 w-4 text-secondary" />
              AI 摘要
            </h3>
            {hasAiSummary ? (
              <div className="rounded-xl bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03] p-5">
                <p className="text-sm leading-relaxed text-text-secondary">{note.aiSummary}</p>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-text-muted">
                {note.status === 'analyzing'
                  ? 'AI 正在生成摘要，请稍后再来查看…'
                  : '暂无 AI 摘要'}
              </div>
            )}
          </div>

          {/* Knowledge Points */}
          <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <Lightbulb className="h-4 w-4 text-accent" />
              AI 提取知识点（{note.knowledgePoints?.length || 0} 个）
            </h3>
            {hasKnowledgePoints ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {note.knowledgePoints.map((kp) => (
                  <KnowledgePointCard key={kp.id} kp={kp} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-text-muted">
                {note.status === 'analyzing'
                  ? 'AI 正在提取知识点，请稍后再来查看…'
                  : '暂无知识点数据'}
              </div>
            )}
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => navigate('/review')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
        >
          <Play className="h-4 w-4" /> 开始复习这篇笔记
        </button>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-5 py-2.5 text-sm font-semibold text-text-secondary transition-all duration-300 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" /> 删除笔记
        </button>
      </div>
    </div>
  );
}
