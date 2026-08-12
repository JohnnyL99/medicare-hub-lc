import { Box, Container } from '@mui/material';
import { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, sidebarWidth } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../hooks/useAuth';
import { getNavigationItemsByRole } from '../utils/navigation';

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const items = useMemo(() => getNavigationItemsByRole(user.role), [user.role]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} items={items} />

      <Box
        sx={{
          minHeight: '100vh',
          ml: { lg: `${sidebarWidth}px` }
        }}
      >
        <TopBar user={user} onMenuOpen={() => setMobileOpen(true)} onLogout={logout} />
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
