import axios from 'axios';
import { appConfig } from '../utils/appConfig';

let getAccessToken = () => null;
let unauthorizedHandler = () => {};
let handlingUnauthorized = false;
let requestInterceptorId = null;
let responseInterceptorId = null;

export const apiClient = axios.create({
  baseURL: appConfig.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export function normalizeApiError(error) {
  if (error?.isApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status || null;
    const apiError = error.response?.data?.error;
    const isNetworkError = !error.response;

    return {
      isApiError: true,
      status,
      code: apiError?.code || (status === 401 ? 'UNAUTHORIZED' : 'REQUEST_FAILED'),
      message:
        apiError?.message ||
        (isNetworkError
          ? 'Il backend non e disponibile o non e raggiungibile in questo momento'
          : error.message || 'Request failed'),
      details: Array.isArray(apiError?.details) ? apiError.details : [],
      raw: error
    };
  }

  return {
    isApiError: true,
    status: null,
    code: 'UNKNOWN_ERROR',
    message: error?.message || 'Unexpected error',
    details: [],
    raw: error
  };
}

export function configureApiClient({ getToken, onUnauthorized }) {
  getAccessToken = typeof getToken === 'function' ? getToken : () => null;
  unauthorizedHandler = typeof onUnauthorized === 'function' ? onUnauthorized : () => {};

  if (requestInterceptorId !== null) {
    apiClient.interceptors.request.eject(requestInterceptorId);
  }

  if (responseInterceptorId !== null) {
    apiClient.interceptors.response.eject(responseInterceptorId);
  }

  requestInterceptorId = apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  responseInterceptorId = apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const normalizedError = normalizeApiError(error);
      const skipAuthRedirect = Boolean(error.config?._skipAuthRedirect);
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      if (
        normalizedError.status === 401 &&
        !skipAuthRedirect &&
        !isLoginRequest &&
        !handlingUnauthorized
      ) {
        handlingUnauthorized = true;

        try {
          await unauthorizedHandler(normalizedError);
        } finally {
          handlingUnauthorized = false;
        }
      }

      return Promise.reject(normalizedError);
    }
  );
}
