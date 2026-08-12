import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';

export function TopBar({ onMenuOpen, onLogout, user }) {
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ minHeight: 76 }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="Apri navigazione"
          onClick={onMenuOpen}
          sx={{ display: { lg: 'none' }, mr: 1 }}
        >
          <MenuOutlinedIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Clinica polispecialistica
          </Typography>
          <Typography variant="h6" color="text.primary">
            Centro Medico Aurora
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton color="inherit" aria-label="Notifiche">
            <NotificationsNoneOutlinedIcon />
          </IconButton>
          <Tooltip title="Esci dalla sessione">
            <IconButton
              color="inherit"
              aria-label="Esci dalla sessione"
              onClick={() => onLogout()}
            >
              <LogoutOutlinedIcon />
            </IconButton>
          </Tooltip>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              {initials}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" color="text.primary">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.role}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
