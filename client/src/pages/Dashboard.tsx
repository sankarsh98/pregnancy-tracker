import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { educationApi } from '../api/client';
import type { WeekContent } from '../api/client';

export default function Dashboard() {
    const { pregnancy, isLoading } = useAuth();
    const navigate = useNavigate();
    const [weekContent, setWeekContent] = useState<WeekContent | null>(null);

    useEffect(() => {
        if (!isLoading && !pregnancy) {
            navigate('/onboarding');
        }
    }, [pregnancy, isLoading, navigate]);

    useEffect(() => {
        if (pregnancy?.week) {
            educationApi.getWeek(pregnancy.week).then(({ data }) => {
                if (data) setWeekContent(data);
            });
        }
    }, [pregnancy?.week]);

    if (isLoading || !pregnancy) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl mb-4 animate-pulse-soft">🤰</div>
                    <p className="text-gray-600">Loading your pregnancy data...</p>
                </div>
            </div>
        );
    }

    const progressPercent = Math.min((pregnancy.week / 40) * 100, 100);

    return (
        <Layout>
            <div className="space-y-6">
                {/* Main Progress Card */}
                <div className="card bg-gradient-to-br from-lavender-500 to-lavender-600 text-white border-0">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Progress Ring */}
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${progressPercent * 2.83} 283`}
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold">{pregnancy.week}</span>
                                <span className="text-sm opacity-80">weeks</span>
                            </div>
                        </div>

                        {/* Pregnancy Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold mb-2">
                                Week {pregnancy.week}, Day {pregnancy.day}
                            </h1>
                            <p className="text-lavender-100 text-lg mb-4">
                                {pregnancy.trimesterLabel}
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <div className="bg-white/20 rounded-xl px-4 py-2">
                                    <div className="text-2xl font-bold">{pregnancy.daysRemaining}</div>
                                    <div className="text-xs opacity-80">days to go</div>
                                </div>
                                <div className="bg-white/20 rounded-xl px-4 py-2">
                                    <div className="text-2xl font-bold">{pregnancy.totalDays}</div>
                                    <div className="text-xs opacity-80">days along</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate('/logs')}
                        className="card hover:shadow-xl transition-shadow text-center py-6"
                    >
                        <span className="text-3xl mb-2 block">📝</span>
                        <span className="text-gray-700 font-medium">Add Log</span>
                    </button>
                    <button
                        onClick={() => navigate('/appointments')}
                        className="card hover:shadow-xl transition-shadow text-center py-6"
                    >
                        <span className="text-3xl mb-2 block">📅</span>
                        <span className="text-gray-700 font-medium">Appointments</span>
                    </button>
                    <button
                        onClick={() => navigate('/education')}
                        className="card hover:shadow-xl transition-shadow text-center py-6"
                    >
                        <span className="text-3xl mb-2 block">📚</span>
                        <span className="text-gray-700 font-medium">This Week</span>
                    </button>
                    <button
                        onClick={() => navigate('/export')}
                        className="card hover:shadow-xl transition-shadow text-center py-6"
                    >
                        <span className="text-3xl mb-2 block">📊</span>
                        <span className="text-gray-700 font-medium">Export</span>
                    </button>
                </div>

                {/* This Week's Info */}
                {weekContent && (
                    <div className="card">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">👶</span>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Week {weekContent.week}: {weekContent.title}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Baby is about the size of a {weekContent.babySize.toLowerCase()}
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-700 mb-4">{weekContent.development}</p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-lavender-50 rounded-xl p-4">
                                <h3 className="font-medium text-lavender-700 mb-2">Common Symptoms</h3>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    {weekContent.symptoms.map((symptom, i) => (
                                        <li key={i}>• {symptom}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-mint-50 rounded-xl p-4">
                                <h3 className="font-medium text-mint-700 mb-2">Tips for This Week</h3>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    {weekContent.tips.map((tip, i) => (
                                        <li key={i}>• {tip}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Due Date Card */}
                <div className="card bg-gradient-to-r from-blush-50 to-cream-50 border-blush-100">
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">🎀</span>
                        <div>
                            <h3 className="font-semibold text-gray-800">Estimated Due Date</h3>
                            <p className="text-2xl font-bold text-blush-600">
                                {new Date(pregnancy.dueDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
