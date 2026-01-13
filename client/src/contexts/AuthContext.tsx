import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
    const loadingCompleteRef = useRef(false);

    const fetchPregnancy = async (): Promise<PregnancyData | null> => {
        try {
            console.log('Fetching pregnancy data...');
            const result = await pregnancyApi.get();
            console.log('Pregnancy fetch result:', result);
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

    const completeLoading = useCallback(() => {
        if (!loadingCompleteRef.current) {
            loadingCompleteRef.current = true;
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                console.log('Initializing auth...');
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session error:', error);
                    if (isMounted) completeLoading();
                    return;
                }

                console.log('Session:', session ? 'exists' : 'none');

                if (session?.user && isMounted) {
                    setUser({ id: session.user.id, email: session.user.email || '' });

                    // Fetch pregnancy with a timeout
                    const pregnancyPromise = fetchPregnancy();
                    const timeoutPromise = new Promise<null>((resolve) => {
                        setTimeout(() => resolve(null), 10000); // 10 second timeout for pregnancy fetch
                    });

                    const pregnancyData = await Promise.race([pregnancyPromise, timeoutPromise]);

                    if (isMounted) {
                        setPregnancy(pregnancyData);
                        completeLoading();
                    }
                } else if (isMounted) {
                    // No session, complete loading immediately
                    completeLoading();
                }
            } catch (err) {
                console.error('Auth init error:', err);
                if (isMounted) completeLoading();
            }
        };

        initializeAuth();

        // Subscribe to auth changes for login/logout during the session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);

                if (event === 'SIGNED_IN' && session?.user && isMounted) {
                    setUser({ id: session.user.id, email: session.user.email || '' });
                    const pregnancyData = await fetchPregnancy();
                    if (isMounted) {
                        setPregnancy(pregnancyData);
                        completeLoading();
                    }
                } else if (event === 'SIGNED_OUT' && isMounted) {
                    setUser(null);
                    setPregnancy(null);
                    completeLoading();
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [completeLoading]);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            loadingCompleteRef.current = false;
            setIsLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                completeLoading();
                return { success: false, error: error.message };
            }
            // Don't complete loading here - let onAuthStateChange handle it
            return { success: true };
        } catch (err: any) {
            completeLoading();
            return { success: false, error: err?.message || 'Login failed' };
        }
    };

    const signup = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            loadingCompleteRef.current = false;
            setIsLoading(true);
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                completeLoading();
                return { success: false, error: error.message };
            }
            // Don't complete loading here - let onAuthStateChange handle it
            return { success: true };
        } catch (err: any) {
            completeLoading();
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
