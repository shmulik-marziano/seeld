import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useRef, useState, ReactNode } from "react";
import type { AuthContextType } from "./AuthProviderImpl";
import { hasStoredSession } from "@/integrations/supabase/lazy";
import { IS_V2 } from "@/integrations/supabase/config";

// The real provider (supabase session, sign-in/out) lives in AuthProviderImpl and
// pulls supabase-js (~45kB gzip). Public pages never need it unless the visitor
// already has a persisted session, so this eager shell only mounts it when:
//   - a stored session exists (returning logged-in visitor),
//   - the page is an auth/OAuth-return/personal route, or
//   - a component calls one of the auth actions (sign in / up / out).
// Until then consumers see a logged-out, not-loading state — which is exactly
// what a visitor without a session would get from the real provider.
const AuthProviderImpl = lazy(() => import("./AuthProviderImpl"));

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EAGER_PREFIXES = ["/app", "/personal-area", "/site-admin", "/saved-calculations"];

function needsAuthAtStart(): boolean {
  // v2: no sessions on the public site (the staff app is rebuilt in phase 2), so the auth chunk never loads.
  if (IS_V2) return false;
  if (typeof window === "undefined") return false;
  const { pathname, hash, search } = window.location;
  if (EAGER_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  // OAuth / magic-link return: session tokens or a PKCE code arrive in the URL.
  if (/access_token|refresh_token|[?&]code=|error_description/.test(hash + search)) return true;
  return hasStoredSession();
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [activatedAtStart] = useState(needsAuthAtStart);
  const [active, setActive] = useState(activatedAtStart);
  const [impl, setImpl] = useState<AuthContextType | null>(null);
  const implRef = useRef<AuthContextType | null>(null);
  const waiters = useRef<Array<(v: AuthContextType) => void>>([]);

  const onValue = useCallback((v: AuthContextType) => {
    implRef.current = v;
    setImpl(v);
    waiters.current.splice(0).forEach((w) => w(v));
  }, []);

  const stub = useMemo<AuthContextType>(() => {
    const whenReady = (): Promise<AuthContextType> => {
      if (IS_V2) return Promise.reject(new Error("sign-in is not available on this backend yet"));
      setActive(true);
      if (implRef.current) return Promise.resolve(implRef.current);
      return new Promise((resolve) => waiters.current.push(resolve));
    };
    return {
      user: null,
      session: null,
      // Only "loading" if we really are waiting for a session to be read.
      loading: activatedAtStart,
      signUp: async (...a) => (await whenReady()).signUp(...a),
      signIn: async (...a) => (await whenReady()).signIn(...a),
      signInWithOtp: async (...a) => (await whenReady()).signInWithOtp(...a),
      verifyOtp: async (...a) => (await whenReady()).verifyOtp(...a),
      signOut: async () => (await whenReady()).signOut(),
    };
  }, [activatedAtStart]);

  return (
    <AuthContext.Provider value={impl ?? stub}>
      {children}
      {active && (
        <Suspense fallback={null}>
          <AuthProviderImpl onValue={onValue} initialLoading={activatedAtStart} />
        </Suspense>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
