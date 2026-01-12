import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { User, AuthContextType } from "../types";
import { signalRService } from "../services/signalr.service";
import {
  setAuthToken,
  setRefreshToken,
  clearAuthTokens,
} from "../services/api.service";
import axios, { AxiosError } from "axios";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Auth API client
const authApi = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==================== API Response Types ====================

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
}

interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    isOnline: boolean;
    createdAt: string;
  };
}

// ==================== Storage Keys ====================

const STORAGE_KEYS = {
  ACCESS_TOKEN: "auth_access_token",
  REFRESH_TOKEN: "auth_refresh_token",
  ACCESS_TOKEN_EXPIRES: "auth_access_token_expires",
  REFRESH_TOKEN_EXPIRES: "auth_refresh_token_expires",
  USER: "auth_user",
} as const;

// ==================== Helper Functions ====================

const saveTokens = (data: AuthResponseData) => {
  // Sync with api.service (updates both memory and localStorage)
  setAuthToken(data.accessToken);
  setRefreshToken(data.refreshToken);

  // Save expiry times
  localStorage.setItem(
    STORAGE_KEYS.ACCESS_TOKEN_EXPIRES,
    data.accessTokenExpiresAt,
  );
  localStorage.setItem(
    STORAGE_KEYS.REFRESH_TOKEN_EXPIRES,
    data.refreshTokenExpiresAt,
  );
};

const saveUser = (user: User) => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

const clearStorage = () => {
  // Clear api.service tokens (memory + localStorage)
  clearAuthTokens();
  // Clear additional keys
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

const getStoredTokens = () => {
  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    accessTokenExpiresAt: localStorage.getItem(
      STORAGE_KEYS.ACCESS_TOKEN_EXPIRES,
    ),
    refreshTokenExpiresAt: localStorage.getItem(
      STORAGE_KEYS.REFRESH_TOKEN_EXPIRES,
    ),
  };
};

const getStoredUser = (): User | null => {
  const userJson = localStorage.getItem(STORAGE_KEYS.USER);
  if (userJson) {
    try {
      const parsed = JSON.parse(userJson);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        lastSeen: parsed.lastSeen ? new Date(parsed.lastSeen) : undefined,
      };
    } catch {
      return null;
    }
  }
  return null;
};

const isTokenExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return true;
  try {
    const expiry = new Date(expiresAt);
    // Consider token expired 30 seconds before actual expiry for safety
    return expiry.getTime() - 30000 < Date.now();
  } catch {
    return true;
  }
};

const mapResponseToUser = (userData: AuthResponseData["user"]): User => ({
  id: userData.id,
  username: userData.username,
  email: userData.email,
  fullName: userData.fullName,
  avatarUrl: userData.avatarUrl,
  isOnline: userData.isOnline,
  createdAt: new Date(userData.createdAt),
});

// ==================== Auth Provider ====================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(
    null,
  );
  const [tokenExpiresAt, setTokenExpiresAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs for refresh token logic
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const isAutoLoginInProgressRef = useRef(false);

  // Refs to break circular dependencies
  const performTokenRefreshRef = useRef<() => Promise<void>>();
  const scheduleTokenRefreshRef = useRef<(expiresAt: Date) => void>();

  // ==================== Token Refresh Logic ====================

  const scheduleTokenRefresh = useCallback((expiresAt: Date) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Calculate time until refresh (refresh 1 minute before expiry)
    const refreshTime = expiresAt.getTime() - Date.now() - 60000;

    if (refreshTime > 0) {
      console.log(
        `[Auth] Scheduling token refresh in ${Math.round(refreshTime / 1000)} seconds`,
      );

      refreshTimerRef.current = setTimeout(async () => {
        console.log("[Auth] Auto-refreshing token...");
        try {
          // Use ref to avoid circular dependency
          await performTokenRefreshRef.current?.();
        } catch (error) {
          console.error("[Auth] Auto-refresh failed:", error);
        }
      }, refreshTime);
    }
  }, []);

  const performTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log("[Auth] Token refresh already in progress");
      return;
    }

    const storedTokens = getStoredTokens();

    if (!storedTokens.accessToken || !storedTokens.refreshToken) {
      throw new Error("No tokens available for refresh");
    }

    if (isTokenExpired(storedTokens.refreshTokenExpiresAt)) {
      throw new Error("Refresh token has expired");
    }

    isRefreshingRef.current = true;

    try {
      const response = await authApi.post<ApiResponse<AuthResponseData>>(
        "/refresh",
        {
          accessToken: storedTokens.accessToken,
          refreshToken: storedTokens.refreshToken,
        },
      );

      const data = response.data;

      if (!data.success || !data.data) {
        throw new Error(data.message || "Token refresh failed");
      }

      const authData = data.data;
      const newUser = mapResponseToUser(authData.user);
      const newExpiresAt = new Date(authData.accessTokenExpiresAt);

      // Update state
      setToken(authData.accessToken);
      setRefreshTokenValue(authData.refreshToken);
      setTokenExpiresAt(newExpiresAt);
      setUser(newUser);

      // Save to storage
      saveTokens(authData);
      saveUser(newUser);

      // Schedule next refresh - use ref to avoid circular dependency
      scheduleTokenRefreshRef.current?.(newExpiresAt);

      console.log("[Auth] Token refreshed successfully");
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Keep refs up to date
  useEffect(() => {
    performTokenRefreshRef.current = performTokenRefresh;
    scheduleTokenRefreshRef.current = scheduleTokenRefresh;
  }, [performTokenRefresh, scheduleTokenRefresh]);

  // ==================== Initialize Auth State ====================

  // Auto-login with existing demo user
  const autoLoginDemoUser = useCallback(async () => {
    // Prevent multiple simultaneous auto-login attempts
    if (isAutoLoginInProgressRef.current) {
      console.log("[Auth] Auto-login already in progress, skipping...");
      return false;
    }

    isAutoLoginInProgressRef.current = true;

    // Random select between demo users for testing chat between multiple users
    const demoUsers = [
      { email: "demo@commhub.local", password: "Demo@123" },
      { email: "test2@commhub.local", password: "Test@123" },
    ];
    const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
    const demoEmail = randomUser.email;
    const demoPassword = randomUser.password;

    console.log("[Auth] Selected demo user:", demoEmail);

    try {
      console.log("[Auth] Attempting to login with demo user...");

      // Try to login with existing demo user
      const loginResponse = await authApi.post<ApiResponse<AuthResponseData>>(
        "/login",
        {
          email: demoEmail,
          password: demoPassword,
        },
      );

      const data = loginResponse.data;

      if (data.success && data.data) {
        const authData = data.data;
        const demoUser = mapResponseToUser(authData.user);
        const expiresAt = new Date(authData.accessTokenExpiresAt);

        // Update state
        setToken(authData.accessToken);
        setRefreshTokenValue(authData.refreshToken);
        setTokenExpiresAt(expiresAt);
        setUser(demoUser);

        // Save to storage
        saveTokens(authData);
        saveUser(demoUser);

        // Schedule token refresh - use ref
        scheduleTokenRefreshRef.current?.(expiresAt);

        // Start SignalR connections
        try {
          await signalRService.startAllConnections(authData.accessToken);
        } catch (error) {
          console.error("[Auth] Failed to start SignalR connections:", error);
        }

        console.log("[Auth] Demo user logged in:", demoUser.email);
        return true;
      }
    } catch (error) {
      console.error("[Auth] Failed to login demo user:", error);
    } finally {
      isAutoLoginInProgressRef.current = false;
    }

    return false;
  }, []);

  useEffect(() => {
    // Prevent re-initialization
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    const initializeAuth = async () => {
      try {
        const storedTokens = getStoredTokens();
        const storedUser = getStoredUser();

        if (!storedTokens.accessToken || !storedUser) {
          console.log(
            "[Auth] No stored credentials found, auto-login with demo user...",
          );

          // Auto-login with demo user
          const success = await autoLoginDemoUser();
          if (!success) {
            console.error("[Auth] Failed to auto-login demo user");
          }

          setIsLoading(false);
          return;
        }

        // Check if access token is expired
        if (isTokenExpired(storedTokens.accessTokenExpiresAt)) {
          // Check if refresh token is still valid
          if (
            storedTokens.refreshToken &&
            !isTokenExpired(storedTokens.refreshTokenExpiresAt)
          ) {
            console.log("[Auth] Access token expired, attempting refresh...");
            try {
              await performTokenRefresh();

              // Start SignalR connections after refresh
              const currentToken = localStorage.getItem(
                STORAGE_KEYS.ACCESS_TOKEN,
              );
              if (currentToken) {
                await signalRService.startAllConnections(currentToken);
              }
            } catch (refreshError) {
              console.error(
                "[Auth] Token refresh failed during init:",
                refreshError,
              );
              clearStorage();
            }
          } else {
            console.log("[Auth] Refresh token expired, clearing credentials");
            clearStorage();
          }
        } else {
          // Token is still valid
          console.log("[Auth] Restored session from storage");

          const expiresAt = storedTokens.accessTokenExpiresAt
            ? new Date(storedTokens.accessTokenExpiresAt)
            : null;

          setToken(storedTokens.accessToken);
          setRefreshTokenValue(storedTokens.refreshToken);
          setTokenExpiresAt(expiresAt);
          setUser(storedUser);

          // Schedule token refresh - use ref for consistency
          if (expiresAt) {
            scheduleTokenRefreshRef.current?.(expiresAt);
          }

          // Start SignalR connections
          try {
            await signalRService.startAllConnections(storedTokens.accessToken);
          } catch (error) {
            console.error("[Auth] Failed to start SignalR connections:", error);
          }
        }
      } catch (error) {
        console.error("[Auth] Failed to initialize auth:", error);
        clearStorage();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== Auth Actions ====================

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await authApi.post<ApiResponse<AuthResponseData>>(
          "/login",
          {
            email,
            password,
          },
        );

        const data = response.data;

        if (!data.success || !data.data) {
          throw new Error(data.message || "Login failed");
        }

        const authData = data.data;
        const loginUser = mapResponseToUser(authData.user);
        const expiresAt = new Date(authData.accessTokenExpiresAt);

        // Update state
        setToken(authData.accessToken);
        setRefreshTokenValue(authData.refreshToken);
        setTokenExpiresAt(expiresAt);
        setUser(loginUser);

        // Save to storage
        saveTokens(authData);
        saveUser(loginUser);

        // Schedule token refresh - use ref for consistency
        scheduleTokenRefreshRef.current?.(expiresAt);

        // Start SignalR connections
        try {
          await signalRService.startAllConnections(authData.accessToken);
        } catch (signalRError) {
          console.error(
            "[Auth] Failed to start SignalR connections:",
            signalRError,
          );
        }

        console.log("[Auth] Login successful:", loginUser.email);
      } catch (error) {
        console.error("[Auth] Login failed:", error);

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<ApiResponse<unknown>>;
          const message = axiosError.response?.data?.message || "Login failed";
          throw new Error(message);
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [scheduleTokenRefresh],
  );

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      fullName?: string,
    ) => {
      setIsLoading(true);
      try {
        const response = await authApi.post<ApiResponse<AuthResponseData>>(
          "/register",
          {
            username,
            email,
            password,
            fullName: fullName || username,
          },
        );

        const data = response.data;

        if (!data.success || !data.data) {
          throw new Error(data.message || "Registration failed");
        }

        const authData = data.data;
        const registeredUser = mapResponseToUser(authData.user);
        const expiresAt = new Date(authData.accessTokenExpiresAt);

        // Update state
        setToken(authData.accessToken);
        setRefreshTokenValue(authData.refreshToken);
        setTokenExpiresAt(expiresAt);
        setUser(registeredUser);

        // Save to storage
        saveTokens(authData);
        saveUser(registeredUser);

        // Schedule token refresh - use ref for consistency
        scheduleTokenRefreshRef.current?.(expiresAt);

        // Start SignalR connections
        try {
          await signalRService.startAllConnections(authData.accessToken);
        } catch (signalRError) {
          console.error(
            "[Auth] Failed to start SignalR connections:",
            signalRError,
          );
        }

        console.log("[Auth] Registration successful:", registeredUser.email);
      } catch (error) {
        console.error("[Auth] Registration failed:", error);

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<ApiResponse<unknown>>;
          const message =
            axiosError.response?.data?.message || "Registration failed";
          throw new Error(message);
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [scheduleTokenRefresh],
  );

  const logout = useCallback(async () => {
    try {
      // Call logout API if we have a token
      if (token) {
        try {
          await authApi.post(
            "/logout",
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
        } catch (error) {
          console.error("[Auth] Logout API call failed:", error);
        }
      }

      // Stop SignalR connections
      await signalRService.stopAllConnections();

      // Clear refresh timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      // Clear state
      setToken(null);
      setRefreshTokenValue(null);
      setTokenExpiresAt(null);
      setUser(null);

      // Clear storage
      clearStorage();

      console.log("[Auth] Logout successful");
    } catch (error) {
      console.error("[Auth] Logout error:", error);
    }
  }, [token]);

  const refreshToken = useCallback(async () => {
    try {
      await performTokenRefresh();
    } catch (error) {
      console.error("[Auth] Manual token refresh failed:", error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  }, [performTokenRefresh, logout]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!token) {
        throw new Error("Not authenticated");
      }

      try {
        const response = await authApi.post<ApiResponse<unknown>>(
          "/change-password",
          {
            currentPassword,
            newPassword,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = response.data;

        if (!data.success) {
          throw new Error(data.message || "Password change failed");
        }

        // Password changed - user should re-login
        console.log("[Auth] Password changed successfully");

        // Logout after password change
        await logout();
      } catch (error) {
        console.error("[Auth] Password change failed:", error);

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<ApiResponse<unknown>>;
          const message =
            axiosError.response?.data?.message || "Password change failed";
          throw new Error(message);
        }
        throw error;
      }
    },
    [token, logout],
  );

  // ==================== Context Value ====================

  const value: AuthContextType = {
    user,
    token,
    refreshTokenValue,
    isAuthenticated: !!user && !!token,
    isLoading,
    tokenExpiresAt,
    login,
    register,
    logout,
    refreshToken,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ==================== Hook ====================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
