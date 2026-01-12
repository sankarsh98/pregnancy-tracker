import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pregnancyApi } from '../api/client';

export default function Onboarding() {
    const [lmpDate, setLmpDate] = useState('');
    const [useDueDate, setUseDueDate] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { refreshPregnancy } = useAuth();
    const navigate = useNavigate();

    // Calculate max date (today)
    const today = new Date().toISOString().split('T')[0];

    // Calculate min LMP date (about 42 weeks ago max)
    const minLmpDate = new Date();
    minLmpDate.setDate(minLmpDate.getDate() - 294);
    const minLmp = minLmpDate.toISOString().split('T')[0];

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await pregnancyApi.create(lmpDate, useDueDate ? dueDate : undefined);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }

        await refreshPregnancy();
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <span className="text-6xl mb-4 block">🌱</span>
                    <h1 className="text-3xl font-bold text-lavender-700 mb-2">Let's Get Started</h1>
                    <p className="text-gray-600">
                        Tell us about your pregnancy so we can personalize your experience
                    </p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-blush-50 border border-blush-200 text-blush-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="lmpDate" className="block text-sm font-medium text-gray-700 mb-2">
                                First day of your last menstrual period (LMP)
                            </label>
                            <input
                                id="lmpDate"
                                type="date"
                                value={lmpDate}
                                onChange={(e) => setLmpDate(e.target.value)}
                                min={minLmp}
                                max={today}
                                required
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                This helps us calculate your pregnancy week and due date
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="useDueDate"
                                checked={useDueDate}
                                onChange={(e) => setUseDueDate(e.target.checked)}
                                className="w-5 h-5 rounded border-lavender-300 text-lavender-600 focus:ring-lavender-400"
                            />
                            <label htmlFor="useDueDate" className="text-sm text-gray-700">
                                I know my due date from my doctor
                            </label>
                        </div>

                        {useDueDate && (
                            <div className="animate-fade-in">
                                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    Expected due date
                                </label>
                                <input
                                    id="dueDate"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    min={today}
                                    required={useDueDate}
                                />
                            </div>
                        )}

                        <div className="bg-cream-50 border border-cream-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">📋</span>
                                <div>
                                    <h3 className="font-medium text-gray-800 mb-1">What we'll track</h3>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Your pregnancy week and day</li>
                                        <li>• Daily symptoms, mood, and notes</li>
                                        <li>• Appointments and checkups</li>
                                        <li>• Weekly baby development info</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full"
                        >
                            {isLoading ? 'Setting up...' : 'Start Tracking'}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-gray-500">
                    ⚠️ This app does not provide medical advice. Always consult a healthcare professional.
                </p>
            </div>
        </div>
    );
}
