import { useState, useRef, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

interface Props {
  onFileSelect: (file: File) => void;
}

export function DropZone({ onFileSelect }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) {
        setFile(dropped);
        onFileSelect(dropped);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) {
        setFile(selected);
        onFileSelect(selected);
      }
    },
    [onFileSelect]
  );

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-2xl border-2 border-dashed bg-slate-50 px-10 py-14 text-center transition-all duration-300 ${
          dragOver
            ? 'border-primary-light bg-primary/[0.04]'
            : 'border-border hover:border-primary-light hover:bg-primary/[0.04]'
        }`}
      >
        <Upload className="mx-auto mb-4 h-12 w-12 text-primary-light" />
        <h4 className="mb-1.5 text-lg font-semibold">拖拽文件到此处</h4>
        <p className="text-sm text-text-muted">或点击选择文件 · 支持 PDF、Word（.docx）</p>
        {file && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            <FileText className="h-4 w-4" />
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
