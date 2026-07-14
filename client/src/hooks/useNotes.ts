import { useState, useCallback, useEffect } from 'react';
import { notesApi } from '@/services/notes';
import type { Note } from '@/types';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; totalPages: number }>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchNotes = useCallback(async (params?: { search?: string; domain?: string; source?: string; page?: number; pageSize?: number }) => {
    setLoading(true);
    try {
      const result = await notesApi.getNotes(params);
      setNotes(result.data);
      setPagination(result.pagination);
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
      const msg = err.response?.data?.message || err.message || '上传失败';
      setError(msg);
      throw new Error(msg);
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

  const updateNote = useCallback(async (id: string, data: { title?: string; content?: string }) => {
    try {
      const updated = await notesApi.updateNote(id, data);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      setError(null);
      return updated;
    } catch (err: any) {
      setError(err.response?.data?.message || '更新失败');
      return null;
    }
  }, []);

  const reanalyzeNote = useCallback(async (id: string) => {
    try {
      const data = await notesApi.reanalyzeNote(id);
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || '重新分析失败');
      return null;
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, error, pagination, fetchNotes, uploadFile, createTextNote, deleteNote, updateNote, reanalyzeNote };
}
