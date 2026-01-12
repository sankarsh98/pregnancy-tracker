import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Layout from '../components/Layout';
import { logsApi } from '../api/client';
import type { DailyLog } from '../api/client';

const SYMPTOM_OPTIONS = [
    'Nausea', 'Fatigue', 'Headache', 'Back pain', 'Cramps',
    'Heartburn', 'Bloating', 'Mood swings', 'Insomnia', 'Swelling',
    'Food cravings', 'Food aversions', 'Frequent urination', 'Breast tenderness'
];

const MOOD_OPTIONS = [
    { value: 'great', emoji: '😊', label: 'Great' },
    { value: 'good', emoji: '🙂', label: 'Good' },
    { value: 'okay', emoji: '😐', label: 'Okay' },
    { value: 'tired', emoji: '😴', label: 'Tired' },
    { value: 'anxious', emoji: '😰', label: 'Anxious' },
    { value: 'sad', emoji: '😢', label: 'Sad' },
];

export default function DailyLogs() {
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [mood, setMood] = useState('');
    const [notes, setNotes] = useState('');
    const [weight, setWeight] = useState('');
    const [bloodPressure, setBloodPressure] = useState('');
    const [bloodSugar, setBloodSugar] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        const { data } = await logsApi.getAll();
        if (data) {
            setLogs(data);
        }
        setIsLoading(false);
    };

    const toggleSymptom = (symptom: string) => {
        setSymptoms(prev =>
            prev.includes(symptom)
                ? prev.filter(s => s !== symptom)
                : [...prev, symptom]
        );
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        const { data, error } = await logsApi.create({
            logDate: selectedDate,
            symptoms,
            mood: mood || undefined,
            notes: notes || undefined,
            weight: weight ? parseFloat(weight) : undefined,
            bloodPressure: bloodPressure || undefined,
            bloodSugar: bloodSugar ? parseFloat(bloodSugar) : undefined,
        });

        if (error) {
            setMessage(`Error: ${error}`);
        } else {
            setMessage(data?.message || 'Log saved!');
            await loadLogs();
            resetForm();
        }

        setIsSaving(false);
    };

    const resetForm = () => {
        setShowForm(false);
        setSymptoms([]);
        setMood('');
        setNotes('');
        setWeight('');
        setBloodPressure('');
        setBloodSugar('');
        setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    const loadLogForEdit = async (date: string) => {
        const { data } = await logsApi.getByDate(date);
        if (data) {
            setSelectedDate(date);
            setSymptoms(data.symptoms || []);
            setMood(data.mood || '');
            setNotes(data.notes || '');
            setWeight(data.weight?.toString() || '');
            setBloodPressure(data.blood_pressure || '');
            setBloodSugar(data.blood_sugar?.toString() || '');
            setShowForm(true);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Daily Logs</h1>
                        <p className="text-gray-600">Track your symptoms, mood, and notes each day</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                        className="btn btn-primary"
                    >
                        + Add Today's Log
                    </button>
                </div>

                {message && (
                    <div className={`px-4 py-3 rounded-xl text-sm ${message.startsWith('Error')
                        ? 'bg-blush-50 border border-blush-200 text-blush-700'
                        : 'bg-mint-50 border border-mint-200 text-mint-700'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Add/Edit Form */}
                {showForm && (
                    <div className="card animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Log Entry</h2>
                            <button
                                onClick={resetForm}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            {/* Mood Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    How are you feeling today?
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {MOOD_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setMood(option.value)}
                                            className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all ${mood === option.value
                                                ? 'border-lavender-400 bg-lavender-50'
                                                : 'border-gray-200 hover:border-lavender-200'
                                                }`}
                                        >
                                            <span className="text-2xl mb-1">{option.emoji}</span>
                                            <span className="text-xs text-gray-600">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Symptoms */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Symptoms
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {SYMPTOM_OPTIONS.map((symptom) => (
                                        <button
                                            key={symptom}
                                            type="button"
                                            onClick={() => toggleSymptom(symptom)}
                                            className={`px-4 py-2 rounded-full text-sm transition-all ${symptoms.includes(symptom)
                                                ? 'bg-lavender-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-lavender-100'
                                                }`}
                                        >
                                            {symptom}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="How was your day? Any concerns or highlights?"
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>

                            {/* Optional Vitals */}
                            <details className="group">
                                <summary className="cursor-pointer text-sm font-medium text-lavender-600 hover:text-lavender-700">
                                    + Add optional vitals
                                </summary>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            placeholder="65.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Blood Pressure</label>
                                        <input
                                            type="text"
                                            value={bloodPressure}
                                            onChange={(e) => setBloodPressure(e.target.value)}
                                            placeholder="120/80"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Blood Sugar (mg/dL)</label>
                                        <input
                                            type="number"
                                            value={bloodSugar}
                                            onChange={(e) => setBloodSugar(e.target.value)}
                                            placeholder="95"
                                        />
                                    </div>
                                </div>
                            </details>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn btn-primary flex-1"
                                >
                                    {isSaving ? 'Saving...' : 'Save Log'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Logs List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4 animate-pulse-soft">📝</div>
                            <p className="text-gray-500">Loading your logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="card text-center py-12">
                            <div className="text-5xl mb-4">📝</div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No logs yet</h3>
                            <p className="text-gray-500 mb-4">Start tracking your pregnancy journey today!</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="btn btn-primary"
                            >
                                Add Your First Log
                            </button>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div
                                key={log.id}
                                className="card hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => loadLogForEdit(log.log_date)}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-lg font-semibold text-gray-800">
                                            {new Date(log.log_date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                        {log.mood && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xl">
                                                    {MOOD_OPTIONS.find(m => m.value === log.mood)?.emoji}
                                                </span>
                                                <span className="text-gray-600 capitalize">{log.mood}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-lavender-500 text-sm">Edit →</span>
                                </div>

                                {log.symptoms.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {log.symptoms.map((symptom, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 bg-lavender-100 text-lavender-700 rounded-full text-sm"
                                            >
                                                {symptom}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {log.notes && (
                                    <p className="mt-3 text-gray-600 text-sm line-clamp-2">{log.notes}</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
}
