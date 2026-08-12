import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PauseCircleOutlineOutlinedIcon from '@mui/icons-material/PauseCircleOutlineOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Chip } from '@mui/material';

const statusMap = {
  SCHEDULED: {
    label: 'Programmato',
    color: 'default',
    icon: <ScheduleOutlinedIcon fontSize="small" />
  },
  CONFIRMED: {
    label: 'Confermato',
    color: 'info',
    icon: <EventAvailableOutlinedIcon fontSize="small" />
  },
  COMPLETED: {
    label: 'Completato',
    color: 'success',
    icon: <CheckCircleOutlineOutlinedIcon fontSize="small" />
  },
  CANCELLED: {
    label: 'Annullato',
    color: 'error',
    icon: <EventBusyOutlinedIcon fontSize="small" />
  },
  NO_SHOW: {
    label: 'No show',
    color: 'warning',
    icon: <VisibilityOutlinedIcon fontSize="small" />
  },
  ACTIVE: {
    label: 'Attivo',
    color: 'success',
    icon: <CheckCircleOutlineOutlinedIcon fontSize="small" />
  },
  INACTIVE: {
    label: 'Non attivo',
    color: 'default',
    icon: <PauseCircleOutlineOutlinedIcon fontSize="small" />
  }
};

export function StatusChip({ status }) {
  const config = statusMap[status] || {
    label: status,
    color: 'default',
    icon: <PauseCircleOutlineOutlinedIcon fontSize="small" />
  };

  return (
    <Chip
      size="small"
      color={config.color}
      variant="outlined"
      icon={config.icon}
      label={config.label}
    />
  );
}
