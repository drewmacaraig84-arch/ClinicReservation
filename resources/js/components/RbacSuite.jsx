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
        allowedPortals: ['doctor', 'tv', 'client'],
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
        allowedPortals: ['staff', 'tv', 'client'],
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
        allowedPortals: ['tv', 'client'],
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
        allowedPortals: ['admin', 'staff', 'doctor', 'tv', 'client'],
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
        allowedPortals: ['super_admin', 'admin', 'staff', 'doctor', 'tv', 'client'],
        icon: ShieldAlert,
        description: 'System health telemetry, Load Balancer/CDN/Rate-Limiter status, crash logs, and soft-deleted data recovery vault.',
    },
};

export function PortalLoginModal({ isOpen, onClose, onLoginSuccess, notify }) {
    const [email, setEmail] = useState('sarah.johnson@carepoint.clinic');
    const [password, setPassword] = useState('password123');
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
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-[#13467b] text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Lock className="w-5 h-5 text-teal-300" />
                        <div>
                            <h3 className="text-base font-extrabold">
                                Authorized Clinic Portal Sign In
                            </h3>
                            <p className="text-xs text-blue-200">
                                Sign in to access Doctor, Staff / Reception, Queuing TV, Admin, or Super Admin portals
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

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Email & Password Form */}
                    <form
                        onSubmit={handleFormSubmit}
                        className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Portal Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@carepoint.clinic"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-[#13467b] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-[#13467b] focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs text-slate-500">
                                Default demo password for all accounts: <code>password123</code>
                            </span>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-lg bg-[#13467b] hover:bg-[#0e355e] text-white text-xs font-extrabold uppercase tracking-wide shadow-sm transition cursor-pointer"
                            >
                                {submitting ? 'Authenticating...' : 'Sign In to Portal →'}
                            </button>
                        </div>
                    </form>

                    {/* Quick Role Portal Login Cards (Doctor, Staff, Queuing TV, Admin, Super Admin) */}
                    <div>
                        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                            Or Click Any Authorized Role Account Below to Sign In Immediately:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.values(PORTAL_ROLE_DEFINITIONS).map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-xl border border-slate-200 hover:border-[#13467b] bg-white p-4 flex flex-col justify-between space-y-3 shadow-2xs transition"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#13467b]">
                                                    <Icon className="w-4 h-4 text-teal-600" />
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="font-bold text-xs text-slate-900">
                                                {item.accountName}
                                            </div>
                                            <div className="text-[11px] font-mono text-slate-500">
                                                {item.email}
                                            </div>
                                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => {
                                                setEmail(item.email);
                                                setPassword('password123');
                                                performLogin(item.email, 'password123', item.id);
                                            }}
                                            className="w-full py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                                        >
                                            <span>Login as {item.name}</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
