import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { configureApiClient, normalizeApiError } from '../api/apiClient';

const ACCESS_TOKEN_KEY = 'medicareHub.accessToken';
const USER_KEY = 'medicareHub.user';

const AuthContext = createContext(null);

function readStoredUser() {
  const raw = sessionStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeSession(accessToken, user) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSessionStorage() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem(ACCESS_TOKEN_KEY));
  const [user, setUser] = useState(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearSessionStorage();
    setAccessToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(
    ({ redirectToLogin = true } = {}) => {
      clearSession();

      if (redirectToLogin && location.pathname !== '/login') {
        navigate('/login', {
          replace: true,
          state: {
            from: location.pathname
          }
        });
      }
    },
    [clearSession, location.pathname, navigate]
  );

  useEffect(() => {
    configureApiClient({
      getToken: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),
      onUnauthorized: () => logout()
    });
  }, [logout]);

  const restoreSession = useCallback(async () => {
    const storedToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    const storedUser = readStoredUser();

    if (!storedToken) {
      clearSession();
      setIsLoading(false);
      return;
    }

    setAccessToken(storedToken);
    setUser(storedUser);

    try {
      const profile = await authApi.getProfile();

      setUser(profile);
      writeSession(storedToken, profile);
    } catch (error) {
      const normalizedError = normalizeApiError(error);

      if (normalizedError.status === 401) {
        logout({ redirectToLogin: location.pathname !== '/login' });
      } else {
        clearSession();
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, location.pathname, logout]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);

    writeSession(data.token, data.user);
    setAccessToken(data.token);
    setUser(data.user);

    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      login,
      logout,
      restoreSession
    }),
    [accessToken, isLoading, login, logout, restoreSession, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
