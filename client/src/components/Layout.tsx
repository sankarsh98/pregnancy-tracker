import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/logs', label: 'Daily Logs', icon: '📝' },
    { path: '/appointments', label: 'Appointments', icon: '📅' },
    { path: '/education', label: 'Learn', icon: '📚' },
    { path: '/export', label: 'Export', icon: '📊' },
];

export default function Layout({ children }: LayoutProps) {
    const { user, logout, pregnancy } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen gradient-bg">
            {/* Disclaimer Banner */}
            <div className="bg-cream-100 border-b border-cream-200 px-4 py-2 text-center text-sm text-cream-800">
                ⚠️ This application does not provide medical advice. Always consult a qualified healthcare professional.
            </div>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-lavender-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <span className="text-2xl">🤰</span>
                            <span className="font-semibold text-xl text-lavender-700">Pregnancy Tracker</span>
                        </Link>

                        {pregnancy && (
                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                                <span className="bg-lavender-100 text-lavender-700 px-3 py-1 rounded-full font-medium">
                                    Week {pregnancy.week}, Day {pregnancy.day}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-lavender-600 hover:text-lavender-800 font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-lavender-100 z-50">
                <div className="flex justify-around py-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center px-3 py-2 text-xs ${location.pathname === item.path
                                ? 'text-lavender-600'
                                : 'text-gray-500'
                                }`}
                        >
                            <span className="text-xl mb-1">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Desktop Sidebar */}
            <div className="flex">
                <aside className="hidden md:block w-64 min-h-[calc(100vh-4rem)] bg-white/60 backdrop-blur-sm border-r border-lavender-100">
                    <nav className="p-4 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path
                                    ? 'bg-lavender-100 text-lavender-700 font-medium'
                                    : 'text-gray-600 hover:bg-lavender-50 hover:text-lavender-600'
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
                    <div className="max-w-5xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
