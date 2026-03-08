import React, { memo } from 'react';
import { Calendar, ChevronDown, Bell, CheckCircle, Clock } from 'lucide-react';
import { Appointment } from '../../types';

interface UpcomingAppointmentsProps {
    appointments: Appointment[];
    selectedDate: string;
    setSelectedDate: (date: string) => void;
}

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = memo(({
    appointments,
    selectedDate,
    setSelectedDate
}) => {
    // Filter appointments for the selected date
    const filteredAppts = appointments
        .filter(a => a.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time));

    return (
        <div className="bg-white dark:bg-[#121721]/40 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-white/5 bg-gradient-to-r from-transparent to-slate-50/30 dark:to-white/5">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Timeline</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Today's schedule</p>
                    </div>
                    <Calendar className="w-5 h-5 text-brand-blue" />
                </div>

                {/* Date Tabs (Mock for demo, can be improved to show actual dates) */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[0, 1, 2, 3, 4].map((offset) => {
                        const date = new Date();
                        date.setDate(date.getDate() + offset);
                        const isoDate = date.toISOString().split('T')[0];
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNum = date.getDate();
                        const isActive = selectedDate === isoDate;

                        return (
                            <button
                                key={isoDate}
                                onClick={() => setSelectedDate(isoDate)}
                                className={`flex flex-col items-center min-w-[50px] py-3 rounded-2xl transition-all duration-300 ${isActive
                                    ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <span className={`text-[10px] font-bold uppercase mb-1 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{dayName}</span>
                                <span className="text-sm font-black tracking-tighter">{dayNum}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px] scrollbar-hide">
                {filteredAppts.length > 0 ? (
                    filteredAppts.map((appt) => (
                        <div key={appt.id} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">{appt.time}</span>
                                <div className="w-px h-full bg-slate-100 dark:bg-white/5 relative">
                                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-2 border-white dark:border-brand-dark transition-all duration-300 ${appt.status === 'Completed' ? 'bg-emerald-500' : 'bg-brand-blue group-hover:scale-125'
                                        }`}></div>
                                </div>
                            </div>
                            <div className={`flex-1 p-4 rounded-2xl transition-all duration-300 border ${appt.status === 'Completed'
                                ? 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 opacity-60'
                                : 'bg-white dark:bg-slate-800/50 border-slate-50 dark:border-white/5 hover:border-brand-blue/30 group-hover:shadow-md'
                                }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1">{appt.patientName}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{appt.reason}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${appt.status === 'Completed' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
                                        }`}>
                                        {appt.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center opacity-50">
                        <Clock className="w-8 h-8 text-slate-300 mb-3" />
                        <p className="text-xs font-bold text-slate-400">No appointments for this date</p>
                    </div>
                )}
            </div>

            <div className="p-6 pt-0">
                <button className="w-full py-3.5 bg-brand-dark dark:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-[0.98]">
                    Schedule New
                </button>
            </div>
        </div>
    );
});

UpcomingAppointments.displayName = 'UpcomingAppointments';
