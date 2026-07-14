import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { readAppConfig } from "../core/app-config";
import { AuthService, type AuthSnapshot } from "../services/auth-service";

interface AuthContextValue extends AuthSnapshot {
  getAccessToken: () => Promise<string | null>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useMemo(() => new AuthService(readAppConfig()), []);
  const snapshot = useSyncExternalStore(
    (listener) => auth.subscribe(listener),
    () => auth.getSnapshot(),
    () => auth.getSnapshot(),
  );

  useEffect(() => {
    void auth.completeSignInFromRedirect();
  }, [auth]);

  const getAccessToken = useCallback(() => auth.getAccessToken(), [auth]);
  const signIn = useCallback(() => auth.signIn(), [auth]);
  const signOut = useCallback(() => auth.signOut(), [auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...snapshot,
      getAccessToken,
      signIn,
      signOut,
    }),
    [getAccessToken, signIn, signOut, snapshot],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("Authentication is not available.");
  }

  return auth;
}
