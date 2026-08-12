import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f766e',
      light: '#39a99d',
      dark: '#0a4f4a',
      contrastText: '#f7fcfb'
    },
    secondary: {
      main: '#2f6f8f',
      light: '#5999b8',
      dark: '#1c4b62'
    },
    success: {
      main: '#2f855a'
    },
    warning: {
      main: '#b7791f'
    },
    error: {
      main: '#c53030'
    },
    background: {
      default: '#eef5f3',
      paper: '#ffffff'
    },
    text: {
      primary: '#15313a',
      secondary: '#59707a'
    },
    divider: '#d6e3e0'
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 800,
      letterSpacing: '-0.05em'
    },
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.04em'
    },
    h3: {
      fontWeight: 800,
      letterSpacing: '-0.04em'
    },
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.03em'
    },
    h5: {
      fontWeight: 700
    },
    h6: {
      fontWeight: 700
    },
    subtitle1: {
      fontWeight: 600
    },
    button: {
      fontWeight: 700,
      textTransform: 'none'
    }
  },
  shape: {
    borderRadius: 18
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#15313a',
          borderBottom: '1px solid rgba(214, 227, 224, 0.9)',
          boxShadow: 'none'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(214, 227, 224, 0.9)',
          backgroundColor: '#ffffff'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600
        }
      }
    }
  }
});
