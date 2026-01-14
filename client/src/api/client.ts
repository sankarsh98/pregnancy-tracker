import { supabase } from '../lib/supabase';
import {
    calculatePregnancyWeek,
    calculateDueDate,
    calculateDaysRemaining,
    getTrimester,
    getTrimesterLabel
} from '../utils/pregnancy';
import educationData from '../data/education.json';

// Types
export interface PregnancyData {
    id: string;
    lmpDate: string;
    dueDate: string;
    week: number;
    day: number;
    totalDays: number;
    daysRemaining: number;
    trimester: 1 | 2 | 3;
    trimesterLabel: string;
    createdAt: string;
}

export interface DailyLog {
    id: string;
    pregnancy_id: string;
    log_date: string;
    symptoms: string[];
    mood: string;
    notes: string;
    weight: number | null;
    blood_pressure: string | null;
    blood_sugar: number | null;
    water_intake: number;
    custom_metrics: Record<string, number>;
    created_at: string;
}

export interface TrackerConfig {
    id: string;
    user_id: string;
    name: string;
    emoji: string;
    daily_goal: number | null;
    created_at: string;
}

export interface Appointment {
    id: string;
    pregnancy_id: string;
    title: string;
    datetime: string;
    location: string | null;
    notes: string | null;
    created_at: string;
}

// Education Types
export interface WeekContent {
    week: number;
    title: string;
    trimester: number;
    babySize: string;
    development: string;
    symptoms: string[];
    tips: string[];
}

export interface TrimesterContent {
    trimester: number;
    title: string;
    weeks: string;
    overview: string;
    keyMilestones: string[];
    selfCare: string[];
}

export interface EducationData {
    weeks: WeekContent[];
    trimesters: TrimesterContent[];
}

// Auth API
export const authApi = {
    signup: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) return { error: error.message };
        return { data: { token: data.session?.access_token, userId: data.user?.id } };
    },

    login: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) return { error: error.message };
        return { data: { token: data.session?.access_token, userId: data.user?.id } };
    },

    me: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return { error: 'Not authenticated' };
        return { data: { id: user.id, email: user.email || '' } };
    },

    logout: async () => {
        await supabase.auth.signOut();
    }
};

// Pregnancy API
export const pregnancyApi = {
    get: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data, error } = await supabase
            .from('pregnancies')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .limit(1);

        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: 'No active pregnancy found' };

        const pregnancy = data[0];

        // Calculate derived (computed) fields on client side
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

        return { data: pregnancyData };
    },

    create: async (lmpDate: string, dueDate?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        // Deactivate existing pregnancies
        await supabase
            .from('pregnancies')
            .update({ is_active: false })
            .eq('user_id', user.id);

        const calculatedDueDate = dueDate || calculateDueDate(new Date(lmpDate)).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('pregnancies')
            .insert({
                user_id: user.id,
                lmp_date: lmpDate,
                due_date: calculatedDueDate,
                is_active: true
            })
            .select();

        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: 'Failed to create pregnancy' };
        return { data: { id: data[0].id, lmpDate: data[0].lmp_date, dueDate: data[0].due_date } };
    },

    update: async (id: string, dueDate: string) => {
        const { error } = await supabase
            .from('pregnancies')
            .update({ due_date: dueDate })
            .eq('id', id);

        if (error) return { error: error.message };
        return { data: { message: 'Updated successfully' } };
    }
};

// Trackers API
export const trackersApi = {
    getAll: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data, error } = await supabase
            .from('tracker_configs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (error) return { error: error.message };
        return { data: data as TrackerConfig[] };
    },

    create: async (name: string, emoji: string, dailyGoal?: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data, error } = await supabase
            .from('tracker_configs')
            .insert({
                user_id: user.id,
                name,
                emoji,
                daily_goal: dailyGoal
            })
            .select()
            .single();

        if (error) return { error: error.message };
        return { data: data as TrackerConfig };
    },

    delete: async (id: string) => {
        const { error } = await supabase
            .from('tracker_configs')
            .delete()
            .eq('id', id);

        if (error) return { error: error.message };
        return { data: true };
    }
};

// Daily Logs API
export const logsApi = {
    getAll: async () => {
        const { data: pregnancy } = await pregnancyApi.get();
        if (!pregnancy) return { error: 'No pregnancy found' };

        const { data, error } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('pregnancy_id', pregnancy.id)
            .order('log_date', { ascending: true });

        if (error) return { error: error.message };
        return { data: data as DailyLog[] };
    },

    getByDate: async (date: string) => {
        const { data: pregnancy } = await pregnancyApi.get();
        if (!pregnancy) return { error: 'No pregnancy found' };

        const { data, error } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('pregnancy_id', pregnancy.id)
            .eq('log_date', date)
            .limit(1);

        if (error || !data || data.length === 0) return { data: null }; // No log for this date is fine
        return { data: data[0] as DailyLog };
    },

    create: async (logData: {
        logDate: string;
        symptoms?: string[];
        mood?: string;
        notes?: string;
        weight?: number;
        bloodPressure?: string;
        bloodSugar?: number;
        waterIntake?: number;
        customMetrics?: Record<string, number>;
    }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data: pregnancy } = await pregnancyApi.get();
        if (!pregnancy) return { error: 'No pregnancy found' };

        const { data: existingRows } = await supabase
            .from('daily_logs')
            .select('id')
            .eq('pregnancy_id', pregnancy.id)
            .eq('log_date', logData.logDate)
            .limit(1);

        const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

        let error;
        const payload: any = {
            symptoms: logData.symptoms,
            mood: logData.mood,
            notes: logData.notes,
            weight: logData.weight,
            blood_pressure: logData.bloodPressure,
            blood_sugar: logData.bloodSugar,
            water_intake: logData.waterIntake,
            custom_metrics: logData.customMetrics
        };

        // Remove undefined keys
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        if (existing) {
            ({ error } = await supabase
                .from('daily_logs')
                .update(payload)
                .eq('id', existing.id));
        } else {
            ({ error } = await supabase
                .from('daily_logs')
                .insert({
                    pregnancy_id: pregnancy.id,
                    user_id: user.id,
                    log_date: logData.logDate,
                    ...payload,
                    // Ensure arrays/objects are initialized if creating new
                    symptoms: payload.symptoms || [],
                    custom_metrics: payload.custom_metrics || {}
                }));
        }

        if (error) return { error: error.message };
        return { data: { id: existing?.id || 'new', message: 'Log saved' } };
    }
};

// Appointments API
export const appointmentsApi = {
    getAll: async () => {
        const { data: pregnancy } = await pregnancyApi.get();
        if (!pregnancy) return { error: 'No pregnancy found' };

        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('pregnancy_id', pregnancy.id)
            .order('datetime', { ascending: true });

        if (error) return { error: error.message };
        return { data: data as Appointment[] };
    },

    create: async (data: {
        title: string;
        datetime: string;
        location?: string;
        notes?: string;
    }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data: pregnancy } = await pregnancyApi.get();
        if (!pregnancy) return { error: 'No pregnancy found' };

        const { data: result, error } = await supabase
            .from('appointments')
            .insert({
                pregnancy_id: pregnancy.id,
                user_id: user.id,
                title: data.title,
                datetime: data.datetime,
                location: data.location,
                notes: data.notes
            })
            .select();

        if (error) return { error: error.message };
        if (!result || result.length === 0) return { error: 'Failed to create appointment' };
        return { data: { id: result[0].id, message: 'Appointment created' } };
    },

    update: async (id: string, updateData: Partial<Omit<Appointment, 'id' | 'pregnancy_id' | 'created_at'>>) => {
        const { error } = await supabase
            .from('appointments')
            .update({
                title: updateData.title,
                datetime: updateData.datetime,
                location: updateData.location,
                notes: updateData.notes
            })
            .eq('id', id);

        if (error) return { error: error.message };
        return { data: { message: 'Updated' } };
    },

    delete: async (id: string) => {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) return { error: error.message };
        return { data: { message: 'Deleted' } };
    }
};

// Education API (Client-side now)
export const educationApi = {
    getAll: async () => {
        // Return local JSON data
        return { data: educationData as unknown as EducationData };
    },

    getWeek: async (week: number) => {
        const data = educationData as unknown as EducationData;
        // Find exact match first
        const exactMatch = data.weeks.find(w => w.week === week);
        if (exactMatch) return { data: exactMatch };

        // Fallback: find the closest week that is <= current week
        const closestWeek = data.weeks
            .filter(w => w.week <= week)
            .sort((a, b) => b.week - a.week)[0]; // Sort descending, take first (highest)

        return { data: closestWeek };
    },

    getTrimester: async (trimester: number) => {
        const data = educationData as unknown as EducationData;
        const triContent = data.trimesters.find(t => t.trimester === trimester);
        // We can filter weeks for this trimester if needed, but UI uses full data usually
        return { data: { ...triContent, weeks: [] } as any };
    }
};

// Export API (Client-side generation)
export const exportApi = {
    getPdfData: async () => {
        const { data: user } = await authApi.me();
        const { data: pregnancy } = await pregnancyApi.get();
        if (!pregnancy) return { error: 'No pregnancy' };

        const { data: logs } = await logsApi.getAll();
        const { data: appointments } = await appointmentsApi.getAll();

        // Return structure needed for client-side PDF generator
        return {
            data: {
                user: { email: user?.email || '' },
                pregnancy,
                logs: logs || [],
                appointments: appointments || [],
                generatedAt: new Date().toISOString()
            }
        };
    },

    downloadCsv: async () => {
        const { data: logs } = await logsApi.getAll();
        if (!logs) return { error: 'No logs found' };

        const headers = ['Date', 'Symptoms', 'Mood', 'Notes', 'Weight', 'Blood Pressure', 'Blood Sugar'];
        const rows = logs.map((log) => [
            log.log_date,
            // Supabase returns array directly if JSON column
            Array.isArray(log.symptoms) ? log.symptoms.join('; ') : '',
            log.mood || '',
            (log.notes || '').replace(/"/g, '""'),
            log.weight || '',
            log.blood_pressure || '',
            log.blood_sugar || ''
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pregnancy_logs.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        return { data: true };
    }
};
