import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { educationApi } from '../api/client';
import type { EducationData, WeekContent } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Education() {
    const { pregnancy } = useAuth();
    const [educationData, setEducationData] = useState<EducationData | null>(null);
    const [selectedWeek, setSelectedWeek] = useState<WeekContent | null>(null);
    const [activeTab, setActiveTab] = useState<'week' | 'overview'>('week');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        educationApi.getAll().then(({ data }) => {
            if (data) {
                setEducationData(data);
                // Select current week by default
                if (pregnancy?.week) {
                    const weekContent = data.weeks.find(w => w.week === pregnancy.week)
                        || data.weeks.find(w => w.week <= pregnancy.week);
                    if (weekContent) setSelectedWeek(weekContent);
                }
            }
            setIsLoading(false);
        });
    }, [pregnancy?.week]);

    if (isLoading) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <div className="text-4xl mb-4 animate-pulse-soft">📚</div>
                    <p className="text-gray-500">Loading educational content...</p>
                </div>
            </Layout>
        );
    }

    if (!educationData) {
        return (
            <Layout>
                <div className="card text-center py-12">
                    <div className="text-5xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold text-gray-700">Content unavailable</h3>
                    <p className="text-gray-500">Please try again later</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Learn</h1>
                    <p className="text-gray-600">Educational content for each stage of your pregnancy</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 bg-lavender-50 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('week')}
                        className={`flex-1 py-2 px-4 rounded-lg transition-all ${activeTab === 'week'
                            ? 'bg-white shadow-sm text-lavender-700 font-medium'
                            : 'text-gray-600'
                            }`}
                    >
                        Week by Week
                    </button>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-2 px-4 rounded-lg transition-all ${activeTab === 'overview'
                            ? 'bg-white shadow-sm text-lavender-700 font-medium'
                            : 'text-gray-600'
                            }`}
                    >
                        Trimester Overview
                    </button>
                </div>

                {activeTab === 'week' ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Week Selector */}
                        <div className="md:col-span-1">
                            <div className="card p-4 max-h-[500px] overflow-y-auto">
                                <h3 className="font-semibold text-gray-700 mb-3">Select Week</h3>
                                <div className="space-y-1">
                                    {educationData.weeks.map((week) => (
                                        <button
                                            key={week.week}
                                            onClick={() => setSelectedWeek(week)}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-all ${selectedWeek?.week === week.week
                                                ? 'bg-lavender-100 text-lavender-700 font-medium'
                                                : 'hover:bg-lavender-50 text-gray-600'
                                                } ${pregnancy?.week === week.week ? 'ring-2 ring-lavender-300' : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>Week {week.week}</span>
                                                {pregnancy?.week === week.week && (
                                                    <span className="text-xs bg-lavender-500 text-white px-2 py-0.5 rounded-full">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">{week.title}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Week Content */}
                        <div className="md:col-span-2">
                            {selectedWeek ? (
                                <div className="card animate-fade-in">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="bg-lavender-100 rounded-full p-4">
                                            <span className="text-3xl">👶</span>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800">
                                                Week {selectedWeek.week}
                                            </h2>
                                            <p className="text-lavender-600 font-medium">{selectedWeek.title}</p>
                                        </div>
                                    </div>

                                    <div className="bg-cream-50 rounded-xl p-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">🍎</span>
                                            <div>
                                                <div className="text-sm text-gray-500">Baby is about the size of</div>
                                                <div className="font-semibold text-gray-800">{selectedWeek.babySize}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="font-semibold text-gray-800 mb-2">Development</h3>
                                        <p className="text-gray-600">{selectedWeek.development}</p>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="bg-lavender-50 rounded-xl p-4">
                                            <h3 className="font-semibold text-lavender-700 mb-3">Common Symptoms</h3>
                                            <ul className="space-y-2">
                                                {selectedWeek.symptoms.map((symptom, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-gray-600">
                                                        <span className="w-1.5 h-1.5 bg-lavender-400 rounded-full"></span>
                                                        {symptom}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-mint-50 rounded-xl p-4">
                                            <h3 className="font-semibold text-mint-700 mb-3">Tips & Advice</h3>
                                            <ul className="space-y-2">
                                                {selectedWeek.tips.map((tip, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-gray-600">
                                                        <span className="w-1.5 h-1.5 bg-mint-400 rounded-full mt-2"></span>
                                                        {tip}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card text-center py-12">
                                    <p className="text-gray-500">Select a week to view content</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {educationData.trimesters.map((tri) => (
                            <div key={tri.trimester} className="card">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`rounded-full p-3 ${tri.trimester === 1 ? 'bg-lavender-100' :
                                        tri.trimester === 2 ? 'bg-mint-100' : 'bg-blush-100'
                                        }`}>
                                        <span className="text-2xl">
                                            {tri.trimester === 1 ? '🌱' : tri.trimester === 2 ? '🌸' : '🎀'}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">{tri.title}</h2>
                                        <p className="text-gray-500">Weeks {tri.weeks}</p>
                                    </div>
                                    {pregnancy && pregnancy.trimester === tri.trimester && (
                                        <span className="ml-auto bg-lavender-500 text-white px-3 py-1 rounded-full text-sm">
                                            You are here
                                        </span>
                                    )}
                                </div>

                                <p className="text-gray-600 mb-4">{tri.overview}</p>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-2">Key Milestones</h3>
                                        <ul className="space-y-1">
                                            {tri.keyMilestones.map((m, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                                    <span className="text-lavender-500">✓</span> {m}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-2">Self-Care Tips</h3>
                                        <ul className="space-y-1">
                                            {tri.selfCare.map((s, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                                    <span className="text-mint-500">•</span> {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Disclaimer */}
                <div className="bg-cream-50 border border-cream-200 rounded-xl p-4 text-sm text-cream-800">
                    <strong>Note:</strong> This content is for informational purposes only and is not a substitute
                    for professional medical advice. Always consult your healthcare provider with any questions.
                </div>
            </div>
        </Layout>
    );
}
