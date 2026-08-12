import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState title="Verifica sessione" description="Controllo autenticazione in corso." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children || <Outlet />;
}
