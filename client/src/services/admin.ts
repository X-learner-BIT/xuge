import { api } from './api';

export interface AdminUser {
  id: string;
  phone: string | null;
  email: string | null;
  nickname: string | null;
  role: string;
  createdAt: string;
  noteCount: number;
  reviewCount: number;
}

export interface UserStats {
  user: {
    id: string;
    phone: string | null;
    email: string | null;
    nickname: string | null;
    role: string;
    createdAt: string;
  };
  stats: {
    noteCount: number;
    knowledgePointCount: number;
    questionCount: number;
    reviewCount: number;
    correctCount: number;
    accuracy: number;
  };
  recentNotes: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }[];
}

export const adminApi = {
  getUsers: () => api.get<AdminUser[]>('/admin/users').then((res) => res.data),
  getUserStats: (userId: string) =>
    api.get<UserStats>(`/admin/users/${userId}/stats`).then((res) => res.data),
  updateUser: (userId: string, data: { password?: string; email?: string }) =>
    api.put<{ user: AdminUser }>(`/admin/users/${userId}`, data).then((res) => res.data),
  updateUserRole: (userId: string, role: string) =>
    api.put<{ user: AdminUser }>(`/admin/users/${userId}/role`, { role }).then((res) => res.data),
  deleteNote: (noteId: string) =>
    api.delete<{ success: boolean }>(`/admin/notes/${noteId}`).then((res) => res.data),
};
