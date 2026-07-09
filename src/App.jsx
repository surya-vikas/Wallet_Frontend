import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import ToastContainer from './components/ui/Toast';
import ThemeToggle from './components/ui/ThemeToggle';
import LoadingSpinner from './components/ui/LoadingSpinner';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CategoryDetail = lazy(() => import('./pages/CategoryDetail'));
const AddCategory = lazy(() => import('./pages/AddCategory'));
const AddDocument = lazy(() => import('./pages/AddDocument'));
const ChooseMethod = lazy(() => import('./pages/ChooseMethod'));
const UploadFile = lazy(() => import('./pages/UploadFile'));
const ScanDocument = lazy(() => import('./pages/ScanDocument'));
const DocumentDetail = lazy(() => import('./pages/DocumentDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  return (
    <>
      <ToastContainer />
      <ThemeToggle />
      <Suspense fallback={<LoadingSpinner size="lg" className="min-h-screen" />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="categories/add" element={<AddCategory />} />
            <Route path="categories/:id" element={<CategoryDetail />} />
            <Route path="documents/:id" element={<DocumentDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/documents/add" element={<ProtectedRoute><AddDocument /></ProtectedRoute>} />
          <Route path="/documents/add/method" element={<ProtectedRoute><ChooseMethod /></ProtectedRoute>} />
          <Route path="/documents/add/upload" element={<ProtectedRoute><UploadFile /></ProtectedRoute>} />
          <Route path="/documents/add/scan" element={<ProtectedRoute><ScanDocument /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </>
  );
}
