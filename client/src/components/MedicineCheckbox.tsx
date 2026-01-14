import React from 'react';

interface MedicineCheckboxProps {
    label: string;
    emoji: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const MedicineCheckbox: React.FC<MedicineCheckboxProps> = ({
    label,
    emoji,
    checked,
    onChange
}) => {
    return (
        <div 
            onClick={() => onChange(!checked)}
            className={`cursor-pointer p-4 rounded-xl shadow-sm border flex items-center gap-3 transition-all ${
                checked 
                    ? 'bg-mint-50 border-mint-200 shadow-md' 
                    : 'bg-white border-gray-100 hover:border-pink-100'
            }`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors ${
                checked ? 'bg-mint-100' : 'bg-gray-50'
            }`}>
                {emoji}
            </div>
            <div className="flex-1">
                <h3 className={`font-medium transition-colors ${checked ? 'text-gray-800' : 'text-gray-600'}`}>{label}</h3>
                <p className="text-xs text-gray-400">{checked ? 'Taken' : 'Not taken yet'}</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                checked 
                    ? 'bg-mint-500 border-mint-500 text-white' 
                    : 'border-gray-300'
            }`}>
                {checked && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
        </div>
    );
};
