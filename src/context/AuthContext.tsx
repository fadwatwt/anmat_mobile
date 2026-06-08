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

import { extractErrorMessage, http, setAuthToken } from '../lib/http';
import { loginWithEmail } from '../services/auth';
import { ApiResponse, User } from '../types';

const TOKEN_KEY = 'anmat.accessToken';
const USER_KEY = 'anmat.user';

type AuthContextValue = {
  isLoading: boolean;
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setAuthToken(storedToken);

          // Verify token is still valid by calling /api/user/auth
          try {
            const res = await http.get<ApiResponse<User>>('/api/user/auth');
            if (res.data?.data) {
              setToken(storedToken);
              setUser(res.data.data);
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

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginWithEmail(email.trim(), password);
      setToken(data.access_token);
      setUser(data.user);
      setAuthToken(data.access_token);
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, data.access_token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user)),
      ]);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }, []);

  const logout = useCallback(async () => {
    // Notify backend to clear current_token_id
    try {
      await http.get('/api/user/auth/logout');
    } catch {
      // Ignore logout API errors — clear local state anyway
    }

    setToken(null);
    setUser(null);
    setAuthToken(null);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  }, []);

  const value = useMemo(
    () => ({ isLoading, token, user, login, logout }),
    [isLoading, token, user, login, logout],
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
