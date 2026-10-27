import React, { useState, useEffect } from 'react';
import { DashboardPortalSkeleton } from '../components/SkeletonLoaders';
import { cachedFetchJson, invalidateClientCache } from '../utils/apiCache';
import {
    Stethoscope,
    Users,
    Clock,
    UserCog,
    CheckCircle2,
    Play,
    PhoneCall,
    FileText,
    Calendar,
    Save,
    Pill,
} from 'lucide-react';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DoctorPortal({ notify }) {
    const [data, setData] = useState(null);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [activeTab, setActiveTab] = useState('patients'); // patients, schedule, profile
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Consultation Note Editor state
    const [activePatient, setActivePatient] = useState(null);
    const [doctorNotes, setDoctorNotes] = useState('');
    const [prescription, setPrescription] = useState('');

    // Schedule Editor state
    const [scheduleForm, setScheduleForm] = useState({
        availability_status: 'active',
        shift_start: '08:00 AM',
        shift_end: '05:00 PM',
        slot_duration_minutes: 30,
        working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        max_daily_patients: 25,
        room_number: 'ROOM 1',
    });

    // Profile Editor state
    const [profileForm, setProfileForm] = useState({
        name: '',
        department_id: '',
        specialty: '',
        license_number: '',
        email: '',
        phone: '',
        bio: '',
        consultation_fee: '750.00',
        room_number: 'ROOM 1',
    });

    const fetchDoctorPortal = async (docId = selectedDoctorId, forceNetwork = false) => {
        try {
            const url = docId ? `/api/v1/doctor/dashboard?doctor_id=${docId}` : '/api/v1/doctor/dashboard';
            await cachedFetchJson(
                url,
                (json) => {
                    setData(json);
                    setLoading(false);
                    if (json.doctor) {
                        setSelectedDoctorId(String(json.doctor.id));
                        setScheduleForm({
                            availability_status: json.doctor.availability_status || 'active',
                            shift_start: json.doctor.shift_start || '08:00 AM',
                            shift_end: json.doctor.shift_end || '05:00 PM',
                            slot_duration_minutes: json.doctor.slot_duration_minutes || 30,
                            working_days: Array.isArray(json.doctor.working_days)
                                ? json.doctor.working_days
                                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                            max_daily_patients: json.doctor.max_daily_patients || 25,
                            room_number: json.doctor.room_number || 'ROOM 1',
                        });
                        setProfileForm({
                            name: json.doctor.name || '',
                            department_id: String(json.doctor.department_id || ''),
                            specialty: json.doctor.specialty || '',
                            license_number: json.doctor.license_number || '',
                            email: json.doctor.email || '',
                            phone: json.doctor.phone || '',
                            bio: json.doctor.bio || '',
                            consultation_fee: String(json.doctor.consultation_fee || '750.00'),
                            room_number: json.doctor.room_number || 'ROOM 1',
                        });
                    }
                    if (json.appointments?.length > 0 && !activePatient) {
                        const first = json.appointments[0];
                        setActivePatient(first);
                        setDoctorNotes(first.doctor_notes || '');
                        setPrescription(first.prescription || '');
                    }
                },
                forceNetwork
            );
        } catch (err) {
            notify('Failed to load Doctor Portal.', 'error');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctorPortal('');
    }, []);

    const handleSwitchDoctor = (newId) => {
        setSelectedDoctorId(newId);
        setActivePatient(null);
        fetchDoctorPortal(newId, false);
    };

    const selectPatientForChart = (appt) => {
        setActivePatient(appt);
        setDoctorNotes(appt.doctor_notes || '');
        setPrescription(appt.prescription || '');
    };

    const handlePatientStatusUpdate = async (appointmentId, newStatus) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/doctor/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    doctor_notes: doctorNotes,
                    prescription: prescription,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Could not update consultation.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                setActivePatient(json.appointment);
                fetchDoctorPortal(selectedDoctorId, true);
            }
        } catch (err) {
            notify('Network error updating consultation.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/doctor/${selectedDoctorId}/schedule`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(scheduleForm),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Failed to update schedule.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                fetchDoctorPortal(selectedDoctorId, true);
            }
        } catch (err) {
            notify('Network error updating clinic schedule.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/doctor/${selectedDoctorId}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    ...profileForm,
                    department_id: Number(profileForm.department_id),
                    consultation_fee: Number(profileForm.consultation_fee),
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Failed to update profile.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                fetchDoctorPortal(selectedDoctorId, true);
            }
        } catch (err) {
            notify('Network error saving doctor details.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleWorkingDay = (day) => {
        const current = scheduleForm.working_days || [];
        if (current.includes(day)) {
            if (current.length === 1) return; // keep at least 1 day
            setScheduleForm({
                ...scheduleForm,
                working_days: current.filter((d) => d !== day),
            });
        } else {
            setScheduleForm({
                ...scheduleForm,
                working_days: [...current, day],
            });
        }
    };

    if (loading && !data) {
        return <DashboardPortalSkeleton />;
    }

    const doctor = data?.doctor;
    const appointments = data?.appointments || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="bg-slate-100 rounded-2xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[78vh]">
                {/* Left Sidebar */}
                <aside className="lg:col-span-3 xl:col-span-2 bg-slate-900 text-slate-200 p-4 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="border-b border-slate-800 pb-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-teal-400">
                                Physician Console
                            </div>
                            <div className="text-base font-extrabold text-white mt-1">
                                {doctor?.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                                {doctor?.room_number} • {doctor?.specialty}
                            </div>

                            {/* Switch Active Doctor Account */}
                            <div className="mt-3">
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                    Switch Doctor View
                                </label>
                                <select
                                    value={selectedDoctorId}
                                    onChange={(e) => handleSwitchDoctor(e.target.value)}
                                    className="w-full rounded-lg bg-slate-800 border border-slate-700 text-xs text-white px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
                                >
                                    {(data?.all_doctors || []).map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name} ({d.room_number})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <nav className="space-y-1.5">
                            <button
                                type="button"
                                onClick={() => setActiveTab('patients')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'patients'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                <span>My Patients & Queue</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('schedule')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'schedule'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                <Clock className="w-4 h-4" />
                                <span>Edit Clinic Hours</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'profile'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                <UserCog className="w-4 h-4" />
                                <span>Edit My Details</span>
                            </button>
                        </nav>
                    </div>

                    <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700 text-xs space-y-1.5">
                        <div className="text-[11px] font-bold text-teal-300 uppercase">Current Shift</div>
                        <div className="font-bold text-white">
                            {doctor?.shift_start} – {doctor?.shift_end}
                        </div>
                        <div className="text-slate-400">
                            License: {doctor?.license_number}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-9 xl:col-span-10 p-6 space-y-6">
                    {/* Top Doctor Header & KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                            <div className="text-xs font-semibold text-slate-500">Assigned Today</div>
                            <div className="text-3xl font-black text-slate-900 mt-1">
                                {data?.stats?.total_patients_today ?? 0}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                            <div className="text-xs font-semibold text-slate-500">Waiting for Me</div>
                            <div className="text-3xl font-black text-teal-700 mt-1">
                                {data?.stats?.waiting_for_me ?? 0}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                            <div className="text-xs font-semibold text-slate-500">In Consultation</div>
                            <div className="text-3xl font-black text-blue-600 mt-1">
                                {data?.stats?.currently_serving ?? 0}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                            <div className="text-xs font-semibold text-slate-500">Completed Today</div>
                            <div className="text-3xl font-black text-emerald-600 mt-1">
                                {data?.stats?.completed_today ?? 0}
                            </div>
                        </div>
                    </div>

                    {/* TAB 1: MY PATIENTS & CLINICAL CONSULTATION */}
                    {activeTab === 'patients' && (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                            {/* Left 6 Cols: Doctor's Assigned Patient List */}
                            <div className="xl:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900">
                                            My Assigned Patients ({appointments.length})
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Click any patient to review complaint, call to {doctor?.room_number}, or record clinical notes.
                                        </p>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                                    {appointments.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-slate-400">
                                            No patients currently assigned to {doctor?.name}.
                                        </div>
                                    ) : (
                                        appointments.map((appt) => {
                                            const isSelected = activePatient?.id === appt.id;
                                            return (
                                                <div
                                                    key={appt.id}
                                                    onClick={() => selectPatientForChart(appt)}
                                                    className={`p-4 flex items-center justify-between gap-3 cursor-pointer transition ${
                                                        isSelected
                                                            ? 'bg-teal-50/90 border-l-4 border-l-teal-600'
                                                            : 'hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-black text-xs">
                                                                {appt.ticket_number}
                                                            </span>
                                                            <span className="font-extrabold text-sm text-slate-900">
                                                                {appt.patient_name}
                                                            </span>
                                                            {appt.patient_age && (
                                                                <span className="text-xs text-slate-500">
                                                                    ({appt.patient_age} yrs)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-600">
                                                            {appt.reason_for_visit || 'General Consultation'}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">
                                                            Slot: {appt.appointment_time} • Phone: {appt.patient_phone}
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                                                            appt.status === 'serving'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : appt.status === 'called'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : appt.status === 'completed'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        {appt.status}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Right 6 Cols: Active Patient Clinical Chart & Consultation Controls */}
                            <div className="xl:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                {activePatient ? (
                                    <div className="space-y-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-teal-100 text-teal-800">
                                                        Ticket {activePatient.ticket_number}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        Ref: {activePatient.booking_reference}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 mt-1">
                                                    {activePatient.patient_name}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Age: {activePatient.patient_age || 'N/A'} • Phone: {activePatient.patient_phone} • Scheduled: {activePatient.appointment_time}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    disabled={saving}
                                                    onClick={() => handlePatientStatusUpdate(activePatient.id, 'called')}
                                                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer"
                                                >
                                                    Call Patient
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={saving}
                                                    onClick={() => handlePatientStatusUpdate(activePatient.id, 'serving')}
                                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                                                >
                                                    Start Consultation
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                                            <div className="text-[11px] font-bold uppercase text-slate-500">
                                                Chief Complaint / Reason for Visit
                                            </div>
                                            <div className="text-sm font-semibold text-slate-900 mt-0.5">
                                                {activePatient.reason_for_visit || 'General Consultation'}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    Doctor's Clinical Notes & Diagnosis
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={doctorNotes}
                                                    onChange={(e) => setDoctorNotes(e.target.value)}
                                                    placeholder="Enter vitals, physical exam findings, and clinical assessment..."
                                                    className="w-full rounded-lg border border-slate-300 p-3 text-xs focus:border-teal-600 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    Prescription / Treatment Plan (Rx)
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={prescription}
                                                    onChange={(e) => setPrescription(e.target.value)}
                                                    placeholder="Enter prescribed medications, dosage, and follow-up instructions..."
                                                    className="w-full rounded-lg border border-slate-300 p-3 text-xs focus:border-teal-600 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() => handlePatientStatusUpdate(activePatient.id, activePatient.status)}
                                                className="px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                                            >
                                                Save Chart Notes Only
                                            </button>
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() => handlePatientStatusUpdate(activePatient.id, 'completed')}
                                                className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                                            >
                                                Save & Complete Consultation
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-16 text-center text-sm text-slate-400">
                                        Select a patient from your queue on the left to begin consultation.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: EDIT DOCTOR'S TIME IN CLINIC & SCHEDULE */}
                    {activeTab === 'schedule' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl">
                            <div className="border-b border-slate-100 pb-4 mb-6">
                                <h3 className="text-lg font-extrabold text-slate-900">
                                    Edit My Clinic Schedule & Live Availability
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Changes immediately update the Patient Reservation Portal, Reception Desk, and Admin Dashboard.
                                </p>
                            </div>

                            <form onSubmit={handleSaveSchedule} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Live Availability Status
                                        </label>
                                        <select
                                            value={scheduleForm.availability_status}
                                            onChange={(e) =>
                                                setScheduleForm({ ...scheduleForm, availability_status: e.target.value })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-600 focus:outline-none"
                                        >
                                            <option value="active">🟢 Active / Available in Clinic</option>
                                            <option value="in_consultation">🔵 In Consultation</option>
                                            <option value="on_break">🟡 On Break / Rounds</option>
                                            <option value="offline">🔴 Offline / Off-Duty</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Assigned Clinic Room
                                        </label>
                                        <input
                                            type="text"
                                            value={scheduleForm.room_number}
                                            onChange={(e) =>
                                                setScheduleForm({ ...scheduleForm, room_number: e.target.value })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-600 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Clinic Shift Start Time
                                        </label>
                                        <input
                                            type="text"
                                            value={scheduleForm.shift_start}
                                            onChange={(e) =>
                                                setScheduleForm({ ...scheduleForm, shift_start: e.target.value })
                                            }
                                            placeholder="08:00 AM"
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Clinic Shift End Time
                                        </label>
                                        <input
                                            type="text"
                                            value={scheduleForm.shift_end}
                                            onChange={(e) =>
                                                setScheduleForm({ ...scheduleForm, shift_end: e.target.value })
                                            }
                                            placeholder="05:00 PM"
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Slot Duration (Minutes)
                                        </label>
                                        <select
                                            value={scheduleForm.slot_duration_minutes}
                                            onChange={(e) =>
                                                setScheduleForm({
                                                    ...scheduleForm,
                                                    slot_duration_minutes: Number(e.target.value),
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-none"
                                        >
                                            <option value={15}>15 mins</option>
                                            <option value={20}>20 mins</option>
                                            <option value={30}>30 mins</option>
                                            <option value={45}>45 mins</option>
                                            <option value={60}>60 mins</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">
                                        Working Days in Clinic
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS_OF_WEEK.map((day) => {
                                            const active = (scheduleForm.working_days || []).includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleWorkingDay(day)}
                                                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                                        active
                                                            ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                                                            : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{saving ? 'Saving Schedule...' : 'Save Clinic Hours & Availability'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 3: EDIT DOCTOR PERSONAL & PROFESSIONAL DETAILS */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl">
                            <div className="border-b border-slate-100 pb-4 mb-6">
                                <h3 className="text-lg font-extrabold text-slate-900">
                                    Edit Doctor Profile & Credentials
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Update your display name, specialty, medical license number, contact info, and biography.
                                </p>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Doctor Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Department *
                                        </label>
                                        <select
                                            value={profileForm.department_id}
                                            onChange={(e) =>
                                                setProfileForm({ ...profileForm, department_id: e.target.value })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                        >
                                            {(data?.departments || []).map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Specialty Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={profileForm.specialty}
                                            onChange={(e) =>
                                                setProfileForm({ ...profileForm, specialty: e.target.value })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Medical License No. *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={profileForm.license_number}
                                            onChange={(e) =>
                                                setProfileForm({ ...profileForm, license_number: e.target.value })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Consultation Fee ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={profileForm.consultation_fee}
                                            onChange={(e) =>
                                                setProfileForm({ ...profileForm, consultation_fee: e.target.value })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Contact Phone
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.phone}
                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Room Assignment *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={profileForm.room_number}
                                            onChange={(e) =>
                                                setProfileForm({ ...profileForm, room_number: e.target.value })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Professional Biography & Credentials
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={profileForm.bio}
                                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-teal-600 focus:outline-none"
                                    />
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{saving ? 'Saving Details...' : 'Save Doctor Details'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

