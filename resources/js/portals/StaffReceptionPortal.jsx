import React, { useState, useEffect } from 'react';
import { DashboardPortalSkeleton } from '../components/SkeletonLoaders';
import { cachedFetchJson, invalidateClientCache } from '../utils/apiCache';
import {
    UserCheck,
    SlidersHorizontal,
    CalendarPlus,
    HelpCircle,
    Search,
    ChevronRight,
    Stethoscope,
    PhoneCall,
    Play,
    RotateCcw,
    CheckCircle2,
    PlusCircle,
} from 'lucide-react';

export default function StaffReceptionPortal({ notify }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('checkin'); // checkin, doctors, helpdesk
    const [search, setSearch] = useState('');
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [walkInName, setWalkInName] = useState('');
    const [walkInPriority, setWalkInPriority] = useState('normal');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchStaffData = async (searchQuery = search, forceNetwork = false) => {
        try {
            await cachedFetchJson(
                `/api/v1/staff/dashboard?search=${encodeURIComponent(searchQuery)}`,
                (json) => {
                    setData(json);
                    setLoading(false);
                    if (!selectedAppointmentId && json.appointments?.length > 0) {
                        setSelectedAppointmentId(json.appointments[0].id);
                    }
                },
                forceNetwork
            );
        } catch (err) {
            notify('Failed to load reception desk data.', 'error');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffData('');
    }, []);

    const handleSearchChange = (val) => {
        setSearch(val);
        fetchStaffData(val, true);
    };

    const triggerQueueAction = async (action, appointmentId = null) => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/v1/staff/queue-action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    action,
                    appointment_id: appointmentId,
                    desk: 'DESK 1',
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Queue action failed.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                if (json.appointment) {
                    setSelectedAppointmentId(json.appointment.id);
                }
                fetchStaffData(search, true);
            }
        } catch (err) {
            notify('Network error while executing queue action.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickWalkIn = async (dept) => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/v1/staff/walk-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    department_id: dept.id,
                    patient_name: walkInName.trim() || undefined,
                    priority: walkInPriority,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Could not generate walk-in ticket.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                setWalkInName('');
                setSelectedAppointmentId(json.appointment.id);
                fetchStaffData(search, true);
            }
        } catch (err) {
            notify('Error generating walk-in ticket.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const appointments = data?.appointments || [];
    const selectedAppt =
        appointments.find((a) => a.id === selectedAppointmentId) ||
        data?.current_desk_ticket ||
        appointments[0] ||
        null;

    const currentDeskTicket = data?.current_desk_ticket || selectedAppt;

    if (loading && !data) {
        return <DashboardPortalSkeleton />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {/* Staff / Reception Frame matching Mockup Bottom-Right */}
            <div className="bg-slate-100 rounded-2xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[78vh]">
                {/* Left Dark Navy Sidebar: Reception Desk 1 */}
                <aside className="lg:col-span-3 xl:col-span-2 bg-slate-900 text-slate-200 flex flex-col justify-between p-4">
                    <div className="space-y-6">
                        <div className="px-2 pt-2 border-b border-slate-800 pb-4">
                            <div className="text-lg font-extrabold text-white tracking-tight">
                                Reception Desk 1
                            </div>
                            <div className="text-xs text-teal-400 font-semibold mt-0.5">
                                Frontline Check-In & Queue
                            </div>
                        </div>

                        <nav className="space-y-1.5">
                            <button
                                type="button"
                                onClick={() => setActiveTab('checkin')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'checkin'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                <UserCheck className="w-4 h-4" />
                                <span>Patient Check-In</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('checkin')}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                            >
                                <SlidersHorizontal className="w-4 h-4 text-teal-400" />
                                <span>Queue Control</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('doctors')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'doctors'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                <Stethoscope className="w-4 h-4 text-emerald-400" />
                                <span>Doctor Availability</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('helpdesk')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'helpdesk'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                <HelpCircle className="w-4 h-4 text-cyan-400" />
                                <span>Helpdesk & Triage</span>
                            </button>
                        </nav>
                    </div>

                    {/* Mini Live Reception Metrics */}
                    <div className="bg-slate-800/90 rounded-xl p-3.5 border border-slate-700/80 space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Waiting Queue:</span>
                            <span className="font-bold text-white">{data?.stats?.waiting_count ?? 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Now Serving:</span>
                            <span className="font-bold text-emerald-400">{data?.stats?.serving_count ?? 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Doctors Online:</span>
                            <span className="font-bold text-teal-300">{data?.stats?.available_doctors_count ?? 0}</span>
                        </div>
                    </div>
                </aside>

                {/* Main Reception Workspace */}
                <main className="lg:col-span-9 xl:col-span-10 p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Center 8 Columns: Active Queue + Walk-In & Reservation Check-In */}
                    <div className="xl:col-span-8 space-y-6">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-800 mb-2.5">Active Queue</h2>
                            {/* Top Box: CURRENT TICKET AT DESK 1: A-101 (Matches Mockup) */}
                            <div className="bg-teal-50/70 border-2 border-teal-500 rounded-xl p-5 shadow-xs">
                                <div className="text-center">
                                    <div className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-1">
                                        {currentDeskTicket?.patient_name || 'Ready for Next Patient'} • {currentDeskTicket?.assigned_room || 'ROOM 1'} ({currentDeskTicket?.doctor?.name || 'Assigned Doctor'})
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                        CURRENT TICKET AT DESK 1:{' '}
                                        <span className="text-teal-800">
                                            {currentDeskTicket?.ticket_number || 'NONE'}
                                        </span>
                                    </h3>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => triggerQueueAction('call_next')}
                                        className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-sm transition cursor-pointer"
                                    >
                                        CALL NEXT
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoading || !currentDeskTicket}
                                        onClick={() => triggerQueueAction('serve', currentDeskTicket?.id)}
                                        className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-sm transition cursor-pointer"
                                    >
                                        SERVE
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoading || !currentDeskTicket}
                                        onClick={() => triggerQueueAction('no_show_requeue', currentDeskTicket?.id)}
                                        className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-sm transition cursor-pointer"
                                    >
                                        NO SHOW / RE-QUEUE
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoading || !currentDeskTicket}
                                        onClick={() => triggerQueueAction('complete', currentDeskTicket?.id)}
                                        className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs tracking-wide transition cursor-pointer"
                                    >
                                        COMPLETE
                                    </button>
                                </div>
                            </div>
                        </div>

                        {activeTab === 'checkin' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                    <h3 className="text-sm font-extrabold text-slate-900">
                                        Walk-in & Reservation check-in
                                    </h3>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {appointments.length} total reservations today
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                    {/* Left Patient Search & List */}
                                    <div className="md:col-span-6 space-y-3">
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                value={search}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                placeholder="Search Patient Name or Ticket..."
                                                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs font-medium focus:border-teal-600 focus:outline-none"
                                            />
                                        </div>

                                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-80 overflow-y-auto">
                                            {appointments.map((appt) => {
                                                const isSelected = selectedAppt?.id === appt.id;
                                                return (
                                                    <button
                                                        key={appt.id}
                                                        type="button"
                                                        onClick={() => setSelectedAppointmentId(appt.id)}
                                                        className={`w-full px-3.5 py-3 flex items-center justify-between text-left transition cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-teal-50/90 border-l-4 border-l-teal-600'
                                                                : 'hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                                                                {appt.patient_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                                    <span>{appt.patient_name}</span>
                                                                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-extrabold">
                                                                        {appt.ticket_number}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[11px] text-slate-500">
                                                                    {appt.appointment_time} • {appt.doctor?.name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Right Checked-In Queue Inspector (Matches Mockup) */}
                                    <div className="md:col-span-6">
                                        {selectedAppt ? (
                                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                                                    <h4 className="text-xs font-extrabold text-slate-900">
                                                        Checked-In queue today
                                                    </h4>
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-teal-100 text-teal-800">
                                                        {selectedAppt.ticket_number} • {selectedAppt.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <span className="text-slate-500 block">Patient Name</span>
                                                        <span className="font-bold text-slate-900 text-sm">
                                                            {selectedAppt.patient_name}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block">Arrival / Slot Time</span>
                                                        <span className="font-bold text-slate-900 text-sm">
                                                            {selectedAppt.appointment_time}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block">Reason</span>
                                                        <span className="font-bold text-slate-800">
                                                            {selectedAppt.reason_for_visit || 'Consultation'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block">Assigned</span>
                                                        <span className="font-bold text-teal-800">
                                                            {selectedAppt.assigned_room} ({selectedAppt.doctor?.name})
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="pt-2 space-y-2">
                                                    <button
                                                        type="button"
                                                        disabled={actionLoading}
                                                        onClick={() => triggerQueueAction('call_next', selectedAppt.id)}
                                                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                                                    >
                                                        Proceed to Queue / Call Ticket {selectedAppt.ticket_number}
                                                    </button>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={actionLoading}
                                                            onClick={() => triggerQueueAction('serve', selectedAppt.id)}
                                                            className="py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition cursor-pointer"
                                                        >
                                                            Send to Doctor Room
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={actionLoading}
                                                            onClick={() => triggerQueueAction('complete', selectedAppt.id)}
                                                            className="py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
                                                        >
                                                            Mark Completed
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-xs text-slate-400">
                                                Select a patient reservation to inspect.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'doctors' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                                <h3 className="text-sm font-extrabold text-slate-900">
                                    Doctor Clinic Availability & Room Assignments
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {(data?.doctors || []).map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3"
                                        >
                                            <div className="space-y-1">
                                                <div className="font-extrabold text-sm text-slate-900">{doc.name}</div>
                                                <div className="text-xs font-semibold text-teal-700">
                                                    {doc.specialty} • {doc.room_number}
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    Hours: {doc.shift_start} – {doc.shift_end}
                                                </div>
                                                <div className="text-[11px] font-semibold text-slate-700 pt-1">
                                                    Waiting Patients: {doc.waiting_patients_count ?? 0} • Served Today: {doc.served_today_count ?? 0}
                                                </div>
                                            </div>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                                    doc.availability_status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : doc.availability_status === 'in_consultation'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : doc.availability_status === 'on_break'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {doc.availability_status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'helpdesk' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                                <h3 className="text-sm font-extrabold text-slate-900">Reception Triage & Helpdesk Protocol</h3>
                                <p className="text-xs text-slate-600">
                                    Use the <strong>Quick Ticket Generation</strong> buttons on the right to issue instant walk-in tickets, or search existing online bookings under <strong>Patient Check-In</strong>.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right 4 Columns: Quick Ticket Generation + Live Doctor Availability */}
                    <div className="xl:col-span-4 space-y-5">
                        {/* Quick Ticket Generation Card (Matches Mockup Right Side: General [G], Pediatric [P], Dental [D], Laboratory [L]) */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                            <div>
                                <h3 className="text-sm font-extrabold text-slate-900">Quick Ticket Generation</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    One-click walk-in ticket issuer for reception kiosk.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={walkInName}
                                    onChange={(e) => setWalkInName(e.target.value)}
                                    placeholder="Optional Walk-In Patient Name..."
                                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-2.5">
                                {(data?.departments || []).map((dept) => (
                                    <button
                                        key={dept.id}
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => handleQuickWalkIn(dept)}
                                        className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white hover:bg-teal-50 hover:border-teal-500 transition overflow-hidden shadow-2xs cursor-pointer group"
                                    >
                                        <span className="px-3.5 py-2.5 text-xs font-bold text-slate-800 group-hover:text-teal-900">
                                            {dept.name}
                                        </span>
                                        <span className="px-3.5 py-2.5 bg-teal-700 group-hover:bg-teal-800 text-white font-black text-xs min-w-[42px] text-center">
                                            {dept.code}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Live Doctor Availability Summary Widget */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                                    Who's Available Now
                                </h3>
                                <span className="text-[11px] font-bold text-emerald-700">Live Status</span>
                            </div>
                            <div className="space-y-2.5">
                                {(data?.doctors || []).map((doc) => {
                                    const isOnline = doc.availability_status === 'active' || doc.availability_status === 'in_consultation';
                                    return (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900">{doc.name}</div>
                                                <div className="text-[11px] text-slate-500">
                                                    {doc.room_number} • {doc.waiting_patients_count ?? 0} in queue
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center gap-1.5 font-bold text-[11px]">
                                                <span
                                                    className={`w-2.5 h-2.5 rounded-full ${
                                                        isOnline ? 'bg-emerald-500' : 'bg-red-500'
                                                    }`}
                                                />
                                                <span className={isOnline ? 'text-emerald-700' : 'text-red-600'}>
                                                    {doc.availability_status === 'active'
                                                        ? 'Available'
                                                        : doc.availability_status === 'in_consultation'
                                                        ? 'In Room'
                                                        : 'Offline'}
                                                </span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

