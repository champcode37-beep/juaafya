import React, { memo } from 'react';
import { MoreHorizontal, FileText, Share2, AlertCircle, X } from 'lucide-react';
import { Patient } from '../../types';

interface RecentPatientsTableProps {
    patients: Patient[];
    activeMenuId: string | null;
    setActiveMenuId: (id: string | null) => void;
    handlePatientAction: (id: string, action: string) => void;
}

export const RecentPatientsTable: React.FC<RecentPatientsTableProps> = memo(({
    patients,
    activeMenuId,
    setActiveMenuId,
    handlePatientAction
}) => {
    // Take only the last 6 recent patients if array is large
    const recentPatients = patients.slice(0, 6);

    return (
        <div className="card-elegant overflow-hidden flex flex-col h-full">
            <div className="p-4 sm:p-8 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-transparent to-slate-50/50 dark:to-white/5">
                <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Patients</h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Latest registered individuals</p>
                </div>
                <button className="text-[10px] sm:text-xs font-black text-brand-blue bg-brand-blue/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl hover:bg-brand-blue hover:text-white transition-all uppercase tracking-wider">View All</button>
            </div>
            <div className="flex-1 table-container">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-50 dark:border-white/5">
                            <th className="px-4 sm:px-8 py-4 font-black">Patient</th>
                            <th className="hidden sm:table-cell px-6 py-4 font-black">Age/Gender</th>
                            <th className="hidden lg:table-cell px-6 py-4 font-black">Last Visit</th>
                            <th className="px-6 py-4 font-black">Status</th>
                            <th className="px-4 sm:px-8 py-4 text-right font-black">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {recentPatients.map((patient) => (
                            <tr key={patient.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all outline-none">
                                <td className="px-4 sm:px-8 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-colors text-xs sm:text-base">
                                            {patient.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-none mb-1 truncate">{patient.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium font-mono truncate">{patient.phone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden sm:table-cell px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{patient.age}Y • {patient.gender}</span>
                                </td>
                                <td className="hidden lg:table-cell px-6 py-4">
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-500 font-mono tracking-tight">{patient.lastVisit}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${patient.id.startsWith('P') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/30'}`}>
                                        Active
                                    </span>
                                </td>
                                <td className="px-4 sm:px-8 py-4 text-right relative">
                                    <button
                                        onClick={() => setActiveMenuId(activeMenuId === patient.id ? null : patient.id)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-brand-blue"
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>

                                    {activeMenuId === patient.id && (
                                        <div className="absolute right-4 sm:right-8 top-12 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <div className="p-2 space-y-1">
                                                <button onClick={() => handlePatientAction(patient.id, 'Record')} className="w-full flex items-center p-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                                    <FileText className="w-4 h-4 mr-3 text-brand-blue" />
                                                    Medical Records
                                                </button>
                                                <button onClick={() => handlePatientAction(patient.id, 'Refer')} className="w-full flex items-center p-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                                    <Share2 className="w-4 h-4 mr-3 text-brand-teal" />
                                                    Refer Patient
                                                </button>
                                                <button onClick={() => handlePatientAction(patient.id, 'Report')} className="w-full flex items-center p-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors">
                                                    <AlertCircle className="w-4 h-4 mr-3" />
                                                    Flag Record
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {patients.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-brand-dark/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-white/10">
                            <AlertCircle className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-slate-400 font-bold mb-1">No patients found</h4>
                        <p className="text-slate-400 text-xs">Start by registering your first patient</p>
                    </div>
                )}
            </div>
        </div>
    );
});

RecentPatientsTable.displayName = 'RecentPatientsTable';
