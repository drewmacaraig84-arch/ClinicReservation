import React from 'react';
import {
    LogOut,
    User,
} from 'lucide-react';

export default function PortalSidebarNav({
    authSession,
    onLogout,
}) {
    if (!authSession) return null;

    return (
        <div className="pt-4 mt-4 border-t border-slate-800 space-y-3">
            {/* Logged-in User Role Badge */}
            <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/70 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-extrabold uppercase tracking-wider">
                    <User className="w-3 h-3" />
                    <span>{authSession.roleLabel || authSession.role}</span>
                </div>
                <div className="text-xs font-extrabold text-white truncate pt-0.5">
                    {authSession.user?.name}
                </div>
                {authSession.user?.email && (
                    <div className="text-[11px] text-slate-400 truncate">
                        {authSession.user.email}
                    </div>
                )}
            </div>

            {/* Sign Out Button */}
            <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-extrabold transition cursor-pointer"
            >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
            </button>
        </div>
    );
}

