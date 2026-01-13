import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { pregnancyApi } from '../api/client';
import type { PregnancyData } from '../api/client';

interface User {
    id: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    pregnancy: PregnancyData | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshPregnancy: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [pregnancy, setPregnancy] = useState<PregnancyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPregnancy = async (): Promise<PregnancyData | null> => {
        try {
            const result = await pregnancyApi.get();
            return result.data || null;
        } catch (err) {
            console.error('Error fetching pregnancy:', err);
            return null;
        }
    };

    const refreshPregnancy = useCallback(async () => {
        const data = await fetchPregnancy();
        setPregnancy(data);
    }, []);

    useEffect(() => {
        let isMounted = true;
        let hasInitialized = false;

        const initializeAuth = async () => {
            if (hasInitialized) return;
            hasInitialized = true;

            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session error:', error);
                    if (isMounted) setIsLoading(false);
                    return;
                }

                if (session?.user && isMounted) {
                    setUser({ id: session.user.id, email: session.user.email || '' });
                    const pregnancyData = await fetchPregnancy();
                    if (isMounted) setPregnancy(pregnancyData);
                }
            } catch (err) {
                console.error('Auth init error:', err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        // Start initialization
        initializeAuth();

        // Failsafe: ensure loading stops after 5 seconds max
        const timeout = setTimeout(() => {
            if (isMounted && isLoading) {
                console.warn('Auth loading timeout - forcing complete');
                setIsLoading(false);
            }
        }, 5000);

        // Subscribe to auth changes for login/logout during the session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);

                // Only handle actual sign-in/sign-out events, not initial session
                if (event === 'SIGNED_IN' && session?.user && isMounted) {
                    setUser({ id: session.user.id, email: session.user.email || '' });
                    const pregnancyData = await fetchPregnancy();
                    if (isMounted) setPregnancy(pregnancyData);
                    setIsLoading(false);
                } else if (event === 'SIGNED_OUT' && isMounted) {
                    setUser(null);
                    setPregnancy(null);
                    setIsLoading(false);
                }
            }
        );

        return () => {
            isMounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setIsLoading(false);
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (err: any) {
            setIsLoading(false);
            return { success: false, error: err?.message || 'Login failed' };
        }
    };

    const signup = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setIsLoading(false);
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (err: any) {
            setIsLoading(false);
            return { success: false, error: err?.message || 'Signup failed' };
        }
    };

    const logout = async (): Promise<void> => {
        await supabase.auth.signOut();
        setUser(null);
        setPregnancy(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                pregnancy,
                isLoading,
                isAuthenticated: !!user,
                login,
                signup,
                logout,
                refreshPregnancy,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
