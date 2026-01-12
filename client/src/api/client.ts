const API_BASE = '/api';

interface ApiResponse<T> {
    data?: T;
    error?: string;
}

function getToken(): string | null {
    return localStorage.getItem('token');
}

export function setToken(token: string): void {
    localStorage.setItem('token', token);
}

export function removeToken(): void {
    localStorage.removeItem('token');
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.error || 'Request failed' };
        }

        return { data };
    } catch (error) {
        return { error: 'Network error' };
    }
}

// Auth API
export const authApi = {
    signup: (email: string, password: string) =>
        request<{ token: string; userId: string }>('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    login: (email: string, password: string) =>
        request<{ token: string; userId: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    me: () => request<{ id: string; email: string }>('/auth/me'),
};

// Pregnancy API
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

export const pregnancyApi = {
    get: () => request<PregnancyData>('/pregnancy'),

    create: (lmpDate: string, dueDate?: string) =>
        request<{ id: string; lmpDate: string; dueDate: string }>('/pregnancy', {
            method: 'POST',
            body: JSON.stringify({ lmpDate, dueDate }),
        }),

    update: (id: string, dueDate: string) =>
        request<{ message: string }>(`/pregnancy/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ dueDate }),
        }),
};

// Daily Logs API
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
    created_at: string;
    updated_at: string;
}

export const logsApi = {
    getAll: () => request<DailyLog[]>('/logs'),

    getByDate: (date: string) => request<DailyLog>(`/logs/${date}`),

    create: (data: {
        logDate: string;
        symptoms?: string[];
        mood?: string;
        notes?: string;
        weight?: number;
        bloodPressure?: string;
        bloodSugar?: number;
    }) =>
        request<{ id: string; message: string }>('/logs', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// Appointments API
export interface Appointment {
    id: string;
    pregnancy_id: string;
    title: string;
    datetime: string;
    location: string | null;
    notes: string | null;
    created_at: string;
}

export const appointmentsApi = {
    getAll: () => request<Appointment[]>('/appointments'),

    create: (data: {
        title: string;
        datetime: string;
        location?: string;
        notes?: string;
    }) =>
        request<{ id: string; message: string }>('/appointments', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: Partial<Omit<Appointment, 'id' | 'pregnancy_id' | 'created_at'>>) =>
        request<{ message: string }>(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        request<{ message: string }>(`/appointments/${id}`, {
            method: 'DELETE',
        }),
};

// Education API
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

export const educationApi = {
    getAll: () => request<EducationData>('/education'),

    getWeek: (week: number) => request<WeekContent>(`/education/week/${week}`),

    getTrimester: (trimester: number) =>
        request<TrimesterContent & { weeks: WeekContent[] }>(`/education/trimester/${trimester}`),
};

// Export API
export interface ExportData {
    user: { email: string };
    pregnancy: PregnancyData;
    logs: DailyLog[];
    appointments: Appointment[];
    generatedAt: string;
}

export const exportApi = {
    getPdfData: () => request<ExportData>('/export/pdf'),

    downloadCsv: async () => {
        const token = getToken();
        const response = await fetch(`${API_BASE}/export/csv`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
            return { error: 'Failed to download CSV' };
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pregnancy_logs.csv';
        a.click();
        window.URL.revokeObjectURL(url);

        return { data: true };
    },
};
