import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NoteCard } from '@/components/NoteCard';
import { EmptyState } from '@/components/EmptyState';
import { useNotes } from '@/hooks/useNotes';
import { formatDate } from '@/utils/formatDate';

type ViewMode = 'card' | 'list';

export function NotesListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notes, loading, pagination, deleteNote, fetchNotes } = useNotes();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [currentPage, setCurrentPage] = useState(1);

  // 根据来源筛选加载笔记
  useEffect(() => {
    const params: { search?: string; page?: number; pageSize?: number } = {};
    const q = searchParams.get('search');
    if (q) params.search = q;
    params.page = currentPage;
    params.pageSize = 10;
    fetchNotes(params);
  }, [searchParams, fetchNotes, currentPage]);

  // 从 URL 参数读取搜索关键词
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearch(q);
  }, [searchParams]);

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = search.trim();
      if (q) {
        navigate(`/notes?search=${encodeURIComponent(q)}`, { replace: true });
      } else {
        navigate('/notes', { replace: true });
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条笔记吗？删除后无法恢复。')) return;
    await deleteNote(id);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center rounded-xl border px-3 py-2 text-sm transition-all ${
              viewMode === 'card'
                ? 'border-primary-light bg-primary/[0.06] font-medium text-primary'
                : 'border-border bg-bg-card text-text-secondary hover:border-primary-light hover:text-primary'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="ml-2">卡片</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center rounded-xl border px-3 py-2 text-sm transition-all ${
              viewMode === 'list'
                ? 'border-primary-light bg-primary/[0.06] font-medium text-primary'
                : 'border-border bg-bg-card text-text-secondary hover:border-primary-light hover:text-primary'
            }`}
          >
            <ListIcon className="h-4 w-4" />
            <span className="ml-2">列表</span>
          </button>
          
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
        >
          <Plus className="h-4 w-4" /> 新建笔记
        </button>
      </div>

      {/* Search */}
      <div className="mb-5 flex items-center rounded-xl border border-border bg-bg-card px-4 py-2.5 transition-all focus-within:border-primary-light focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]">
        <Search className="h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="搜索笔记标题、标签，按回车确认..."
          className="ml-3 flex-1 border-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
        />
        {search && (
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-text-muted">
            {filtered.length} 条结果
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-sm text-text-muted">加载中…</div>
      ) : filtered.length > 0 ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => navigate(`/note/${note.id}`)}
              />
            ))}
            {/* Upload placeholder card */}
            <div
              onClick={() => navigate('/upload')}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card p-5 text-center transition-all duration-300 hover:border-primary-light hover:bg-primary/[0.02]"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-primary-light text-white">
                <Plus className="h-4 w-4" />
              </div>
              <div className="text-[15px] font-semibold text-text-secondary">上传新笔记…</div>
              <p className="mt-1 text-xs text-text-muted">点击或拖拽上传</p>
              <p className="mt-2 text-xs text-text-muted">支持 PDF / Word / 文字</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-bg-card shadow-card">
            {/* List header */}
            <div className="grid grid-cols-[1fr_100px_100px_120px_80px] gap-3 border-b border-border px-5 py-3 text-xs font-semibold text-text-muted">
              <div>笔记信息</div>
              <div className="text-center">状态</div>
              <div className="text-center">知识点</div>
              <div className="text-center">上传时间</div>
              <div className="text-center">操作</div>
            </div>
            {/* List items */}
            <ul>
              {filtered.map((note, idx) => (
                <li
                  key={note.id}
                  onClick={() => navigate(`/note/${note.id}`)}
                  className={`grid cursor-pointer grid-cols-[1fr_100px_100px_120px_80px] items-center gap-3 px-5 py-3 transition-all hover:bg-slate-50 ${
                    idx < filtered.length - 1 ? 'border-b border-slate-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${
                        note.contentType === 'pdf'
                          ? 'from-primary to-primary-light'
                          : note.contentType === 'docx'
                          ? 'from-secondary to-secondary-light'
                          : 'from-accent to-purple-300'
                      } text-white`}
                    >
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{note.title}</div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-text-muted">
                            +{note.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    {note.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                        <CheckCircle className="h-3 w-3" /> 完成
                      </span>
                    ) : note.status === 'analyzing' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                        <Clock className="h-3 w-3" /> 分析中
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                        <AlertCircle className="h-3 w-3" /> 失败
                      </span>
                    )}
                  </div>

                  <div className="text-center text-sm text-text-secondary">
                    {note.knowledgePoints?.length || 0} 个
                  </div>

                  <div className="text-center text-xs text-text-muted">
                    {formatDate(note.createdAt)}
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      onClick={(e) => handleDelete(e, note.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-red-50 hover:text-red-500"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : (
        <EmptyState
          title="还没有笔记"
          description="先去上传一篇笔记，让 AI 帮你提取知识点吧"
          action={
            <button
              onClick={() => navigate('/upload')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
            >
              <Plus className="h-4 w-4" /> 上传笔记
            </button>
          }
        />
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg-card text-sm text-text-secondary transition-all hover:border-primary-light hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 rounded-lg text-sm transition-all ${
                  currentPage === page
                    ? 'bg-primary text-white font-medium'
                    : 'border border-border bg-bg-card text-text-secondary hover:border-primary-light hover:text-primary'
                }`}
              >
                {page}
              </button>
            );
          })}
          {pagination.totalPages > 5 && (
            <span className="flex h-8 w-8 items-center justify-center text-sm text-text-muted">...</span>
          )}
          <button
            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage === pagination.totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg-card text-sm text-text-secondary transition-all hover:border-primary-light hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
