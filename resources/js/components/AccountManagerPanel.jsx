import React, { useState } from 'react';
import { getRbacHeaders, invalidateClientCache } from '../utils/apiCache';
import {
    UserPlus,
    Users,
    KeyRound,
    Trash2,
    Search,
    Stethoscope,
    ShieldCheck,
    Eye,
    EyeOff,
} from 'lucide-react';

export default function AccountManagerPanel({
    users = [],
    departments = [],
    doctors = [],
    isSuperAdmin = false,
    dark = false,
    notify,
    onRefresh,
}) {
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [busyUserId, setBusyUserId] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [resetPasswordUserId, setResetPasswordUserId] = useState(null);
    const [newPasswordVal, setNewPasswordVal] = useState('');

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: 'password123',
        role: 'doctor',
        phone: '',
        department_id: departments[0]?.id ? String(departments[0].id) : '1',
        specialty: 'Internal Medicine & Primary Care Specialist',
        license_number: '',
        room_number: 'ROOM 5',
        consultation_fee: '750',
    });

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role,
                phone: form.phone || null,
            };

            if (form.role === 'doctor') {
                payload.department_id = Number(form.department_id || departments[0]?.id || 1);
                payload.specialty = form.specialty || 'Medical Specialist';
                payload.license_number = form.license_number || null;
                payload.room_number = form.room_number || 'ROOM 1';
                payload.consultation_fee = Number(form.consultation_fee || 650);
            }

            const res = await fetch('/api/v1/admin/users', {
                method: 'POST',
                headers: getRbacHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Could not create account.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                setForm({
                    name: '',
                    email: '',
                    password: 'password123',
                    role: 'doctor',
                    phone: '',
                    department_id: departments[0]?.id ? String(departments[0].id) : '1',
                    specialty: 'Internal Medicine & Primary Care Specialist',
                    license_number: '',
                    room_number: 'ROOM 5',
                    consultation_fee: '750',
                });
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            notify('Network error while creating account.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateAccount = async (userId, updates) => {
        setBusyUserId(userId);
        try {
            const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: getRbacHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(updates),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Failed to update account.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                setResetPasswordUserId(null);
                setNewPasswordVal('');
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            notify('Error updating account.', 'error');
        } finally {
            setBusyUserId(null);
        }
    };

    const handleDeleteAccount = async (userId) => {
        setBusyUserId(userId);
        try {
            const res = await fetch(`/api/v1/admin/users/${userId}`, {
                method: 'DELETE',
                headers: getRbacHeaders(),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Could not archive account.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            notify('Error archiving account.', 'error');
        } finally {
            setBusyUserId(null);
        }
    };

    const visibleUsers = users.filter((u) => {
        if (!isSuperAdmin && u.role === 'super_admin') {
            return false; // Admin cannot see or edit Super Admin accounts
        }
        if (roleFilter !== 'ALL' && u.role !== roleFilter) {
            return false;
        }
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            return (
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.role || '').toLowerCase().includes(q)
            );
        }
        return true;
    });

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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left 5 Cols: Create New Doctor / Staff Account Form */}
            <div className={`xl:col-span-5 rounded-2xl border p-6 space-y-5 shadow-2xs ${cardBg}`}>
                <div className="flex items-center gap-3 pb-4 border-b border-slate-500/20">
                    <div className="p-2.5 rounded-xl bg-teal-600/20 text-teal-500 border border-teal-500/30">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black">
                            Create Doctor or Staff Account
                        </h3>
                        <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Register a new login account for Doctors, Reception Staff, TV Display, or Administrators.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                        <label className={labelClass}>Account Role *</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className={inputClass}
                        >
                            <option value="doctor">Doctor / Physician (Doctor Portal)</option>
                            <option value="staff">Staff / Receptionist (Reception Portal)</option>
                            <option value="tv_display">Queuing TV Display Monitor</option>
                            <option value="admin">Clinic Administrator (Admin Dashboard)</option>
                            {isSuperAdmin && (
                                <option value="super_admin">Super Administrator (Root Observatory)</option>
                            )}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className={labelClass}>
                                {form.role === 'doctor' ? 'Doctor Full Name *' : 'Staff / User Full Name *'}
                            </label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder={
                                    form.role === 'doctor'
                                        ? 'e.g. Dr. Maria Santos'
                                        : 'e.g. Mark Dela Cruz (Desk 2)'
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Contact Mobile / Phone</label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="e.g. 0939-930-6575"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className={labelClass}>Login Email Address *</label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="user@carepoint.clinic"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Login Password *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="Enter password"
                                    className={`${inputClass} pr-9`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Extra Doctor Profile Fields when creating a Doctor account */}
                    {form.role === 'doctor' && (
                        <div className={`p-4 rounded-xl border space-y-3.5 ${subCardBg}`}>
                            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-teal-500">
                                <Stethoscope className="w-4 h-4" />
                                <span>Doctor Clinic Profile & Room Assignment</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Clinical Department *</label>
                                    <select
                                        value={form.department_id}
                                        onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                                        className={inputClass}
                                    >
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name} ({dept.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Assigned Clinic Room *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.room_number}
                                        onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                                        placeholder="e.g. ROOM 5"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                    <label className={labelClass}>Specialty Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.specialty}
                                        onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                                        placeholder="e.g. Internal Medicine Specialist"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Fee (₱)</label>
                                    <input
                                        type="number"
                                        value={form.consultation_fee}
                                        onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>PRC / Medical License No. (Optional)</label>
                                <input
                                    type="text"
                                    value={form.license_number}
                                    onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                                    placeholder="Auto-generated if left blank (e.g. PRC-2026-88412)"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wide shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                        {submitting
                            ? 'Creating Account...'
                            : `+ Create ${form.role.replace('_', ' ').toUpperCase()} Account`}
                    </button>
                </form>
            </div>

            {/* Right 7 Cols: Active Accounts Directory & Password/Role Manager */}
            <div className={`xl:col-span-7 rounded-2xl border p-6 space-y-5 shadow-2xs ${cardBg}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-500/20">
                    <div className="flex items-center gap-2.5">
                        <Users className="w-5 h-5 text-teal-500" />
                        <div>
                            <h3 className="text-base font-black">
                                Registered Portal Accounts ({visibleUsers.length})
                            </h3>
                            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Manage roles, reset passwords, suspend access, or archive Doctor & Staff accounts.
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-60">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search name, email, role..."
                            className={`${inputClass} pl-9 py-2`}
                        />
                    </div>
                </div>

                {/* Role Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                    {[
                        { id: 'ALL', label: 'All Accounts' },
                        { id: 'doctor', label: 'Doctors' },
                        { id: 'staff', label: 'Staff / Reception' },
                        { id: 'tv_display', label: 'TV Display' },
                        { id: 'admin', label: 'Admins' },
                        ...(isSuperAdmin ? [{ id: 'super_admin', label: 'Super Admin' }] : []),
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setRoleFilter(tab.id)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                                roleFilter === tab.id
                                    ? 'bg-teal-600 text-white'
                                    : dark
                                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Accounts List */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {visibleUsers.map((u) => {
                        const linkedDoctor = doctors.find(
                            (d) => d.user_id === u.id || d.email === u.email
                        );
                        const isResetting = resetPasswordUserId === u.id;

                        return (
                            <div
                                key={u.id}
                                className={`p-4 rounded-xl border space-y-3 ${subCardBg}`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-extrabold text-sm">
                                                {u.name}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                    u.status === 'suspended'
                                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                }`}
                                            >
                                                {u.status || 'active'}
                                            </span>
                                        </div>
                                        <div className="text-xs font-mono text-teal-500">
                                            {u.email}
                                            {u.phone ? ` • ${u.phone}` : ''}
                                        </div>
                                        {linkedDoctor && (
                                            <div className="text-[11px] text-slate-400">
                                                Linked Doctor Profile: <strong>{linkedDoctor.specialty}</strong> ({linkedDoctor.room_number} • License: {linkedDoctor.license_number})
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Role Selector */}
                                        <select
                                            disabled={busyUserId === u.id || (!isSuperAdmin && u.role === 'super_admin')}
                                            value={u.role}
                                            onChange={(e) =>
                                                handleUpdateAccount(u.id, { role: e.target.value })
                                            }
                                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold focus:outline-none ${
                                                dark
                                                    ? 'bg-slate-900 border-slate-700 text-teal-300'
                                                    : 'bg-white border-slate-300 text-slate-800'
                                            }`}
                                        >
                                            <option value="doctor">DOCTOR</option>
                                            <option value="staff">STAFF / RECEPTION</option>
                                            <option value="tv_display">TV DISPLAY</option>
                                            <option value="admin">ADMIN</option>
                                            {isSuperAdmin && (
                                                <option value="super_admin">SUPER ADMIN</option>
                                            )}
                                        </select>

                                        {/* Suspend / Activate Toggle */}
                                        {u.role !== 'super_admin' && (
                                            <button
                                                type="button"
                                                disabled={busyUserId === u.id}
                                                onClick={() =>
                                                    handleUpdateAccount(u.id, {
                                                        status: u.status === 'suspended' ? 'active' : 'suspended',
                                                    })
                                                }
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                                    u.status === 'suspended'
                                                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                }`}
                                            >
                                                {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                                            </button>
                                        )}

                                        {/* Reset Password Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setResetPasswordUserId(isResetting ? null : u.id);
                                                setNewPasswordVal('password123');
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold cursor-pointer"
                                        >
                                            <KeyRound className="w-3.5 h-3.5" />
                                            <span>Password</span>
                                        </button>

                                        {/* Soft Delete / Archive */}
                                        {u.role !== 'super_admin' && (
                                            <button
                                                type="button"
                                                disabled={busyUserId === u.id}
                                                onClick={() => handleDeleteAccount(u.id)}
                                                title="Archive Account (Soft Delete)"
                                                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Inline Reset Password Form */}
                                {isResetting && (
                                    <div className="pt-2 border-t border-slate-500/20 flex flex-wrap items-center gap-2">
                                        <input
                                            type="text"
                                            value={newPasswordVal}
                                            onChange={(e) => setNewPasswordVal(e.target.value)}
                                            placeholder="Enter new password"
                                            className={`${inputClass} sm:w-56 py-1.5`}
                                        />
                                        <button
                                            type="button"
                                            disabled={busyUserId === u.id || !newPasswordVal.trim()}
                                            onClick={() =>
                                                handleUpdateAccount(u.id, { password: newPasswordVal.trim() })
                                            }
                                            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
                                        >
                                            Save New Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setResetPasswordUserId(null)}
                                            className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:underline cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

