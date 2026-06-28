import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Trash2,
  LogOut,
  Feather,
  Save,
  AlertCircle,
  CheckCircle,
  Smartphone,
  Mail,
  Calendar,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/auth';

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);

  // 昵称编辑
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [savingNickname, setSavingNickname] = useState(false);
  const [nicknameMsg, setNicknameMsg] = useState('');

  // 密码修改
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  // 清除数据
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSaveNickname = async () => {
    const val = nickname.trim();
    if (!val) {
      setNicknameMsg('昵称不能为空');
      return;
    }
    setSavingNickname(true);
    setNicknameMsg('');
    try {
      const res = await authApi.updateNickname(val);
      updateUser(res.user);
      setNicknameMsg('昵称已保存');
      setTimeout(() => setNicknameMsg(''), 2000);
    } catch (e: any) {
      setNicknameMsg(e.response?.data?.message || '保存失败');
    } finally {
      setSavingNickname(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      setPasswordMsg('请填写完整');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg('新密码至少4位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('两次输入的新密码不一致');
      return;
    }
    setSavingPassword(true);
    setPasswordMsg('');
    try {
      await authApi.updatePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('密码修改成功');
      setTimeout(() => setPasswordMsg(''), 2000);
    } catch (e: any) {
      setPasswordMsg(e.response?.data?.message || '修改失败');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleClearData = async () => {
    setClearing(true);
    try {
      await authApi.clearData();
      setShowClearConfirm(false);
      alert('所有学习数据已清除');
      window.location.reload();
    } catch (e: any) {
      alert(e.response?.data?.message || '清除失败');
    } finally {
      setClearing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-[720px] space-y-5">
      {/* 个人资料 */}
      <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
        <h3 className="mb-5 flex items-center gap-2 text-base font-semibold">
          <User className="h-5 w-5 text-primary" />
          个人资料
        </h3>

        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-light to-accent text-xl font-semibold text-white">
            {user?.nickname?.[0] || user?.phone?.[0] || user?.email?.[0] || 'U'}
          </div>
          <div>
            <div className="font-semibold">{user?.nickname || '用户'}</div>
            <div className="text-[13px] text-text-muted">
              {user?.phone || user?.email || '未绑定'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
              昵称
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
              <button
                onClick={handleSaveNickname}
                disabled={savingNickname}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {savingNickname ? '保存中…' : '保存'}
              </button>
            </div>
            {nicknameMsg && (
              <div className={`mt-1.5 flex items-center gap-1 text-xs ${nicknameMsg.includes('成功') || nicknameMsg.includes('已保存') ? 'text-green-600' : 'text-red-500'}`}>
                {nicknameMsg.includes('成功') || nicknameMsg.includes('已保存') ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {nicknameMsg}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">手机号</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-slate-100 px-4 py-2.5 text-sm text-text-muted">
                <Smartphone className="h-4 w-4 text-text-muted/60" />
                {user?.phone || '未绑定'}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">邮箱</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-slate-100 px-4 py-2.5 text-sm text-text-muted">
                <Mail className="h-4 w-4 text-text-muted/60" />
                {user?.email || '未绑定'}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">注册时间</label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-slate-100 px-4 py-2.5 text-sm text-text-muted">
              <Calendar className="h-4 w-4 text-text-muted/60" />
              {formatDate(user?.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* 账户安全 */}
      <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
        <h3 className="mb-5 flex items-center gap-2 text-base font-semibold">
          <Shield className="h-5 w-5 text-secondary" />
          账户安全
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">旧密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted/60" />
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入当前密码"
                className="w-full rounded-xl border border-border bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">新密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted/60" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少4位"
                className="w-full rounded-xl border border-border bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">确认新密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted/60" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="w-full rounded-xl border border-border bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-secondary to-secondary/80 px-4 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {savingPassword ? '修改中…' : '修改密码'}
          </button>

          {passwordMsg && (
            <div className={`flex items-center gap-1 text-xs ${passwordMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
              {passwordMsg.includes('成功') ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {passwordMsg}
            </div>
          )}
        </div>
      </div>

      {/* 数据管理 */}
      <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
        <h3 className="mb-5 flex items-center gap-2 text-base font-semibold">
          <Trash2 className="h-5 w-5 text-red-500" />
          数据管理
        </h3>

        <div className="space-y-4">
          <div className="rounded-xl bg-red-50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-red-700">
              <AlertCircle className="h-4 w-4" /> 清除所有学习数据
            </div>
            <p className="text-xs text-red-600">
              此操作将删除你所有的笔记、知识点、题目和答题记录，但会保留你的账号信息。清除后无法恢复，请谨慎操作。
            </p>
          </div>

          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-500 transition-all hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> 清除所有学习数据
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearData}
                disabled={clearing}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {clearing ? '清除中…' : '确认清除'}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-all hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 退出登录 */}
      <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
        <h3 className="mb-5 flex items-center gap-2 text-base font-semibold">
          <LogOut className="h-5 w-5 text-text-secondary" />
          退出登录
        </h3>
        <p className="mb-4 text-sm text-text-secondary">退出后将需要重新输入账号密码登录。</p>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-2.5 text-sm font-semibold text-text-secondary transition-all hover:border-primary-light hover:text-primary hover:bg-primary/[0.04]"
        >
          <LogOut className="h-4 w-4" /> 退出当前账号
        </button>
      </div>

      {/* Footer */}
      <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03] p-5 text-center">
        <p className="text-[13px] text-text-muted">
          <Feather className="mr-1 inline h-4 w-4 text-primary" />
          栩格 v1.0 · 把你的知识管起来，让遗忘有据可查
        </p>
      </div>
    </div>
  );
}
