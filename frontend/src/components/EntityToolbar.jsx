import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { Button, InputAdornment, MenuItem, Paper, Stack, TextField } from '@mui/material';

const defaultStatusOptions = [
  { value: 'all', label: 'Tutti gli stati' },
  { value: 'true', label: 'Solo attivi' },
  { value: 'false', label: 'Solo non attivi' }
];

export function EntityToolbar({
  searchLabel = 'Ricerca',
  searchValue,
  onSearchChange,
  statusValue = 'all',
  onStatusChange,
  statusOptions = defaultStatusOptions,
  onSubmit,
  onReset,
  extraFilters,
  actions
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="stretch"
          useFlexGap
          sx={{ flexWrap: 'wrap' }}
        >
          <TextField
            label={searchLabel}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            sx={{
              flexGrow: 1,
              minWidth: { xs: '100%', md: 280 }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon color="action" />
                </InputAdornment>
              )
            }}
          />
          {onStatusChange ? (
            <TextField
              select
              label="Stato"
              value={statusValue}
              onChange={(event) => onStatusChange(event.target.value)}
              sx={{
                width: { xs: '100%', sm: 220 },
                flexShrink: 0
              }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
          {extraFilters}
        </Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            {onSubmit ? (
              <Button variant="contained" startIcon={<TuneOutlinedIcon />} onClick={onSubmit}>
                Applica filtri
              </Button>
            ) : null}
            <Button variant="text" onClick={onReset}>
              Reimposta
            </Button>
          </Stack>
          {actions}
        </Stack>
      </Stack>
    </Paper>
  );
}
