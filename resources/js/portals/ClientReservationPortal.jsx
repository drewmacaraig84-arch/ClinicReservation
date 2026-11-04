import React, { useState, useEffect } from 'react';
import CarePointLogo from '../components/CarePointLogo';
import { ClientWebsiteSkeleton } from '../components/SkeletonLoaders';
import { cachedFetchJson, invalidateClientCache } from '../utils/apiCache';
import {
    Stethoscope,
    CheckCircle2,
    Search,
    Phone,
    Mail,
    MapPin,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
    ChevronDown,
    Plus,
    Minus,
    Building2,
    HeartPulse,
    Microscope,
    Award,
    CreditCard,
    Sparkles,
    Clock,
} from 'lucide-react';

const SERVICES_DROPDOWN = [
    {
        name: 'Laboratory',
        desc: 'Complete blood chemistry, hematology, clinical microscopy & serology.',
        turnaround: 'Same-Day Digital Results (2–6 Hours)',
        prep: '8–12 hours fasting required for FBS and Lipid Profile.',
        inclusions: ['Complete Blood Count (CBC)', 'Fasting Blood Sugar & HbA1c', 'Lipid Profile & Liver Enzymes', 'Urinalysis, Fecalysis & Serology'],
    },
    {
        name: 'Imaging',
        desc: 'Digital X-Ray, 4D Ultrasound, Mammography & Low-Dose CT Scan.',
        turnaround: '24-Hour Radiologist Official Reading',
        prep: 'Full bladder for pelvic ultrasound; 6-hour fast for whole abdomen ultrasound.',
        inclusions: ['Digital Chest & Skeletal X-Ray', 'Whole Abdomen & OB-GYN 4D Ultrasound', '3D Digital Mammography', 'Low-Dose Multi-Slice CT Scan'],
    },
    {
        name: 'Cardiopulmonary',
        desc: '12-Lead ECG, 2D Echo with Doppler, Treadmill Stress Test & Holter.',
        turnaround: 'Immediate Tracings • Cardiologist Verified',
        prep: 'Bring comfortable walking shoes/attire for Treadmill Stress Test.',
        inclusions: ['12-Lead Resting ECG', '2D Echocardiography with Color Doppler', 'Treadmill Exercise Stress Test', '24-Hour Holter & ABPM Monitoring'],
    },
    {
        name: 'Ambulatory Surgery',
        desc: 'Outpatient minor surgical procedures and endoscopy suites.',
        turnaround: 'Same-Day Outpatient Recovery',
        prep: 'Pre-procedure surgical clearance and specialist consultation.',
        inclusions: ['Excision of Minor Cysts & Lesions', 'Wound Debridement & Suturing', 'Upper GI Endoscopy & Colonoscopy', 'Outpatient Biopsy Procedures'],
    },
    {
        name: 'Rehabilitation',
        desc: 'Physical therapy, sports medicine & post-operative rehabilitation.',
        turnaround: '60-Minute Personalized 1-on-1 Sessions',
        prep: 'Wear loose, comfortable athletic clothing.',
        inclusions: ['Post-Stroke & Orthopedic Rehab', 'Sports Injury Recovery Therapy', 'Therapeutic Ultrasound & TENS', 'Postural & Mobility Conditioning'],
    },
    {
        name: 'Vaccinations',
        desc: 'Flu, Pneumonia, HPV, Hepatitis & Pediatric immunization packages.',
        turnaround: '15-Minute Physician Screening & Administration',
        prep: 'Bring your previous immunization record card if available.',
        inclusions: ['Quadrivalent Influenza (Flu) Vaccine', 'Pneumococcal (PCV13 / PPSV23)', 'HPV (Gardasil-9) & Hepatitis A/B', 'Tetanus, Rabies & Travel Vaccines'],
    },
    {
        name: 'Mental Health',
        desc: 'Confidential psychiatric & psychological wellness consultations.',
        turnaround: 'Strictly Confidential 45–60 Min Sessions',
        prep: 'Available in-clinic at Mandaluyong & Greenhills or via private consultation.',
        inclusions: ['Adult & Adolescent Psychiatry', 'Psychological Counseling & Therapy', 'Stress, Burnout & Sleep Management', 'Corporate Mental Wellness Assessments'],
    },
    {
        name: 'Home Care',
        desc: 'Home service blood extraction, ECG, and physician house calls.',
        turnaround: 'Scheduled Morning Home Visits (Metro Manila)',
        prep: 'Book at least 24 hours in advance for mobile phlebotomy.',
        inclusions: ['Home Blood Extraction & Specimen Pickup', 'Portable 12-Lead Home ECG', 'Home Vaccination Administration', 'Senior Citizen Physician House Calls'],
    },
];

const CHECKUPS_DROPDOWN = [
    {
        name: 'Executive Check-Up',
        price: '₱4,800',
        badge: 'Most Comprehensive',
        desc: 'Comprehensive 42-parameter blood panel, ECG, Chest X-Ray, Ultrasound & Physician Evaluation.',
        prep: '10–12 hours fasting (water is allowed). Morning schedule recommended.',
        inclusions: [
            '42-Parameter Blood Chemistry (FBS, HbA1c, Lipid Profile, Kidney & Liver Function, Uric Acid, Electrolytes)',
            'Complete Blood Count (CBC), Urinalysis & Fecalysis with Occult Blood',
            '12-Lead Resting ECG & Digital Chest X-Ray (PA View)',
            'Whole Abdomen Ultrasound',
            'Comprehensive Physical Exam & Nutritional Review with Internal Medicine Specialist',
        ],
    },
    {
        name: 'Annual Physical Exam',
        price: '₱1,650',
        badge: 'Preventive Standard',
        desc: 'CBC, Urinalysis, Fecalysis, Chest X-Ray, Visual Acuity & Medical Clearance.',
        prep: 'No fasting required unless adding optional blood chemistry tests.',
        inclusions: [
            'Complete History & Physical Examination by Clinic Physician',
            'Complete Blood Count (CBC) with Platelet Count',
            'Routine Urinalysis & Fecalysis',
            'Digital Chest X-Ray (PA View)',
            'Visual Acuity, BMI & Blood Pressure Assessment + Official Medical Certificate',
        ],
    },
    {
        name: 'Pre-Employment Medical Exam',
        price: '₱1,250',
        badge: '24-Hour Fit-to-Work',
        desc: 'Fast-track corporate onboarding medical exam with 24-hour digital fit-to-work certificate.',
        prep: 'Bring valid government ID and company referral slip if applicable.',
        inclusions: [
            'Physical Examination & Medical History Review',
            'Complete Blood Count (CBC), Urinalysis & Fecalysis',
            'Digital Chest X-Ray',
            'Optional Drug Testing & Hepatitis B Screening Add-On',
            'Official Fit-to-Work Medical Clearance Certificate within 24 Hours',
        ],
    },
    {
        name: 'Pre-Enrollment Exam',
        price: '₱950',
        badge: 'Student Package',
        desc: 'Student health screening, physical exam, and immunization review for schools & universities.',
        prep: 'Bring school medical form for physician signature and stamp.',
        inclusions: [
            'Complete Student Physical Examination & Vital Signs',
            'Complete Blood Count (CBC), Urinalysis & Fecalysis',
            'Digital Chest X-Ray & Visual Acuity Check',
            'Immunization Record Review & School Health Form Endorsement',
        ],
    },
];

const PATIENT_RESOURCES_DROPDOWN = [
    { name: 'HMO Partners', target: 'hmo' },
    { name: 'Discount Cards', target: 'discounts' },
    { name: 'Live Queue Tracker', target: 'booking' },
];

const HMO_PARTNERS_LIST = [
    { name: 'Maxicare Healthcare', type: 'Full Outpatient, Lab & Imaging Coverage', loa: 'Instant Clinic Terminal & App E-LOA' },
    { name: 'Medicard Philippines', type: 'Consultations, Executive Check-Ups & Diagnostics', loa: 'MACE App & Concierge Desk Approval' },
    { name: 'Intellicare (Asalus)', type: 'Specialist Consultations & Diagnostic Procedures', loa: 'Agora App & HMO Desk 1 Verification' },
    { name: 'PhilCare', type: 'Preventive Care, Lab Panels & X-Ray/Ultrasound', loa: 'HeyPhil App & Instant Clinic LOA' },
    { name: 'Cocolife Healthcare', type: 'Corporate & Individual Medical Plans', loa: 'Direct HMO Coordinator Verification' },
    { name: 'Avega Managed Care', type: 'Outpatient Specialist & Diagnostic Services', loa: 'Digital LOA & Corporate Endorsement' },
    { name: 'ValuCare Health Systems', type: 'Primary & Specialist Clinic Consultations', loa: 'On-Site HMO Verification Desk' },
    { name: 'EastWest Healthcare', type: 'Comprehensive Outpatient & Laboratory Care', loa: 'Direct Clinic LOA Processing' },
];

const DISCOUNT_CARDS_LIST = [
    {
        title: 'HealthCube Prestige Wellness Card',
        discount: '15% OFF Diagnostics & 10% OFF Packages',
        desc: 'Exclusive loyalty card for individuals and families offering year-round discounts on laboratory tests, imaging, and executive check-ups.',
    },
    {
        title: 'Senior Citizen Privilege (RA 9994)',
        discount: '20% Discount + 12% VAT Exemption',
        desc: 'Honored across all consultations, laboratory workups, diagnostic imaging, and medical procedures upon presentation of OSCA ID.',
    },
    {
        title: 'Persons with Disability (PWD - RA 10754)',
        discount: '20% Discount + 12% VAT Exemption',
        desc: 'Dedicated priority lane access and statutory discounts on all medical and diagnostic services.',
    },
    {
        title: 'Corporate Partner Wellness Card',
        discount: 'Custom Corporate Rates',
        desc: 'Special preferred rates for employees and dependents of our 150+ accredited corporate partner organizations.',
    },
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
    {
        q: 'How do I prepare for an Executive Check-Up or fasting blood test?',
        a: 'Please fast for 10 to 12 hours prior to your morning appointment (plain water is permitted). Avoid alcoholic beverages 24 hours before your laboratory extraction.',
    },
];

function resolvePageFromLocation() {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');

    if (path.startsWith('/schedule') || pageParam === 'schedule') return 'schedule';
    if (path.startsWith('/services') || pageParam === 'services') return 'services';
    if (path.startsWith('/medical-check-ups') || pageParam === 'checkups') return 'checkups';
    if (path.startsWith('/patient-resources') || pageParam === 'resources') return 'resources';
    if (path.startsWith('/about-us') || pageParam === 'about') return 'about';
    if (path.startsWith('/find-a-doctor') || pageParam === 'doctors') return 'doctors';
    if (path.startsWith('/faqs') || path.startsWith('/contact-us') || pageParam === 'faqs') return 'faqs';
    return 'home';
}

export default function ClientReservationPortal({
    onSwitchPortal,
    onOpenLoginModal,
    notify,
    onOpenLegalModal,
}) {
    const [catalog, setCatalog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    // Multi-page navigator state ('home', 'services', 'checkups', 'resources', 'about', 'doctors', 'faqs', 'schedule')
    const [activePage, setActivePage] = useState(() => resolvePageFromLocation());
    const [highlightedItem, setHighlightedItem] = useState(() => {
        if (typeof window === 'undefined') return '';
        return new URLSearchParams(window.location.search).get('item') || '';
    });

    // Find a Doctor page filter state
    const [doctorSearch, setDoctorSearch] = useState('');
    const [doctorDeptFilter, setDoctorDeptFilter] = useState('ALL');

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

    const navigateToPage = (page, options = {}) => {
        setOpenDropdown(null);
        setActivePage(page);

        if (options.item !== undefined) {
            setHighlightedItem(options.item);
        } else {
            setHighlightedItem('');
        }

        if (options.service) {
            setReasonForVisit(options.service);
        }
        if (options.deptId) {
            setDepartmentId(String(options.deptId));
        }
        if (options.docId) {
            setDoctorId(String(options.docId));
        }

        const routeMap = {
            home: '/',
            services: '/services',
            checkups: '/medical-check-ups',
            resources: '/patient-resources',
            about: '/about-us',
            doctors: '/find-a-doctor',
            faqs: '/faqs',
            schedule: '/schedule',
        };

        const basePath = routeMap[page] || '/';
        const params = new URLSearchParams();
        if (options.item) params.set('item', options.item);
        if (page === 'schedule') {
            if (options.service || reasonForVisit) params.set('service', options.service || reasonForVisit);
            if (options.deptId || departmentId) params.set('dept', String(options.deptId || departmentId));
            if (options.docId || doctorId) params.set('doctor', String(options.docId || doctorId));
        }

        const qs = params.toString();
        const url = `${basePath}${qs ? `?${qs}` : ''}`;

        if (typeof window !== 'undefined') {
            window.history.pushState({ page, item: options.item || '' }, '', url);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const openSchedulePage = ({ service, deptId, docId } = {}) => {
        navigateToPage('schedule', { service, deptId, docId });
    };

    useEffect(() => {
        const handlePopState = () => {
            setActivePage(resolvePageFromLocation());
            const params = new URLSearchParams(window.location.search);
            setHighlightedItem(params.get('item') || '');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

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
            notify(`Reservation confirmed! Your Queue Ticket is ${data.appointment.ticket_number}`, 'success');
            fetchCatalog(true);
        } catch (err) {
            notify('Network error while submitting reservation.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !catalog) {
        return <ClientWebsiteSkeleton />;
    }

    const availableDoctors = catalog?.doctors || [];
    const filteredDoctors = availableDoctors.filter((d) => String(d.department_id) === String(departmentId));
    const doctorsToShow = filteredDoctors.length > 0 ? filteredDoctors : availableDoctors;
    const selectedDoctorObj = availableDoctors.find((d) => String(d.id) === String(doctorId));

    // Filtered doctors for the dedicated Find A Doctor page
    const directoryDoctors = availableDoctors.filter((doc) => {
        if (doctorDeptFilter !== 'ALL' && String(doc.department_id) !== String(doctorDeptFilter)) {
            return false;
        }
        if (doctorSearch.trim() !== '') {
            const q = doctorSearch.toLowerCase();
            return (
                doc.name.toLowerCase().includes(q) ||
                doc.specialty.toLowerCase().includes(q) ||
                (doc.room_number || '').toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <div className="bg-white min-h-screen flex flex-col">
            {/* 1. TOP ROYAL-BLUE UTILITY BAR */}
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
                            onClick={() => navigateToPage('faqs')}
                            className={`font-semibold hover:text-cyan-200 transition cursor-pointer ${
                                activePage === 'faqs' ? 'text-teal-300 underline' : ''
                            }`}
                        >
                            FAQs
                        </button>
                        <span className="text-blue-400">|</span>
                        <button
                            type="button"
                            onClick={() => navigateToPage('faqs', { item: 'contact' })}
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

            {/* 2. MAIN WHITE HEADER WITH DEDICATED PAGE NAVIGATION & "SCHEDULE NOW" CTA */}
            <header
                className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs"
                onMouseLeave={() => setOpenDropdown(null)}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    {/* Brand Logo (Clicks back to Home Page Summary) */}
                    <div
                        onClick={() => navigateToPage('home')}
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

                    {/* Multi-Page Navigation Links */}
                    <nav className="flex items-center gap-1 lg:gap-4 flex-wrap text-sm font-semibold text-slate-700">
                        {/* Home Summary Link */}
                        <button
                            type="button"
                            onClick={() => navigateToPage('home')}
                            className={`px-2.5 py-2 rounded-lg transition cursor-pointer ${
                                activePage === 'home'
                                    ? 'text-[#13467b] bg-blue-50 font-extrabold'
                                    : 'hover:text-[#13467b]'
                            }`}
                        >
                            Home
                        </button>

                        {/* Page 1: Services (with dropdown to jump to any specific service on the Services Page) */}
                        <div
                            className="relative"
                            onMouseEnter={() => setOpenDropdown('services')}
                        >
                            <button
                                type="button"
                                onClick={() => navigateToPage('services')}
                                className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-lg transition cursor-pointer ${
                                    activePage === 'services'
                                        ? 'text-[#13467b] bg-blue-50 font-extrabold'
                                        : 'hover:text-[#13467b]'
                                }`}
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
                                            onClick={() => navigateToPage('services', { item: s.name })}
                                            className="w-full text-left px-5 py-2.5 text-sm font-semibold text-[#13467b] hover:bg-blue-50 transition block cursor-pointer"
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Page 2: Medical Check-Ups */}
                        <div
                            className="relative"
                            onMouseEnter={() => setOpenDropdown('checkups')}
                        >
                            <button
                                type="button"
                                onClick={() => navigateToPage('checkups')}
                                className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-lg transition cursor-pointer ${
                                    activePage === 'checkups'
                                        ? 'text-[#13467b] bg-blue-50 font-extrabold'
                                        : 'hover:text-[#13467b]'
                                }`}
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
                                            onClick={() => navigateToPage('checkups', { item: c.name })}
                                            className="w-full text-left px-5 py-2.5 text-sm font-semibold text-[#13467b] hover:bg-blue-50 transition flex items-center justify-between cursor-pointer"
                                        >
                                            <span>{c.name}</span>
                                            <span className="text-xs font-bold text-teal-700">{c.price}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Page 3: Patient Resources */}
                        <div
                            className="relative"
                            onMouseEnter={() => setOpenDropdown('resources')}
                        >
                            <button
                                type="button"
                                onClick={() => navigateToPage('resources')}
                                className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-lg transition cursor-pointer ${
                                    activePage === 'resources'
                                        ? 'text-[#13467b] bg-blue-50 font-extrabold'
                                        : 'hover:text-[#13467b]'
                                }`}
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
                                            onClick={() => navigateToPage('resources', { item: item.name })}
                                            className="w-full text-left px-5 py-2.5 text-sm font-semibold text-[#13467b] hover:bg-blue-50 transition block cursor-pointer"
                                        >
                                            {item.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Page 4: About Us (Direct Link without dropdown) */}
                        <button
                            type="button"
                            onClick={() => navigateToPage('about')}
                            className={`px-2.5 py-2 rounded-lg transition cursor-pointer ${
                                activePage === 'about'
                                    ? 'text-[#13467b] bg-blue-50 font-extrabold'
                                    : 'hover:text-[#13467b]'
                            }`}
                        >
                            About Us
                        </button>

                        {/* Page 5: Find A Doctor */}
                        <button
                            type="button"
                            onClick={() => navigateToPage('doctors')}
                            className={`px-2.5 py-2 rounded-lg transition cursor-pointer ${
                                activePage === 'doctors'
                                    ? 'text-[#13467b] bg-blue-50 font-extrabold'
                                    : 'hover:text-[#13467b]'
                            }`}
                        >
                            Find A Doctor
                        </button>
                    </nav>

                    {/* Right CTA: SCHEDULE NOW */}
                    <div className="flex items-center gap-2">
                        {activePage === 'schedule' ? (
                            <button
                                type="button"
                                onClick={() => navigateToPage('home')}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-extrabold transition cursor-pointer border border-slate-300"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to Home</span>
                            </button>
                            About Us
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

            {/* =====================================================================
                PAGE 1: DEDICATED SCHEDULE NOW PAGE (/schedule)
               ===================================================================== */}
            {activePage === 'schedule' && (
                <section className="bg-slate-100 py-8 border-b border-slate-200 flex-1">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
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
                                        <button
                                            type="button"
                                            onClick={() => setBookedReceipt(null)}
                                            className="text-xs font-semibold text-emerald-800 underline cursor-pointer"
                                        >
                                            Dismiss Receipt
                                        </button>
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
                                        Choose your department, specialist doctor, preferred date, and real-time slot.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleBookSubmit} className="mt-6 space-y-6">
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
                                </div>
                            )}

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
                                                        className={`px-4 py-2 rounded-full text-xs font-bold transition border ${
                                                            slot.is_reserved
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
                </section>
            )}

            {/* =====================================================================
                PAGE 2: DEDICATED SERVICES PAGE (/services)
               ===================================================================== */}
            {activePage === 'services' && (
                <section className="py-12 bg-slate-50 border-b border-slate-200 flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
                        <div className="bg-gradient-to-r from-[#13467b] to-teal-800 rounded-2xl p-8 text-white flex flex-wrap items-center justify-between gap-6">
                            <div className="max-w-2xl space-y-2">
                                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-200">
                                    CLINICAL & DIAGNOSTIC DEPARTMENTS
                                </span>
                                <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                                    Our Comprehensive Medical Services
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                                    Explore our 8 specialized diagnostic and therapeutic departments equipped with automated
                                    laboratory analyzers, low-dose imaging, and board-certified clinicians.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => openSchedulePage()}
                                className="px-6 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide shadow-lg cursor-pointer"
                            >
                                Schedule a Service Now
                            </button>
                        </div>

                        {/* Service Filter Pills */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setHighlightedItem('')}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                                    !highlightedItem
                                        ? 'bg-[#13467b] text-white shadow-xs'
                                        : 'bg-white text-slate-700 border border-slate-200 hover:border-[#13467b]'
                                }`}
                            >
                                All 8 Services
                            </button>
                            {SERVICES_DROPDOWN.map((srv) => (
                                <button
                                    key={srv.name}
                                    type="button"
                                    onClick={() => setHighlightedItem(srv.name)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                                        highlightedItem === srv.name
                                            ? 'bg-[#13467b] text-white shadow-xs'
                                            : 'bg-white text-slate-700 border border-slate-200 hover:border-[#13467b]'
                                    }`}
                                >
                                    {srv.name}
                                </button>
                            ))}
                        </div>

                        {/* Detailed Service Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {SERVICES_DROPDOWN.filter(
                                (s) => !highlightedItem || s.name.toLowerCase() === highlightedItem.toLowerCase()
                            ).map((srv) => (
                                <div
                                    key={srv.name}
                                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-5"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                                                    {srv.turnaround}
                                                </span>
                                                <h3 className="text-xl font-black text-[#13467b] mt-0.5">
                                                    {srv.name}
                                                </h3>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-blue-50 text-[#13467b]">
                                                <Microscope className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{srv.desc}</p>

                                        <div className="pt-2 space-y-1.5">
                                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                                                Key Procedures & Capabilities:
                                            </div>
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                                                {srv.inclusions.map((inc) => (
                                                    <li key={inc} className="flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                                        <span>{inc}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 text-xs text-slate-600">
                                            <strong className="text-slate-800">Patient Preparation:</strong> {srv.prep}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-medium">
                                            Available at Shaw Blvd & Greenhills
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickSelectService(`${srv.name} Service`)}
                                            className="px-4 py-2 rounded-lg bg-[#13467b] hover:bg-[#0e355e] text-white text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5"
                                        >
                                            <span>Schedule {srv.name}</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* =====================================================================
                PAGE 3: DEDICATED MEDICAL CHECK-UPS PAGE (/medical-check-ups)
               ===================================================================== */}
            {activePage === 'checkups' && (
                <section className="py-12 bg-slate-50 border-b border-slate-200 flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
                        <div className="bg-gradient-to-r from-slate-900 via-[#13467b] to-teal-900 rounded-2xl p-8 text-white flex flex-wrap items-center justify-between gap-6">
                            <div className="max-w-2xl space-y-2">
                                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-200">
                                    PREVENTIVE WELLNESS & EXECUTIVE PACKAGES
                                </span>
                                <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                                    Medical Check-Up Packages
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                                    Proactive health screening packages tailored for executives, annual wellness, corporate
                                    pre-employment onboarding, and university enrollment clearances.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => openSchedulePage({ service: 'Executive Check-Up' })}
                                className="px-6 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide shadow-lg cursor-pointer"
                            >
                                Book Check-Up Now
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {CHECKUPS_DROPDOWN.map((pkg) => {
                                const isSelected =
                                    highlightedItem && pkg.name.toLowerCase() === highlightedItem.toLowerCase();
                                return (
                                    <div
                                        key={pkg.name}
                                        className={`rounded-2xl bg-white p-6 sm:p-7 flex flex-col justify-between space-y-5 transition ${
                                            isSelected
                                                ? 'border-2 border-[#13467b] ring-4 ring-blue-500/10 shadow-lg'
                                                : 'border border-slate-200 shadow-2xs'
                                        }`}
                                    >
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold">
                                                        {pkg.badge}
                                                    </span>
                                                    <h3 className="text-xl font-black text-[#13467b] mt-1.5">
                                                        {pkg.name}
                                                    </h3>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-slate-900">
                                                        {pkg.price}
                                                    </div>
                                                    <div className="text-[10px] font-bold uppercase text-slate-400">
                                                        All-In Package
                                                    </div>
                                                </div>
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
                                    </div>

                                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                                {pkg.desc}
                                            </p>

                                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                                                    Complete Package Inclusions:
                                                </div>
                                                <ul className="space-y-2 text-xs text-slate-600">
                                                    {pkg.inclusions.map((item) => (
                                                        <li key={item} className="flex items-start gap-2">
                                                            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-sky-50/80 rounded-xl p-3.5 border border-sky-200/70 text-xs text-slate-700">
                                                <strong className="text-[#13467b]">Preparation Guidelines:</strong>{' '}
                                                {pkg.prep}
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

                                        <button
                                            type="button"
                                            onClick={() => handleQuickSelectService(pkg.name)}
                                            className="w-full py-3 rounded-xl bg-[#13467b] hover:bg-[#0e355e] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wide shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <span>Schedule {pkg.name}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* =====================================================================
                PAGE 4: DEDICATED PATIENT RESOURCES PAGE (/patient-resources)
               ===================================================================== */}
            {activePage === 'resources' && (
                <section className="py-12 bg-slate-50 border-b border-slate-200 flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
                        <div className="bg-gradient-to-r from-[#13467b] to-slate-900 rounded-2xl p-8 text-white flex flex-wrap items-center justify-between gap-6">
                            <div className="max-w-2xl space-y-2">
                                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-300">
                                    PATIENT RESOURCES & ACCREDITATIONS
                                </span>
                                <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                                    HMO Partners & Discount Cards
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                                    Enjoy cashless medical consultations, laboratory workups, and imaging with our accredited
                                    HMO providers, or avail exclusive savings with our privilege and statutory discount cards.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => openSchedulePage()}
                                className="px-6 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide shadow-lg cursor-pointer"
                            >
                                Book with HMO / Card
                            </button>
                        </div>

                        {/* Section A: Accredited HMO Partners */}
                        <div className="space-y-5">
                            <div>
                                <div className="text-xs font-extrabold uppercase tracking-widest text-teal-700">
                                    CASHLESS MEDICAL COVERAGE
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                                    Accredited HMO Partners
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {HMO_PARTNERS_LIST.map((hmo) => (
                                    <div
                                        key={hmo.name}
                                        className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2.5 flex flex-col justify-between"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                Accredited Partner
                                            </div>
                                            <h3 className="font-black text-base text-[#13467b]">{hmo.name}</h3>
                                            <p className="text-xs text-slate-600">{hmo.type}</p>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500">
                                            LOA Processing: <span className="text-slate-800">{hmo.loa}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section B: Discount Cards & Privileges */}
                        <div className="space-y-5">
                            <div>
                                <div className="text-xs font-extrabold uppercase tracking-widest text-[#13467b]">
                                    WELLNESS PRIVILEGES & STATUTORY DISCOUNTS
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                                    Discount Cards & Privileges
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {DISCOUNT_CARDS_LIST.map((card) => (
                                    <div
                                        key={card.title}
                                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex items-start gap-4"
                                    >
                                        <div className="p-3 rounded-xl bg-blue-50 text-[#13467b] shrink-0">
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="inline-block text-xs font-extrabold text-teal-700">
                                                {card.discount}
                                            </span>
                                            <h3 className="text-base font-black text-slate-900">{card.title}</h3>
                                            <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* =====================================================================
                PAGE 5: DEDICATED ABOUT US PAGE (/about-us)
               ===================================================================== */}
            {activePage === 'about' && (
                <section className="py-12 bg-white border-b border-slate-200 flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
                        <div className="bg-gradient-to-r from-slate-900 via-[#13467b] to-teal-900 rounded-2xl p-8 sm:p-10 text-white space-y-4">
                            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-300">
                                ABOUT HEALTHCUBE & CAREPOINT MEDICAL CLINICS
                            </span>
                            <h1 className="text-2xl sm:text-4xl font-black tracking-tight max-w-3xl">
                                Precision. Innovation. Trusted Multispecialty Healthcare.
                            </h1>
                            <p className="text-xs sm:text-base text-slate-200 leading-relaxed max-w-3xl">
                                Founded with a vision to redefine outpatient healthcare in Metro Manila, HealthCube &
                                CarePoint Medical Clinics bring together board-certified specialists, hospital-grade
                                diagnostic imaging, and automated laboratory medicine under one roof.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50 space-y-2.5">
                                <div className="p-2.5 rounded-xl bg-[#13467b] text-white w-fit">
                                    <HeartPulse className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">Our Mission</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    To deliver accessible, compassionate, and evidence-based medical care empowered by
                                    modern diagnostic precision and seamless digital patient experiences.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50 space-y-2.5">
                                <div className="p-2.5 rounded-xl bg-teal-700 text-white w-fit">
                                    <Award className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">Our Vision</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    To be the most trusted multispecialty ambulatory and diagnostic clinic network in the
                                    Philippines, setting the benchmark for clinical quality and patient safety.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50 space-y-2.5">
                                <div className="p-2.5 rounded-xl bg-[#13467b] text-white w-fit">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">Clinical Research & Quality</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    DOH-licensed and NEQAS-participating clinical laboratories adhering to international
                                    quality assurance protocols, RA 10173 Data Privacy, and HIPAA security safeguards.
                                </p>
                            </div>
                        </div>

                        {/* Clinic Branches */}
                        <div className="bg-slate-900 text-white rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-3">
                                <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                                    OUR METRO MANILA FACILITIES
                                </span>
                                <h2 className="text-2xl font-black">Visit Our Clinic Branches</h2>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                    Both branches feature full laboratory, imaging, cardiopulmonary, and multispecialty
                                    consultation suites open Monday to Saturday from 7:00 AM to 5:00 PM.
                                </p>
                            </div>
                            <div className="space-y-4 text-xs sm:text-sm">
                                <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                                    <div className="font-extrabold text-teal-300">Shaw Boulevard Main Facility</div>
                                    <div className="text-slate-200">241 Shaw Blvd, Mandaluyong, 1552 Metro Manila</div>
                                    <div className="text-slate-400 text-xs">Dedicated Street-Level Patient Parking</div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                                    <div className="font-extrabold text-teal-300">Greenhills Mall Branch</div>
                                    <div className="text-slate-200">
                                        5th Floor, GH Mall, Greenhills Comml Complex, San Juan, 1500 Metro Manila
                                    </div>
                                    <div className="text-slate-400 text-xs">Direct Multi-Level Mall Parking Access</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* =====================================================================
                PAGE 6: DEDICATED FIND A DOCTOR PAGE (/find-a-doctor)
               ===================================================================== */}
            {activePage === 'doctors' && (
                <section className="py-12 bg-slate-50 border-b border-slate-200 flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <div className="text-xs font-extrabold uppercase tracking-widest text-teal-700">
                                        BOARD-CERTIFIED SPECIALISTS DIRECTORY
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                                        Find A Doctor & Check Live Room Availability
                                    </h1>
                                </div>
                                <button
                                    type="button"
                                    onClick={onOpenLoginModal}
                                    className="text-xs font-bold text-[#13467b] underline cursor-pointer"
                                >
                                    Are you a Physician or Staff? Sign In to Portal →
                                </button>
                            </div>

                            {/* Search & Department Filter Bar */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-7 relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={doctorSearch}
                                        onChange={(e) => setDoctorSearch(e.target.value)}
                                        placeholder="Search doctor by name, specialty, or room (e.g. Sarah Johnson, Cardiology, ROOM 1)..."
                                        className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-[#13467b] focus:outline-none"
                                    />
                                </div>
                                <div className="md:col-span-5">
                                    <select
                                        value={doctorDeptFilter}
                                        onChange={(e) => setDoctorDeptFilter(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-700 focus:border-[#13467b] focus:outline-none bg-white"
                                    >
                                        <option value="ALL">All Clinical Departments</option>
                                        {(catalog?.departments || []).map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name} ({dept.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {directoryDoctors.map((doc) => {
                                const isOnline =
                                    doc.availability_status === 'active' ||
                                    doc.availability_status === 'in_consultation';
                                return (
                                    <div
                                        key={doc.id}
                                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4"
                                    >
                                        <div className="space-y-2.5">
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
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                        isOnline
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {doc.room_number} • {doc.availability_status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{doc.bio}</p>
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="text-slate-500 font-medium inline-flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {doc.shift_start} – {doc.shift_end}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openSchedulePage({
                                                        deptId: doc.department_id,
                                                        docId: doc.id,
                                                    })
                                                }
                                                className="px-4 py-2 rounded-lg bg-[#13467b] hover:bg-[#0e355e] text-white font-bold cursor-pointer"
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
            )}

            {/* =====================================================================
                PAGE 7: DEDICATED FAQS & CONTACT US PAGE (/faqs)
               ===================================================================== */}
            {activePage === 'faqs' && (
                <section className="py-12 bg-slate-50 border-b border-slate-200 flex-1">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
                        <div className="text-center space-y-2">
                            <span className="text-xs font-extrabold uppercase tracking-widest text-[#13467b]">
                                HELP CENTER & PATIENT INQUIRIES
                            </span>
                            <h1 className="text-2xl sm:text-4xl font-black text-slate-900">
                                Frequently Asked Questions & Contact Info
                            </h1>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-3 shadow-2xs">
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
                                            className="w-full px-4 py-3.5 bg-[#13467b] text-white text-left text-xs sm:text-sm font-bold flex items-center justify-between cursor-pointer"
                                        >
                                            <span>{item.q}</span>
                                            {isOpen ? (
                                                <Minus className="w-4 h-4 shrink-0" />
                                            ) : (
                                                <Plus className="w-4 h-4 shrink-0" />
                                            )}
                                        </button>
                                        {isOpen && (
                                            <div className="p-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white">
                                                {item.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-1.5">
                                <Phone className="w-5 h-5 text-[#13467b]" />
                                <div className="font-black text-sm text-slate-900">Patient Hotline</div>
                                <div className="text-xs text-slate-600">8652-1111 / +1 (800) 555-0199</div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-1.5">
                                <Mail className="w-5 h-5 text-[#13467b]" />
                                <div className="font-black text-sm text-slate-900">Email Inquiries</div>
                                <div className="text-xs text-slate-600">inquiry@healthcube.com.ph</div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-1.5">
                                <MapPin className="w-5 h-5 text-[#13467b]" />
                                <div className="font-black text-sm text-slate-900">Clinic Branches</div>
                                <div className="text-xs text-slate-600">241 Shaw Blvd & 5F GH Mall Greenhills</div>
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
            )}

            {/* =====================================================================
                HOME PAGE (/): EXECUTIVE SUMMARY OF ALL OTHER PAGES
               ===================================================================== */}
            {activePage === 'home' && (
                <>
                    {/* 1. HERO BANNER */}
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
                                comprehensive medical consultations, executive check-ups, and advanced diagnostics.
                            </p>
                        </div>

                        {/* Medical Check-Up Packages Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {CHECKUPS_DROPDOWN.map((pkg) => (
                                <div
                                    key={pkg.name}
                                    className="rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-50/70 to-white p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition"
                                >
                                    Schedule Now
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigateToPage('services')}
                                    className="px-7 py-3 rounded-lg bg-[#13467b] hover:bg-[#0e355e] border border-blue-400/40 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wide shadow-lg transition cursor-pointer"
                                >
                                    Explore All Services
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                    {/* 2. SUMMARY OF SERVICES & MEDICAL CHECK-UPS */}
                    <section className="py-12 bg-white border-b border-slate-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
                            {/* Summary Row A: Medical Check-Ups Preview */}
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-end justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-extrabold uppercase tracking-widest text-[#13467b]">
                                            PREVENTIVE PACKAGES SUMMARY
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                                            Featured Medical Check-Ups
                                        </h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigateToPage('checkups')}
                                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#13467b] hover:text-teal-700 cursor-pointer"
                                    >
                                        <span>View All Check-Up Packages & Inclusions</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {CHECKUPS_DROPDOWN.map((pkg) => (
                                        <div
                                            key={pkg.name}
                                            className="rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-50/70 to-white p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition"
                                        >
                                            <div className="space-y-2">
                                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#13467b] text-white text-[11px] font-bold">
                                                    {pkg.price}
                                                </span>
                                                <h3 className="text-base font-extrabold text-[#13467b]">{pkg.name}</h3>
                                                <p className="text-xs text-slate-600 line-clamp-2">{pkg.desc}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => navigateToPage('checkups', { item: pkg.name })}
                                                className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#13467b] hover:text-teal-700 cursor-pointer"
                                            >
                                                <span>View Package Details</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenLoginModal}
                                className="text-xs font-bold text-[#13467b] underline cursor-pointer"
                            >
                                Are you a Physician or Staff? Sign In to Portal →
                            </button>
                        </div>

                            {/* Summary Row B: Clinical Services Preview (Top 4 shown on Home Summary) */}
                            <div className="space-y-5 pt-4 border-t border-slate-100">
                                <div className="flex flex-wrap items-end justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-extrabold uppercase tracking-widest text-teal-700">
                                            DIAGNOSTIC & CLINICAL SERVICES SUMMARY
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                                            Core Clinical Departments
                                        </h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigateToPage('services')}
                                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#13467b] hover:text-teal-700 cursor-pointer"
                                    >
                                        <span>Explore All 8 Clinical Services</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {SERVICES_DROPDOWN.slice(0, 4).map((srv) => (
                                        <div
                                            key={srv.name}
                                            className="p-5 rounded-xl border border-slate-200 hover:border-[#13467b] transition bg-white space-y-2 flex flex-col justify-between"
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-extrabold text-sm text-slate-900">{srv.name}</h4>
                                                    <Microscope className="w-4 h-4 text-[#13467b]" />
                                                </div>
                                                <p className="text-xs text-slate-600">{srv.desc}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => navigateToPage('services', { item: srv.name })}
                                                className="text-xs font-bold text-teal-700 hover:underline cursor-pointer pt-2 inline-flex items-center gap-1"
                                            >
                                                <span>Learn More</span>
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    {/* 3. SUMMARY OF FIND A DOCTOR (Featured 3 Doctors + Link to Full Directory Page) */}
                    <section className="py-12 bg-slate-50 border-b border-slate-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <div className="text-xs font-extrabold uppercase tracking-widest text-teal-700">
                                        MEDICAL SPECIALISTS SUMMARY
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                                        Meet Our Lead Specialists
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigateToPage('doctors')}
                                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#13467b] hover:text-teal-700 cursor-pointer"
                                >
                                    <span>View All {availableDoctors.length} Doctors & Live Availability</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {availableDoctors.slice(0, 3).map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-extrabold text-base text-slate-900">
                                                        {doc.name}
                                                    </h3>
                                                    <p className="text-xs font-bold text-[#13467b]">{doc.specialty}</p>
                                                </div>
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                                                    {doc.room_number}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2">{doc.bio}</p>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="text-slate-500 font-medium">
                                                {doc.shift_start} – {doc.shift_end}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => navigateToPage('doctors')}
                                                className="font-extrabold text-[#13467b] hover:text-teal-700 cursor-pointer"
                                            >
                                                View Profile →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 4. SUMMARY OF ABOUT US, PATIENT RESOURCES & FAQS */}
                    <section className="py-12 bg-white border-b border-slate-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Card 1: About Us Summary */}
                            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50 flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#13467b]">
                                        ABOUT US
                                    </span>
                                    <h3 className="text-xl font-black text-slate-900">
                                        Precision. Innovation. Trusted Results.
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Discover our mission, vision, DOH-accredited diagnostic facilities, and our
                                        Mandaluyong (Shaw Blvd) and San Juan (Greenhills) clinic branches.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigateToPage('about')}
                                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#13467b] hover:text-teal-700 cursor-pointer"
                                >
                                    <span>Read Full About Us Page</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Card 2: Patient Resources Summary */}
                            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50 flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">
                                        PATIENT RESOURCES
                                    </span>
                                    <h3 className="text-xl font-black text-slate-900">
                                        HMO Partners & Discount Cards
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Accredited with Maxicare, Medicard, Intellicare, PhilCare, Cocolife, Avega,
                                        ValuCare, Senior/PWD privileges, and HealthCube Prestige Cards.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigateToPage('resources')}
                                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#13467b] hover:text-teal-700 cursor-pointer"
                                >
                                    <span>View HMO & Discount Guide</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Card 3: FAQs & Contact Summary */}
                            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50 flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#13467b]">
                                        FAQS & SUPPORT
                                    </span>
                                    <h3 className="text-xl font-black text-slate-900">
                                        Patient Help & Branch Parking Info
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Have questions about fasting preparation, parking at Shaw Blvd or Greenhills, or
                                        online appointment scheduling? View our full FAQ directory.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigateToPage('faqs')}
                                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#13467b] hover:text-teal-700 cursor-pointer"
                                >
                                    <span>Open FAQs & Contact Page</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* 8. FULL BLACK FOOTER WITH LOCATIONS, CONTACT & LEGAL POLICIES */}
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
                </section>
            </>
        )
    }

                    {/* Column 2: Find Us Here */}
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
                                    onClick={() => navigateToPage('services')}
                                    className="hover:text-white cursor-pointer"
                                >
                                    Our Services
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => navigateToPage('checkups')}
                                    className="hover:text-white cursor-pointer"
                                >
                                    Medical Check-Ups
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => navigateToPage('doctors')}
                                    className="hover:text-white cursor-pointer"
                                >
                                    Find A Doctor
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => navigateToPage('about')}
                                    className="hover:text-white cursor-pointer"
                                >
                                    About Us
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
                </div>
            </div>

                    {/* Column 4: Legal Policies */}
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
        </div >
    );
}
