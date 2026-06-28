import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Pen,
  Sparkles,
  CheckCircle,
  Clock,
  FileText,
  Lightbulb,
  FileCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import { DropZone } from '@/components/DropZone';
import { useNotes } from '@/hooks/useNotes';
import { notesApi } from '@/services/notes';
import { formatDate } from '@/utils/formatDate';

export function UploadPage() {
  const navigate = useNavigate();
  const { notes, uploadFile, createTextNote, loading: notesLoading } = useNotes();
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');

  // 文件上传流程状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<
    'idle' | 'uploading' | 'analyzing' | 'completed' | 'failed'
  >('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzingNoteId, setAnalyzingNoteId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setAnalysisStatus('idle');
    setUploadError(null);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setAnalysisStatus('idle');
    setUploadError(null);
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;
    setUploadError(null);
    setAnalysisStatus('uploading');

    try {
      const res = await uploadFile(selectedFile);
      if (!res) {
        setAnalysisStatus('idle');
        setUploadError('上传失败，服务器未返回数据');
        return;
      }

      setAnalyzingNoteId(res.id);
      setAnalysisStatus('analyzing');

      // 开始轮询分析状态
      pollTimerRef.current = setInterval(async () => {
        try {
          const note = await notesApi.getNote(res.id);
          if (note.status === 'completed') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setAnalysisStatus('completed');
            showToastMessage('AI 分析完成！', 'success');
            setTimeout(() => {
              navigate(`/note/${res.id}`);
            }, 1500);
          } else if (note.status === 'failed') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setAnalysisStatus('failed');
            showToastMessage('AI 分析失败，请前往笔记详情页重试', 'error');
            setTimeout(() => {
              navigate(`/note/${res.id}`);
            }, 2000);
          }
        } catch {
          // 轮询出错继续等待
        }
      }, 3000);
    } catch (err: any) {
      setAnalysisStatus('idle');
      const backendMsg = err?.response?.data?.detail || err?.response?.data?.message;
      const msg = backendMsg || err?.message || '上传失败，请检查网络连接或文件格式后重试';
      setUploadError(msg);
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleTextSubmit = async () => {
    if (!textTitle.trim() || !textContent.trim()) return;
    const res = await createTextNote(textTitle, textContent);
    if (res) {
      navigate(`/note/${res.id}`);
    }
  };

  // 取最近 5 条真实笔记作为"最近上传"
  const recentNotes = notes.slice(0, 5);

  const isAnalyzing = analysisStatus === 'uploading' || analysisStatus === 'analyzing';
  const isValidFormat = selectedFile
    ? selectedFile.name.toLowerCase().endsWith('.pdf') || selectedFile.name.toLowerCase().endsWith('.docx')
    : false;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_2fr]">
      {/* Toast */}
      {showToast && (
        <div
          className={`fixed right-5 top-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toastType === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toastType === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {toastMessage}
        </div>
      )}

      <div className="space-y-5">
        {/* Upload Tabs */}
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'file'
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-primary'
                  : 'border border-border text-text-secondary hover:border-primary-light hover:text-primary'
              }`}
            >
              <FolderOpen className="h-4 w-4" /> 上传文件
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'text'
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-primary'
                  : 'border border-border text-text-secondary hover:border-primary-light hover:text-primary'
              }`}
            >
              <Pen className="h-4 w-4" /> 输入文字
            </button>
          </div>

          {activeTab === 'file' ? (
            <div>
              {!selectedFile ? (
                <DropZone onFileSelect={handleFileSelect} />
              ) : (
                <div className="space-y-4">
                  {/* 已选文件卡片 */}
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-light text-white">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{selectedFile.name}</div>
                      <div className="text-xs text-text-muted">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB ·{' '}
                        {selectedFile.name.endsWith('.pdf') ? 'PDF' : 'Word'}
                      </div>
                    </div>
                    <button
                      onClick={clearSelectedFile}
                      disabled={isAnalyzing}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 开始分析按钮 */}
                  <button
                    onClick={startAnalysis}
                    disabled={isAnalyzing || !isValidFormat}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover disabled:opacity-50 ${
                      isValidFormat
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white'
                        : 'bg-slate-300 text-white cursor-not-allowed'
                    }`}
                  >
                    {analysisStatus === 'uploading' ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" /> 正在上传…
                      </>
                    ) : analysisStatus === 'analyzing' ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" /> AI 分析中…
                      </>
                    ) : analysisStatus === 'completed' ? (
                      <>
                        <CheckCircle className="h-4 w-4" /> 分析完成
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> 开始 AI 分析
                      </>
                    )}
                  </button>

                  {/* 状态提示 */}
                  {!isValidFormat && selectedFile && (
                    <div className="rounded-xl bg-orange-50 px-4 py-3 text-center text-sm text-orange-700">
                      <AlertCircle className="mx-auto mb-1 h-4 w-4" />
                      文件格式不支持。系统仅支持 PDF 和 Word（.docx）格式，请更换文件后重试。
                    </div>
                  )}
                  {uploadError && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                      {uploadError}
                    </div>
                  )}
                  {analysisStatus === 'analyzing' && (
                    <div className="rounded-xl bg-yellow-50 px-4 py-3 text-center text-sm text-yellow-700">
                      AI 正在提取知识点和生成摘要，请稍候…
                    </div>
                  )}
                  {analysisStatus === 'failed' && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                      AI 分析失败，请前往笔记详情页手动重新分析。
                    </div>
                  )}
                </div>
              )}
              <p className="mt-3 text-center text-xs text-text-muted">
                支持 PDF、Word（.docx）· 最大 50MB
              </p>
            </div>
          ) : (
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
                  rows={8}
                  className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm leading-relaxed text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                />
              </div>
              <button
                onClick={handleTextSubmit}
                disabled={notesLoading || !textTitle.trim() || !textContent.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" /> 提交并让 AI 分析
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="h-fit rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Clock className="h-5 w-5 text-accent" />
          最近上传
        </h3>

        {recentNotes.length > 0 ? (
          <ul className="space-y-3">
            {recentNotes.map((note) => (
              <li
                key={note.id}
                onClick={() => navigate(`/note/${note.id}`)}
                className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all hover:bg-slate-50"
              >
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
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{note.title}</div>
                  <div className="text-xs text-text-muted">
                    {formatDate(note.createdAt)} ·{' '}
                    {note.status === 'completed'
                      ? `${note.knowledgePoints?.length || 0} 个知识点`
                      : note.status === 'analyzing'
                      ? 'AI 分析中…'
                      : '分析失败'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {note.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      <CheckCircle className="h-3 w-3" /> 完成
                    </span>
                  ) : note.status === 'analyzing' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                      分析中
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                      失败
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center text-sm text-text-muted">
            <Lightbulb className="mx-auto mb-2 h-8 w-8 text-text-muted/40" />
            还没有上传记录，快去添加第一篇笔记吧
          </div>
        )}
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
