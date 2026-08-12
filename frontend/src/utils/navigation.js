import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import SupervisedUserCircleOutlinedIcon from '@mui/icons-material/SupervisedUserCircleOutlined';
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined';

export const navigationConfig = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: DashboardOutlinedIcon,
    roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR']
  },
  {
    label: 'Appuntamenti',
    path: '/appointments',
    icon: CalendarMonthOutlinedIcon,
    roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR']
  },
  {
    label: 'Pazienti',
    path: '/patients',
    icon: PeopleOutlineOutlinedIcon,
    roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR']
  },
  {
    label: 'Medici',
    path: '/doctors',
    icon: LocalHospitalOutlinedIcon,
    roles: ['ADMIN', 'RECEPTIONIST']
  },
  {
    label: 'Specializzazioni',
    path: '/specialties',
    icon: VaccinesOutlinedIcon,
    roles: ['ADMIN', 'RECEPTIONIST']
  },
  {
    label: 'Prestazioni',
    path: '/medical-services',
    icon: MedicalServicesOutlinedIcon,
    roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR']
  },
  {
    label: 'Utenti',
    path: '/users',
    icon: SupervisedUserCircleOutlinedIcon,
    roles: ['ADMIN']
  },
  {
    label: 'Profilo',
    path: '/profile',
    icon: PersonOutlineOutlinedIcon,
    roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR']
  }
];

export function getNavigationItemsByRole(role) {
  return navigationConfig.filter((item) => item.roles.includes(role));
}
