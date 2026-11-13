import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type UserRole = 'student' | 'operator' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  institutionId?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  loginAsDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: 'demo-admin-1',
    email: 'admin@raahdost.edu.in',
    fullName: 'Dr. R. K. Srivastava (Chief Transport Officer)',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    role: 'admin',
    institutionId: 'inst-1',
  },
  operator: {
    id: 'demo-operator-1',
    email: 'rameshwar.yadav@gmail.com',
    fullName: 'Rameshwar Yadav (Bolero Van Fleet)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    role: 'operator',
  },
  student: {
    id: 'demo-student-1',
    email: 'aarav.sharma@polytechnic.ac.in',
    fullName: 'Aarav Sharma (Polytechnic 2nd Yr)',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    role: 'student',
    institutionId: 'inst-1',
  },
};

const LOCAL_STORAGE_SESSION_KEY = 'raahdost_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    return cached ? JSON.parse(cached) : DEMO_USERS.admin; // Default demo session for instant hackathon review
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Sync Supabase Auth session if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const client = supabase;

    const initSession = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user.id, session.user.email || '');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string, email: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        const profile: UserProfile = {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          avatarUrl: data.avatar_url,
          role: data.role as UserRole,
          institutionId: data.institution_id,
        };
        setUser(profile);
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(profile));
      } else {
        // Fallback default profile
        const defaultProfile: UserProfile = {
          id: userId,
          email,
          fullName: email.split('@')[0],
          role: 'student',
        };
        setUser(defaultProfile);
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(defaultProfile));
      }
    } catch (err) {
      console.warn('Profile fetch error, using default student role:', err);
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      return { 
        error: new Error('Google OAuth requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be set in your .env file with Google provider enabled.') 
      };
    }

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      // Demo simulated login
      const matched = Object.values(DEMO_USERS).find(u => u.email === email);
      const demoProfile = matched || {
        id: `user-${Date.now()}`,
        email,
        fullName: email.split('@')[0],
        role: 'student' as UserRole,
      };
      setUser(demoProfile);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(demoProfile));
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      if (data.user) {
        await loadUserProfile(data.user.id, data.user.email || '');
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured || !supabase) {
      // Create new student in demo mode
      const newStudent: UserProfile = {
        id: `user-${Date.now()}`,
        email,
        fullName,
        role: 'student', // Security rule: always default to student
      };
      setUser(newStudent);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(newStudent));
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) return { error };
      if (data.user) {
        await loadUserProfile(data.user.id, data.user.email || '');
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Security check: Never permit client to overwrite role
    const sanitizedUpdates = { ...updates };
    delete sanitizedUpdates.role;
    delete sanitizedUpdates.id;

    const updatedUser = { ...user, ...sanitizedUpdates };
    setUser(updatedUser);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updatedUser));

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: updatedUser.fullName,
            avatar_url: updatedUser.avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        return { error };
      } catch (err: any) {
        return { error: err };
      }
    }
    return { error: null };
  };

  const loginAsDemoRole = (role: UserRole) => {
    const demoProfile = DEMO_USERS[role];
    setUser(demoProfile);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(demoProfile));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateProfile,
        loginAsDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
