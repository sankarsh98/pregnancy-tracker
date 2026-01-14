import React from 'react';

interface TrackerCounterProps {
    label: string;
    emoji: string;
    value: number;
    unit?: string;
    onChange: (newValue: number) => void;
    min?: number;
    max?: number;
}

export const TrackerCounter: React.FC<TrackerCounterProps> = ({
    label,
    emoji,
    value,
    unit = '',
    onChange,
    min = 0,
    max = 100
}) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-xl">
                    {emoji}
                </div>
                <div>
                    <h3 className="font-medium text-gray-800">{label}</h3>
                    {value > 0 && <p className="text-xs text-pink-500">{value} {unit}</p>}
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={value <= min}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                    -
                </button>
                <span className="w-8 text-center font-semibold text-gray-700">{value}</span>
                <button
                    onClick={() => onChange(Math.min(max, value + 1))}
                    disabled={value >= max}
                    className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center hover:bg-pink-200 disabled:opacity-50"
                >
                    +
                </button>
            </div>
        </div>
    );
};
