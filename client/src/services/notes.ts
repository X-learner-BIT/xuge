import { api } from './api';
import type { Note } from '@/types';

export const notesApi = {
  getNotes: (params?: { search?: string; domain?: string }) =>
    api.get<Note[]>('/notes', { params }).then((res) => res.data),
  getNote: (id: string) =>
    api.get<Note & { knowledgePoints: any[] }>(`/notes/${id}`).then((res) => res.data),
  uploadFile: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return api
      .post<{ id: string; title: string; status: string }>('/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
  createTextNote: (title: string, content: string) =>
    api
      .post<{ id: string; title: string; status: string }>('/notes/text', { title, content })
      .then((res) => res.data),
  deleteNote: (id: string) =>
    api.delete<{ success: boolean }>(`/notes/${id}`).then((res) => res.data),
};
