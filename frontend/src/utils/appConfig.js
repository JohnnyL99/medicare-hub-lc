const fallbackApiUrl = import.meta.env.DEV ? 'http://localhost:4000' : '';

export const appConfig = {
  apiUrl: import.meta.env.VITE_API_URL || fallbackApiUrl,
  appName: 'MediCare Hub',
  clinicName: 'Centro Medico Aurora'
};
