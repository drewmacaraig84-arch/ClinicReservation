import React from 'react';

export default function CarePointLogo({ dark = false, size = 'md' }) {
    const iconSizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
    };

    const textSizes = {
        sm: 'text-base',
        md: 'text-lg',
        lg: 'text-3xl',
    };

    return (
        <div className="flex items-center gap-2.5 select-none">
            <div className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-teal-600 to-slate-800 flex items-center justify-center shadow-sm relative overflow-hidden shrink-0`}>
                <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7">
                    <path
                        d="M14 6H22V14H30V22H22V30H14V22H6V14H14V6Z"
                        fill="#14B8A6"
                        fillOpacity="0.25"
                    />
                    <path
                        d="M15 8H21V15H28V21H21V28H15V21H8V15H15V8Z"
                        stroke="#FFFFFF"
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                    />
                    <circle cx="18" cy="18" r="3.5" fill="#2DD4BF" />
                </svg>
            </div>
            <div className="leading-tight">
                <div className={`font-extrabold tracking-tight ${textSizes[size]} ${dark ? 'text-white' : 'text-slate-800'}`}>
                    CarePoint
                </div>
                <div className={`text-xs font-semibold tracking-wide uppercase -mt-0.5 ${dark ? 'text-teal-300' : 'text-teal-700'}`}>
                    Clinic
                </div>
            </div>
        </div>
    );
}

