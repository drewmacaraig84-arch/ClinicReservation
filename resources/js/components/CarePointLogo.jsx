import React from 'react';

export default function CarePointLogo({ dark = false, size = 'md' }) {
    const iconSizes = {
        sm: 'w-9 h-9',
        md: 'w-11 h-11',
        lg: 'w-14 h-14',
    };

    const textSizes = {
        sm: 'text-base',
        md: 'text-lg',
        lg: 'text-2xl',
    };

    return (
        <div className="flex items-center gap-2.5 select-none">
            <div className={`${iconSizes[size]} rounded-full bg-white flex items-center justify-center shadow-sm ring-1 ring-sky-200/80 relative overflow-hidden shrink-0`}>
                <img
                    src="/labcure-logo.jpg"
                    alt="Labcure Laboratory Inc. & Medical Services"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="leading-tight">
                <div className={`font-extrabold tracking-tight ${textSizes[size]} ${dark ? 'text-white' : 'text-[#0b3b75]'}`}>
                    LABCURE
                </div>
                <div className={`text-[10px] font-bold tracking-wider uppercase -mt-0.5 ${dark ? 'text-sky-300' : 'text-sky-600'}`}>
                    Laboratory & Medical Services
                </div>
            </div>
        </div>
    );
}


