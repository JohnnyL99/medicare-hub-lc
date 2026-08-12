import { CssBaseline, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/it';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { appTheme } from './theme/theme';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={appTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
        <CssBaseline />
        <SnackbarProvider>
          <App />
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </StrictMode>
);
