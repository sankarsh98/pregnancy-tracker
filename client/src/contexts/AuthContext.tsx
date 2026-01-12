import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi, setToken, removeToken, pregnancyApi } from '../api/client';
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
    logout: () => void;
    refreshPregnancy: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [pregnancy, setPregnancy] = useState<PregnancyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshPregnancy = async () => {
        const { data } = await pregnancyApi.get();
        if (data) {
            setPregnancy(data);
        }
    };

    useEffect(() => {
        // Check if user is logged in on mount
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const { data: userData, error } = await authApi.me();
            if (error || !userData) {
                removeToken();
                setIsLoading(false);
                return;
            }

            setUser(userData);

            // Try to get pregnancy data
            const { data: pregnancyData } = await pregnancyApi.get();
            if (pregnancyData) {
                setPregnancy(pregnancyData);
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const { data, error } = await authApi.login(email, password);

        if (error || !data) {
            return { success: false, error: error || 'Login failed' };
        }

        setToken(data.token);

        // Get user info
        const { data: userData } = await authApi.me();
        if (userData) {
            setUser(userData);
        }

        // Try to get pregnancy
        const { data: pregnancyData } = await pregnancyApi.get();
        if (pregnancyData) {
            setPregnancy(pregnancyData);
        }

        return { success: true };
    };

    const signup = async (email: string, password: string) => {
        const { data, error } = await authApi.signup(email, password);

        if (error || !data) {
            return { success: false, error: error || 'Signup failed' };
        }

        setToken(data.token);
        setUser({ id: data.userId, email });

        return { success: true };
    };

    const logout = () => {
        removeToken();
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
