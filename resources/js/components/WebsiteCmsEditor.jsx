import React, { useState, useEffect } from 'react';
import CarePointLogo from './CarePointLogo';
import { getRbacHeaders, invalidateClientCache } from '../utils/apiCache';
import {
    buildResolvedConfig,
    broadcastWebsiteSettings,
    DEFAULT_WEBSITE_SETTINGS,
    DEFAULT_SERVICES,
    DEFAULT_CHECKUPS,
    DEFAULT_HMOS,
    DEFAULT_DISCOUNTS,
    DEFAULT_FAQS,
} from '../utils/websiteConfig';
import {
    Save,
    Upload,
    RotateCcw,
    Plus,
    Trash2,
    Globe,
    Stethoscope,
    PackageCheck,
    Building2,
    HelpCircle,
} from 'lucide-react';

export default function WebsiteCmsEditor({
    initialSettings = {},
    notify,
    onSaved,
    dark = false,
}) {
    const resolved = buildResolvedConfig(initialSettings);

    const [subTab, setSubTab] = useState('branding'); // branding, about, services, checkups, resources
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        clinic_name: resolved.clinic_name,
        brand_short_name: resolved.brand_short_name,
        brand_subtitle: resolved.brand_subtitle,
        logo_url: resolved.logo_url,
        header_location: resolved.header_location,
        header_accreditation: resolved.header_accreditation,
        contact_phone: resolved.contact_phone,
        contact_email: resolved.contact_email,
        contact_address: resolved.contact_address,
        operating_hours: resolved.operating_hours,
        facebook_url: resolved.facebook_url,
        ticker_news: resolved.ticker_news,
        hero_badge: resolved.hero_badge,
        hero_title: resolved.hero_title,
        hero_subtitle: resolved.hero_subtitle,
        about_title: resolved.about_title,
        about_story: resolved.about_story,
        about_mission: resolved.about_mission,
        about_vision: resolved.about_vision,
        about_standards: resolved.about_standards,
    });

    const [services, setServices] = useState(() => resolved.servicesList);
    const [checkups, setCheckups] = useState(() => resolved.checkupsList);
    const [hmos, setHmos] = useState(() => resolved.hmosList);
    const [discounts, setDiscounts] = useState(() => resolved.discountsList);
    const [faqs, setFaqs] = useState(() => resolved.faqsList);

    useEffect(() => {
        if (initialSettings && Object.keys(initialSettings).length > 0) {
            const next = buildResolvedConfig(initialSettings);
            setForm({
                clinic_name: next.clinic_name,
                brand_short_name: next.brand_short_name,
                brand_subtitle: next.brand_subtitle,
                logo_url: next.logo_url,
                header_location: next.header_location,
                header_accreditation: next.header_accreditation,
                contact_phone: next.contact_phone,
                contact_email: next.contact_email,
                contact_address: next.contact_address,
                operating_hours: next.operating_hours,
                facebook_url: next.facebook_url,
                ticker_news: next.ticker_news,
                hero_badge: next.hero_badge,
                hero_title: next.hero_title,
                hero_subtitle: next.hero_subtitle,
                about_title: next.about_title,
                about_story: next.about_story,
                about_mission: next.about_mission,
                about_vision: next.about_vision,
                about_standards: next.about_standards,
            });
            setServices(next.servicesList);
            setCheckups(next.checkupsList);
            setHmos(next.hmosList);
            setDiscounts(next.discountsList);
            setFaqs(next.faqsList);
        }
    }, [initialSettings]);

    const handleFieldChange = (key, val) => {
        setForm((prev) => ({ ...prev, [key]: val }));
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                // Resize to max 180x180 JPEG so Base64 stays lightweight (<15KB)
                const canvas = document.createElement('canvas');
                const maxDim = 180;
                let w = img.width;
                let h = img.height;
                if (w > h && w > maxDim) {
                    h = Math.round((h * maxDim) / w);
                    w = maxDim;
                } else if (h >= w && h > maxDim) {
                    w = Math.round((w * maxDim) / h);
                    h = maxDim;
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                handleFieldChange('logo_url', dataUrl);
                notify('Logo image loaded! Click "Save & Publish to Website" to apply across the site.', 'success');
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSaveAll = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                services_json: JSON.stringify(services),
                checkups_json: JSON.stringify(checkups),
                hmo_json: JSON.stringify(hmos),
                discounts_json: JSON.stringify(discounts),
                faqs_json: JSON.stringify(faqs),
            };

            const res = await fetch('/api/v1/admin/settings', {
                method: 'PUT',
                headers: getRbacHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Failed to save website settings.', 'error');
            } else {
                broadcastWebsiteSettings(json.settings || payload);
                invalidateClientCache();
                notify(json.message || 'Website content & branding updated!', 'success');
                if (onSaved) onSaved(json.settings || payload);
            }
        } catch (err) {
            notify('Network error saving website settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefaults = () => {
        setForm({ ...DEFAULT_WEBSITE_SETTINGS });
        setServices([...DEFAULT_SERVICES]);
        setCheckups([...DEFAULT_CHECKUPS]);
        setHmos([...DEFAULT_HMOS]);
        setDiscounts([...DEFAULT_DISCOUNTS]);
        setFaqs([...DEFAULT_FAQS]);
        notify('Restored default Labcure content in editor. Click Save & Publish to apply.', 'success');
    };

    const cardBg = dark
        ? 'bg-slate-900 border-slate-800 text-slate-100'
        : 'bg-white border-slate-200 text-slate-900';
    const subCardBg = dark
        ? 'bg-slate-950 border-slate-800 text-slate-100'
        : 'bg-slate-50 border-slate-200 text-slate-900';
    const inputClass = dark
        ? 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-teal-500 focus:outline-none'
        : 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-[#13467b] focus:outline-none';
    const labelClass = dark
        ? 'block text-xs font-bold text-slate-300 mb-1.5'
        : 'block text-xs font-bold text-slate-700 mb-1.5';

    return (
        <div className={`rounded-2xl border p-6 sm:p-8 space-y-6 ${cardBg}`}>
            {/* Top CMS Header & Save Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/20">
                <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-teal-500">
                        LIVE WEBSITE CONTENT MANAGEMENT SYSTEM (CMS)
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black mt-0.5">
                        Edit Website Branding, Logo, Services, Check-Ups & About Us
                    </h2>
                    <p className={`text-xs mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        All changes saved here update the public Client Website, Navigation Header, Footer, and Waiting Lounge TV Display in real time.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            dark
                                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Defaults</span>
                    </button>

                    <button
                        type="button"
                        disabled={saving}
                        onClick={handleSaveAll}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-extrabold shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving & Publishing...' : 'Save & Publish to Website'}</span>
                    </button>
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'branding', label: '1. Logo, Name & Contact Info', icon: Globe },
                    { id: 'about', label: '2. Home Hero & About Us Page', icon: Building2 },
                    { id: 'services', label: `3. Services Page (${services.length})`, icon: Stethoscope },
                    { id: 'checkups', label: `4. Medical Check-Ups (${checkups.length})`, icon: PackageCheck },
                    { id: 'resources', label: '5. HMOs, Discounts & FAQs', icon: HelpCircle },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const active = subTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSubTab(tab.id)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                                active
                                    ? 'bg-[#13467b] text-white shadow-sm'
                                    : dark
                                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: LOGO, BRAND NAME & CONTACT INFO */}
            {subTab === 'branding' && (
                <div className="space-y-6">
                    {/* Logo Upload & Preview Box */}
                    <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-6 ${subCardBg}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white ring-2 ring-teal-500/40 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                                <img
                                    src={form.logo_url || '/labcure-logo.jpg'}
                                    alt="Clinic Logo Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-teal-500">
                                    LIVE BRAND & LOGO PREVIEW
                                </div>
                                <div className="text-lg font-black">
                                    {form.brand_short_name || 'LABCURE'} — {form.brand_subtitle || 'Laboratory & Medical Services'}
                                </div>
                                <div className="text-xs text-slate-400">
                                    {form.clinic_name}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13467b] hover:bg-[#0e355e] text-white text-xs font-extrabold cursor-pointer shadow-xs">
                                <Upload className="w-4 h-4" />
                                <span>Upload Logo Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => handleFieldChange('logo_url', '/labcure-logo.jpg')}
                                className="px-3.5 py-2.5 rounded-xl border border-slate-400/40 text-xs font-bold cursor-pointer hover:bg-slate-500/10"
                            >
                                Use Default Labcure Logo
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className={labelClass}>Brand Short Title (Logo Main Text)</label>
                            <input
                                type="text"
                                value={form.brand_short_name}
                                onChange={(e) => handleFieldChange('brand_short_name', e.target.value)}
                                placeholder="e.g. LABCURE"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Brand Subtitle (Below Logo Title)</label>
                            <input
                                type="text"
                                value={form.brand_subtitle}
                                onChange={(e) => handleFieldChange('brand_subtitle', e.target.value)}
                                placeholder="e.g. Laboratory & Medical Services"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Full Clinic Legal Name</label>
                            <input
                                type="text"
                                value={form.clinic_name}
                                onChange={(e) => handleFieldChange('clinic_name', e.target.value)}
                                placeholder="e.g. Labcure Laboratory & Medical Services Inc."
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className={labelClass}>Logo Image URL (or Base64 from Upload)</label>
                            <input
                                type="text"
                                value={form.logo_url}
                                onChange={(e) => handleFieldChange('logo_url', e.target.value)}
                                placeholder="/labcure-logo.jpg or https://..."
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Header City / Branch Label</label>
                            <input
                                type="text"
                                value={form.header_location}
                                onChange={(e) => handleFieldChange('header_location', e.target.value)}
                                placeholder="e.g. Calapan City, OrMin"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Header Accreditation Badge</label>
                            <input
                                type="text"
                                value={form.header_accreditation}
                                onChange={(e) => handleFieldChange('header_accreditation', e.target.value)}
                                placeholder="e.g. PhilHealth Konsulta Accredited"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className={labelClass}>Contact Phone / Mobile Numbers</label>
                            <input
                                type="text"
                                value={form.contact_phone}
                                onChange={(e) => handleFieldChange('contact_phone', e.target.value)}
                                placeholder="0939-930-6575 / 0956-495-6174"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Official Email Address</label>
                            <input
                                type="email"
                                value={form.contact_email}
                                onChange={(e) => handleFieldChange('contact_email', e.target.value)}
                                placeholder="labcurelaboratoryincorporated@gmail.com"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Official Facebook Page URL</label>
                            <input
                                type="url"
                                value={form.facebook_url}
                                onChange={(e) => handleFieldChange('facebook_url', e.target.value)}
                                placeholder="https://www.facebook.com/LabcureLab"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Clinic Physical Street Address</label>
                            <input
                                type="text"
                                value={form.contact_address}
                                onChange={(e) => handleFieldChange('contact_address', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Clinic Operating Hours</label>
                            <input
                                type="text"
                                value={form.operating_hours}
                                onChange={(e) => handleFieldChange('operating_hours', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Waiting Lounge TV Display Ticker Announcement</label>
                        <textarea
                            rows={2}
                            value={form.ticker_news}
                            onChange={(e) => handleFieldChange('ticker_news', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>
            )}

            {/* TAB 2: HOME HERO & ABOUT US PAGE */}
            {subTab === 'about' && (
                <div className="space-y-6">
                    <div className={`p-5 rounded-2xl border space-y-4 ${subCardBg}`}>
                        <h3 className="text-sm font-black uppercase tracking-wider text-teal-500">
                            Home Page Hero Banner
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Hero Top Badge Text</label>
                                <input
                                    type="text"
                                    value={form.hero_badge}
                                    onChange={(e) => handleFieldChange('hero_badge', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Hero Main Headline</label>
                                <input
                                    type="text"
                                    value={form.hero_title}
                                    onChange={(e) => handleFieldChange('hero_title', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Hero Subtitle / Description</label>
                            <textarea
                                rows={2}
                                value={form.hero_subtitle}
                                onChange={(e) => handleFieldChange('hero_subtitle', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className={`p-5 rounded-2xl border space-y-4 ${subCardBg}`}>
                        <h3 className="text-sm font-black uppercase tracking-wider text-teal-500">
                            About Us Page Content
                        </h3>
                        <div>
                            <label className={labelClass}>About Us Page Headline</label>
                            <input
                                type="text"
                                value={form.about_title}
                                onChange={(e) => handleFieldChange('about_title', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>About Us Overview / Clinic Story</label>
                            <textarea
                                rows={3}
                                value={form.about_story}
                                onChange={(e) => handleFieldChange('about_story', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Our Mission</label>
                                <textarea
                                    rows={4}
                                    value={form.about_mission}
                                    onChange={(e) => handleFieldChange('about_mission', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Our Vision</label>
                                <textarea
                                    rows={4}
                                    value={form.about_vision}
                                    onChange={(e) => handleFieldChange('about_vision', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>PhilHealth Konsulta & DOH Standards</label>
                                <textarea
                                    rows={4}
                                    value={form.about_standards}
                                    onChange={(e) => handleFieldChange('about_standards', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: SERVICES PAGE EDITOR */}
            {subTab === 'services' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-400">
                            Add, edit, or remove services displayed in the Navigation Dropdown, Home Summary, and Services Page.
                        </p>
                        <button
                            type="button"
                            onClick={() =>
                                setServices((prev) => [
                                    ...prev,
                                    {
                                        name: 'New Clinical Service',
                                        turnaround: 'Same-Day Official Result',
                                        desc: 'Describe this diagnostic or clinical service.',
                                        prep: 'Bring valid ID and physician referral if applicable.',
                                        inclusions: ['Procedure 1', 'Procedure 2'],
                                    },
                                ])
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#13467b] text-white text-xs font-extrabold cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Service</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {services.map((srv, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border space-y-3 ${subCardBg}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-black uppercase text-teal-500">
                                        Service #{idx + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setServices((prev) => prev.filter((_, i) => i !== idx))}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Remove</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Service Name</label>
                                        <input
                                            type="text"
                                            value={srv.name}
                                            onChange={(e) => {
                                                const next = [...services];
                                                next[idx] = { ...srv, name: e.target.value };
                                                setServices(next);
                                            }}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Turnaround Badge</label>
                                        <input
                                            type="text"
                                            value={srv.turnaround}
                                            onChange={(e) => {
                                                const next = [...services];
                                                next[idx] = { ...srv, turnaround: e.target.value };
                                                setServices(next);
                                            }}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Description</label>
                                    <textarea
                                        rows={2}
                                        value={srv.desc}
                                        onChange={(e) => {
                                            const next = [...services];
                                            next[idx] = { ...srv, desc: e.target.value };
                                            setServices(next);
                                        }}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Patient Preparation</label>
                                    <input
                                        type="text"
                                        value={srv.prep}
                                        onChange={(e) => {
                                            const next = [...services];
                                            next[idx] = { ...srv, prep: e.target.value };
                                            setServices(next);
                                        }}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Inclusions / Procedures (One per line)</label>
                                    <textarea
                                        rows={3}
                                        value={(srv.inclusions || []).join('\n')}
                                        onChange={(e) => {
                                            const next = [...services];
                                            next[idx] = {
                                                ...srv,
                                                inclusions: e.target.value
                                                    .split('\n')
                                                    .map((s) => s.trim())
                                                    .filter(Boolean),
                                            };
                                            setServices(next);
                                        }}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 4: MEDICAL CHECK-UPS EDITOR */}
            {subTab === 'checkups' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-400">
                            Edit Medical Check-Up packages, pricing, badges, and inclusions.
                        </p>
                        <button
                            type="button"
                            onClick={() =>
                                setCheckups((prev) => [
                                    ...prev,
                                    {
                                        name: 'New Check-Up Package',
                                        price: '₱1,500',
                                        badge: 'Wellness Bundle',
                                        desc: 'Comprehensive preventive check-up package.',
                                        prep: '8–10 hours fasting recommended.',
                                        inclusions: ['Complete Blood Count (CBC)', 'Routine Urinalysis', 'Physical Examination'],
                                    },
                                ])
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#13467b] text-white text-xs font-extrabold cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Check-Up Package</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {checkups.map((pkg, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border space-y-3 ${subCardBg}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-black uppercase text-teal-500">
                                        Package #{idx + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setCheckups((prev) => prev.filter((_, i) => i !== idx))}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Remove</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className={labelClass}>Package Name</label>
                                        <input
                                            type="text"
                                            value={pkg.name}
                                            onChange={(e) => {
                                                const next = [...checkups];
                                                next[idx] = { ...pkg, name: e.target.value };
                                                setCheckups(next);
                                            }}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Price</label>
                                        <input
                                            type="text"
                                            value={pkg.price}
                                            onChange={(e) => {
                                                const next = [...checkups];
                                                next[idx] = { ...pkg, price: e.target.value };
                                                setCheckups(next);
                                            }}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Highlight Badge</label>
                                        <input
                                            type="text"
                                            value={pkg.badge}
                                            onChange={(e) => {
                                                const next = [...checkups];
                                                next[idx] = { ...pkg, badge: e.target.value };
                                                setCheckups(next);
                                            }}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Package Description</label>
                                    <textarea
                                        rows={2}
                                        value={pkg.desc}
                                        onChange={(e) => {
                                            const next = [...checkups];
                                            next[idx] = { ...pkg, desc: e.target.value };
                                            setCheckups(next);
                                        }}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Preparation Guidelines</label>
                                    <input
                                        type="text"
                                        value={pkg.prep}
                                        onChange={(e) => {
                                            const next = [...checkups];
                                            next[idx] = { ...pkg, prep: e.target.value };
                                            setCheckups(next);
                                        }}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Package Inclusions (One per line)</label>
                                    <textarea
                                        rows={3}
                                        value={(pkg.inclusions || []).join('\n')}
                                        onChange={(e) => {
                                            const next = [...checkups];
                                            next[idx] = {
                                                ...pkg,
                                                inclusions: e.target.value
                                                    .split('\n')
                                                    .map((s) => s.trim())
                                                    .filter(Boolean),
                                            };
                                            setCheckups(next);
                                        }}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 5: HMO PARTNERS, DISCOUNTS & FAQS */}
            {subTab === 'resources' && (
                <div className="space-y-8">
                    {/* HMO Partners */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-wider text-teal-500">
                                Accredited HMO & Healthcare Partners ({hmos.length})
                            </h3>
                            <button
                                type="button"
                                onClick={() =>
                                    setHmos((prev) => [
                                        ...prev,
                                        { name: 'New HMO Partner', type: 'Outpatient Lab & Consultations', loa: 'Reception Desk Verification' },
                                    ])
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#13467b] text-white text-xs font-bold cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add HMO</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {hmos.map((hmo, idx) => (
                                <div key={idx} className={`p-3.5 rounded-xl border space-y-2 ${subCardBg}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-teal-500">HMO #{idx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => setHmos((prev) => prev.filter((_, i) => i !== idx))}
                                            className="text-xs text-red-500 font-bold cursor-pointer"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={hmo.name}
                                        onChange={(e) => {
                                            const next = [...hmos];
                                            next[idx] = { ...hmo, name: e.target.value };
                                            setHmos(next);
                                        }}
                                        placeholder="HMO Partner Name"
                                        className={inputClass}
                                    />
                                    <input
                                        type="text"
                                        value={hmo.type}
                                        onChange={(e) => {
                                            const next = [...hmos];
                                            next[idx] = { ...hmo, type: e.target.value };
                                            setHmos(next);
                                        }}
                                        placeholder="Coverage Type"
                                        className={inputClass}
                                    />
                                    <input
                                        type="text"
                                        value={hmo.loa}
                                        onChange={(e) => {
                                            const next = [...hmos];
                                            next[idx] = { ...hmo, loa: e.target.value };
                                            setHmos(next);
                                        }}
                                        placeholder="LOA Verification Process"
                                        className={inputClass}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Discount Cards */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-wider text-teal-500">
                                Discount Cards & Privileges ({discounts.length})
                            </h3>
                            <button
                                type="button"
                                onClick={() =>
                                    setDiscounts((prev) => [
                                        ...prev,
                                        { title: 'New Privilege Card', discount: '10% Discount', desc: 'Details of privilege.' },
                                    ])
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#13467b] text-white text-xs font-bold cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Discount Card</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {discounts.map((card, idx) => (
                                <div key={idx} className={`p-3.5 rounded-xl border space-y-2 ${subCardBg}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-teal-500">Privilege #{idx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => setDiscounts((prev) => prev.filter((_, i) => i !== idx))}
                                            className="text-xs text-red-500 font-bold cursor-pointer"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={card.title}
                                        onChange={(e) => {
                                            const next = [...discounts];
                                            next[idx] = { ...card, title: e.target.value };
                                            setDiscounts(next);
                                        }}
                                        placeholder="Title"
                                        className={inputClass}
                                    />
                                    <input
                                        type="text"
                                        value={card.discount}
                                        onChange={(e) => {
                                            const next = [...discounts];
                                            next[idx] = { ...card, discount: e.target.value };
                                            setDiscounts(next);
                                        }}
                                        placeholder="Discount Badge"
                                        className={inputClass}
                                    />
                                    <textarea
                                        rows={2}
                                        value={card.desc}
                                        onChange={(e) => {
                                            const next = [...discounts];
                                            next[idx] = { ...card, desc: e.target.value };
                                            setDiscounts(next);
                                        }}
                                        placeholder="Description"
                                        className={inputClass}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAQs */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-wider text-teal-500">
                                Frequently Asked Questions ({faqs.length})
                            </h3>
                            <button
                                type="button"
                                onClick={() =>
                                    setFaqs((prev) => [
                                        ...prev,
                                        { q: 'New Question?', a: 'Answer details here.' },
                                    ])
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#13467b] text-white text-xs font-bold cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add FAQ</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {faqs.map((faq, idx) => (
                                <div key={idx} className={`p-3.5 rounded-xl border space-y-2 ${subCardBg}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-teal-500">FAQ #{idx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => setFaqs((prev) => prev.filter((_, i) => i !== idx))}
                                            className="text-xs text-red-500 font-bold cursor-pointer"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={faq.q}
                                        onChange={(e) => {
                                            const next = [...faqs];
                                            next[idx] = { ...faq, q: e.target.value };
                                            setFaqs(next);
                                        }}
                                        placeholder="Question"
                                        className={inputClass}
                                    />
                                    <textarea
                                        rows={2}
                                        value={faq.a}
                                        onChange={(e) => {
                                            const next = [...faqs];
                                            next[idx] = { ...faq, a: e.target.value };
                                            setFaqs(next);
                                        }}
                                        placeholder="Answer"
                                        className={inputClass}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

