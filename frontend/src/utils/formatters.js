import dayjs from 'dayjs';

export function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = dayjs(value);

  return date.isValid() ? date.format('DD/MM/YYYY') : '-';
}

export function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = dayjs(value);

  return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : '-';
}

export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(value));
}
