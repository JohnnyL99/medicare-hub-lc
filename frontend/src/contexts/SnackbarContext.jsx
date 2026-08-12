import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { Alert, IconButton, Snackbar } from '@mui/material';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SnackbarContext = createContext({
  showSnackbar: () => {}
});

export function SnackbarProvider({ children }) {
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbarState({
      open: true,
      message,
      severity
    });
  }, []);

  const handleClose = useCallback(() => {
    setSnackbarState((current) => ({
      ...current,
      open: false
    }));
  }, []);

  const value = useMemo(
    () => ({
      showSnackbar
    }),
    [showSnackbar]
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={snackbarState.severity}
          variant="filled"
          action={
            <IconButton
              aria-label="Chiudi notifica"
              color="inherit"
              size="small"
              onClick={handleClose}
            >
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          }
          sx={{ width: '100%' }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  return useContext(SnackbarContext);
}
