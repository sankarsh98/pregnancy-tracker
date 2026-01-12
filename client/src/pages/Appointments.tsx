import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Layout from '../components/Layout';
import { appointmentsApi } from '../api/client';
import type { Appointment } from '../api/client';

export default function Appointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [datetime, setDatetime] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        const { data } = await appointmentsApi.getAll();
        if (data) {
            setAppointments(data);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        if (editingId) {
            const { error } = await appointmentsApi.update(editingId, {
                title,
                datetime,
                location: location || undefined,
                notes: notes || undefined,
            });
            if (error) {
                setMessage(`Error: ${error}`);
            } else {
                setMessage('Appointment updated!');
                await loadAppointments();
                resetForm();
            }
        } else {
            const { error } = await appointmentsApi.create({
                title,
                datetime,
                location: location || undefined,
                notes: notes || undefined,
            });
            if (error) {
                setMessage(`Error: ${error}`);
            } else {
                setMessage('Appointment created!');
                await loadAppointments();
                resetForm();
            }
        }

        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this appointment?')) return;

        const { error } = await appointmentsApi.delete(id);
        if (error) {
            setMessage(`Error: ${error}`);
        } else {
            setMessage('Appointment deleted');
            await loadAppointments();
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setTitle('');
        setDatetime('');
        setLocation('');
        setNotes('');
    };

    const startEdit = (apt: Appointment) => {
        setEditingId(apt.id);
        setTitle(apt.title);
        setDatetime(apt.datetime.slice(0, 16)); // Format for datetime-local input
        setLocation(apt.location || '');
        setNotes(apt.notes || '');
        setShowForm(true);
    };

    // Separate upcoming and past appointments
    const now = new Date();
    const upcoming = appointments.filter(a => new Date(a.datetime) >= now);
    const past = appointments.filter(a => new Date(a.datetime) < now);

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
                        <p className="text-gray-600">Manage your prenatal checkups and visits</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="btn btn-primary"
                    >
                        + Add Appointment
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
                            <h2 className="text-xl font-semibold text-gray-800">
                                {editingId ? 'Edit Appointment' : 'New Appointment'}
                            </h2>
                            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., 20-week ultrasound"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={datetime}
                                    onChange={(e) => setDatetime(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Hospital name or address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Questions to ask, things to remember..."
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={resetForm} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSaving} className="btn btn-primary flex-1">
                                    {isSaving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Appointments List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4 animate-pulse-soft">📅</div>
                        <p className="text-gray-500">Loading appointments...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-5xl mb-4">📅</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No appointments yet</h3>
                        <p className="text-gray-500 mb-4">Schedule your prenatal visits here</p>
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            Add Your First Appointment
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Upcoming */}
                        {upcoming.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-700 mb-3">Upcoming</h2>
                                <div className="space-y-3">
                                    {upcoming.map((apt) => (
                                        <div key={apt.id} className="card">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4">
                                                    <div className="bg-lavender-100 text-lavender-700 rounded-xl p-3 text-center min-w-[70px]">
                                                        <div className="text-2xl font-bold">
                                                            {new Date(apt.datetime).getDate()}
                                                        </div>
                                                        <div className="text-xs">
                                                            {new Date(apt.datetime).toLocaleDateString('en-US', { month: 'short' })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-800">{apt.title}</h3>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(apt.datetime).toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                        {apt.location && (
                                                            <p className="text-sm text-gray-500 mt-1">📍 {apt.location}</p>
                                                        )}
                                                        {apt.notes && (
                                                            <p className="text-sm text-gray-600 mt-2">{apt.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => startEdit(apt)}
                                                        className="text-lavender-600 hover:text-lavender-700 text-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(apt.id)}
                                                        className="text-blush-600 hover:text-blush-700 text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past */}
                        {past.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-500 mb-3">Past</h2>
                                <div className="space-y-3 opacity-70">
                                    {past.map((apt) => (
                                        <div key={apt.id} className="card">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-gray-100 text-gray-500 rounded-xl p-3 text-center min-w-[70px]">
                                                    <div className="text-xl font-bold">
                                                        {new Date(apt.datetime).getDate()}
                                                    </div>
                                                    <div className="text-xs">
                                                        {new Date(apt.datetime).toLocaleDateString('en-US', { month: 'short' })}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-700">{apt.title}</h3>
                                                    {apt.location && (
                                                        <p className="text-sm text-gray-500">📍 {apt.location}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
