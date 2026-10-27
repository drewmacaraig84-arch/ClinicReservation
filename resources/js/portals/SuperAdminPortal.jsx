import React, { useState, useEffect } from 'react';
import { DashboardPortalSkeleton } from '../components/SkeletonLoaders';
import { cachedFetchJson, getRbacHeaders, invalidateClientCache } from '../utils/apiCache';
import {
    ShieldAlert,
    Activity,
    Database,
    Server,
    Terminal,
    Trash2,
    RotateCcw,
    CheckCircle2,
    AlertTriangle,
    Lock,
    Cpu,
    HardDrive,
    Zap,
    RefreshCw,
    Flame,
} from 'lucide-react';

export default function SuperAdminPortal({ notify }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('health'); // health, crashlogs, vault, security
    const [logLevel, setLogLevel] = useState('ALL');
    const [expandedLogId, setExpandedLogId] = useState(null);
    const [vaultSubTab, setVaultSubTab] = useState('appointments'); // appointments, doctors, users
    const [busy, setBusy] = useState(false);

    const fetchSuperAdmin = async (level = logLevel, forceNetwork = false) => {
        try {
            await cachedFetchJson(
                `/api/v1/super-admin/dashboard?level=${encodeURIComponent(level)}`,
                (json) => {
                    setData(json);
                    setLoading(false);
                },
                forceNetwork
            );
        } catch (err) {
            notify('Failed to load Super Admin Telemetry.', 'error');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuperAdmin('ALL');
    }, []);

    const handleFilterLevel = (lvl) => {
        setLogLevel(lvl);
        fetchSuperAdmin(lvl);
    };

    const handleRestore = async (type, id) => {
        setBusy(true);
        try {
            const res = await fetch('/api/v1/super-admin/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ type, id }),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Restore failed.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                fetchSuperAdmin(logLevel, true);
            }
        } catch (err) {
            notify('Network error restoring record.', 'error');
        } finally {
            setBusy(false);
        }
    };

    const handleForceDelete = async (type, id) => {
        setBusy(true);
        try {
            const res = await fetch('/api/v1/super-admin/force-delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ type, id }),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Purge failed.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                fetchSuperAdmin(logLevel, true);
            }
        } catch (err) {
            notify('Network error purging record.', 'error');
        } finally {
            setBusy(false);
        }
    };

    const handleSoftDeleteUser = async (userId) => {
        setBusy(true);
        try {
            const res = await fetch(`/api/v1/super-admin/users/${userId}`, {
                method: 'DELETE',
                headers: getRbacHeaders(),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Cannot archive user.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                fetchSuperAdmin(logLevel, true);
            }
        } catch (err) {
            notify('Error archiving user.', 'error');
        } finally {
            setBusy(false);
        }
    };

    const handleChangeUserRole = async (userId, newRole) => {
        setBusy(true);
        try {
            const res = await fetch(`/api/v1/super-admin/users/${userId}/role`, {
                method: 'PUT',
                headers: getRbacHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ role: newRole }),
            });
            const json = await res.json();
            if (!res.ok) {
                notify(json.message || 'Could not update role.', 'error');
            } else {
                invalidateClientCache();
                notify(json.message, 'success');
                fetchSuperAdmin(logLevel, true);
            }
        } catch (err) {
            notify('Error updating user role.', 'error');
        } finally {
            setBusy(false);
        }
    };

    const handleResolveLog = async (logId) => {
        try {
            const res = await fetch(`/api/v1/super-admin/logs/${logId}/resolve`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();
            if (res.ok) {
                invalidateClientCache();
                notify(json.message, 'success');
                fetchSuperAdmin(logLevel, true);
            }
        } catch (err) {
            notify('Error resolving log.', 'error');
        }
    };

    const handleSimulateDiagnostic = async (scenario) => {
        setBusy(true);
        try {
            const res = await fetch('/api/v1/super-admin/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ scenario }),
            });
            const json = await res.json();
            if (res.ok) {
                invalidateClientCache();
                notify(json.message, 'success');
                if (json.log) {
                    setExpandedLogId(json.log.id);
                }
                fetchSuperAdmin(logLevel, true);
            }
        } catch (err) {
            notify('Diagnostic simulation failed.', 'error');
        } finally {
            setBusy(false);
        }
    };

    if (loading && !data) {
        return <DashboardPortalSkeleton dark />;
    }

    const health = data?.health || {};
    const logCounts = data?.log_counts || {};
    const logs = data?.logs || [];
    const softDeleted = data?.soft_deleted || {};

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden min-h-[82vh]">
                {/* Top Command Header */}
                <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black tracking-tight text-white">
                                    SUPER ADMIN OBSERVATORY
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    {health.overall_status || 'HEALTHY'} • {health.uptime_percentage}% Uptime
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                System Health • Crash Logs & Stack Traces • Soft-Deleted Data Recovery Vault • WAF, Rate Limiter & Load Balancer
                            </p>
                        </div>
                    </div>

                    {/* Navigation Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('health')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'health'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            System Health & Load Balancer
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('crashlogs')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'crashlogs'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <span>Crash Logs & WAF Telemetry</span>
                            {logCounts.unresolved_crashes > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                                    {logCounts.unresolved_crashes}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('vault')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'vault'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <span>Soft-Deleted Data Vault</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                                {softDeleted.total_trashed ?? 0}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => fetchSuperAdmin(logLevel)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                            title="Refresh Telemetry"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <div className="p-6 space-y-6">
                    {/* Top Telemetry Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">MySQL Latency</div>
                            <div className="text-2xl font-black text-emerald-400 mt-1">
                                {health.database?.latency_ms ?? 0.8} ms
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                DB: {health.database?.database_name}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">Memory Footprint</div>
                            <div className="text-2xl font-black text-cyan-400 mt-1">
                                {health.resources?.memory_usage_mb ?? 24} MB
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                Peak: {health.resources?.memory_peak_mb ?? 28} MB
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">Disk Available</div>
                            <div className="text-2xl font-black text-white mt-1">
                                {health.resources?.disk_free_gb ?? 120} GB
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                {health.resources?.disk_used_percent ?? 35}% utilized
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">Crash Exceptions</div>
                            <div className="text-2xl font-black text-red-400 mt-1">
                                {logCounts.crashes ?? 0}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                {logCounts.unresolved_crashes ?? 0} unresolved
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">WAF & Rate Blocks</div>
                            <div className="text-2xl font-black text-amber-400 mt-1">
                                {(logCounts.security_events ?? 0) + (logCounts.rate_limit_blocks ?? 0)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                Attacks neutralized
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">Soft-Deleted Vault</div>
                            <div className="text-2xl font-black text-purple-400 mt-1">
                                {softDeleted.total_trashed ?? 0}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                Recoverable records
                            </div>
                        </div>
                    </div>

                    {/* TAB 1: SYSTEM HEALTH, LOAD BALANCER, CDN, RATE LIMITER & WAF */}
                    {activeTab === 'health' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Load Balancer & Multi-Node Cluster Topology */}
                            <div className="lg:col-span-6 bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-wide">
                                            Load Balancer & CDN Edge Cluster
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Algorithm: {health.infrastructure?.load_balancer?.algorithm}
                                        </p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                                        {health.infrastructure?.load_balancer?.status}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {(health.infrastructure?.load_balancer?.nodes || []).map((node) => (
                                        <div
                                            key={node.id}
                                            className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="font-mono text-xs font-bold text-emerald-400">
                                                    {node.id}
                                                </div>
                                                <div className="text-xs text-slate-400">{node.role}</div>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                                    {node.status}
                                                </span>
                                                <div className="text-[11px] text-slate-400 mt-1">
                                                    Load: {node.load} • Ping: {node.latency_ms} ms
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                                    <div className="text-xs font-bold text-cyan-400">
                                        CDN & Edge Caching Policy ({health.infrastructure?.cdn?.status})
                                    </div>
                                    <p className="text-xs text-slate-300">
                                        {health.infrastructure?.cdn?.provider}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        {health.infrastructure?.cdn?.cache_policy}
                                    </p>
                                </div>
                            </div>

                            {/* Multi-Tier Rate Limiter & Hardened Security Shields */}
                            <div className="lg:col-span-6 bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-wide">
                                            Zero-Trust Security & Rate Limiter Shield
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Active protection against SQLi, XSS, CSRF, Clickjacking, and DDoS bursts
                                        </p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 text-[10px] font-black uppercase">
                                        {health.infrastructure?.rate_limiter?.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {(health.infrastructure?.rate_limiter?.tiers || []).map((tier) => (
                                        <div
                                            key={tier.name}
                                            className="p-3 rounded-lg bg-slate-950 border border-slate-800"
                                        >
                                            <div className="text-[11px] font-bold text-slate-400">{tier.name}</div>
                                            <div className="text-xs font-black text-amber-400 mt-1">{tier.limit}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    {(health.infrastructure?.security_shields || []).map((shield) => (
                                        <div
                                            key={shield.name}
                                            className="px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                                        >
                                            <span className="font-bold text-slate-200">{shield.name}</span>
                                            <span className="text-emerald-400 font-mono text-[11px]">
                                                ✓ {shield.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: CRASH LOGS, EXCEPTIONS & SECURITY WAF LOGS */}
                    {activeTab === 'crashlogs' && (
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-black text-white">
                                        Crash Logs, Stack Traces & Security WAF Stream
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {['ALL', 'CRITICAL', 'SECURITY', 'WARNING', 'INFO'].map((lvl) => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => handleFilterLevel(lvl)}
                                                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${logLevel === lvl
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Live Diagnostic Simulator Buttons */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => handleSimulateDiagnostic('crash')}
                                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold transition cursor-pointer"
                                    >
                                        + Simulate Crash Exception
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => handleSimulateDiagnostic('security_probe')}
                                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer"
                                    >
                                        + Simulate WAF Attack Block
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => handleSimulateDiagnostic('rate_limit')}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition cursor-pointer"
                                    >
                                        + Simulate Rate-Limit 429
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => handleSimulateDiagnostic('resolve_all')}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                                    >
                                        ✓ Resolve All Alerts
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                                {logs.map((log) => {
                                    const isExpanded = expandedLogId === log.id;
                                    const badgeColor =
                                        log.level === 'CRITICAL'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                            : log.level === 'SECURITY'
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                : log.level === 'WARNING'
                                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                                                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

                                    return (
                                        <div
                                            key={log.id}
                                            className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span
                                                            className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase ${badgeColor}`}
                                                        >
                                                            {log.level} • {log.category}
                                                        </span>
                                                        <span className="font-mono text-xs text-slate-400">
                                                            [{log.method}] /{log.endpoint}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500">
                                                            IP: {log.ip_address} • {new Date(log.created_at).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <div className="font-bold text-sm text-white">
                                                        {log.message}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {log.stack_trace && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setExpandedLogId(isExpanded ? null : log.id)
                                                            }
                                                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                                                        >
                                                            {isExpanded ? 'Hide Stack Trace' : 'Inspect Trace'}
                                                        </button>
                                                    )}
                                                    {!log.is_resolved ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleResolveLog(log.id)}
                                                            className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold cursor-pointer"
                                                        >
                                                            Mark Resolved
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-emerald-400">
                                                            ✓ Resolved
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {isExpanded && log.stack_trace && (
                                                <div className="mt-3 p-3.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-red-300 overflow-x-auto whitespace-pre-wrap">
                                                    <div className="text-slate-400 mb-1">
                                                        Exception: {log.exception_class} ({log.file}:{log.line})
                                                    </div>
                                                    {log.stack_trace}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: SOFT-DELETED DATA RECOVERY VAULT */}
                    {activeTab === 'vault' && (
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-base font-black text-white">
                                        Soft-Deleted Data Vault & Disaster Recovery
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Inspect, restore, or permanently purge soft-deleted Reservations, Doctors, and User accounts.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setVaultSubTab('appointments')}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${vaultSubTab === 'appointments'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-800 text-slate-300'
                                            }`}
                                    >
                                        Reservations ({softDeleted.appointments?.length ?? 0})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVaultSubTab('doctors')}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${vaultSubTab === 'doctors'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-800 text-slate-300'
                                            }`}
                                    >
                                        Doctors ({softDeleted.doctors?.length ?? 0})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVaultSubTab('users')}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${vaultSubTab === 'users'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-800 text-slate-300'
                                            }`}
                                    >
                                        Users & Staff ({softDeleted.users?.length ?? 0})
                                    </button>
                                </div>
                            </div>

                            {vaultSubTab === 'appointments' && (
                                <div className="space-y-2.5">
                                    {(softDeleted.appointments || []).length === 0 ? (
                                        <div className="p-8 text-center text-xs text-slate-500">
                                            No soft-deleted reservations in vault.
                                        </div>
                                    ) : (
                                        (softDeleted.appointments || []).map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-black text-xs">
                                                            {item.ticket_number}
                                                        </span>
                                                        <span className="font-bold text-white text-sm">
                                                            {item.patient_name}
                                                        </span>
                                                        <span className="text-xs font-mono text-slate-500">
                                                            ({item.booking_reference})
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        Doctor: {item.doctor?.name} • Reason: {item.reason_for_visit} • Deleted At:{' '}
                                                        {new Date(item.deleted_at).toLocaleString()}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => handleRestore('appointment', item.id)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span>Restore Reservation</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => handleForceDelete('appointment', item.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-xs font-bold transition cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>Permanent Purge</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {vaultSubTab === 'doctors' && (
                                <div className="space-y-2.5">
                                    {(softDeleted.doctors || []).length === 0 ? (
                                        <div className="p-8 text-center text-xs text-slate-500">
                                            No soft-deleted doctor profiles in vault.
                                        </div>
                                    ) : (
                                        (softDeleted.doctors || []).map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4"
                                            >
                                                <div>
                                                    <div className="font-bold text-white text-sm">{doc.name}</div>
                                                    <div className="text-xs text-slate-400">
                                                        {doc.specialty} • License: {doc.license_number} • Room: {doc.room_number}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => handleRestore('doctor', doc.id)}
                                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                                                    >
                                                        Restore Doctor
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => handleForceDelete('doctor', doc.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 text-xs font-bold cursor-pointer"
                                                    >
                                                        Permanent Purge
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {vaultSubTab === 'users' && (
                                <div className="space-y-4">
                                    <div className="space-y-2.5">
                                        {(softDeleted.users || []).map((u) => (
                                            <div
                                                key={u.id}
                                                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4"
                                            >
                                                <div>
                                                    <div className="font-bold text-white text-sm">
                                                        {u.name} <span className="text-xs text-emerald-400">({u.role})</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {u.email} • Deleted: {new Date(u.deleted_at).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => handleRestore('user', u.id)}
                                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                                                    >
                                                        Restore Account
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => handleForceDelete('user', u.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 text-xs font-bold cursor-pointer"
                                                    >
                                                        Permanent Purge
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-slate-800">
                                        <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">
                                            Active System Accounts & RBAC Role Assignment
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {(data?.active_users || []).map((u) => (
                                                <div
                                                    key={u.id}
                                                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                                                >
                                                    <div>
                                                        <div className="font-bold text-white">{u.name}</div>
                                                        <div className="text-slate-400">{u.email}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={u.role}
                                                            onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                                                            className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] font-bold text-teal-300 focus:outline-none"
                                                        >
                                                            <option value="patient">PATIENT</option>
                                                            <option value="tv_display">TV DISPLAY</option>
                                                            <option value="staff">STAFF</option>
                                                            <option value="doctor">DOCTOR</option>
                                                            <option value="admin">ADMIN</option>
                                                            <option value="super_admin">SUPER ADMIN</option>
                                                        </select>
                                                        {u.role !== 'super_admin' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSoftDeleteUser(u.id)}
                                                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 text-[11px] font-bold cursor-pointer"
                                                            >
                                                                Soft Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

