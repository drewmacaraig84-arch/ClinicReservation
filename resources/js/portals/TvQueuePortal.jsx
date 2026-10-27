import React, { useState, useEffect } from 'react';
import CarePointLogo from '../components/CarePointLogo';
import { ArrowRight, RefreshCw, Volume2 } from 'lucide-react';

export default function TvQueuePortal() {
    const [catalog, setCatalog] = useState(null);
    const [clock, setClock] = useState('');

    const fetchQueue = async () => {
        try {
            const res = await fetch('/api/v1/public/catalog');
            const data = await res.json();
            setCatalog(data);
        } catch (e) {
            // ignore transient network errors on TV display
        }
    };

    useEffect(() => {
        fetchQueue();
        const poll = setInterval(fetchQueue, 5000);
        return () => clearInterval(poll);
    }, []);

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setClock(
                now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                })
            );
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    const nowServing = catalog?.queue?.now_serving || [];
    const upcoming = catalog?.queue?.upcoming || [];
    const tickerNews =
        catalog?.ticker_news ||
        'Flu vaccines are now available. Inquiry at the reception desk. • Please keep your ticket number ready when called.';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {/* Outer TV Bezel Frame matching Mockup Top-Right */}
            <div className="rounded-2xl bg-slate-900 p-3 shadow-2xl border-4 border-slate-800">
                <div className="rounded-xl bg-white overflow-hidden flex flex-col min-h-[76vh]">
                    {/* Top TV Banner: CarePoint Clinic + Huge Clock (02:45 PM) */}
                    <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-100 px-8 py-5 border-b border-slate-300 flex items-center justify-between">
                        <CarePointLogo size="lg" />
                        <div className="flex items-center gap-5">
                            <button
                                type="button"
                                onClick={fetchQueue}
                                className="p-2 rounded-lg bg-white/80 hover:bg-white text-slate-600 border border-slate-200 transition cursor-pointer"
                                title="Refresh Live Display"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 tabular-nums">
                                {clock || '02:45 PM'}
                            </div>
                        </div>
                    </div>

                    {/* Subheader Bar: NOW SERVING | UPCOMING QUEUE */}
                    <div className="grid grid-cols-12 bg-slate-900 text-white font-extrabold text-sm sm:text-base tracking-wider uppercase">
                        <div className="col-span-12 lg:col-span-8 px-8 py-3 border-b lg:border-b-0 lg:border-r border-slate-700 flex items-center justify-between">
                            <span>NOW SERVING</span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 normal-case">
                                <Volume2 className="w-4 h-4 animate-bounce" />
                                Audio Chime Active
                            </span>
                        </div>
                        <div className="col-span-12 lg:col-span-4 px-8 py-3 bg-slate-800 text-center">
                            UPCOMING QUEUE
                        </div>
                    </div>

                    {/* Main Split TV Body */}
                    <div className="grid grid-cols-12 flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-300">
                        {/* Left 8 Cols: NOW SERVING Large Cards */}
                        <div className="col-span-12 lg:col-span-8 divide-y divide-slate-200 flex flex-col justify-center bg-white">
                            {nowServing.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 font-bold text-xl">
                                    Standby — Next ticket will be called shortly
                                </div>
                            ) : (
                                nowServing.slice(0, 3).map((ticket) => (
                                    <div key={ticket.id} className="px-8 sm:px-12 py-8 flex flex-col justify-center">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-lg sm:text-xl font-bold text-slate-700">
                                                Ticket No.
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                                                {ticket.status === 'called' ? 'Calling to Desk / Room' : 'Now Serving'} • {ticket.doctor?.name}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                                            <span className="text-5xl sm:text-7xl font-black tracking-tight text-slate-900">
                                                {ticket.ticket_number}
                                            </span>
                                            <ArrowRight className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-600 stroke-[3]" />
                                            <span className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 uppercase">
                                                {ticket.assigned_room || 'ROOM 1'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Right 4 Cols: UPCOMING QUEUE List (G-105 ROOM 1, A-103 ROOM 1, C-301 ROOM 3, B-205 ROOM 2, G-106 ROOM 3) */}
                        <div className="col-span-12 lg:col-span-4 bg-slate-100 p-6 space-y-3 overflow-y-auto">
                            {upcoming.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 font-semibold">
                                    No waiting tickets in queue
                                </div>
                            ) : (
                                upcoming.slice(0, 7).map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between"
                                    >
                                        <div>
                                            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                                {item.ticket_number}
                                            </span>
                                            <span className="block text-[11px] font-semibold text-slate-500">
                                                {item.doctor?.name}
                                            </span>
                                        </div>
                                        <span className="text-base sm:text-lg font-bold text-slate-700 uppercase">
                                            {item.assigned_room || 'ROOM 1'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Bottom Teal Banner: Please watch this screen for your turn */}
                    <div className="bg-teal-700 text-white text-center py-2.5 px-4 font-bold text-base sm:text-lg tracking-wide">
                        Please watch this screen for your turn
                    </div>

                    {/* Bottom Dark Ticker News Bar */}
                    <div className="bg-slate-950 text-white flex items-center overflow-hidden border-t border-slate-800">
                        <div className="bg-slate-900 px-5 py-3 font-extrabold text-sm text-teal-400 shrink-0 border-r border-slate-700 z-10">
                            Ticker News/Updates
                        </div>
                        <div className="flex-1 overflow-hidden py-3 px-4">
                            <div className="animate-marquee text-sm font-medium text-slate-200">
                                <span className="mx-6">{tickerNews}</span>
                                <span className="mx-6 text-teal-400">•</span>
                                <span className="mx-6">{tickerNews}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

