import React from "react"

const ShellSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-200">
            {/* Sidebar Skeleton */}
            <div className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-900 fixed left-4 top-4 bottom-4 rounded-3xl z-20 shadow-2xl overflow-hidden p-6 animate-pulse">
                <div className="h-10 w-32 bg-slate-800 rounded-xl mb-12"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-12 w-full bg-slate-800/50 rounded-2xl"></div>
                    ))}
                </div>
                <div className="mt-auto h-16 w-full bg-slate-800/50 rounded-2xl"></div>
            </div>

            {/* Main Content Skeleton */}
            <main className="flex-1 md:ml-72 lg:ml-80 w-full p-4 md:p-8 space-y-8 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-8 w-48 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
                    </div>
                    <div className="flex gap-4">
                        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    </div>
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700"></div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[400px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700"></div>
                    <div className="h-[400px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700"></div>
                </div>
            </main>
        </div>
    )
}

export default ShellSkeleton
