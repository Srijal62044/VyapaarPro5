import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Single authorized administrator email for VyapaarPro
export const AUTHORIZED_ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL || 'kumarsrijal732@gmail.com'
).toLowerCase().trim();

export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL;
};

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password?: string,
    fullName?: string,
    phone?: string,
    companyName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'vp_current_user_v1';
const LOCAL_USERS_KEY = 'vp_registered_users_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to ensure profile role is synchronized with email authorization
  const sanitizeProfile = (rawProfile: UserProfile): UserProfile => {
    const isAuthAdmin = isAuthorizedAdminEmail(rawProfile.email);
    if (isAuthAdmin) {
      return {
        ...rawProfile,
        role: 'super_admin',
      };
    }
    // Any other email cannot hold an admin role
    return {
      ...rawProfile,
      role: 'customer',
    };
  };

  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      // If Supabase is configured, check real session
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && session.user.email) {
            const isAuthAdmin = isAuthorizedAdminEmail(session.user.email);
            const resolvedRole: UserRole = isAuthAdmin ? 'super_admin' : 'customer';

            // Query existing profile row
            const { data: userProfile, error: profileErr } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            let activeProfile: UserProfile;

            if (userProfile) {
              activeProfile = userProfile;
              // Synchronize super_admin role if admin email
              if (isAuthAdmin && userProfile.role !== 'super_admin') {
                await supabase
                  .from('profiles')
                  .update({ role: 'super_admin', updated_at: new Date().toISOString() })
                  .eq('id', session.user.id);
                activeProfile.role = 'super_admin';
              }
            } else {
              // Profile record does not exist yet in public.profiles: Self-heal & create it immediately
              const defaultName = session.user.user_metadata?.full_name || 
                session.user.user_metadata?.name || 
                session.user.email.split('@')[0];
              const defaultPhone = session.user.user_metadata?.phone || '';
              const defaultCompany = session.user.user_metadata?.company_name || '';

              const newRow = {
                id: session.user.id,
                email: session.user.email,
                full_name: defaultName,
                phone: defaultPhone,
                company_name: defaultCompany,
                role: resolvedRole,
                updated_at: new Date().toISOString(),
              };

              await supabase.from('profiles').upsert(newRow);
              activeProfile = {
                ...newRow,
                created_at: new Date().toISOString(),
              };
            }

            const finalProfile = sanitizeProfile(activeProfile);
            setProfile(finalProfile);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(finalProfile));
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Supabase auth init notice:', err);
        }
      }

      // Check local storage session
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile(sanitizeProfile(parsed));
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Failed to parse auth from storage:', err);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.toLowerCase().trim();
    const isAuthAdmin = isAuthorizedAdminEmail(cleanEmail);

    try {
      if (isSupabaseConfigured && supabase && password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const resolvedRole: UserRole = isAuthAdmin ? 'super_admin' : 'customer';

          // Query public.profiles
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          let activeProf: UserProfile;

          if (prof) {
            activeProf = prof;
            if (isAuthAdmin && prof.role !== 'super_admin') {
              await supabase.from('profiles').update({ role: 'super_admin', updated_at: new Date().toISOString() }).eq('id', data.user.id);
              activeProf.role = 'super_admin';
            }
          } else {
            // Missing profile row self-heal
            const defaultName = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];
            const defaultPhone = data.user.user_metadata?.phone || '';
            const defaultCompany = data.user.user_metadata?.company_name || '';

            const newRow = {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              full_name: defaultName,
              phone: defaultPhone,
              company_name: defaultCompany,
              role: resolvedRole,
              updated_at: new Date().toISOString(),
            };

            await supabase.from('profiles').upsert(newRow);
            activeProf = {
              ...newRow,
              created_at: new Date().toISOString(),
            };
          }

          const userProf: UserProfile = sanitizeProfile(activeProf);
          setProfile(userProf);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProf));
          setIsLoading(false);
          return { success: true };
        }
      }

      // Local / Offline authentication handling
      let role: UserRole = isAuthAdmin ? 'super_admin' : 'customer';
      let name = isAuthAdmin ? 'Srijal Kumar (Agency Admin)' : cleanEmail.split('@')[0].replace('.', ' ');
      name = name.charAt(0).toUpperCase() + name.slice(1);

      // Check registered users in offline mode
      let localUsers: UserProfile[] = [];
      try {
        localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
      } catch (e) {
        localUsers = [];
      }

      const existing = localUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      const resolvedProfile: UserProfile = existing || {
        id: isAuthAdmin ? 'admin-super-srijal' : 'u-' + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        full_name: name,
        company_name: isAuthAdmin ? 'VyapaarPro Operations' : 'Client Ventures',
        role,
        phone: isAuthAdmin ? '+91 98765 43210' : '+91 98765 00000',
        created_at: new Date().toISOString(),
      };

      setProfile(resolvedProfile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(resolvedProfile));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  const register = async (
    email: string,
    password?: string,
    fullName?: string,
    phone?: string,
    companyName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.toLowerCase().trim();
    const isAuthAdmin = isAuthorizedAdminEmail(cleanEmail);
    const assignedRole: UserRole = isAuthAdmin ? 'super_admin' : 'customer';

    try {
      if (isSupabaseConfigured && supabase && password) {
        // 1. Supabase Auth signup
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName || cleanEmail.split('@')[0],
              phone: phone || '',
              company_name: companyName || '',
              role: assignedRole,
            },
          },
        });

        // 2. Duplicate email check in Supabase Auth
        // Supabase returns user with empty identities list when email already exists
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setIsLoading(false);
          return {
            success: false,
            error: 'This email is already registered. Please log in instead.',
          };
        }

        if (error) {
          setIsLoading(false);
          const msg = (error.message || '').toLowerCase();
          if (
            msg.includes('already registered') ||
            msg.includes('already in use') ||
            msg.includes('user already exists') ||
            msg.includes('duplicate')
          ) {
            return {
              success: false,
              error: 'This email is already registered. Please log in instead.',
            };
          }
          return { success: false, error: error.message };
        }

        if (data.user) {
          // 3. Ensure corresponding row in public.profiles exists immediately
          const profilePayload = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name: fullName || cleanEmail.split('@')[0],
            phone: phone || '',
            company_name: companyName || '',
            role: assignedRole,
            updated_at: new Date().toISOString(),
          };

          try {
            await supabase.from('profiles').upsert(profilePayload);
          } catch (upsertErr) {
            console.warn('Initial profiles upsert notice (handled by DB trigger):', upsertErr);
          }

          const newProfile: UserProfile = {
            ...profilePayload,
            created_at: new Date().toISOString(),
          };

          setProfile(newProfile);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));
          setIsLoading(false);
          return { success: true };
        }
      }

      // Local fallback registration (when Supabase is offline/unconfigured)
      let localUsers: UserProfile[] = [];
      try {
        localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
      } catch (e) {
        localUsers = [];
      }

      if (localUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
        setIsLoading(false);
        return {
          success: false,
          error: 'This email is already registered. Please log in instead.',
        };
      }

      const newProfile: UserProfile = {
        id: isAuthAdmin ? 'admin-super-srijal' : 'u-' + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        full_name: fullName || cleanEmail.split('@')[0],
        phone: phone || '',
        company_name: companyName || '',
        role: assignedRole,
        created_at: new Date().toISOString(),
      };

      localUsers.push(newProfile);
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
      setProfile(newProfile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
    }
    setProfile(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!profile) return false;
    // Disallow role modification by user
    const safeData = { ...data };
    delete safeData.role;

    const updated: UserProfile = sanitizeProfile({
      ...profile,
      ...safeData,
      updated_at: new Date().toISOString(),
    });

    setProfile(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update(safeData).eq('id', profile.id);
      } catch (err) {
        console.error('Supabase profile update error:', err);
      }
    }
    return true;
  };

  // Strict authorization enforcement:
  // isAdmin is ONLY true if:
  // 1. User profile exists
  // 2. Profile's email EXACTLY matches AUTHORIZED_ADMIN_EMAIL
  // 3. Role is 'admin' or 'super_admin'
  const isEmailAdmin = isAuthorizedAdminEmail(profile?.email);
  const isAdmin = Boolean(profile && isEmailAdmin && (profile.role === 'admin' || profile.role === 'super_admin'));
  const isSuperAdmin = Boolean(profile && isEmailAdmin && profile.role === 'super_admin');
  const role: UserRole | null = profile ? (isAdmin ? profile.role : 'customer') : null;

  return (
    <AuthContext.Provider
      value={{
        user: profile ? { id: profile.id, email: profile.email } : null,
        profile,
        role,
        isAdmin,
        isSuperAdmin,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
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
