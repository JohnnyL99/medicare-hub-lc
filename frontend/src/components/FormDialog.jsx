import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

export function FormDialog({
  open,
  title,
  children,
  submitLabel = 'Salva',
  isSubmitting = false,
  maxWidth = 'sm',
  onClose,
  onSubmit
}) {
  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Annulla
        </Button>
        {submitLabel ? (
          <Button variant="contained" onClick={onSubmit} disabled={isSubmitting}>
            {submitLabel}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
