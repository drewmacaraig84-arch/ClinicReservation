import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ClientReservationPortal from './portals/ClientReservationPortal';
import TvQueuePortal from './portals/TvQueuePortal';
import StaffReceptionPortal from './portals/StaffReceptionPortal';
import DoctorPortal from './portals/DoctorPortal';
import AdminPortal from './portals/AdminPortal';
import SuperAdminPortal from './portals/SuperAdminPortal';
import LegalAndConsentSuite from './components/LegalAndConsentSuite';
import {
    PORTAL_ROLE_DEFINITIONS,
    PortalLoginModal,
} from './components/RbacSuite';
import {
    getAuthSession,
    setAuthSession,
    clearAuthSession,
} from './utils/apiCache';
import {
    Globe,
    Tv,
    UserCheck,
    Stethoscope,
    LayoutDashboard,
    ShieldAlert,
    CheckCircle2,
    AlertCircle,
    LogOut,
    User,
} from 'lucide-react';

const PORTALS = [
    {
        id: 'client',
        label: 'Client Website',
        icon: Globe,
    },
    {
        id: 'tv',
        label: 'Queuing TV Display',
        icon: Tv,
    },
    {
        id: 'staff',
        label: 'Staff / Reception',
        icon: UserCheck,
    },
    {
        id: 'doctor',
        label: 'Doctor Side',
        icon: Stethoscope,
    },
    {
        id: 'admin',
        label: 'Admin & Reports',
        icon: LayoutDashboard,
    },
    {
        id: 'super_admin',
        label: 'Super Admin',
        icon: ShieldAlert,
    },
];

function App() {
    const [authSession, setAuthSessionState] = useState(() => getAuthSession());
    const [activePortal, setActivePortal] = useState(() => {
        const current = getAuthSession();
        return current?.defaultPortal || 'client';
    });
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [legalModalTab, setLegalModalTab] = useState(null);
    const [toast, setToast] = useState(null);

    const notify = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast((current) => (current?.message === message ? null : current));
        }, 4500);
    };

    const handleLoginSuccess = (sessionData) => {
        setAuthSession(sessionData);
        setAuthSessionState(sessionData);
        setActivePortal(sessionData.defaultPortal || 'client');
    };

    const handleLogout = () => {
        clearAuthSession();
        setAuthSessionState(null);
        setActivePortal('client');
        notify('Signed out of portal session. Returned to public Client Website.', 'success');
    };

    const allowedPortals = authSession?.allowedPortals || ['client'];
    const currentPortalToRender =
        authSession && allowedPortals.includes(activePortal) ? activePortal : 'client';

    return (
        <div className="min-h-screen bg-slate-200/70 flex flex-col">
            {/* Authenticated Session Bar: ONLY visible when logged in as Doctor, Staff, Queuing TV, Admin, or Super Admin */}
            {authSession && (
                <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-xs">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/20 border border-teal-500/30 text-teal-300 font-extrabold uppercase">
                                <User className="w-3.5 h-3.5" />
                                {authSession.roleLabel || authSession.role}
                            </span>
                            <span className="font-semibold text-slate-200">
                                {authSession.user?.name}
                            </span>
                        </div>

                        {/* Show ONLY the portals this logged-in user's role is permitted to access */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {PORTALS.filter((p) => allowedPortals.includes(p.id)).map((portal) => {
                                const Icon = portal.icon;
                                const isActive = currentPortalToRender === portal.id;
                                return (
                                    <button
                                        key={portal.id}
                                        type="button"
                                        onClick={() => setActivePortal(portal.id)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${isActive
                                                ? 'bg-teal-600 text-white shadow-sm'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{portal.label}</span>
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition cursor-pointer ml-1"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification Banner */}
            {toast && (
                <div className="fixed top-16 right-5 z-50 max-w-md animate-bounce">
                    <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold ${toast.type === 'error'
                                ? 'bg-red-950 text-red-100 border-red-500'
                                : 'bg-slate-900 text-emerald-300 border-emerald-500'
                            }`}
                    >
                        {toast.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Active Portal View */}
            <div className="flex-1">
                {currentPortalToRender === 'client' && (
                    <ClientReservationPortal
                        onSwitchPortal={(target) => {
                            if (authSession && allowedPortals.includes(target)) {
                                setActivePortal(target);
                            } else {
                                setLoginModalOpen(true);
                            }
                        }}
                        onOpenLoginModal={() => setLoginModalOpen(true)}
                        notify={notify}
                        onOpenLegalModal={(tab) => setLegalModalTab(tab)}
                    />
                )}
                {currentPortalToRender === 'tv' && <TvQueuePortal />}
                {currentPortalToRender === 'staff' && <StaffReceptionPortal notify={notify} />}
                {currentPortalToRender === 'doctor' && <DoctorPortal notify={notify} />}
                {currentPortalToRender === 'admin' && (
                    <AdminPortal notify={notify} onSwitchPortal={setActivePortal} />
                )}
                {currentPortalToRender === 'super_admin' && <SuperAdminPortal notify={notify} />}
            </div>

            {/* Authorized Portal Sign-In Modal */}
            <PortalLoginModal
                isOpen={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
                notify={notify}
            />

            {/* Global Cookie Consent Banner ("Manage Consent"), Help Concierge & Legal Policy Modals */}
            <LegalAndConsentSuite
                activeModalTab={legalModalTab}
                onCloseModal={() => setLegalModalTab(null)}
                onOpenModalTab={(tab) => setLegalModalTab(tab)}
                onScheduleNow={() => setActivePortal('client')}
            />
        </div>
    );
}

const container = document.getElementById('carepoint-root');
if (container) {
    createRoot(container).render(<App />);
}
