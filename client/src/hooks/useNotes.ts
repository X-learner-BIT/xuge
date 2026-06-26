import { useState, useCallback, useEffect } from 'react';
import { notesApi } from '@/services/notes';
import type { Note } from '@/types';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async (params?: { search?: string; domain?: string }) => {
    setLoading(true);
    try {
      const data = await notesApi.getNotes(params);
      setNotes(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取笔记失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file: File, title?: string) => {
    setLoading(true);
    try {
      const data = await notesApi.uploadFile(file, title);
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || '上传失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTextNote = useCallback(async (title: string, content: string) => {
    setLoading(true);
    try {
      const data = await notesApi.createTextNote(title, content);
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || '提交失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    try {
      await notesApi.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, error, fetchNotes, uploadFile, createTextNote, deleteNote };
}
