import React, { useState, useEffect } from 'react';
import {
    X,
    ShieldCheck,
    Cookie,
    FileText,
    Scale,
    MessageSquare,
    Send,
    Phone,
    CheckCircle2,
} from 'lucide-react';

export default function LegalAndConsentSuite({
    activeModalTab,
    onCloseModal,
    onOpenModalTab,
    onScheduleNow,
}) {
    const [consentStatus, setConsentStatus] = useState(() => {
        try {
            return localStorage.getItem('carepoint_cookie_consent') || '';
        } catch (e) {
            return '';
        }
    });
    const [showConsentBanner, setShowConsentBanner] = useState(!consentStatus);
    const [showPreferences, setShowPreferences] = useState(false);
    const [cookiePrefs, setCookiePrefs] = useState({
        essential: true,
        functional: true,
        analytics: true,
        marketing: false,
    });

    // Floating Help Chat Widget (Matches HealthCube bottom-right "Hi. Need any help?")
    const [chatOpen, setChatOpen] = useState(false);
    const [chatBubbleVisible, setChatBubbleVisible] = useState(true);

    const handleAcceptConsent = () => {
        try {
            localStorage.setItem('carepoint_cookie_consent', 'accepted');
            localStorage.setItem('carepoint_cookie_prefs', JSON.stringify(cookiePrefs));
        } catch (e) {
            // ignore
        }
        setConsentStatus('accepted');
        setShowConsentBanner(false);
    };

    const handleDenyConsent = () => {
        const minimal = { essential: true, functional: false, analytics: false, marketing: false };
        setCookiePrefs(minimal);
        try {
            localStorage.setItem('carepoint_cookie_consent', 'denied');
            localStorage.setItem('carepoint_cookie_prefs', JSON.stringify(minimal));
        } catch (e) {
            // ignore
        }
        setConsentStatus('denied');
        setShowConsentBanner(false);
    };

    return (
        <>
            {/* 1. Floating "Manage Consent" Card (Matches HealthCube Screenshot Bottom-Right) */}
            {showConsentBanner && (
                <div className="fixed bottom-4 right-4 sm:right-20 z-40 w-[92vw] max-w-[430px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-slate-800">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-900 mx-auto">Manage Consent</h4>
                        <button
                            type="button"
                            onClick={() => setShowConsentBanner(false)}
                            className="text-slate-500 hover:text-slate-900 cursor-pointer"
                            aria-label="Close Consent"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-600">
                        To provide the best experiences, we use technologies like cookies to store and/or access device
                        information. Consenting to these technologies will allow us to process data such as browsing
                        behavior or unique IDs on this site. Not consenting or withdrawing consent, may adversely
                        affect certain features and functions.
                    </p>

                    {showPreferences && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                            <label className="flex items-center justify-between font-semibold text-slate-800">
                                <span>Strictly Necessary & Queue Session (Always Active)</span>
                                <input type="checkbox" checked disabled className="accent-[#13467b]" />
                            </label>
                            <label className="flex items-center justify-between text-slate-700 cursor-pointer">
                                <span>Functional & Appointment Preferences</span>
                                <input
                                    type="checkbox"
                                    checked={cookiePrefs.functional}
                                    onChange={(e) =>
                                        setCookiePrefs({ ...cookiePrefs, functional: e.target.checked })
                                    }
                                    className="accent-[#13467b]"
                                />
                            </label>
                            <label className="flex items-center justify-between text-slate-700 cursor-pointer">
                                <span>Performance & Wait-Time Analytics</span>
                                <input
                                    type="checkbox"
                                    checked={cookiePrefs.analytics}
                                    onChange={(e) =>
                                        setCookiePrefs({ ...cookiePrefs, analytics: e.target.checked })
                                    }
                                    className="accent-[#13467b]"
                                />
                            </label>
                        </div>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-2.5">
                        <button
                            type="button"
                            onClick={handleAcceptConsent}
                            className="py-2.5 px-3 rounded-lg bg-[#13467b] hover:bg-[#0e355e] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                        >
                            Accept
                        </button>
                        <button
                            type="button"
                            onClick={handleDenyConsent}
                            className="py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer"
                        >
                            Deny
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowPreferences(!showPreferences)}
                            className="py-2.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer"
                        >
                            {showPreferences ? 'Save Prefs' : 'View preferences'}
                        </button>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] font-semibold text-[#13467b]">
                        <button
                            type="button"
                            onClick={() => onOpenModalTab('privacy')}
                            className="underline hover:text-teal-700 cursor-pointer"
                        >
                            Privacy Policy
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenModalTab('cookies')}
                            className="underline hover:text-teal-700 cursor-pointer"
                        >
                            Cookie Policy
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenModalTab('terms')}
                            className="underline hover:text-teal-700 cursor-pointer"
                        >
                            Terms & Agreements
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Floating "Hi. Need any help?" Chat Assistant Button (Matches HealthCube Bottom-Right) */}
            <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
                {chatOpen && (
                    <div className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mb-1">
                        <div className="bg-[#13467b] text-white px-4 py-3 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-extrabold">CarePoint & HealthCube Concierge</div>
                                <div className="text-[10px] text-blue-200">Online • Instant Patient Triage</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setChatOpen(false)}
                                className="text-blue-200 hover:text-white cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3 text-xs bg-slate-50">
                            <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 shadow-2xs">
                                👋 Hello! Welcome to CarePoint & HealthCube Medical Clinics. How can we assist you today?
                            </div>
                            <div className="space-y-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setChatOpen(false);
                                        if (onScheduleNow) onScheduleNow();
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-lg bg-[#13467b] text-white font-bold hover:bg-[#0e355e] transition cursor-pointer"
                                >
                                    📅 Book a Doctor Appointment Now
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setChatOpen(false);
                                        onOpenModalTab('privacy');
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
                                >
                                    🔒 View Data Privacy & Patient Rights
                                </button>
                                <div className="px-3 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-semibold">
                                    📞 Hotline: <strong>8652-1111</strong> | <strong>inquiry@healthcube.com.ph</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {chatBubbleVisible && !chatOpen && (
                        <div className="bg-white text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setChatBubbleVisible(false)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            <span
                                onClick={() => setChatOpen(true)}
                                className="cursor-pointer"
                            >
                                Hi. Need any help?
                            </span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setChatOpen(!chatOpen)}
                        className="w-12 h-12 rounded-xl bg-[#1e73be] hover:bg-[#13467b] text-white shadow-xl flex items-center justify-center transition cursor-pointer"
                        title="Patient Help Concierge"
                    >
                        <MessageSquare className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* 3. Full Legal & Compliance Modal (Privacy Policy, Cookie Policy, Terms & Agreements, Patient Rights) */}
            {activeModalTab && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-[#13467b] text-white px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck className="w-6 h-6 text-teal-300" />
                                <div>
                                    <h3 className="text-base font-extrabold">
                                        Legal, Privacy & Patient Compliance Center
                                    </h3>
                                    <p className="text-xs text-blue-200">
                                        Data Privacy Act of 2012 (RA 10173), HIPAA & GDPR Compliant Healthcare Policies
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onCloseModal}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Navigation Tabs */}
                        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap gap-2">
                            {[
                                { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
                                { id: 'cookies', label: 'Cookie Policy', icon: Cookie },
                                { id: 'terms', label: 'Terms & Agreements', icon: Scale },
                                { id: 'rights', label: 'Patient Rights & HMO Policy', icon: FileText },
                            ].map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => onOpenModalTab(t.id)}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            activeModalTab === t.id
                                                ? 'bg-[#13467b] text-white shadow-xs'
                                                : 'bg-white text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Modal Content Body */}
                        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed flex-1">
                            {activeModalTab === 'privacy' && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-extrabold text-slate-900">
                                        Privacy Policy & Data Protection Notice
                                    </h4>
                                    <p>
                                        <strong>Effective Date:</strong> October 27, 2026 • <strong>Compliance:</strong>{' '}
                                        Republic Act No. 10173 (Data Privacy Act of 2012), HIPAA Privacy Rule, and GDPR.
                                    </p>
                                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                                        <div className="font-bold text-[#13467b]">
                                            1. Collection of Personal & Sensitive Health Information
                                        </div>
                                        <p className="text-xs text-slate-700">
                                            When you book an appointment or generate a queue ticket at CarePoint /
                                            HealthCube Medical Clinics, we collect only the necessary personal data:
                                            Full Name, Contact Number, Email Address, Age, Preferred Physician, Chief
                                            Complaint / Reason for Visit, and Clinical Consultation Notes recorded by
                                            your attending physician.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h5 className="font-bold text-slate-900">
                                            2. How We Use & Protect Your Medical Data
                                        </h5>
                                        <ul className="list-disc pl-5 space-y-1 text-xs">
                                            <li>
                                                <strong>Queue & Appointment Coordination:</strong> Assigning your queue
                                                ticket (e.g., <code>G-105</code>) and routing you to the proper
                                                consultation room.
                                            </li>
                                            <li>
                                                <strong>Zero-Trust Security Architecture:</strong> All database queries
                                                use parameterized PDO statements, WAF input sanitization, strict HTTP
                                                security headers (HSTS, X-Frame-Options, nosniff), and Role-Based Access
                                                Control.
                                            </li>
                                            <li>
                                                <strong>Soft-Delete Audit Trail:</strong> No patient record is
                                                accidentally lost; archived records are held in an encrypted Super Admin
                                                Recovery Vault with strict audit logs.
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="space-y-1">
                                        <h5 className="font-bold text-slate-900">
                                            3. Data Protection Officer (DPO) Contact
                                        </h5>
                                        <p className="text-xs">
                                            For data access, correction, or erasure requests, contact our Data
                                            Protection Office at <strong>dpo@healthcube-carepoint.com.ph</strong> or call{' '}
                                            <strong>(02) 8652-1111</strong>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeModalTab === 'cookies' && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-extrabold text-slate-900">
                                        Cookie Policy & Storage Technologies
                                    </h4>
                                    <p className="text-xs text-slate-600">
                                        We use cookies, <code>sessionStorage</code>, and <code>localStorage</code> to
                                        deliver instant Stale-While-Revalidate (SWR) page reloads and preserve your live
                                        queue ticket status.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                                            <div className="font-bold text-slate-900">
                                                1. Strictly Necessary Cookies (Required)
                                            </div>
                                            <p className="text-slate-600 mt-1">
                                                CSRF security tokens (<code>XSRF-TOKEN</code>), rate-limiter session
                                                identifiers, and load-balancer sticky session routing.
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                                            <div className="font-bold text-slate-900">
                                                2. High-Speed SWR Cache Storage
                                            </div>
                                            <p className="text-slate-600 mt-1">
                                                Caches department catalogs, doctor schedules, and slot availability
                                                locally so reloading or switching tabs is instantaneous.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onCloseModal();
                                                setShowConsentBanner(true);
                                                setShowPreferences(true);
                                            }}
                                            className="px-4 py-2 rounded-lg bg-[#13467b] text-white text-xs font-bold cursor-pointer"
                                        >
                                            Re-Open Cookie Consent Preferences
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeModalTab === 'terms' && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-extrabold text-slate-900">
                                        Terms and Agreements — Clinic Reservation & Queue Service
                                    </h4>
                                    <p className="text-xs text-slate-600">
                                        By scheduling an appointment or generating a queue ticket through CarePoint /
                                        HealthCube Medical Clinics, you agree to the following terms:
                                    </p>
                                    <ol className="list-decimal pl-5 space-y-2 text-xs">
                                        <li>
                                            <strong>Arrival & Check-In Window:</strong> Online reservation holders
                                            should arrive at least <strong>15 minutes prior</strong> to their selected
                                            time slot and check in at Reception Desk 1.
                                        </li>
                                        <li>
                                            <strong>No-Show & Re-Queue Policy:</strong> If a ticket is called three (3)
                                            times on the Queuing Status TV Display without response, reception staff may
                                            mark the ticket as <em>No Show / Re-Queued</em> so waiting patients are not
                                            delayed.
                                        </li>
                                        <li>
                                            <strong>Single Slot Reservation Rule:</strong> To ensure fair access for all
                                            patients, duplicate bookings for the same physician, date, and time slot are
                                            automatically prevented, and automated scraping is blocked by our multi-tier
                                            rate limiter (15 bookings/min threshold).
                                        </li>
                                        <li>
                                            <strong>Medical Emergency Disclaimer:</strong> This online reservation
                                            portal is for non-life-threatening outpatient consultations, diagnostics, and
                                            check-ups. For acute medical emergencies, proceed immediately to the nearest
                                            Emergency Room.
                                        </li>
                                    </ol>
                                </div>
                            )}

                            {activeModalTab === 'rights' && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-extrabold text-slate-900">
                                        Patient Bill of Rights, Senior/PWD Priority & HMO Accreditation
                                    </h4>
                                    <ul className="list-disc pl-5 space-y-2 text-xs">
                                        <li>
                                            <strong>Priority Lane Guarantee (RA 9994 / RA 7277):</strong> Senior
                                            Citizens, Persons with Disabilities (PWD), and Pregnant Women are accorded
                                            priority queue ordering at Reception Desk 1 and all diagnostic rooms.
                                        </li>
                                        <li>
                                            <strong>Accredited HMO Partners:</strong> We accept major HMOs including
                                            Maxicare, Medicard, Intellicare, PhilCare, Avega, Cocolife Healthcare,
                                            ValuCare, and EastWest Healthcare. Please bring a valid government ID and
                                            your physical or digital LOA.
                                        </li>
                                        <li>
                                            <strong>Right to Informed Consent & Confidentiality:</strong> Every patient
                                            has the right to review their clinical diagnosis, prescription, and diagnostic
                                            results in complete privacy.
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                CarePoint & HealthCube Medical Clinics • Regulatory & Legal Affairs
                            </span>
                            <button
                                type="button"
                                onClick={onCloseModal}
                                className="px-5 py-2 rounded-lg bg-[#13467b] hover:bg-[#0e355e] text-white text-xs font-bold cursor-pointer"
                            >
                                I Understand & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
