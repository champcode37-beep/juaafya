import React, { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subValue: string;
    icon: React.ElementType;
    trend?: 'up' | 'down';
    trendValue?: string;
    colorClass: string;
    iconColorClass: string;
}

export const StatCard: React.FC<StatCardProps> = memo(({
    title,
    value,
    subValue,
    icon: Icon,
    trend,
    trendValue,
    colorClass,
    iconColorClass
}) => {
    return (
        <div className="card-elegant p-4 sm:p-6 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${iconColorClass} transition-transform duration-500 group-hover:scale-110`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold ${trend === 'up' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'}`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {trendValue}
                    </div>
                )}
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold mb-1 tracking-tight">{title}</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs font-medium mt-1">{subValue}</p>
            </div>
        </div>
    );
});

StatCard.displayName = 'StatCard';
