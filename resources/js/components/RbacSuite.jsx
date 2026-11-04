import React, { useState } from 'react';
import {
    KeyRound,
    Lock,
    X,
    Stethoscope,
    UserCheck,
    Tv,
    LayoutDashboard,
    ShieldAlert,
    ArrowRight,
} from 'lucide-react';

export const PORTAL_ROLE_DEFINITIONS = {
    doctor: {
        id: 'doctor',
        name: 'Doctor Portal',
        roleLabel: 'Doctor / Physician',
        email: 'sarah.johnson@carepoint.clinic',
        accountName: 'Dr. Sarah Johnson',
        defaultPortal: 'doctor',
        allowedPortals: ['doctor'],
        icon: Stethoscope,
        description: 'View assigned patients, record clinical notes & prescriptions, edit clinic hours & profile details.',
    },
    staff: {
        id: 'staff',
        name: 'Staff / Reception',
        roleLabel: 'Reception Desk Staff',
        email: 'reception@carepoint.clinic',
        accountName: 'Clara Receptionist (Desk 1)',
        defaultPortal: 'staff',
        allowedPortals: ['staff'],
        icon: UserCheck,
        description: 'Manage Desk 1 active queue, call/serve tickets, check in patients, generate walk-in tickets & view live doctor availability.',
    },
    tv_display: {
        id: 'tv_display',
        name: 'Queuing TV Display',
        roleLabel: 'Queuing TV Monitor',
        email: 'tv@carepoint.clinic',
        accountName: 'Waiting Lounge TV Display',
        defaultPortal: 'tv',
        allowedPortals: ['tv'],
        icon: Tv,
        description: 'Full-screen waiting lounge TV display showing NOW SERVING rooms, UPCOMING QUEUE, and ticker announcements.',
    },
    admin: {
        id: 'admin',
        name: 'Admin Dashboard',
        roleLabel: 'Clinic Administrator',
        email: 'admin@carepoint.clinic',
        accountName: 'Admin User',
        defaultPortal: 'admin',
        allowedPortals: ['admin'],
        icon: LayoutDashboard,
        description: 'View clinic KPIs, interactive 7-day & department graph reports, manage queue, export CSVs, and manage doctors.',
    },
    super_admin: {
        id: 'super_admin',
        name: 'Super Admin Observatory',
        roleLabel: 'Super Administrator',
        email: 'superadmin@carepoint.clinic',
        accountName: 'chief.architect (Super Admin)',
        defaultPortal: 'super_admin',
        allowedPortals: ['super_admin'],
        icon: ShieldAlert,
        description: 'System health telemetry, Load Balancer/CDN/Rate-Limiter status, crash logs, and soft-deleted data recovery vault.',
    },
};

export function PortalLoginModal({ isOpen, onClose, onLoginSuccess, notify }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const performLogin = async (loginEmail, loginPassword, fallbackRole = null) => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(
                    loginEmail
                        ? { email: loginEmail, password: loginPassword }
                        : { role: fallbackRole }
                ),
            });
            const data = await res.json();
            if (!res.ok) {
                notify(data.message || 'Invalid login credentials.', 'error');
            } else {
                const roleDef = PORTAL_ROLE_DEFINITIONS[data.role] || {
                    defaultPortal: 'client',
                    allowedPortals: ['client'],
                    roleLabel: data.role,
                };
                onLoginSuccess({
                    user: data.user,
                    role: data.role,
                    token: data.token,
                    defaultPortal: roleDef.defaultPortal,
                    allowedPortals: roleDef.allowedPortals,
                    roleLabel: roleDef.roleLabel,
                });
                notify(data.message, 'success');
                onClose();
            }
        } catch (err) {
            notify('Network error during authentication.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        performLogin(email, password);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-[#13467b] text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Lock className="w-5 h-5 text-teal-300" />
                        <div>
                            <h3 className="text-base font-extrabold">
                                Authorized Clinic Portal Sign In
                            </h3>
                            <p className="text-xs text-blue-200">
                                Enter your authorized staff, physician, or administrator credentials
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Email & Password Form */}
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Portal Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-[#13467b] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-[#13467b] focus:outline-none"
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 rounded-xl bg-[#13467b] hover:bg-[#0e355e] text-white text-xs sm:text-sm font-extrabold uppercase tracking-wide shadow-sm transition cursor-pointer"
                            >
                                {submitting ? 'Authenticating...' : 'Sign In to Portal'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
