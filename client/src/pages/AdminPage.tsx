import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  BookOpen,
  Brain,
  CheckCircle,
  XCircle,
  Edit3,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from 'lucide-react';
import { adminApi, type AdminUser, type UserStats } from '@/services/admin';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/formatDate';

export function AdminPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({});
  const [statsLoading, setStatsLoading] = useState<Record<string, boolean>>({});
  const [editUser, setEditUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ password: '', email: '' });
  const [message, setMessage] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(userId);
    if (!userStats[userId]) {
      setStatsLoading((prev) => ({ ...prev, [userId]: true }));
      try {
        const stats = await adminApi.getUserStats(userId);
        setUserStats((prev) => ({ ...prev, [userId]: stats }));
      } catch (err: any) {
        setMessage(err?.response?.data?.message || '获取统计失败');
      } finally {
        setStatsLoading((prev) => ({ ...prev, [userId]: false }));
      }
    }
  };

  const handleUpdateUser = async (userId: string) => {
    if (!editForm.password && !editForm.email) {
      setMessage('请填写要修改的内容');
      return;
    }
    try {
      const data: { password?: string; email?: string } = {};
      if (editForm.password) data.password = editForm.password;
      if (editForm.email) data.email = editForm.email;
      await adminApi.updateUser(userId, data);
      setMessage('修改成功');
      setEditUser(null);
      setEditForm({ password: '', email: '' });
      loadUsers();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || '修改失败');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!confirm(`确定要将该用户设为 ${newRole === 'admin' ? '管理员' : '普通用户'} 吗？`)) return;
    try {
      await adminApi.updateUserRole(userId, newRole);
      setMessage('角色修改成功');
      loadUsers();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || '修改角色失败');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <Shield className="mb-4 h-12 w-12 text-red-300" />
        <p className="text-lg font-medium">无权限访问</p>
        <p className="mt-1 text-sm">该页面仅管理员可见</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {message && (
        <div className="flex items-center justify-between rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-yellow-600 hover:text-yellow-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-xs text-text-muted">总用户数</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {users.reduce((sum, u) => sum + u.noteCount, 0)}
              </div>
              <div className="text-xs text-text-muted">总笔记数</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {users.reduce((sum, u) => sum + u.reviewCount, 0)}
              </div>
              <div className="text-xs text-text-muted">总答题数</div>
            </div>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="rounded-2xl border border-border/60 bg-bg-card shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-5 w-5 text-primary" />
            用户管理
          </h3>
        </div>
        {loading ? (
          <div className="py-10 text-center text-sm text-text-muted">加载中…</div>
        ) : users.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-muted">暂无用户</div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div key={user.id} className="px-5 py-4">
                {/* 用户概览行 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light text-sm font-bold text-white">
                      {user.nickname?.[0] || user.phone?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {user.nickname || user.phone || user.email || '未命名'}
                        </span>
                        {user.role === 'admin' && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                            管理员
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {user.phone && `手机号: ${user.phone}`}
                        {user.phone && user.email && ' · '}
                        {user.email && `邮箱: ${user.email}`}
                        {' · '}
                        注册: {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="mr-4 text-right text-xs text-text-muted">
                      <div>{user.noteCount} 笔记</div>
                      <div>{user.reviewCount} 答题</div>
                    </div>
                    {user.id !== currentUser?.id && (
                      <>
                        <button
                          onClick={() => handleUpdateRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                            user.role === 'admin'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                          title={user.role === 'admin' ? '降级为普通用户' : '设为管理员'}
                        >
                          {user.role === 'admin' ? '降级' : '提权'}
                        </button>
                        <button
                          onClick={() => {
                            setEditUser(editUser === user.id ? null : user.id);
                            setEditForm({ password: '', email: user.email || '' });
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-primary/5 hover:text-primary"
                          title="编辑"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => toggleExpand(user.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-primary/5 hover:text-primary"
                      title="查看详情"
                    >
                      {expandedUser === user.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 编辑表单 */}
                {editUser === user.id && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-text-secondary">
                          新密码（留空则不修改）
                        </label>
                        <input
                          type="password"
                          value={editForm.password}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, password: e.target.value }))
                          }
                          placeholder="至少4位"
                          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary-light"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-text-secondary">
                          邮箱
                        </label>
                        <input
                          type="text"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, email: e.target.value }))
                          }
                          placeholder="用户邮箱"
                          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary-light"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={() => setEditUser(null)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-all hover:bg-slate-100"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleUpdateUser(user.id)}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-primary-dark"
                      >
                        <Save className="h-3 w-3" /> 保存
                      </button>
                    </div>
                  </div>
                )}

                {/* 展开详情 */}
                {expandedUser === user.id && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-4">
                    {statsLoading[user.id] ? (
                      <div className="py-4 text-center text-sm text-text-muted">加载统计中…</div>
                    ) : userStats[user.id] ? (
                      <div className="space-y-4">
                        {/* 统计数据 */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-lg bg-white p-3 text-center">
                            <div className="text-lg font-bold text-primary">
                              {userStats[user.id].stats.noteCount}
                            </div>
                            <div className="text-[11px] text-text-muted">笔记数</div>
                          </div>
                          <div className="rounded-lg bg-white p-3 text-center">
                            <div className="text-lg font-bold text-primary">
                              {userStats[user.id].stats.knowledgePointCount}
                            </div>
                            <div className="text-[11px] text-text-muted">知识点</div>
                          </div>
                          <div className="rounded-lg bg-white p-3 text-center">
                            <div className="text-lg font-bold text-primary">
                              {userStats[user.id].stats.reviewCount}
                            </div>
                            <div className="text-[11px] text-text-muted">答题数</div>
                          </div>
                          <div className="rounded-lg bg-white p-3 text-center">
                            <div className="text-lg font-bold text-green-600">
                              {userStats[user.id].stats.accuracy}%
                            </div>
                            <div className="text-[11px] text-text-muted">正确率</div>
                          </div>
                        </div>

                        {/* 最近笔记 */}
                        {userStats[user.id].recentNotes.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-xs font-semibold text-text-secondary">
                              最近笔记
                            </h4>
                            <div className="space-y-2">
                              {userStats[user.id].recentNotes.map((note) => (
                                <div
                                  key={note.id}
                                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                                >
                                  <div className="flex items-center gap-2">
                                    {note.status === 'completed' ? (
                                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                    ) : note.status === 'analyzing' ? (
                                      <div className="h-3.5 w-3.5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                                    ) : (
                                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                                    )}
                                    <span className="text-sm">{note.title}</span>
                                  </div>
                                  <span className="text-[11px] text-text-muted">
                                    {formatDate(note.createdAt)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-sm text-text-muted">暂无数据</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
