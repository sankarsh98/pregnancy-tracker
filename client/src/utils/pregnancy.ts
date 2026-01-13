/**
 * Calculate the pregnancy week and day from LMP date
 */
export function calculatePregnancyWeek(lmpDate: Date | string, dueDate?: Date | string): { week: number; day: number; totalDays: number } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let anchorDate: Date;

    if (dueDate) {
        // If due date is provided, calculation is based on it
        // Standard term is 280 days. So effective LMP is Due Date - 280 days.
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        anchorDate = new Date(due);
        anchorDate.setDate(due.getDate() - 280);
    } else {
        const lmp = new Date(lmpDate);
        lmp.setHours(0, 0, 0, 0);
        anchorDate = lmp;
    }

    const diffMs = today.getTime() - anchorDate.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
        week: Math.floor(totalDays / 7),
        day: totalDays % 7,
        totalDays
    };
}

/**
 * Calculate due date from LMP (LMP + 280 days = 40 weeks)
 */
export function calculateDueDate(lmpDate: Date | string): Date {
    const dueDate = new Date(lmpDate);
    dueDate.setDate(dueDate.getDate() + 280);
    return dueDate;
}

/**
 * Calculate days remaining until due date
 */
export function calculateDaysRemaining(dueDate: Date | string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffMs = due.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get trimester from week number
 */
export function getTrimester(week: number): 1 | 2 | 3 {
    if (week <= 13) return 1;
    if (week <= 27) return 2;
    return 3;
}

/**
 * Get trimester label
 */
export function getTrimesterLabel(trimester: 1 | 2 | 3): string {
    switch (trimester) {
        case 1: return 'First Trimester';
        case 2: return 'Second Trimester';
        case 3: return 'Third Trimester';
    }
}
