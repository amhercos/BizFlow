import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAxiosError } from "axios";
import React, {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiClient, pingHealthCheck } from "../api/client";
import { User } from "../types/user";

interface AuthState {
  readonly token: string | null;
  readonly user: User | null;
  readonly isLoading: boolean;
}

interface AuthContextType extends AuthState {
  authenticate: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "bizflow_token";
const USER_KEY = "bizflow_user";

export function AuthProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
  });

  const logout = async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
    } finally {
      setState({ token: null, user: null, isLoading: false });
    }
  };

  useEffect(() => {
    const bootstrapAsync = async (): Promise<void> => {
      try {
        const [token, userJson] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        const user = userJson ? (JSON.parse(userJson) as User) : null;

        setState({ token, user, isLoading: false });

        if (token) {
          void pingHealthCheck();

          apiClient.get("/Auth/me").catch(async (error: unknown) => {
            if (isAxiosError(error) && error.response?.status === 401) {
              console.log("[AuthContext] Session expired. Logging out.");
              await logout();
            }
          });
        }
      } catch (error: unknown) {
        console.error("[AuthContext] Bootstrap failed", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    void bootstrapAsync();
  }, []);

  const authenticate = async (token: string, user: User): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
      ]);
      setState({ token, user, isLoading: false });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Persistence error";
      throw new Error(`Auth persistence failed: ${message}`);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
