import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

export function RoleRoute({ roles, children }) {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {roles.includes(user.role) ? children || <Outlet /> : <Navigate to="/forbidden" replace />}
    </ProtectedRoute>
  );
}
