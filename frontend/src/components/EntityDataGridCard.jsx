import { Alert, Card, CardContent, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

export function EntityDataGridCard({
  rows,
  columns,
  loading,
  error,
  toolbar,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  rowCount,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onRetry
}) {
  if (loading && rows.length === 0) {
    return <LoadingState description="Recupero dei dati dal backend in corso." />;
  }

  if (error && rows.length === 0) {
    return (
      <Stack spacing={3}>
        {toolbar}
        <ErrorState description={error.message} onAction={onRetry} />
      </Stack>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <Stack spacing={3}>
        {toolbar}
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {toolbar}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            {error ? <Alert severity="warning">{error.message}</Alert> : null}
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              loading={loading}
              pagination
              paginationMode="server"
              sortingMode="server"
              rowCount={rowCount}
              paginationModel={paginationModel}
              onPaginationModelChange={onPaginationModelChange}
              sortModel={sortModel}
              onSortModelChange={onSortModelChange}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 20, 50]}
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
