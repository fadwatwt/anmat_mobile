import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { extractErrorMessage, http, onUnauthorized, setAuthToken } from '../lib/http';
import { adminLoginWithEmail, loginWithEmail } from '../services/auth';
import { initPushNotifications, logoutPushNotifications } from '../services/pushNotifications';
import { ApiResponse, LoginData, User } from '../types';

const TOKEN_KEY = 'anmat.accessToken';
const USER_KEY = 'anmat.user';
const LAST_USER_TYPE_KEY = 'anmat.lastUserType';

type AuthContextValue = {
  isLoading: boolean;
  token: string | null;
  user: User | null;
  permissions: string[];
  permissionsLoaded: boolean;
  lastUserType: string | null;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [lastUserType, setLastUserType] = useState<string | null>(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [storedToken, storedUser, storedLastType] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
          SecureStore.getItemAsync(LAST_USER_TYPE_KEY),
        ]);

        if (storedLastType) setLastUserType(storedLastType);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setAuthToken(storedToken);

          // Verify token is still valid by calling /api/user/auth
          try {
            const res = await http.get<ApiResponse<User>>('/api/user/auth');
            if (res.data?.data) {
              setToken(storedToken);
              setUser(res.data.data);
              initPushNotifications();
              return;
            }
          } catch {
            // Token invalid/expired — clear stored session
          }

          await Promise.all([
            SecureStore.deleteItemAsync(TOKEN_KEY),
            SecureStore.deleteItemAsync(USER_KEY),
          ]);
          setAuthToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Fetch the authenticated user's permission names (mirrors the web layout:
  // GET /api/user/auth/permissions returns ['*'] for full-access accounts).
  useEffect(() => {
    if (!token) {
      setPermissions([]);
      setPermissionsLoaded(false);
      return;
    }

    let active = true;
    setPermissionsLoaded(false);
    http
      .get<ApiResponse<{ permissions?: string[] }>>('/api/user/auth/permissions')
      .then((res) => {
        if (active) setPermissions(res.data?.data?.permissions ?? []);
      })
      .catch(() => {
        if (active) setPermissions([]);
      })
      .finally(() => {
        if (active) setPermissionsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const persistSession = useCallback(async (data: LoginData) => {
    setAuthToken(data.access_token);

    // The login response does not include subscription gating fields
    // (has_subscription_access / subscription_status). Fetch the full profile
    // from /api/user/auth so the navigator can gate correctly on first render.
    let resolvedUser: User = data.user;
    try {
      const res = await http.get<ApiResponse<User>>('/api/user/auth');
      if (res.data?.data) {
        resolvedUser = res.data.data;
      }
    } catch {
      // Fall back to the login user; gating fields may be missing until refresh.
    }

    setToken(data.access_token);
    setUser(resolvedUser);
    setLastUserType(resolvedUser.type ?? null);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, data.access_token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(resolvedUser)),
      SecureStore.setItemAsync(LAST_USER_TYPE_KEY, resolvedUser.type ?? ''),
    ]);
    initPushNotifications();
  }, []);

  // Regular (Subscriber/Employee) login. Admins must use adminLogin.
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const data = await loginWithEmail(email.trim(), password);
        if (data.user?.type === 'Admin') {
          throw new Error('Access Denied: Use Admin Sign In.');
        }
        await persistSession(data);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Access Denied')) {
          throw error;
        }
        throw new Error(extractErrorMessage(error));
      }
    },
    [persistSession],
  );

  // Admin-only login.
  const adminLogin = useCallback(
    async (email: string, password: string) => {
      try {
        const data = await adminLoginWithEmail(email.trim(), password);
        if (data.user?.type !== 'Admin') {
          throw new Error('Access Denied: You do not have administrator privileges.');
        }
        await persistSession(data);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Access Denied')) {
          throw error;
        }
        throw new Error(extractErrorMessage(error));
      }
    },
    [persistSession],
  );

  const refreshUser = useCallback(async () => {
    try {
      const res = await http.get<ApiResponse<User>>('/api/user/auth');
      if (res.data?.data) {
        setUser(res.data.data);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch {
      // Keep existing user on refresh failure
    }
    return null;
  }, []);

  const clearLocalSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    setPermissions([]);
    setPermissionsLoaded(false);
    setAuthToken(null);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  }, []);

  // Auto-logout when any API returns 401 (expired/revoked token).
  useEffect(() => {
    onUnauthorized(() => {
      logoutPushNotifications();
      void clearLocalSession();
    });
    return () => onUnauthorized(null);
  }, [clearLocalSession]);

  const logout = useCallback(async () => {
    logoutPushNotifications();

    // Notify backend to clear current_token_id (POST preferred; GET fallback for old backend).
    try {
      await http.post('/api/user/auth/logout');
    } catch {
      try {
        await http.get('/api/user/auth/logout');
      } catch {
        // Ignore logout API errors — clear local state anyway
      }
    }

    await clearLocalSession();
  }, [clearLocalSession]);

  const value = useMemo(
    () => ({
      isLoading,
      token,
      user,
      permissions,
      permissionsLoaded,
      lastUserType,
      login,
      adminLogin,
      logout,
      refreshUser,
    }),
    [isLoading, token, user, permissions, permissionsLoaded, lastUserType, login, adminLogin, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
