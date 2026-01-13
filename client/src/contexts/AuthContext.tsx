import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { PregnancyData } from '../api/client';
import {
    calculatePregnancyWeek,
    calculateDaysRemaining,
    getTrimester,
    getTrimesterLabel
} from '../utils/pregnancy';

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

// Fetch pregnancy directly using user ID to avoid getUser() call
async function fetchPregnancyForUser(userId: string): Promise<PregnancyData | null> {
    try {
        console.log('Fetching pregnancy for user:', userId);
        const { data, error } = await supabase
            .from('pregnancies')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .limit(1);

        if (error) {
            console.error('Pregnancy fetch error:', error);
            return null;
        }
        if (!data || data.length === 0) {
            console.log('No active pregnancy found');
            return null;
        }

        const pregnancy = data[0];
        const lmpDate = new Date(pregnancy.lmp_date);
        const dueDate = new Date(pregnancy.due_date);
        const { week, day, totalDays } = calculatePregnancyWeek(lmpDate, dueDate);
        const daysRemaining = calculateDaysRemaining(dueDate);
        const trimester = getTrimester(week);

        const pregnancyData: PregnancyData = {
            id: pregnancy.id,
            lmpDate: pregnancy.lmp_date,
            dueDate: pregnancy.due_date,
            week,
            day,
            totalDays,
            daysRemaining,
            trimester,
            trimesterLabel: getTrimesterLabel(trimester),
            createdAt: pregnancy.created_at
        };

        console.log('Pregnancy loaded:', pregnancyData.id);
        return pregnancyData;
    } catch (err) {
        console.error('Error fetching pregnancy:', err);
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [pregnancy, setPregnancy] = useState<PregnancyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const initDone = useRef(false);

    const refreshPregnancy = useCallback(async () => {
        if (user) {
            const data = await fetchPregnancyForUser(user.id);
            setPregnancy(data);
        }
    }, [user]);

    useEffect(() => {
        if (initDone.current) return;
        initDone.current = true;

        let isMounted = true;

        const initializeAuth = async () => {
            try {
                console.log('Getting session...');
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error || !session?.user) {
                    console.log('No session found');
                    if (isMounted) setIsLoading(false);
                    return;
                }

                console.log('Session found for:', session.user.email);
                if (isMounted) {
                    setUser({ id: session.user.id, email: session.user.email || '' });
                }

                const pregnancyData = await fetchPregnancyForUser(session.user.id);
                if (isMounted) {
                    setPregnancy(pregnancyData);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Auth init error:', err);
                if (isMounted) setIsLoading(false);
            }
        };

        initializeAuth();

        // Handle auth state changes (for login/logout after initial load)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, _session) => {
                console.log('Auth event:', event);

                // Only handle events after initial load
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setPregnancy(null);
                    setIsLoading(false);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setIsLoading(false);
                return { success: false, error: error.message };
            }

            if (data.user) {
                setUser({ id: data.user.id, email: data.user.email || '' });
                const pregnancyData = await fetchPregnancyForUser(data.user.id);
                setPregnancy(pregnancyData);
            }

            setIsLoading(false);
            return { success: true };
        } catch (err: any) {
            setIsLoading(false);
            return { success: false, error: err?.message || 'Login failed' };
        }
    };

    const signup = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setIsLoading(false);
                return { success: false, error: error.message };
            }

            if (data.user) {
                setUser({ id: data.user.id, email: data.user.email || '' });
                // New users won't have pregnancy yet
                setPregnancy(null);
            }

            setIsLoading(false);
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
