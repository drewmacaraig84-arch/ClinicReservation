import { useState, useEffect } from 'react';

const STORAGE_KEY = 'labcure_cms_settings_v1';
const EVENT_NAME = 'labcure-cms-updated';

export const DEFAULT_SERVICES = [
    {
        name: 'Clinical Laboratory',
        desc: 'Complete blood chemistry, hematology, clinical microscopy, electrolytes & serology.',
        turnaround: 'Same-Day Official Lab Results (2–6 Hours)',
        prep: '8–12 hours fasting required for FBS and Lipid Profile (water is permitted).',
        inclusions: [
            'Complete Blood Count (CBC) with Platelet',
            'Blood Chemistry (FBS, HbA1c, Lipid Profile, Creatinine, Uric Acid, SGPT/SGOT)',
            'Routine Urinalysis & Fecalysis with Occult Blood',
            'Serology, Thyroid Panel, HBsAg & Dengue NS1/IgG/IgM',
        ],
    },
    {
        name: 'Imaging & Ultrasound',
        desc: 'Digital X-Ray and diagnostic ultrasound with official radiologist interpretation.',
        turnaround: 'Same-Day / 24-Hour Radiologist Reading',
        prep: 'Full bladder for pelvic ultrasound; 6–8 hours fasting for whole abdomen ultrasound.',
        inclusions: [
            'Digital Chest X-Ray (PA / APL Views)',
            'Skeletal & Extremity Digital X-Ray',
            'Whole Abdomen, KUB, Hepatobiliary & Thyroid Ultrasound',
            'OB-GYN & Pelvic Diagnostic Ultrasound',
        ],
    },
    {
        name: 'Cardiopulmonary & ECG',
        desc: '12-Lead resting Electrocardiogram (ECG) and cardiovascular screening.',
        turnaround: 'Immediate Tracing • Specialist Verified',
        prep: 'Rest for 10 minutes before tracing; avoid caffeine or smoking prior to ECG.',
        inclusions: [
            '12-Lead Resting Electrocardiogram (ECG)',
            'Pre-Operative & Pre-Employment Cardiac Clearance',
            'Hypertension & Cardiovascular Risk Profiling',
            'Internal Medicine & Cardiology Referral Evaluation',
        ],
    },
    {
        name: 'PhilHealth Konsulta',
        desc: 'Accredited PhilHealth Konsulta & YAKAP primary care consultations and diagnostics.',
        turnaround: 'Accredited Primary Care Benefit Provider',
        prep: 'Bring your PhilHealth ID / Member Data Record (MDR) and valid government ID.',
        inclusions: [
            'Free Primary Care Consultation for Registered Beneficiaries',
            'Targeted Diagnostic Laboratory Tests under Konsulta Package',
            'Preventive Health Risk Screening & Vital Signs',
            'Essential Primary Care Medications & Follow-Up Care',
        ],
    },
    {
        name: 'Vaccinations',
        desc: 'Flu, Pneumococcal, Hepatitis B, Tetanus & corporate immunization programs.',
        turnaround: '15-Minute Physician Screening & Administration',
        prep: 'Bring your previous immunization record or company endorsement if applicable.',
        inclusions: [
            'Quadrivalent Influenza (Flu) Vaccine',
            'Pneumococcal Vaccine (PCV13 / PPSV23)',
            'Hepatitis B & Tetanus Toxoid Immunization',
            'On-Site Corporate & Institutional Vaccination Drives',
        ],
    },
    {
        name: 'Outpatient Consultations',
        desc: 'Multispecialty consultations including Internal Medicine, Medical Oncology & General Medicine.',
        turnaround: 'Scheduled & Walk-In Clinic Consultations',
        prep: 'Bring previous laboratory results and current medication list for physician review.',
        inclusions: [
            'Internal Medicine & Adult Primary Care',
            'Visiting Specialist Consultations (Medical Oncology, Pulmonology, Cardiology)',
            'Medical Clearance & Fit-to-Work Certification',
            'Chronic Disease Management (Diabetes, Hypertension, Thyroid)',
        ],
    },
    {
        name: 'Drug Testing & Clearance',
        desc: 'DOH-accredited screening for pre-employment, LTO, school, and corporate compliance.',
        turnaround: 'Fast-Track Official Biometric Result',
        prep: 'Bring a valid government-issued photo ID for biometric verification.',
        inclusions: [
            'Standard Pre-Employment Drug Screening',
            'Corporate Random & Annual Drug Testing',
            'Student & Institutional Compliance Screening',
            'Bundled Medical & Physical Clearance Certificate',
        ],
    },
    {
        name: 'Home & Mobile Lab',
        desc: 'Scheduled home blood extraction and mobile on-site corporate laboratory services in Calapan.',
        turnaround: 'Scheduled Morning Home Extraction (Calapan City)',
        prep: 'Book at least 24 hours in advance via 0939-930-6575 or Facebook Messenger.',
        inclusions: [
            'Home Service Blood Extraction for Seniors & Bedridden Patients',
            'Portable Home 12-Lead ECG Recording',
            'On-Site Corporate Annual Physical Exam (APE) Mobile Team',
            'Digital & Printed Official Result Delivery',
        ],
    },
];

export const DEFAULT_CHECKUPS = [
    {
        name: 'Executive Check-Up',
        price: '₱4,800',
        badge: 'Most Comprehensive',
        desc: 'Complete blood chemistry panel, CBC, Urinalysis, Fecalysis, 12-Lead ECG, Chest X-Ray, Ultrasound & Physician Evaluation.',
        prep: '10–12 hours fasting (plain water is allowed). Morning schedule at Brgy. Lumangbayan is recommended.',
        inclusions: [
            'Comprehensive Blood Chemistry (FBS, HbA1c, Lipid Profile, Creatinine, BUN, Uric Acid, SGPT/SGOT, Electrolytes)',
            'Complete Blood Count (CBC), Routine Urinalysis & Fecalysis',
            '12-Lead Resting ECG & Digital Chest X-Ray (PA View)',
            'Whole Abdomen Ultrasound',
            'Physical Examination & Comprehensive Result Interpretation by Clinic Physician',
        ],
    },
    {
        name: 'Annual Physical Exam',
        price: '₱1,650',
        badge: 'Corporate & Individual APE',
        desc: 'CBC, Urinalysis, Fecalysis, Chest X-Ray, Visual Acuity, Physical Exam & Official Medical Clearance.',
        prep: 'No fasting required unless adding Fasting Blood Sugar (FBS) or Lipid Profile.',
        inclusions: [
            'Complete History & Physical Examination by Clinic Physician',
            'Complete Blood Count (CBC) with Platelet Count',
            'Routine Urinalysis & Fecalysis',
            'Digital Chest X-Ray (PA View)',
            'Vital Signs, BMI & Official Medical Fitness Certificate',
        ],
    },
    {
        name: 'Pre-Employment Medical Exam',
        price: '₱1,250',
        badge: 'Fast Fit-to-Work',
        desc: 'Fast-track onboarding medical exam for local companies, government agencies, and institutions in Oriental Mindoro.',
        prep: 'Bring valid government ID and company referral slip if applicable.',
        inclusions: [
            'Physical Examination & Medical History Review',
            'Complete Blood Count (CBC), Urinalysis & Fecalysis',
            'Digital Chest X-Ray',
            'Optional Drug Testing & Hepatitis B (HBsAg) Screening Add-On',
            'Official Fit-to-Work Medical Clearance Certificate',
        ],
    },
    {
        name: 'Pre-Enrollment Exam',
        price: '₱950',
        badge: 'Student Package',
        desc: 'Student health screening, lab workup, and physical examination for schools, colleges & universities in Calapan City.',
        prep: 'Bring your school medical form for official physician signature.',
        inclusions: [
            'Complete Student Physical Examination & Vital Signs',
            'Complete Blood Count (CBC), Urinalysis & Fecalysis',
            'Digital Chest X-Ray & Visual Acuity Check',
            'Official School Medical Clearance Endorsement',
        ],
    },
];

export const DEFAULT_HMOS = [
    { name: 'PhilHealth Konsulta / YAKAP', type: 'Accredited Primary Care & Diagnostic Provider', loa: 'PhilHealth ID / MDR Verification at Reception' },
    { name: 'EastWest Healthcare', type: 'Outpatient Consultations & Clinical Laboratory', loa: 'Direct Clinic LOA Verification' },
    { name: 'Maxicare Healthcare', type: 'Outpatient Lab, X-Ray, Ultrasound & Consultations', loa: 'LOA & Corporate Health Endorsement' },
    { name: 'Medicard Philippines', type: 'Consultations, Annual Physical Exams & Diagnostics', loa: 'Digital LOA & Reception Desk Processing' },
    { name: 'Intellicare (Asalus)', type: 'Specialist Consultations & Diagnostic Procedures', loa: 'LOA Presentation at Reception Desk 1' },
    { name: 'PhilCare', type: 'Preventive Care, Blood Chemistry & Imaging', loa: 'Digital LOA & Clinic Coordinator Approval' },
    { name: 'Cocolife Healthcare', type: 'Corporate & Individual Medical Plans', loa: 'Direct HMO Coordinator Verification' },
    { name: 'Government & Corporate Partners', type: 'NIA, Judiciary & Institutional Wellness Accounts', loa: 'Agency Referral Slip / Official Endorsement' },
];

export const DEFAULT_DISCOUNTS = [
    {
        title: 'PhilHealth Konsulta / YAKAP Benefit',
        discount: 'Covered Primary Care & Lab Package',
        desc: 'Labcure Laboratory and Medical Services Inc. is an accredited PhilHealth Konsulta provider in Calapan City offering covered primary care consultations and targeted diagnostics.',
    },
    {
        title: 'Senior Citizen Privilege (RA 9994)',
        discount: '20% Discount + 12% VAT Exemption',
        desc: 'Honored across all consultations, clinical laboratory tests, X-ray, ultrasound, and ECG upon presentation of a valid Senior Citizen / OSCA ID.',
    },
    {
        title: 'Persons with Disability (PWD - RA 10754)',
        discount: '20% Discount + 12% VAT Exemption',
        desc: 'Dedicated priority queue lane access and statutory discounts on all laboratory and medical services.',
    },
    {
        title: 'Corporate & Institutional Partner Rates',
        discount: 'Preferred Group & Agency Packages',
        desc: 'Custom discounted rates for annual physical exams, pre-employment testing, and flu/pneumococcal vaccination programs for partner offices and schools in Oriental Mindoro.',
    },
];

export const DEFAULT_FAQS = [
    {
        q: 'Where is Labcure Laboratory and Medical Services Inc. located?',
        a: 'We are located at the A2RD Commercial Building, Dama de Noche Street, Barangay Lumangbayan, Calapan City, 5200 Oriental Mindoro (accessible along the Lumangbayan medical corridor).',
    },
    {
        q: 'What are your clinic and laboratory operating hours?',
        a: 'Our clinical laboratory and diagnostic facility is open Monday to Saturday starting at 7:00 AM. Visiting specialist physicians hold scheduled morning and afternoon clinic blocks—you can book online or call 0939-930-6575 / 0956-495-6174 to confirm your doctor’s exact hours.',
    },
    {
        q: 'Are you an accredited PhilHealth Konsulta / YAKAP provider?',
        a: 'Yes! Labcure Laboratory and Medical Services Inc. is an officially accredited PhilHealth Konsulta provider in Calapan City, Oriental Mindoro. Bring your PhilHealth ID or Member Data Record (MDR) to avail of your primary care and diagnostic benefits.',
    },
    {
        q: 'How do I prepare for a Fasting Blood Sugar (FBS) or Lipid Profile test?',
        a: 'Please fast for 8 to 12 hours prior to your morning blood extraction (plain water is allowed). Avoid alcoholic beverages and heavy meals at least 24 hours before your test.',
    },
    {
        q: 'How can I reach Labcure Lab for results, home service, or corporate packages?',
        a: 'You can call or text us at 0939-930-6575 or 0956-495-6174, email labcurelaboratoryincorporated@gmail.com, or message our official Facebook page at facebook.com/LabcureLab (Labcure Lab Calapan OrMin).',
    },
];

export const DEFAULT_WEBSITE_SETTINGS = {
    clinic_name: 'Labcure Laboratory & Medical Services Inc.',
    brand_short_name: 'LABCURE',
    brand_subtitle: 'Laboratory & Medical Services',
    logo_url: '/labcure-logo.jpg',
    header_location: 'Calapan City, OrMin',
    header_accreditation: 'PhilHealth Konsulta Accredited',
    contact_phone: '0939-930-6575 / 0956-495-6174',
    contact_email: 'labcurelaboratoryincorporated@gmail.com',
    contact_address: 'A2RD Commercial Building, Dama de Noche Street, Brgy. Lumangbayan, Calapan City, 5200 Oriental Mindoro',
    operating_hours: 'Monday – Saturday: 7:00 AM – 4:00 PM',
    facebook_url: 'https://www.facebook.com/LabcureLab',
    ticker_news: 'Flu vaccines & PhilHealth Konsulta check-ups are available daily. • Online appointments enjoy priority lane check-in at Desk 1.',
    hero_badge: 'Labcure Laboratory & Medical Services Inc. • Calapan City, Oriental Mindoro',
    hero_title: 'Your Health & Diagnostic Needs, All in One Place',
    hero_subtitle: 'Trusted outpatient clinical laboratory, digital X-ray, ultrasound, 12-lead ECG, PhilHealth Konsulta primary care, and specialist consultations at Dama de Noche St., Brgy. Lumangbayan, Calapan City.',
    about_title: 'Trusted Clinical Laboratory & Multispecialty Care in Calapan City',
    about_story: 'Located at A2RD Commercial Building, Dama de Noche Street, Brgy. Lumangbayan, Calapan City, Oriental Mindoro, Labcure Laboratory and Medical Services Inc. provides accurate outpatient diagnostic testing, PhilHealth Konsulta primary care, and specialist medical consultations for individuals, families, and partner institutions.',
    about_mission: 'To deliver accessible, accurate, and compassionate diagnostic laboratory and primary care services to the people of Calapan City and Oriental Mindoro.',
    about_vision: 'To be Oriental Mindoro’s premier outpatient diagnostic laboratory and multispecialty medical clinic known for clinical integrity, fast turnaround times, and patient-centered care.',
    about_standards: 'Accredited under PhilHealth Konsulta / YAKAP and compliant with Department of Health (DOH) clinical laboratory standards and RA 10173 Data Privacy safeguards.',
};

function parseJsonSafe(raw, fallback) {
    if (!raw) return fallback;
    if (Array.isArray(raw)) return raw;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
    } catch (e) {
        return fallback;
    }
}

export function getStoredWebsiteSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) || {};
    } catch (e) {
        return {};
    }
}

export function broadcastWebsiteSettings(rawSettingsMap = {}) {
    try {
        const merged = {
            ...getStoredWebsiteSettings(),
            ...(rawSettingsMap || {}),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }));
        }
    } catch (e) {
        // Ignore storage quota errors
    }
}

export function buildResolvedConfig(rawSettings = {}) {
    const merged = {
        ...DEFAULT_WEBSITE_SETTINGS,
        ...getStoredWebsiteSettings(),
        ...(rawSettings || {}),
    };

    // Ensure non-empty strings fall back to defaults
    Object.keys(DEFAULT_WEBSITE_SETTINGS).forEach((k) => {
        if (!merged[k] || String(merged[k]).trim() === '') {
            merged[k] = DEFAULT_WEBSITE_SETTINGS[k];
        }
    });

    return {
        ...merged,
        servicesList: parseJsonSafe(merged.services_json, DEFAULT_SERVICES),
        checkupsList: parseJsonSafe(merged.checkups_json, DEFAULT_CHECKUPS),
        hmosList: parseJsonSafe(merged.hmo_json, DEFAULT_HMOS),
        discountsList: parseJsonSafe(merged.discounts_json, DEFAULT_DISCOUNTS),
        faqsList: parseJsonSafe(merged.faqs_json, DEFAULT_FAQS),
    };
}

export function useWebsiteConfig(serverSettings = null) {
    const [config, setConfig] = useState(() => buildResolvedConfig(serverSettings || {}));

    useEffect(() => {
        if (serverSettings && Object.keys(serverSettings).length > 0) {
            broadcastWebsiteSettings(serverSettings);
            setConfig(buildResolvedConfig(serverSettings));
        }
    }, [serverSettings]);

    useEffect(() => {
        const handler = (ev) => {
            setConfig(buildResolvedConfig(ev?.detail || {}));
        };
        window.addEventListener(EVENT_NAME, handler);
        return () => window.removeEventListener(EVENT_NAME, handler);
    }, []);

    return config;
}

