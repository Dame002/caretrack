import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken, type Role, type User } from "./api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (r: Role) => boolean;
  isAdmin: boolean;
  isMedecin: boolean;
  isInfirmier: boolean;
  isDirection: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await api.get<User>("/auth/me");
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadMe().finally(() => setLoading(false));
  }, [loadMe]);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.post<{ token: string; user: User; message: string }>(
        "/auth/login",
        { email, password },
      );
      setToken(res.token);
      setUser(res.user);
      return { error: null };
    } catch (e: any) {
      return { error: e?.message ?? "Erreur de connexion" };
    }
  };

  const signOut = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
  };

  const hasRole = (r: Role) => user?.role === r;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        refresh: loadMe,
        hasRole,
        isAdmin: hasRole("administrateur"),
        isMedecin: hasRole("medecin"),
        isInfirmier: hasRole("infirmier"),
        isDirection: hasRole("direction"),
        isStaff: !!user && user.actif,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export { ROLE_LABELS } from "./api";
export type { Role } from "./api";
