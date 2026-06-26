import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotesListPage } from '@/pages/NotesListPage';
import { NoteDetailPage } from '@/pages/NoteDetailPage';
import { UploadPage } from '@/pages/UploadPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { ReportPage } from '@/pages/ReportPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useAuthStore } from '@/store/authStore';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/notes" element={<NotesListPage />} />
        <Route path="/note/:id" element={<NoteDetailPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
