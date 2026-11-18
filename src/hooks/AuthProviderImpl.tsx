import { memo, useState, useEffect, useLayoutEffect } from "react";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { User, Session } from "@supabase/supabase-js";

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

/**
 * Headless provider: owns the Supabase session, publishes its value to the eager
 * shell in useAuth.tsx. Lives in its own chunk so supabase-js is only fetched when
 * a page actually needs auth.
 */
const AuthProviderImpl = ({ onValue, initialLoading }: { onValue: (v: AuthContextType) => void; initialLoading: boolean }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(initialLoading);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Entry is only for existing accounts (clients we invited); nobody can self-register here.
        shouldCreateUser: false,
      },
    });
    return { error: error as Error | null };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = { user, session, loading, signUp, signIn, signInWithOtp, verifyOtp, signOut };
  // Keep the shell in sync with every state change (signOut/signIn closures are stable enough:
  // they only touch the singleton client).
  useLayoutEffect(() => { onValue(value); });
  return null;
};

// memo: the shell re-renders on every published value; this must not re-run then.
export default memo(AuthProviderImpl);
