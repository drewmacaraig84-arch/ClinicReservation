import React, { useState, useEffect } from 'react';
import CarePointLogo from '../components/CarePointLogo';
import { DashboardPortalSkeleton } from '../components/SkeletonLoaders';
import { cachedFetchJson, invalidateClientCache } from '../utils/apiCache';
import {
    LayoutDashboard,
    SlidersHorizontal,
    Calendar,
    Users,
    Settings,
    BarChart3,
    FileSpreadsheet,
    Bell,
    User,
    Trash2,
    Plus,
    Search,
    Download,
    TrendingUp,
} from 'lucide-react';

export default function AdminPortal({ notify, onSwitchPortal }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('overview'); // overview, analytics, doctors, settings
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, active, completed
    const [search, setSearch] = useState('');
    const [busyId, setBusyId] = useState(null);

    // New Doctor modal/form
    const [newDoc, setNewDoc] = useState({
        name: '',
        department_id: '',
        specialty: '',
        license_number: '',
        room_number: 'ROOM 5',
        email: '',
        phone: '',
        consultation_fee: '750',
    });

    // Settings form
    const [tickerNews, setTickerNews] = useState('');

    const fetchAdminDashboard = async (status = statusFilter, searchStr = search, forceNetwork = false) => {
        try {
            await cachedFetchJson(
                `/api/v1/admin/dashboard?status=${encodeURIComponent(status)}&search=${encodeURIComponent(searchStr)}`,
                (json) => {
                    setData(json);
                    setLoading(false);
                    if (!newDoc.department_id && json.departments?.length > 0) {
                        setNewDoc((prev) => ({ ...prev, department_id: String(json.departments[0].id) }));
                    }
                    if (json.settings?.ticker_news && !tickerNews) {
                        setTickerNews(json.settings.ticker_news);
                    }
                },
                forceNetwork
            );
        } catch (err) {
            notify('Failed to load Admin Dashboard.', 'error');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminDashboard('all', '');
    }, []);

    const handleFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        fetchAdminDashboard(newStatus, search);
    };

    const handleSearch = (val) => {
        setSearch(val);
        fetchAdminDashboard(statusFilter, val, true);
    };

    const handleAppointmentAction = async (appointmentId, action) => {
        setBusyId(appointmentId);
        try {
            const res = await fetch(`/api/v1/admin/appointments/${appointmentId}/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ action }),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Action failed.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                fetchAdminDashboard(statusFilter, search, true);
            }
        } catch (err) {
            notify('Network error performing action.', 'error');
        } finally {
            setBusyId(null);
        }
    };

    const handleCreateDoctor = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/v1/admin/doctors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    ...newDoc,
                    department_id: Number(newDoc.department_id),
                    consultation_fee: Number(newDoc.consultation_fee),
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Failed to add doctor.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                setNewDoc({
                    name: '',
                    department_id: String(data?.departments?.[0]?.id || 1),
                    specialty: '',
                    license_number: '',
                    room_number: 'ROOM 5',
                    email: '',
                    phone: '',
                    consultation_fee: '750',
                });
                fetchAdminDashboard(statusFilter, search, true);
            }
        } catch (err) {
            notify('Error adding doctor.', 'error');
        }
    };

    const handleSoftDeleteDoctor = async (docId) => {
        try {
            const res = await fetch(`/api/v1/admin/doctors/${docId}`, {
                method: 'DELETE',
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();
            if (res.ok) {
                invalidateClientCache();
                notify(json.message, 'success');
                fetchAdminDashboard(statusFilter, search, true);
            }
        } catch (err) {
            notify('Failed to soft-delete doctor.', 'error');
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/v1/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ ticker_news: tickerNews }),
            });
            const json = await res.json();
            if (res.ok) {
                invalidateClientCache();
                notify(json.message, 'success');
            }
        } catch (err) {
            notify('Failed to update settings.', 'error');
        }
    };

    const exportCsvReport = () => {
        const rows = [
            ['Ticket No', 'Booking Ref', 'Patient Name', 'Department', 'Doctor', 'Date', 'Time', 'Status', 'Room'],
            ...(data?.appointments || []).map((a) => [
                a.ticket_number,
                a.booking_reference,
                a.patient_name,
                a.department?.name || '',
                a.doctor?.name || '',
                a.appointment_date?.slice(0, 10) || '',
                a.appointment_time,
                a.status,
                a.assigned_room,
            ]),
        ];
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `carepoint_admin_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notify('Exported CSV reservation report!', 'success');
    };

    if (loading && !data) {
        return <DashboardPortalSkeleton />;
    }

    const kpis = data?.kpis || {};
    const reports = data?.reports || {};
    const appointments = data?.appointments || [];
    const doctors = data?.doctors || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {/* Admin Dashboard Frame matching Mockup Bottom-Left */}
            <div className="bg-slate-100 rounded-2xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[80vh]">
                {/* Left Dark Navy Sidebar */}
                <aside className="lg:col-span-3 xl:col-span-2 bg-slate-900 text-slate-200 p-4 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="px-2 pt-1 pb-4 border-b border-slate-800">
                            <CarePointLogo dark size="sm" />
                        </div>

                        <nav className="space-y-1">
                            <button
                                type="button"
                                onClick={() => setActiveSection('overview')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    activeSection === 'overview'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Dashboard</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveSection('overview')}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                            >
                                <span className="flex items-center gap-3">
                                    <SlidersHorizontal className="w-4 h-4 text-teal-400" />
                                    <span>Queue Control</span>
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveSection('analytics')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    activeSection === 'analytics'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                <BarChart3 className="w-4 h-4 text-emerald-400" />
                                <span>Analytics & Graphs</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveSection('doctors')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    activeSection === 'doctors'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                <Calendar className="w-4 h-4 text-cyan-400" />
                                <span>Doctor Schedules</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveSection('settings')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    activeSection === 'settings'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                <Settings className="w-4 h-4 text-amber-400" />
                                <span>Clinic Settings</span>
                            </button>

                            <button
                                type="button"
                                onClick={exportCsvReport}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-teal-300" />
                                <span>Export CSV Report</span>
                            </button>
                        </nav>
                    </div>

                    <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 text-[11px] text-slate-400 space-y-1">
                        <div className="font-bold text-white">Soft-Delete Protection</div>
                        <p>Deleted reservations move to the Super Admin Vault for audit & recovery.</p>
                    </div>
                </aside>

                {/* Main Admin Content Area */}
                <main className="lg:col-span-9 xl:col-span-10 flex flex-col">
                    {/* Top Header Bar: Admin Dashboard - Overview | Admin User */}
                    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                        <h1 className="text-lg font-extrabold text-slate-900">
                            Admin Dashboard - {activeSection === 'overview' ? 'Overview & Queue' : activeSection === 'analytics' ? 'Graph Reports & Analytics' : activeSection === 'doctors' ? 'Doctor Management' : 'Clinic Settings'}
                        </h1>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveSection(activeSection === 'analytics' ? 'overview' : 'analytics')}
                                className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold hover:bg-teal-100 transition cursor-pointer"
                            >
                                {activeSection === 'analytics' ? '← Back to Queue Table' : '📊 View Full Graph Reports'}
                            </button>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                                <User className="w-4 h-4 text-slate-600" />
                                <span>Admin User</span>
                            </div>
                            <Bell className="w-4 h-4 text-slate-500" />
                        </div>
                    </header>

                    <div className="p-6 space-y-6 flex-1">
                        {/* 4 Top KPI Cards matching Mockup Bottom-Left (142, 18, 94, 22 mins) */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
                                <div className="text-xs font-semibold text-slate-600">Total Bookings today</div>
                                <div className="text-3xl font-black text-slate-900 mt-1">
                                    {kpis.total_bookings_today ?? 142}
                                </div>
                                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                                    Includes {kpis.live_db_bookings_today ?? 0} active live records
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
                                <div className="text-xs font-semibold text-slate-600">Currently Waiting</div>
                                <div className="text-3xl font-black text-slate-900 mt-1">
                                    {kpis.currently_waiting ?? 18}
                                </div>
                                <div className="text-[11px] text-teal-700 font-semibold mt-1">
                                    Real-time active queue
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
                                <div className="text-xs font-semibold text-slate-600">Served Today</div>
                                <div className="text-3xl font-black text-slate-900 mt-1">
                                    {kpis.served_today ?? 94}
                                </div>
                                <div className="text-[11px] text-blue-600 font-semibold mt-1">
                                    96.4% completion rate
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
                                <div className="text-xs font-semibold text-slate-600">Avg. Waiting Time</div>
                                <div className="text-3xl font-black text-slate-900 mt-1">
                                    {kpis.avg_waiting_time ?? 22} mins
                                </div>
                                <div className="text-[11px] text-slate-500 font-semibold mt-1">
                                    Target SLA: &lt; 25 mins
                                </div>
                            </div>
                        </div>

                        {/* Interactive Visual Graph Reports Strip (Always accessible in Overview & Expanded in Analytics) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* 7-Day Reservation Trend Bar Chart */}
                            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-teal-600" />
                                            <span>7-Day Reservation & Queue Volume Graph</span>
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Daily comparison of Online Bookings vs Walk-In Queue Tickets
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] font-bold">
                                        <span className="inline-flex items-center gap-1 text-teal-700">
                                            <span className="w-2.5 h-2.5 rounded-xs bg-teal-600" /> Online
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-cyan-600">
                                            <span className="w-2.5 h-2.5 rounded-xs bg-cyan-400" /> Walk-In
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4 px-2 border-b border-slate-200">
                                    {(reports.daily_trends || []).map((day) => {
                                        const total = day.online + day.walk_in;
                                        const onlineH = Math.min(100, Math.round((day.online / 160) * 100));
                                        const walkInH = Math.min(100, Math.round((day.walk_in / 160) * 100));
                                        return (
                                            <div key={day.date} className="flex flex-col items-center gap-1 h-full justify-end group">
                                                <div className="text-[10px] font-bold text-slate-600">{total}</div>
                                                <div className="w-full max-w-[34px] flex flex-col justify-end rounded-t overflow-hidden bg-slate-100 h-28">
                                                    <div
                                                        style={{ height: `${walkInH}%` }}
                                                        className="bg-cyan-400 transition-all"
                                                        title={`Walk-In: ${day.walk_in}`}
                                                    />
                                                    <div
                                                        style={{ height: `${onlineH}%` }}
                                                        className="bg-teal-600 transition-all"
                                                        title={`Online: ${day.online}`}
                                                    />
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500 pt-1">
                                                    {day.short_label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Department Distribution Graph */}
                            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                                <div className="mb-3">
                                    <h3 className="text-sm font-extrabold text-slate-900">
                                        Reservations by Department
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        Live distribution across clinic specialties
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {(reports.bookings_by_department || []).slice(0, 5).map((dept) => {
                                        const pct = Math.min(100, Math.max(15, dept.total * 22));
                                        return (
                                            <div key={dept.id} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-bold text-slate-800">
                                                        [{dept.code}] {dept.name}
                                                    </span>
                                                    <span className="font-bold text-teal-700">
                                                        {dept.total} bookings ({dept.waiting} waiting)
                                                    </span>
                                                </div>
                                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        style={{ width: `${pct}%` }}
                                                        className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* OVERVIEW SECTION: Queue Management Table + Live Doctor Availability (Matches Mockup Bottom-Left) */}
                        {activeSection === 'overview' && (
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                                {/* Left 9 Cols: Queue Management Table */}
                                <div className="xl:col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                        <div>
                                            <h3 className="text-base font-extrabold text-slate-900">
                                                Queue Management
                                            </h3>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {[
                                                    { id: 'all', label: 'All' },
                                                    { id: 'pending', label: 'Pending' },
                                                    { id: 'active', label: 'Active' },
                                                    { id: 'completed', label: 'Completed' },
                                                ].map((tab) => (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => handleFilterChange(tab.id)}
                                                        className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                                                            statusFilter === tab.id
                                                                ? 'bg-teal-700 text-white'
                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="relative w-full sm:w-60">
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                value={search}
                                                onChange={(e) => handleSearch(e.target.value)}
                                                placeholder="Filter ticket, patient, doctor..."
                                                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                                                    <th className="py-2.5 px-3">Ticket No</th>
                                                    <th className="py-2.5 px-3">Patient Name</th>
                                                    <th className="py-2.5 px-3">Doctor</th>
                                                    <th className="py-2.5 px-3">Status</th>
                                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs">
                                                {appointments.map((appt) => (
                                                    <tr key={appt.id} className="hover:bg-slate-50/80">
                                                        <td className="py-3 px-3 font-black text-slate-900 text-sm">
                                                            {appt.ticket_number}
                                                            <span className="block text-[10px] font-medium text-slate-400">
                                                                {appt.assigned_room} • {appt.appointment_time}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="text-[10px] text-slate-400">Patient Name</div>
                                                            <div className="font-bold text-slate-900">{appt.patient_name}</div>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="text-[10px] text-slate-400">Doctor</div>
                                                            <div className="font-bold text-slate-800">
                                                                {appt.doctor?.name || 'Unassigned'}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="text-[10px] text-slate-400">Status</div>
                                                            <div className="font-semibold text-slate-700 capitalize">
                                                                {appt.status === 'waiting'
                                                                    ? `Waiting (${appt.estimated_wait_minutes || 12} mins)`
                                                                    : appt.status}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 text-right">
                                                            <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                                                                <button
                                                                    type="button"
                                                                    disabled={busyId === appt.id}
                                                                    onClick={() => handleAppointmentAction(appt.id, 'call_next')}
                                                                    className="px-2.5 py-1 rounded bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] transition cursor-pointer"
                                                                >
                                                                    Call Next
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={busyId === appt.id}
                                                                    onClick={() => handleAppointmentAction(appt.id, 'decline')}
                                                                    className="px-2.5 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 font-bold text-[11px] transition cursor-pointer"
                                                                >
                                                                    Decline
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={busyId === appt.id}
                                                                    onClick={() => handleAppointmentAction(appt.id, 'transfer')}
                                                                    className="px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-[11px] transition cursor-pointer"
                                                                >
                                                                    Transfer
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={busyId === appt.id}
                                                                    onClick={() => handleAppointmentAction(appt.id, 'delete')}
                                                                    title="Soft Delete (Sends to Super Admin Recovery Vault)"
                                                                    className="p-1 rounded border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Right 3 Cols: Live Doctor Availability Widget */}
                                <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900">
                                            Live Doctor Availability
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold">
                                            <span className="inline-flex items-center gap-1 text-emerald-700">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-red-600">
                                                <span className="w-2 h-2 rounded-full bg-red-500" /> Offline
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 divide-y divide-slate-100">
                                        {doctors.map((doc) => {
                                            const isOnline =
                                                doc.availability_status === 'active' ||
                                                doc.availability_status === 'in_consultation';
                                            return (
                                                <div key={doc.id} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                                                    <div>
                                                        <div className="font-bold text-slate-900">{doc.name}</div>
                                                        <div className="text-[11px] text-slate-500">
                                                            {doc.room_number} • {doc.specialty}
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`w-3 h-3 rounded-full shrink-0 ${
                                                            isOnline ? 'bg-emerald-500' : 'bg-red-500'
                                                        }`}
                                                        title={doc.availability_status}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ANALYTICS SECTION: Detailed Doctor Performance & Hourly Traffic */}
                        {activeSection === 'analytics' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900">
                                            Doctor Utilization & Revenue Analytics Report
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Complete breakdown of appointments, active queue load, and consultation revenue per physician.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={exportCsvReport}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Export CSV</span>
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-slate-500 uppercase font-extrabold">
                                                <th className="py-2.5 px-3">Doctor</th>
                                                <th className="py-2.5 px-3">Specialty & Room</th>
                                                <th className="py-2.5 px-3">Total Assigned</th>
                                                <th className="py-2.5 px-3">Waiting</th>
                                                <th className="py-2.5 px-3">Completed</th>
                                                <th className="py-2.5 px-3">Est. Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(reports.doctor_analytics || []).map((d) => (
                                                <tr key={d.id}>
                                                    <td className="py-3 px-3 font-bold text-slate-900">{d.name}</td>
                                                    <td className="py-3 px-3 text-slate-600">
                                                        {d.specialty} ({d.room_number})
                                                    </td>
                                                    <td className="py-3 px-3 font-bold">{d.total_assigned}</td>
                                                    <td className="py-3 px-3 text-amber-700 font-bold">{d.waiting}</td>
                                                    <td className="py-3 px-3 text-emerald-700 font-bold">{d.completed}</td>
                                                    <td className="py-3 px-3 font-black text-slate-900">
                                                        ${d.revenue_generated.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* DOCTORS MANAGEMENT SECTION */}
                        {activeSection === 'doctors' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                    <h3 className="text-sm font-extrabold text-slate-900">Active Clinic Doctors</h3>
                                    <div className="divide-y divide-slate-100">
                                        {doctors.map((doc) => (
                                            <div key={doc.id} className="py-3 flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-sm text-slate-900">{doc.name}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {doc.specialty} • {doc.room_number} • {doc.license_number}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSoftDeleteDoctor(doc.id)}
                                                    className="px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                                                >
                                                    Archive (Soft Delete)
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                    <h3 className="text-sm font-extrabold text-slate-900">Add New Doctor</h3>
                                    <form onSubmit={handleCreateDoctor} className="space-y-3 text-xs">
                                        <input
                                            type="text"
                                            required
                                            placeholder="Doctor Name (e.g. Dr. Rachel Green)"
                                            value={newDoc.name}
                                            onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={newDoc.department_id}
                                                onChange={(e) => setNewDoc({ ...newDoc, department_id: e.target.value })}
                                                className="rounded-lg border border-slate-300 px-3 py-2"
                                            >
                                                {(data?.departments || []).map((dept) => (
                                                    <option key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Room (e.g. ROOM 5)"
                                                value={newDoc.room_number}
                                                onChange={(e) => setNewDoc({ ...newDoc, room_number: e.target.value })}
                                                className="rounded-lg border border-slate-300 px-3 py-2"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Specialty"
                                                value={newDoc.specialty}
                                                onChange={(e) => setNewDoc({ ...newDoc, specialty: e.target.value })}
                                                className="rounded-lg border border-slate-300 px-3 py-2"
                                            />
                                            <input
                                                type="text"
                                                required
                                                placeholder="License No."
                                                value={newDoc.license_number}
                                                onChange={(e) => setNewDoc({ ...newDoc, license_number: e.target.value })}
                                                className="rounded-lg border border-slate-300 px-3 py-2"
                                            />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            placeholder="Doctor Email"
                                            value={newDoc.email}
                                            onChange={(e) => setNewDoc({ ...newDoc, email: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                        />
                                        <button
                                            type="submit"
                                            className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer"
                                        >
                                            + Register Doctor
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* SETTINGS SECTION */}
                        {activeSection === 'settings' && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4">
                                <h3 className="text-base font-extrabold text-slate-900">
                                    TV Queue Display Ticker Announcement
                                </h3>
                                <form onSubmit={handleSaveSettings} className="space-y-4">
                                    <textarea
                                        rows={3}
                                        value={tickerNews}
                                        onChange={(e) => setTickerNews(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-teal-600 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 rounded-lg bg-teal-700 text-white text-xs font-bold cursor-pointer"
                                    >
                                        Update Live TV Ticker
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

