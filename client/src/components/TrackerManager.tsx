import React, { useState } from 'react';
import { TrackerConfig, trackersApi } from '../api/client';

interface TrackerManagerProps {
    trackers: TrackerConfig[];
    onTrackerAdded: () => void;
    onTrackerDeleted: (id: string) => void;
}

export const TrackerManager: React.FC<TrackerManagerProps> = ({ trackers, onTrackerAdded, onTrackerDeleted }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('🍎');
    const [dailyGoal, setDailyGoal] = useState<string>('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        const res = await trackersApi.create(name, emoji, dailyGoal ? parseInt(dailyGoal) : undefined);
        if (res.error) {
            setError(res.error);
        } else {
            setIsAdding(false);
            setName('');
            setDailyGoal('');
            onTrackerAdded();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this tracker?')) {
            const res = await trackersApi.delete(id);
            if (!res.error) {
                onTrackerDeleted(id);
            }
        }
    };

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Additional Trackers</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                >
                    {isAdding ? 'Cancel' : '+ Add Tracker'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Emoji</label>
                            <input
                                type="text"
                                value={emoji}
                                onChange={(e) => setEmoji(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500"
                                placeholder="🍎"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500"
                                placeholder="Fruits"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Daily Goal (Optional)</label>
                            <input
                                type="number"
                                value={dailyGoal}
                                onChange={(e) => setDailyGoal(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500"
                                placeholder="5"
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-pink-600 text-white py-2 rounded-md hover:bg-pink-700 transition-colors"
                    >
                        Save Tracker
                    </button>
                </form>
            )}

            <div className="space-y-3">
                {trackers.length === 0 && !isAdding && (
                    <p className="text-sm text-gray-500 italic">No additional trackers set up.</p>
                )}
                
                {trackers.map(tracker => (
                    <div key={tracker.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{tracker.emoji}</span>
                            <div>
                                <p className="font-medium text-gray-800">{tracker.name}</p>
                                {tracker.daily_goal && (
                                    <p className="text-xs text-gray-500">Goal: {tracker.daily_goal}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(tracker.id)}
                            className="text-gray-400 hover:text-red-500 px-2"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
