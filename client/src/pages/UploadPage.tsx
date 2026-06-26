import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Pen, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { DropZone } from '@/components/DropZone';
import { useNotes } from '@/hooks/useNotes';

const recentUploads = [
  { title: '微观经济学原理', status: 'completed', points: 8 },
  { title: '数据结构与算法', status: 'completed', points: 12 },
  { title: '机器学习笔记', status: 'analyzing', points: 0 },
];

export function UploadPage() {
  const navigate = useNavigate();
  const { uploadFile, createTextNote, loading } = useNotes();
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  const handleFileSelect = async (file: File) => {
    const res = await uploadFile(file);
    if (res) {
      navigate(`/note/${res.id}`);
    }
  };

  const handleTextSubmit = async () => {
    if (!textTitle.trim() || !textContent.trim()) return;
    const res = await createTextNote(textTitle, textContent);
    if (res) {
      navigate(`/note/${res.id}`);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_2fr]">
      <div className="space-y-5">
        {/* File Upload */}
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <FolderOpen className="h-5 w-5 text-primary" />
            上传文件
          </h3>
          <DropZone onFileSelect={handleFileSelect} />
          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-yellow-50 py-3 text-sm font-medium text-yellow-700">
              <Clock className="h-4 w-4 animate-spin" />
              AI 正在分析你的笔记…
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Pen className="h-5 w-5 text-secondary" />
            直接输入文字
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                笔记标题
              </label>
              <input
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="例如：微观经济学第三章"
                className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                笔记内容
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="粘贴或输入你的笔记内容…"
                rows={6}
                className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm leading-relaxed text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
            <button
              onClick={handleTextSubmit}
              disabled={loading || !textTitle.trim() || !textContent.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" /> 提交并让 AI 分析
            </button>
          </div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="h-fit rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Clock className="h-5 w-5 text-accent" />
          最近上传
        </h3>
        <ul className="space-y-3">
          {recentUploads.map((item) => (
            <li
              key={item.title}
              onClick={() => navigate('/notes')}
              className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all hover:bg-slate-50"
            >
              <div
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  item.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs text-text-muted">
                  {item.status === 'completed'
                    ? `完成分析 · ${item.points} 个知识点`
                    : '正在分析中…'}
                </div>
              </div>
              {item.status === 'completed' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  <CheckCircle className="h-3 w-3" /> 完成
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                  分析中
                </span>
              )}
            </li>
          ))}
        </ul>
        <button
          onClick={() => navigate('/notes')}
          className="mt-3 w-full rounded-xl border border-border bg-bg-card py-2.5 text-sm font-medium text-text-secondary transition-all duration-300 hover:border-primary-light hover:text-primary hover:bg-primary/[0.04]"
        >
          查看全部笔记 →
        </button>
      </div>
    </div>
  );
}
