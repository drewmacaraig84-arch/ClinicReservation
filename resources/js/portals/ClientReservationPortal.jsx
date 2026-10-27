import React, { useState, useEffect, useRef } from 'react';
import CarePointLogo from '../components/CarePointLogo';
import { ClientWebsiteSkeleton } from '../components/SkeletonLoaders';
import { cachedFetchJson, invalidateClientCache } from '../utils/apiCache';
import {
    Calendar,
    Clock,
    User,
    Stethoscope,
    CheckCircle2,
    Search,
    Phone,
    Mail,
    MapPin,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
    ExternalLink,
    ChevronDown,
    Plus,
    Minus,
    Building2,
    HeartPulse,
    Microscope,
    Award,
    CreditCard,
    Sparkles,
} from 'lucide-react';

const SERVICES_DROPDOWN = [
    { name: 'Laboratory', desc: 'Complete blood chemistry, hematology, clinical microscopy & serology.' },
    { name: 'Imaging', desc: 'Digital X-Ray, 4D Ultrasound, Mammography & Low-Dose CT Scan.' },
    { name: 'Cardiopulmonary', desc: '12-Lead ECG, 2D Echo with Doppler, Treadmill Stress Test & Holter.' },
    { name: 'Ambulatory Surgery', desc: 'Outpatient minor surgical procedures and endoscopy suites.' },
    { name: 'Rehabilitation', desc: 'Physical therapy, sports medicine & post-operative rehabilitation.' },
    { name: 'Vaccinations', desc: 'Flu, Pneumonia, HPV, Hepatitis & Pediatric immunization packages.' },
    { name: 'Mental Health', desc: 'Confidential psychiatric & psychological wellness consultations.' },
    { name: 'Home Care', desc: 'Home service blood extraction, ECG, and physician house calls.' },
];

const CHECKUPS_DROPDOWN = [
    { name: 'Executive Check-Up', price: '₱4,800', desc: 'Comprehensive 42-parameter blood panel, ECG, Chest X-Ray, Ultrasound & Physician Evaluation.' },
    { name: 'Annual Physical Exam', price: '₱1,650', desc: 'CBC, Urinalysis, Fecalysis, Chest X-Ray, Visual Acuity & Medical Clearance.' },
    { name: 'Pre-Employment Medical Exam', price: '₱1,250', desc: 'Fast-track corporate onboarding medical exam with 24-hour digital fit-to-work certificate.' },
    { name: 'Pre-Enrollment Exam', price: '₱950', desc: 'Student health screening, physical exam, and immunization review for schools & universities.' },
];

const PATIENT_RESOURCES_DROPDOWN = [
    { name: 'HMO Partners', target: 'hmo' },
    { name: 'Discount Cards', target: 'hmo' },
    { name: 'Live Queue Tracker', target: 'booking' },
];

const ABOUT_DROPDOWN = [
    { name: 'History and Milestones', target: 'about' },
    { name: 'Mission and Vision', target: 'about' },
    { name: 'Clinical Research', target: 'about' },
    { name: 'Careers', target: 'about' },
];

const FAQS = [
    {
        q: 'Is parking available at the Shaw and Greenhills branch?',
        a: 'Yes! Dedicated patient parking slots are available right in front of our 241 Shaw Blvd (Mandaluyong) facility, and ample multi-level mall parking is available at the 5th Floor, GH Mall, Greenhills Commercial Complex (San Juan).',
    },
    {
        q: 'Do you perform both walk-in and online scheduled exams?',
        a: 'Yes. Online reservations enjoy priority check-in at Reception Desk 1 with an instant digital queue ticket (e.g., G-105), while walk-in patients can generate a ticket at our Reception Kiosk.',
    },
    {
        q: 'Which HMO partners and discount cards are accredited?',
        a: 'We are accredited with Maxicare, Medicard, Intellicare, PhilCare, Avega, Cocolife Healthcare, ValuCare, and EastWest Healthcare. We also honor Senior Citizen, PWD, and HealthCube Prestige Discount Cards.',
    },
    {
        q: 'How is my personal health data protected?',
        a: 'All personal and clinical information is protected under the Data Privacy Act of 2012 (RA 10173) and HIPAA security standards, utilizing encrypted database storage, WAF input sanitization, and strict access controls.',
    },
];

export default function ClientReservationPortal({
    onSwitchPortal,
    onOpenLoginModal,
    notify,
    onOpenLegalModal,
}) {
    const [catalog, setCatalog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null); // services, checkups, resources, about
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    // Dedicated Schedule Page state (only visible when SCHEDULE NOW is clicked or /schedule is opened)
    const [isSchedulePage, setIsSchedulePage] = useState(() => {
        if (typeof window === 'undefined') return false;
        const params = new URLSearchParams(window.location.search);
        return (
            window.location.pathname.toLowerCase().startsWith('/schedule') ||
            params.get('page') === 'schedule'
        );
    });

    // Booking form state
    const [departmentId, setDepartmentId] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedSlot, setSelectedSlot] = useState('09:00 AM');
    const [slots, setSlots] = useState([]);
    const [patientName, setPatientName] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [patientEmail, setPatientEmail] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [priority, setPriority] = useState('normal');
    const [reasonForVisit, setReasonForVisit] = useState(() => {
        if (typeof window === 'undefined') return '';
        return new URLSearchParams(window.location.search).get('service') || '';
    });
    const [agreedToTerms, setAgreedToTerms] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [bookedReceipt, setBookedReceipt] = useState(null);

    // Quick Ticket Lookup state
    const [lookupQuery, setLookupQuery] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);

    const bookingRefSection = useRef(null);
    const doctorsRefSection = useRef(null);
    const servicesRefSection = useRef(null);
    const hmoRefSection = useRef(null);
    const faqRefSection = useRef(null);

    const openSchedulePage = ({ service, deptId, docId, inNewWindow = false } = {}) => {
        setOpenDropdown(null);
        if (service) {
            setReasonForVisit(service);
        }
        if (deptId) {
            setDepartmentId(String(deptId));
        }
        if (docId) {
            setDoctorId(String(docId));
        }

        const params = new URLSearchParams();
        if (service || reasonForVisit) params.set('service', service || reasonForVisit);
        if (deptId || departmentId) params.set('dept', String(deptId || departmentId));
        if (docId || doctorId) params.set('doctor', String(docId || doctorId));
        const queryString = params.toString();
        const targetUrl = `/schedule${queryString ? `?${queryString}` : ''}`;

        if (inNewWindow && typeof window !== 'undefined') {
            window.open(targetUrl, '_blank', 'width=1280,height=860,noopener,noreferrer');
            return;
        }

        setIsSchedulePage(true);
        if (typeof window !== 'undefined') {
            window.history.pushState({ page: 'schedule' }, '', targetUrl);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const closeSchedulePage = () => {
        setOpenDropdown(null);
        setIsSchedulePage(false);
        if (typeof window !== 'undefined') {
            window.history.pushState({ page: 'home' }, '', '/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const onSchedule =
                window.location.pathname.toLowerCase().startsWith('/schedule') ||
                params.get('page') === 'schedule';
            setIsSchedulePage(onSchedule);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const scrollToRef = (ref) => {
        setOpenDropdown(null);
        if (isSchedulePage) {
            setIsSchedulePage(false);
            if (typeof window !== 'undefined') {
                window.history.pushState({ page: 'home' }, '', '/');
            }
            setTimeout(() => {
                if (ref?.current) {
                    ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 80);
            return;
        }
        if (ref?.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const fetchCatalog = async (forceNetwork = false) => {
        try {
            await cachedFetchJson(
                '/api/v1/public/catalog',
                (data) => {
                    setCatalog(data);
                    setLoading(false);
                    const urlParams =
                        typeof window !== 'undefined'
                            ? new URLSearchParams(window.location.search)
                            : new URLSearchParams();
                    const initialDept = urlParams.get('dept');
                    const initialDoc = urlParams.get('doctor');

                    if (!departmentId && data.departments?.length > 0) {
                        const defaultDept =
                            data.departments.find((d) => String(d.id) === String(initialDept)) ||
                            data.departments[0];
                        setDepartmentId(String(defaultDept.id));
                        const deptDocs = (data.doctors || []).filter(
                            (d) => d.department_id === defaultDept.id
                        );
                        const chosenDoc =
                            (data.doctors || []).find((d) => String(d.id) === String(initialDoc)) ||
                            deptDocs[0] ||
                            data.doctors?.[0];
                        if (chosenDoc) {
                            setDoctorId(String(chosenDoc.id));
                        }
                    }
                    if (data.slots) {
                        setSlots(data.slots);
                    }
                },
                forceNetwork
            );
        } catch (err) {
            notify('Failed to load clinic catalog', 'error');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    // Fetch live slots with SWR cache whenever doctor or date changes
    useEffect(() => {
        if (!doctorId || !appointmentDate) return;
        const loadSlots = async () => {
            setSlotsLoading(true);
            try {
                await cachedFetchJson(
                    `/api/v1/public/slots?doctor_id=${doctorId}&date=${appointmentDate}`,
                    (data) => {
                        if (data.slots) {
                            setSlots(data.slots);
                            const currentSlotObj = data.slots.find((s) => s.time === selectedSlot);
                            if (!currentSlotObj || currentSlotObj.is_reserved) {
                                const firstAvailable = data.slots.find((s) => !s.is_reserved);
                                if (firstAvailable) setSelectedSlot(firstAvailable.time);
                            }
                        }
                        setSlotsLoading(false);
                    }
                );
            } catch (e) {
                setSlotsLoading(false);
            }
        };
        loadSlots();
    }, [doctorId, appointmentDate]);

    const handleDepartmentChange = (newDeptId) => {
        setDepartmentId(newDeptId);
        if (!catalog?.doctors) return;
        const matchingDoctors = catalog.doctors.filter((d) => String(d.department_id) === String(newDeptId));
        if (matchingDoctors.length > 0) {
            setDoctorId(String(matchingDoctors[0].id));
        } else if (catalog.doctors.length > 0) {
            setDoctorId(String(catalog.doctors[0].id));
        }
    };

    const handleQuickSelectService = (serviceTitle) => {
        openSchedulePage({ service: serviceTitle });
        notify(`Opened Schedule Page for "${serviceTitle}" — choose your preferred date & time slot.`, 'success');
    };

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        if (!agreedToTerms) {
            notify('Please accept the Privacy Policy and Terms & Agreements before booking.', 'error');
            return;
        }
        if (!patientName.trim() || !patientPhone.trim()) {
            notify('Please enter your full name and phone number to complete the reservation.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/v1/public/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    patient_name: patientName,
                    patient_phone: patientPhone,
                    patient_email: patientEmail || null,
                    patient_age: patientAge ? Number(patientAge) : null,
                    department_id: Number(departmentId),
                    doctor_id: Number(doctorId),
                    appointment_date: appointmentDate,
                    appointment_time: selectedSlot,
                    priority,
                    reason_for_visit: reasonForVisit || 'General Consultation',
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                notify(data.message || 'Unable to book slot.', 'error');
                return;
            }

            invalidateClientCache();
            setBookedReceipt(data.appointment);
            setLookupResult({
                appointment: data.appointment,
                patients_ahead: 1,
                estimated_wait_minutes: data.appointment.estimated_wait_minutes,
            });
            notify(`Reservation confirmed! Your Queue Ticket is ${data.appointment.ticket_number}`, 'success');
            fetchCatalog(true);
        } catch (err) {
            notify('Network error while submitting reservation.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTicketLookup = async (e) => {
        e.preventDefault();
        if (!lookupQuery.trim()) return;
        setLookupLoading(true);
        try {
            const res = await fetch(`/api/v1/public/lookup?query=${encodeURIComponent(lookupQuery.trim())}`);
            const data = await res.json();
            if (!res.ok) {
                notify(data.message || 'Ticket not found.', 'error');
                setLookupResult(null);
            } else {
                setLookupResult(data);
                notify(`Found Ticket ${data.appointment.ticket_number} (${data.appointment.patient_name})`, 'success');
            }
        } catch (err) {
            notify('Error looking up ticket.', 'error');
        } finally {
            setLookupLoading(false);
        }
    };

    if (loading && !catalog) {
        return <ClientWebsiteSkeleton />;
    }

    const availableDoctors = catalog?.doctors || [];
    const filteredDoctors = availableDoctors.filter((d) => String(d.department_id) === String(departmentId));
    const doctorsToShow = filteredDoctors.length > 0 ? filteredDoctors : availableDoctors;
    const selectedDoctorObj = availableDoctors.find((d) => String(d.id) === String(doctorId));

    const activeTicket = lookupResult?.appointment || bookedReceipt || catalog?.queue?.active_ticket_preview || {
        ticket_number: 'G-105',
        estimated_wait_minutes: 15,
        assigned_room: 'ROOM 1',
        patient_name: 'John Doe',
        status: 'waiting',
        doctor: { name: 'Dr. Sarah Johnson' },
    };

    return (
        <div className="bg-white min-h-screen flex flex-col">
            {/* 1. TOP ROYAL-BLUE UTILITY BAR (Matches HealthCube Screenshot 1) */}
            <div className="bg-[#13467b] text-white text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-5 flex-wrap">
                        <a
                            href="mailto:inquiry@healthcube.com.ph"
                            className="inline-flex items-center gap-1.5 hover:text-cyan-200 transition font-medium"
                        >
                            <Mail className="w-3.5 h-3.5" />
                            <span>inquiry@healthcube.com.ph</span>
                        </a>
                        <a
                            href="tel:86521111"
                            className="inline-flex items-center gap-1.5 hover:text-cyan-200 transition font-semibold"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            <span>8652-1111</span>
                        </a>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <button
                            type="button"
                            onClick={() => scrollToRef(faqRefSection)}
                            className="font-semibold hover:text-cyan-200 transition cursor-pointer"
                        >
                            FAQs
                        </button>
                        <span className="text-blue-400">|</span>
                        <button
                            type="button"
                            onClick={() => openSchedulePage()}
                            className="font-semibold hover:text-cyan-200 transition cursor-pointer"
                        >
                            CONTACT US
                        </button>
                        <span className="text-blue-400">|</span>
                        <button
                            type="button"
                            onClick={onOpenLoginModal}
                            className="font-bold text-teal-300 hover:text-white transition cursor-pointer"
                        >
                            PORTAL LOGIN
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. MAIN WHITE HEADER WITH HEALTHCUBE DROPDOWNS & "SCHEDULE NOW" CTA */}
            <header
                className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs"
                onMouseLeave={() => setOpenDropdown(null)}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    {/* Brand Logo */}
                    <div
                        onClick={() => closeSchedulePage()}
                        className="flex items-center gap-3 cursor-pointer"
                    >
                        <CarePointLogo size="md" />
                        <span className="hidden sm:inline-block h-6 w-px bg-slate-200" />
                        <div className="hidden sm:block leading-tight">
                            <div className="text-sm font-black tracking-tight text-[#13467b]">
                                HealthCube
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Medical Clinics
                            </div>
                        </div>
                    </div>

                    {/* Dropdown Navigation Links (Services, Medical Check-Ups, Patient Resources, About Us, Find A Doctor) */}
                    <nav className="flex items-center gap-1 lg:gap-5 flex-wrap text-sm font-semibold text-slate-700">
                        {/* Dropdown 1: Services */}
                        <div
                            className="relative"
                            onMouseEnter={() => setOpenDropdown('services')}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenDropdown(openDropdown === 'services' ? null : 'services')
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg hover:text-[#13467b] transition cursor-pointer"
                            >
                                <span>Services</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {openDropdown === 'services' && (
                                <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 py-3 z-50">
                                    {SERVICES_DROPDOWN.map((s) => (
                                        <button
                                            key={s.name}
                                            type="button"
                                            onClick={() => handleQuickSelectService(s.name)}
                                            className="w-full text-left px-5 py-2.5 text-sm font-semibold text-[#13467b] hover:bg-blue-50 transition block cursor-pointer"
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dropdown 2: Medical Check-Ups */}
                        <div
                            className="relative"
                            onMouseEnter={() => setOpenDropdown('checkups')}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenDropdown(openDropdown === 'checkups' ? null : 'checkups')
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg hover:text-[#13467b] transition cursor-pointer"
                            >
                                <span>Medical Check-Ups</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {openDropdown === 'checkups' && (
                                <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 py-3 z-50">
                                    {CHECKUPS_DROPDOWN.map((c) => (
                                        <button
                                            key={c.name}
                                            type="button"
                                            onClick={() => handleQuickSelectService(c.name)}
                                            className="w-full text-left px-5 py-2.5 text-sm font-semibold text-[#13467b] hover:bg-blue-50 transition flex items-center justify-between cursor-pointer"
                                        >
                                            <span>{c.name}</span>
                                            <span className="text-xs font-bold text-teal-700">{c.price}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dropdown 3: Patient Resources */}
                        <div
                            className="relative"
                            onMouseEnter={() => setOpenDropdown('resources')}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenDropdown(openDropdown === 'resources' ? null : 'resources')
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg hover:text-[#13467b] transition cursor-pointer"
                            >
                                <span>Patient Resources</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {openDropdown === 'resources' && (
                                <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-3 z-50">
                                    {PATIENT_RESOURCES_DROPDOWN.map((item) => (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() =>
                                                item.target === 'hmo'
                                                    ? scrollToRef(hmoRefSection)
                                                    : openSchedulePage()
                                            }
                                            className="w-full text-left px-5 py-2.5 text-sm font-semibold text-[#13467b] hover:bg-blue-50 transition block cursor-pointer"
                                        >
                                            {item.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dropdown 4: About Us */}
                        <div
                            className="relative"
                            onMouseEnter={() => setOpenDropdown('about')}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenDropdown(openDropdown === 'about' ? null : 'about')
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg hover:text-[#13467b] transition cursor-pointer"
                            >
                                <span>About Us</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {openDropdown === 'about' && (
                                <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-xl shadow-2xl border border-slate-100 py-3 z-50">
                                    {ABOUT_DROPDOWN.map((item) => (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => scrollToRef(servicesRefSection)}
                                            className="w-full text-left px-5 py-2.5 text-sm font-semibold text-[#13467b] hover:bg-blue-50 transition block cursor-pointer"
                                        >
                                            {item.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Direct Link: Find A Doctor */}
                        <button
                            type="button"
                            onClick={() => scrollToRef(doctorsRefSection)}
                            className="px-2.5 py-2 rounded-lg hover:text-[#13467b] transition cursor-pointer"
                        >
                            Find A Doctor
                        </button>
                    </nav>

                    {/* Right CTA: SCHEDULE NOW (Opens dedicated Schedule Page) */}
                    <div className="flex items-center gap-2">
                        {isSchedulePage ? (
                            <button
                                type="button"
                                onClick={closeSchedulePage}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-extrabold transition cursor-pointer border border-slate-300"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to Website</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => openSchedulePage()}
                                className="px-5 py-2.5 rounded-lg bg-[#13467b] hover:bg-[#0e355e] text-white text-xs sm:text-sm font-extrabold tracking-wide uppercase shadow-md transition cursor-pointer"
                            >
                                SCHEDULE NOW
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* DEDICATED SCHEDULE PAGE VIEW (ONLY VISIBLE WHEN "SCHEDULE NOW" IS CLICKED OR /schedule IS OPENED) */}
            {isSchedulePage ? (
                <section ref={bookingRefSection} className="bg-slate-100 py-8 border-b border-slate-200 flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Left Sidebar: My Quick Queue Status + Live Ticket Lookup (Matches CarePoint Mockup) */}
                            <div className="lg:col-span-4 space-y-5">
                                <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
                                    <div className="bg-slate-200/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-slate-800">My Quick Queue Status</h3>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Live Queue
                                        </span>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        <div>
                                            <div className="text-xs font-medium text-slate-500">Active Ticket:</div>
                                            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                                                {activeTicket.ticket_number}
                                            </div>
                                            <div className="text-xs font-semibold text-teal-700 mt-1">
                                                {activeTicket.patient_name} • {activeTicket.assigned_room || 'ROOM 1'}
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-100">
                                            <div className="text-xs font-medium text-slate-500">Estimated Wait Time:</div>
                                            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                                                {activeTicket.estimated_wait_minutes ?? 15} mins
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Assigned Doctor:{' '}
                                                <span className="font-semibold text-slate-700">
                                                    {activeTicket.doctor?.name || 'Dr. Sarah Johnson'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Search / Track any Ticket */}
                                        <form
                                            onSubmit={handleTicketLookup}
                                            className="pt-3 border-t border-slate-100 space-y-2"
                                        >
                                            <label className="block text-xs font-semibold text-slate-600">
                                                Check Your Ticket or Booking Ref
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={lookupQuery}
                                                    onChange={(e) => setLookupQuery(e.target.value)}
                                                    placeholder="e.g. G-105 or Maria Santos"
                                                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-slate-50"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={lookupLoading}
                                                    className="px-3.5 py-1.5 rounded-lg bg-[#13467b] hover:bg-[#0e355e] text-white text-xs font-semibold transition cursor-pointer"
                                                >
                                                    {lookupLoading ? '...' : 'Track'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                {/* Currently Serving Mini Board */}
                                <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Now Serving in Clinic
                                        </h4>
                                        <span className="text-xs font-semibold text-teal-700">
                                            {catalog?.server_time}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {(catalog?.queue?.now_serving || []).slice(0, 3).map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-teal-50/70 border border-teal-200/70"
                                            >
                                                <div>
                                                    <span className="font-extrabold text-base text-slate-900">
                                                        {item.ticket_number}
                                                    </span>
                                                    <p className="text-[11px] text-slate-600">{item.doctor?.name}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-extrabold text-teal-800 bg-white px-2.5 py-1 rounded-md border border-teal-200">
                                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>{item.assigned_room}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right 8 Columns: Book an Appointment Form */}
                            <div className="lg:col-span-8">
                                {bookedReceipt && (
                                    <div className="mb-6 bg-emerald-50 border-2 border-emerald-500 rounded-xl p-5 shadow-sm">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    Appointment Confirmed & Added to Clinic Queue
                                                </div>
                                                <h3 className="text-xl font-extrabold text-slate-900">
                                                    Ticket No:{' '}
                                                    <span className="text-teal-700">{bookedReceipt.ticket_number}</span>
                                                    <span className="ml-3 text-xs font-mono bg-white px-2.5 py-1 rounded border border-emerald-300 text-slate-700">
                                                        Ref: {bookedReceipt.booking_reference}
                                                    </span>
                                                </h3>
                                                <p className="text-xs text-slate-700">
                                                    Patient: <strong>{bookedReceipt.patient_name}</strong> • Doctor:{' '}
                                                    <strong>{bookedReceipt.doctor?.name}</strong> (
                                                    {bookedReceipt.assigned_room}) •{' '}
                                                    <strong>
                                                        {bookedReceipt.appointment_date?.slice(0, 10)} at{' '}
                                                        {bookedReceipt.appointment_time}
                                                    </strong>
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setBookedReceipt(null)}
                                                className="text-xs font-semibold text-emerald-800 underline cursor-pointer"
                                            >
                                                Dismiss Receipt
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-5 border-b border-slate-100">
                                        <div>
                                            <h2 className="text-xl font-extrabold text-slate-900">
                                                Book an Appointment
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Choose your department, specialist doctor, preferred date, and real-time
                                                slot.
                                            </p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleBookSubmit} className="mt-6 space-y-6">
                                        {/* Row 1: Select Department & Select Doctor */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                    Select Department
                                                </label>
                                                <select
                                                    value={departmentId}
                                                    onChange={(e) => handleDepartmentChange(e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                >
                                                    {(catalog?.departments || []).map((dept) => (
                                                        <option key={dept.id} value={dept.id}>
                                                            {dept.name} ({dept.code})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                    Select Doctor
                                                </label>
                                                <select
                                                    value={doctorId}
                                                    onChange={(e) => setDoctorId(e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                >
                                                    {doctorsToShow.map((doc) => (
                                                        <option key={doc.id} value={doc.id}>
                                                            {doc.name} — {doc.room_number} (
                                                            {doc.availability_status === 'active'
                                                                ? 'Available'
                                                                : doc.availability_status.replace('_', ' ')}
                                                            )
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {selectedDoctorObj && (
                                            <div className="bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <Stethoscope className="w-4 h-4 text-teal-600" />
                                                    <span className="font-bold">{selectedDoctorObj.name}</span>
                                                    <span className="text-slate-400">•</span>
                                                    <span>{selectedDoctorObj.specialty}</span>
                                                    <span className="text-slate-400">•</span>
                                                    <span className="font-semibold text-teal-700">
                                                        {selectedDoctorObj.room_number}
                                                    </span>
                                                </div>
                                                <div className="text-slate-600 font-medium">
                                                    Clinic Hours:{' '}
                                                    <span className="font-semibold text-slate-800">
                                                        {selectedDoctorObj.shift_start} – {selectedDoctorObj.shift_end}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Row 2: Choose Date & Priority */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                    Choose Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={appointmentDate}
                                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs focus:border-teal-600 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                    Priority / Lane Type
                                                </label>
                                                <select
                                                    value={priority}
                                                    onChange={(e) => setPriority(e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs focus:border-teal-600 focus:outline-none"
                                                >
                                                    <option value="normal">Standard Consultation</option>
                                                    <option value="senior_pwd">
                                                        Senior Citizen / PWD / Pregnant Priority
                                                    </option>
                                                    <option value="urgent">Urgent Acute Care</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Row 3: Select Time Slot Pills with Skeleton Loader when switching date/doctor */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-2">
                                                Select Time Slot
                                            </label>
                                            {slotsLoading ? (
                                                <div className="flex flex-wrap gap-2.5">
                                                    {[1, 2, 3, 4, 5, 6].map((n) => (
                                                        <div
                                                            key={n}
                                                            className="h-9 w-24 rounded-full bg-slate-200 animate-pulse"
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2.5">
                                                    {slots.map((slot) => {
                                                        const isSelected =
                                                            selectedSlot === slot.time && !slot.is_reserved;
                                                        return (
                                                            <button
                                                                key={slot.time}
                                                                type="button"
                                                                disabled={slot.is_reserved}
                                                                onClick={() => setSelectedSlot(slot.time)}
                                                                className={`px-4 py-2 rounded-full text-xs font-bold transition border ${slot.is_reserved
                                                                    ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed'
                                                                    : isSelected
                                                                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm scale-[1.02] cursor-pointer'
                                                                        : 'bg-teal-50/70 text-teal-900 border-teal-300 hover:bg-teal-100 cursor-pointer'
                                                                    }`}
                                                            >
                                                                {slot.time} {slot.is_reserved ? '(Reserved)' : ''}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Row 4: Patient Details */}
                                        <div className="pt-4 border-t border-slate-100 space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Patient Information
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                        Full Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={patientName}
                                                        onChange={(e) => setPatientName(e.target.value)}
                                                        placeholder="e.g. John Doe"
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                        Mobile / Phone *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={patientPhone}
                                                        onChange={(e) => setPatientPhone(e.target.value)}
                                                        placeholder="e.g. +63 917 555 0199"
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                        Email (Optional)
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={patientEmail}
                                                        onChange={(e) => setPatientEmail(e.target.value)}
                                                        placeholder="patient@email.com"
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                        Age
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="120"
                                                        value={patientAge}
                                                        onChange={(e) => setPatientAge(e.target.value)}
                                                        placeholder="30"
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                        Reason for Visit / Selected Package
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={reasonForVisit}
                                                        onChange={(e) => setReasonForVisit(e.target.value)}
                                                        placeholder="e.g. General consultation, Executive Check-Up, Annual Physical Exam..."
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Mandatory Data Privacy & Terms Consent Checkbox */}
                                            <div className="pt-2 flex items-start gap-2.5 text-xs text-slate-600">
                                                <input
                                                    id="consent-checkbox"
                                                    type="checkbox"
                                                    checked={agreedToTerms}
                                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                    className="mt-0.5 accent-teal-700 cursor-pointer"
                                                />
                                                <label htmlFor="consent-checkbox" className="leading-relaxed">
                                                    I consent to the collection and processing of my personal and medical
                                                    appointment data in accordance with the{' '}
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenLegalModal('privacy')}
                                                        className="font-bold text-[#13467b] underline cursor-pointer"
                                                    >
                                                        Privacy Policy
                                                    </button>
                                                    ,{' '}
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenLegalModal('cookies')}
                                                        className="font-bold text-[#13467b] underline cursor-pointer"
                                                    >
                                                        Cookie Policy
                                                    </button>
                                                    , and{' '}
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenLegalModal('terms')}
                                                        className="font-bold text-[#13467b] underline cursor-pointer"
                                                    >
                                                        Terms & Agreements
                                                    </button>
                                                    .
                                                </label>
                                            </div>
                                        </div>

                                        {/* Bottom Bar: 1. Patient Info -> 2. Doctor & Time -> 3. Confirmation + Submit Reservation */}
                                        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                                            <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                                                <span className="text-teal-700 font-bold">1. Patient Info</span>
                                                <span>→</span>
                                                <span className="text-teal-700 font-bold">2. Doctor & Time</span>
                                                <span>→</span>
                                                <span className="text-slate-900 font-bold">3. Confirmation</span>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="px-6 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
                                            >
                                                {submitting ? 'Submitting Reservation...' : 'Submit Reservation'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <>
                    {/* 3. HERO BANNER (Matches HealthCube "Your Health Needs, All in One Place") */}
                    <section className="relative bg-gradient-to-r from-slate-900 via-[#13467b] to-teal-900 text-white overflow-hidden">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-20 relative z-10 text-center max-w-3xl space-y-5">
                            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-teal-200 border border-white/20">
                                <Sparkles className="w-3.5 h-3.5" />
                                Seamless, Personalized Healthcare Designed to Empower You
                            </span>
                            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                                Your Health Needs, All in One Place
                            </h1>
                            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                                Experience healthcare designed for your lifestyle. CarePoint & HealthCube Medical Clinics offer
                                comprehensive medical consultations, executive check-ups, and advanced diagnostics with real-time
                                smart queue tracking.
                            </p>
                            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
                                <button
                                    type="button"
                                    onClick={() => openSchedulePage()}
                                    className="px-7 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide shadow-lg transition cursor-pointer"
                                >
                                    Schedule Now
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollToRef(servicesRefSection)}
                                    className="px-7 py-3 rounded-lg bg-[#13467b] hover:bg-[#0e355e] border border-blue-400/40 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wide shadow-lg transition cursor-pointer"
                                >
                                    Explore Services
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* 5. HEALTHCUBE SECTION: "WHAT WE OFFER — Expert Care Tailored to Your Needs" (Matches Screenshots 2 & 3) */}
                    <section ref={servicesRefSection} className="py-14 bg-white border-b border-slate-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
                            <div className="text-center max-w-3xl mx-auto space-y-2">
                                <div className="text-xs font-extrabold uppercase tracking-widest text-[#13467b]">
                                    WHAT WE OFFER
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                    Expert Care Tailored to Your Needs
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-600">
                                    At HealthCube & CarePoint Medical Clinics, we offer a comprehensive range of medical
                                    services designed for preventive wellness, executive check-ups, and advanced diagnostics.
                                </p>
                            </div>

                            {/* Medical Check-Up Packages Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {CHECKUPS_DROPDOWN.map((pkg) => (
                                    <div
                                        key={pkg.name}
                                        className="rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-50/70 to-white p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition"
                                    >
                                        <div className="space-y-2">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#13467b] text-white text-[11px] font-bold">
                                                Check-Up Package • {pkg.price}
                                            </span>
                                            <h3 className="text-base font-extrabold text-[#13467b]">{pkg.name}</h3>
                                            <p className="text-xs text-slate-600 leading-relaxed">{pkg.desc}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickSelectService(pkg.name)}
                                            className="mt-5 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#13467b] hover:text-teal-700 cursor-pointer"
                                        >
                                            <span>Schedule Package</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Diagnostic & Clinical Services Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {SERVICES_DROPDOWN.map((srv) => (
                                    <div
                                        key={srv.name}
                                        className="p-5 rounded-xl border border-slate-200 hover:border-[#13467b] transition bg-white space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-extrabold text-sm text-slate-900">{srv.name}</h4>
                                            <Microscope className="w-4 h-4 text-[#13467b]" />
                                        </div>
                                        <p className="text-xs text-slate-600">{srv.desc}</p>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickSelectService(`${srv.name} Service`)}
                                            className="text-xs font-bold text-teal-700 hover:underline cursor-pointer pt-1 inline-block"
                                        >
                                            Schedule Now →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 6. FIND A DOCTOR DIRECTORY SECTION */}
                    <section ref={doctorsRefSection} className="py-14 bg-slate-50 border-b border-slate-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <div className="text-xs font-extrabold uppercase tracking-widest text-teal-700">
                                        BOARD-CERTIFIED SPECIALISTS
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                                        Find A Doctor & Check Live Room Availability
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={onOpenLoginModal}
                                    className="text-xs font-bold text-[#13467b] underline cursor-pointer"
                                >
                                    Are you a Physician or Staff? Sign In to Portal →
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {availableDoctors.map((doc) => {
                                    const isOnline =
                                        doc.availability_status === 'active' ||
                                        doc.availability_status === 'in_consultation';
                                    return (
                                        <div
                                            key={doc.id}
                                            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-extrabold text-base text-slate-900">
                                                            {doc.name}
                                                        </h3>
                                                        <p className="text-xs font-bold text-[#13467b]">
                                                            {doc.specialty}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${isOnline
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                            }`}
                                                    >
                                                        {doc.room_number} • {doc.availability_status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600">{doc.bio}</p>
                                            </div>

                                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                                <span className="text-slate-500 font-medium">
                                                    Shift: {doc.shift_start} – {doc.shift_end}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openSchedulePage({
                                                            deptId: doc.department_id,
                                                            docId: doc.id,
                                                        })
                                                    }
                                                    className="px-3.5 py-1.5 rounded-lg bg-[#13467b] hover:bg-[#0e355e] text-white font-bold cursor-pointer"
                                                >
                                                    Schedule with Doctor
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* 7. ADVANCED DIAGNOSTICS & HMO PARTNERS (Matches Screenshot 4) */}
                    <section ref={hmoRefSection} className="py-14 bg-white border-b border-slate-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-6 space-y-4">
                                <div className="text-xs font-extrabold uppercase tracking-widest text-[#13467b]">
                                    ADVANCED DIAGNOSTICS & PATIENT RESOURCES
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-black text-[#13467b] leading-tight">
                                    Precision. Innovation. Trusted Results.
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    We combine advanced diagnostic technology with expert physicians to deliver accurate
                                    diagnoses and effective treatments. Our commitment to precision ensures reliable laboratory
                                    and imaging results, while smart queue automation eliminates long waiting lines.
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {[
                                        'Maxicare',
                                        'Medicard',
                                        'Intellicare',
                                        'PhilCare',
                                        'Cocolife',
                                        'Avega',
                                        'ValuCare',
                                        'Senior / PWD 20% Privilege',
                                    ].map((hmo) => (
                                        <span
                                            key={hmo}
                                            className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                                        >
                                            ✓ {hmo}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-6" ref={faqRefSection}>
                                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3">
                                    <h3 className="text-base font-extrabold text-slate-900 mb-2">
                                        Frequently Asked Questions (FAQs)
                                    </h3>
                                    {FAQS.map((item, idx) => {
                                        const isOpen = openFaqIndex === idx;
                                        return (
                                            <div
                                                key={item.q}
                                                className="rounded-xl overflow-hidden border border-slate-200 bg-white"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                                                    className="w-full px-4 py-3 bg-[#13467b] text-white text-left text-xs font-bold flex items-center justify-between cursor-pointer"
                                                >
                                                    <span>{item.q}</span>
                                                    {isOpen ? (
                                                        <Minus className="w-4 h-4 shrink-0" />
                                                    ) : (
                                                        <Plus className="w-4 h-4 shrink-0" />
                                                    )}
                                                </button>
                                                {isOpen && (
                                                    <div className="p-4 text-xs text-slate-600 leading-relaxed bg-white">
                                                        {item.a}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* 8. FULL BLACK FOOTER WITH LOCATIONS, CONTACT & LEGAL POLICIES (Matches Screenshot 5) */}
            <footer className="bg-[#05070a] text-slate-300 pt-14 pb-10 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
                    {/* Column 1: Logo & Contact Us */}
                    <div className="space-y-4">
                        <CarePointLogo dark size="md" />
                        <div className="space-y-2 pt-2 text-xs">
                            <div className="font-bold text-white text-sm">Contact Us</div>
                            <div className="flex items-center gap-2 text-slate-300">
                                <Phone className="w-4 h-4 text-teal-400" />
                                <span>8652-1111 / +1 (800) 555-0199</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                                <Mail className="w-4 h-4 text-teal-400" />
                                <span>inquiry@healthcube.com.ph</span>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Find Us Here (Mandaluyong & Greenhills from Screenshot 5) */}
                    <div className="space-y-3 text-xs">
                        <h4 className="font-bold text-white text-sm">Find Us Here</h4>
                        <div className="flex items-start gap-2 leading-relaxed">
                            <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span>241 Shaw Blvd, Mandaluyong, 1552 Metro Manila</span>
                        </div>
                        <div className="flex items-start gap-2 leading-relaxed">
                            <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span>5th Floor, GH Mall, Greenhills Comml Complex, San Juan, 1500 Metro Manila</span>
                        </div>
                    </div>

                    {/* Column 3: Quick Links */}
                    <div className="space-y-2.5 text-xs">
                        <h4 className="font-bold text-white text-sm">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <button
                                    type="button"
                                    onClick={() => scrollToRef(servicesRefSection)}
                                    className="hover:text-white cursor-pointer"
                                >
                                    Our Services
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => handleQuickSelectService('Executive Check-Up')}
                                    className="hover:text-white cursor-pointer"
                                >
                                    Executive Check-Ups
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => scrollToRef(doctorsRefSection)}
                                    className="hover:text-white cursor-pointer"
                                >
                                    Find A Doctor
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={onOpenLoginModal}
                                    className="hover:text-white cursor-pointer text-teal-400 font-semibold"
                                >
                                    Staff, Doctor, TV & Admin Login
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Patient Resources & Legal Policies */}
                    <div className="space-y-2.5 text-xs">
                        <h4 className="font-bold text-white text-sm">Legal, Privacy & Compliance</h4>
                        <ul className="space-y-2">
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegalModal('privacy')}
                                    className="hover:text-teal-300 cursor-pointer font-semibold"
                                >
                                    Privacy Policy (RA 10173 / HIPAA)
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegalModal('cookies')}
                                    className="hover:text-teal-300 cursor-pointer font-semibold"
                                >
                                    Cookie Policy & Consent Settings
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegalModal('terms')}
                                    className="hover:text-teal-300 cursor-pointer font-semibold"
                                >
                                    Terms and Agreements
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegalModal('rights')}
                                    className="hover:text-teal-300 cursor-pointer font-semibold"
                                >
                                    Patient Bill of Rights & HMO Policy
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                    <div>
                        Copyright © 2026 – CarePoint & HealthCube Medical Clinics. All Rights Reserved.
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => onOpenLegalModal('privacy')}
                            className="hover:text-slate-300 cursor-pointer"
                        >
                            Privacy Policy
                        </button>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={() => onOpenLegalModal('cookies')}
                            className="hover:text-slate-300 cursor-pointer"
                        >
                            Cookie Policy
                        </button>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={() => onOpenLegalModal('terms')}
                            className="hover:text-slate-300 cursor-pointer"
                        >
                            Terms & Agreements
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
