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
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isPregnancyLoading, setIsPregnancyLoading] = useState(true);

    // Combined loading state - we're loading until both auth AND pregnancy check are done
    const isLoading = isAuthLoading || (user !== null && isPregnancyLoading);

    const refreshPregnancy = useCallback(async () => {
        try {
            setIsPregnancyLoading(true);
            const result = await pregnancyApi.get();
            if (result.data) {
                setPregnancy(result.data);
            } else {
                setPregnancy(null);
            }
        } catch (err) {
            console.error('Error fetching pregnancy:', err);
            setPregnancy(null);
        } finally {
            setIsPregnancyLoading(false);
        }
    }, []);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session }, error }) => {
            if (error) {
                console.error('Session error:', error);
                setIsAuthLoading(false);
                setIsPregnancyLoading(false);
                return;
            }

            if (session?.user) {
                setUser({ id: session.user.id, email: session.user.email || '' });
                // Fetch pregnancy data and wait for it
                try {
                    const result = await pregnancyApi.get();
                    if (result.data) setPregnancy(result.data);
                } catch (err) {
                    console.error('Error fetching pregnancy:', err);
                }
                setIsPregnancyLoading(false);
            } else {
                setIsPregnancyLoading(false);
            }
            setIsAuthLoading(false);
        }).catch(err => {
            console.error('GetSession error:', err);
            setIsAuthLoading(false);
            setIsPregnancyLoading(false);
        });

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);

                if (session?.user) {
                    setUser({ id: session.user.id, email: session.user.email || '' });
                    setIsPregnancyLoading(true);
                    try {
                        const result = await pregnancyApi.get();
                        if (result.data) setPregnancy(result.data);
                        else setPregnancy(null);
                    } catch (err) {
                        console.error('Error fetching pregnancy:', err);
                        setPregnancy(null);
                    }
                    setIsPregnancyLoading(false);
                } else {
                    setUser(null);
                    setPregnancy(null);
                    setIsPregnancyLoading(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err?.message || 'Login failed' };
        }
    };

    const signup = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (err: any) {
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
