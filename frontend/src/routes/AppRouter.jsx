import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../layouts/MainLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DoctorsPage } from '../pages/DoctorsPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { LoginPage } from '../pages/LoginPage';
import { MedicalServicesPage } from '../pages/MedicalServicesPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PatientsPage } from '../pages/PatientsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SpecialtiesPage } from '../pages/SpecialtiesPage';
import { UsersPage } from '../pages/UsersPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route
            path="/doctors"
            element={
              <RoleRoute roles={['ADMIN', 'RECEPTIONIST']}>
                <DoctorsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/specialties"
            element={
              <RoleRoute roles={['ADMIN', 'RECEPTIONIST']}>
                <SpecialtiesPage />
              </RoleRoute>
            }
          />
          <Route path="/medical-services" element={<MedicalServicesPage />} />
          <Route
            path="/users"
            element={
              <RoleRoute roles={['ADMIN']}>
                <UsersPage />
              </RoleRoute>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
