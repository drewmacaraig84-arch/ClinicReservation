import React from 'react';

export function ShimmerBlock({ className = 'h-4 w-full rounded-md' }) {
    return (
        <div
            className={`bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-pulse ${className}`}
        />
    );
}

export function ClientWebsiteSkeleton() {
    return (
        <div className="w-full space-y-6 pb-12">
            {/* Top Utility Bar Skeleton */}
            <div className="bg-[#13467b] h-10 w-full px-6 flex items-center justify-between">
                <div className="flex gap-4">
                    <div className="h-3 w-40 bg-blue-300/30 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-blue-300/30 rounded animate-pulse" />
                </div>
                <div className="flex gap-3">
                    <div className="h-3 w-20 bg-blue-300/30 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-blue-300/30 rounded animate-pulse" />
                </div>
            </div>

            {/* Main Nav Skeleton */}
            <div className="max-w-7xl mx-auto px-6 py-4 bg-white rounded-xl shadow-xs flex items-center justify-between">
                <ShimmerBlock className="h-10 w-48 rounded-lg" />
                <div className="hidden md:flex gap-6">
                    <ShimmerBlock className="h-4 w-20 rounded" />
                    <ShimmerBlock className="h-4 w-28 rounded" />
                    <ShimmerBlock className="h-4 w-28 rounded" />
                    <ShimmerBlock className="h-4 w-20 rounded" />
                    <ShimmerBlock className="h-4 w-24 rounded" />
                </div>
                <ShimmerBlock className="h-10 w-36 rounded-lg" />
            </div>

            {/* Hero Skeleton */}
            <div className="max-w-7xl mx-auto px-6">
                <div className="h-72 rounded-2xl bg-slate-200 animate-pulse p-10 flex flex-col justify-center items-center space-y-4">
                    <div className="h-8 w-96 max-w-full bg-slate-300 rounded-lg" />
                    <div className="h-4 w-80 max-w-full bg-slate-300 rounded" />
                    <div className="h-10 w-36 bg-slate-300 rounded-lg mt-2" />
                </div>
            </div>

            {/* Booking & Queue Grid Skeleton */}
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-white rounded-xl p-6 border border-slate-200 space-y-4">
                    <ShimmerBlock className="h-5 w-44 rounded" />
                    <ShimmerBlock className="h-12 w-32 rounded-lg" />
                    <ShimmerBlock className="h-4 w-full rounded" />
                    <ShimmerBlock className="h-10 w-full rounded-lg" />
                </div>
                <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-slate-200 space-y-5">
                    <ShimmerBlock className="h-6 w-56 rounded" />
                    <div className="grid grid-cols-2 gap-4">
                        <ShimmerBlock className="h-11 w-full rounded-lg" />
                        <ShimmerBlock className="h-11 w-full rounded-lg" />
                    </div>
                    <div className="flex gap-3">
                        <ShimmerBlock className="h-9 w-24 rounded-full" />
                        <ShimmerBlock className="h-9 w-24 rounded-full" />
                        <ShimmerBlock className="h-9 w-24 rounded-full" />
                        <ShimmerBlock className="h-9 w-28 rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <ShimmerBlock className="h-10 w-full rounded-lg" />
                        <ShimmerBlock className="h-10 w-full rounded-lg" />
                        <ShimmerBlock className="h-10 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function DashboardPortalSkeleton({ dark = false }) {
    const bgOuter = dark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200';
    const bgCard = dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
    const pulse = dark ? 'bg-slate-800 animate-pulse' : 'bg-slate-200 animate-pulse';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className={`rounded-2xl shadow-xl border overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[78vh] ${bgOuter}`}>
                <div className="lg:col-span-3 xl:col-span-2 bg-slate-900 p-5 space-y-5">
                    <div className="h-8 w-36 bg-slate-800 rounded-lg animate-pulse" />
                    <div className="space-y-2.5 pt-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-9 w-full bg-slate-800 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-9 xl:col-span-10 p-6 space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`rounded-xl p-5 border space-y-3 ${bgCard}`}>
                                <div className={`h-3 w-24 rounded ${pulse}`} />
                                <div className={`h-8 w-20 rounded-lg ${pulse}`} />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className={`lg:col-span-8 rounded-xl p-6 border space-y-4 ${bgCard}`}>
                            <div className={`h-5 w-48 rounded ${pulse}`} />
                            {[1, 2, 3, 4, 5].map((row) => (
                                <div key={row} className={`h-12 w-full rounded-lg ${pulse}`} />
                            ))}
                        </div>
                        <div className={`lg:col-span-4 rounded-xl p-6 border space-y-4 ${bgCard}`}>
                            <div className={`h-5 w-36 rounded ${pulse}`} />
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className={`h-10 w-full rounded-lg ${pulse}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
