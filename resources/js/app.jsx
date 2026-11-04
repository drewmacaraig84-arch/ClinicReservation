import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ClientReservationPortal from './portals/LabcureReservationPortal';
import TvQueuePortal from './portals/TvQueuePortal';
import StaffReceptionPortal from './portals/StaffReceptionPortal';
import DoctorPortal from './portals/DoctorPortal';
import AdminPortal from './portals/AdminPortal';
import SuperAdminPortal from './portals/SuperAdminPortal';
import LegalAndConsentSuite from './components/LegalAndConsentSuite';
import CarePointLogo from './components/CarePointLogo';
import PortalSidebarNav from './components/PortalSidebarNav';
import { PortalLoginModal } from './components/RbacSuite';
import {
    getAuthSession,
    setAuthSession,
    clearAuthSession,
} from './utils/apiCache';
import {
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

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

    const sharedPortalProps = {
        authSession,
        activePortal: currentPortalToRender,
        onSwitchPortal: (target) => {
            if (authSession && allowedPortals.includes(target)) {
                setActivePortal(target);
            } else {
                setLoginModalOpen(true);
            }
        },
        onLogout: handleLogout,
        notify,
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Toast Notification Banner */}
            {toast && (
                <div className="fixed top-5 right-5 z-50 max-w-md animate-bounce">
                    <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold ${
                            toast.type === 'error'
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
            <div className="flex-1 flex flex-col">
                {currentPortalToRender === 'client' && (
                    <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
                        {authSession && (
                            <aside className="w-full lg:w-64 xl:w-72 bg-slate-900 text-slate-200 p-5 flex flex-col justify-between shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto border-r border-slate-800">
                                <div className="space-y-4">
                                    <div className="pb-4 border-b border-slate-800">
                                        <CarePointLogo dark size="sm" />
                                    </div>
                                    <div className="text-xs text-slate-400 leading-relaxed">
                                        Viewing the public Client Website while signed in. Use the sidebar below to return to your clinical or administrative workspace.
                                    </div>
                                </div>
                                <PortalSidebarNav {...sharedPortalProps} />
                            </aside>
                        )}
                        <div className="flex-1 min-w-0">
                            <ClientReservationPortal
                                {...sharedPortalProps}
                                onOpenLoginModal={() => setLoginModalOpen(true)}
                                onOpenLegalModal={(tab) => setLegalModalTab(tab)}
                            />
                        </div>
                    </div>
                )}
                {currentPortalToRender === 'tv' && <TvQueuePortal {...sharedPortalProps} />}
                {currentPortalToRender === 'staff' && <StaffReceptionPortal {...sharedPortalProps} />}
                {currentPortalToRender === 'doctor' && <DoctorPortal {...sharedPortalProps} />}
                {currentPortalToRender === 'admin' && <AdminPortal {...sharedPortalProps} />}
                {currentPortalToRender === 'super_admin' && <SuperAdminPortal {...sharedPortalProps} />}
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
