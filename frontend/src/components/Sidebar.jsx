import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import { appConfig } from '../utils/appConfig';

const drawerWidth = 280;

function SidebarContent({ items, onNavigate }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack spacing={1} sx={{ px: 3, py: 3.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <LocalHospitalOutlinedIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1">{appConfig.appName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {appConfig.clinicName}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      <Divider />

      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              onClick={onNavigate}
              sx={{
                mb: 0.5,
                minHeight: 48,
                borderRadius: 2.5,
                '&.active': {
                  backgroundColor: 'action.selected',
                  color: 'primary.main'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 42, color: 'inherit' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

export function Sidebar({ open, onClose, items }) {
  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        variant="temporary"
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth
          }
        }}
      >
        <SidebarContent items={items} onNavigate={onClose} />
      </Drawer>

      <Drawer
        open
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
      >
        <SidebarContent items={items} />
      </Drawer>
    </>
  );
}

export const sidebarWidth = drawerWidth;
