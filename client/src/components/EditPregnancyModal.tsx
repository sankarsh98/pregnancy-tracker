import { useState } from 'react';
import type { FormEvent } from 'react';
import { pregnancyApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface EditPregnancyModalProps {
    currentDueDate: string;
    pregnancyId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditPregnancyModal({
    currentDueDate,
    pregnancyId,
    isOpen,
    onClose,
    onSuccess
}: EditPregnancyModalProps) {
    const [dueDate, setDueDate] = useState(currentDueDate);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { refreshPregnancy } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error: apiError } = await pregnancyApi.update(pregnancyId, dueDate);

        if (apiError) {
            setError(apiError);
            setIsLoading(false);
            return;
        }

        await refreshPregnancy();
        onSuccess();
        onClose();
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Due Date</h2>
                <p className="text-gray-600 mb-6">
                    Updating your due date will recalculate your pregnancy week and current progress.
                </p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Due Date
                        </label>
                        <input
                            type="date"
                            required
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
