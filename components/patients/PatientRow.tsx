import React, { memo } from 'react';
import { Patient } from '../../types';
import { MoreHorizontal, Eye, Edit2, Phone, Trash2, MessageSquare, Printer } from 'lucide-react';
import { getAvatarUrl } from '../../lib/utils';
import { canCurrentUser } from '../../lib/roleMapper';

interface PatientRowProps {
    patient: Patient;
    onView: (p: Patient) => void;
    onEdit: (p: Patient) => void;
    onDelete: (id: string) => void;
    onSms: (p: Patient) => void;
    onCall: (phone: string) => void;
    activeMenuId: string | null;
    setActiveMenuId: (id: string | null) => void;
}

const PatientRow: React.FC<PatientRowProps> = memo(({
    patient,
    onView,
    onEdit,
    onDelete,
    onSms,
    onCall,
    activeMenuId,
    setActiveMenuId
}) => {
    const canDelete = canCurrentUser('patients.delete');

    return (
        <tr className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all group">
            <td className="px-4 sm:px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm bg-slate-100 dark:bg-slate-800 shrink-0">
                        <img src={getAvatarUrl(patient.name)} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">{patient.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tight">{patient.id}</div>
                    </div>
                </div>
            </td>
            <td className="px-4 py-4 hidden sm:table-cell">
                <div className="flex flex-col">
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">{patient.phone}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-black">Contact</span>
                </div>
            </td>
            <td className="px-4 py-4 hidden xl:table-cell text-center">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-black border border-slate-200 dark:border-white/5">{patient.age}Y</span>
            </td>
            <td className="px-4 py-4">
                <div className="flex flex-col">
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">{patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'No visit'}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-black">History</span>
                </div>
            </td>
            <td className="px-4 sm:px-6 py-4 text-right relative">
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => onView(patient)}
                        className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-all active:scale-90"
                        title="View Details"
                    >
                        <Eye className="w-5 h-5" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === patient.id ? null : patient.id);
                            }}
                            className={`p-2 rounded-xl transition-all active:scale-95 ${activeMenuId === patient.id ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {activeMenuId === patient.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => onEdit(patient)}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-brand-dark/40 flex items-center gap-3 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4 text-brand-blue" /> Edit Record
                                </button>
                                <button
                                    onClick={() => onSms(patient)}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-brand-dark/40 flex items-center gap-3 transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4 text-brand-teal" /> Draft SMS
                                </button>
                                <button
                                    onClick={() => onCall(patient.phone)}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-brand-dark/40 flex items-center gap-3 transition-colors"
                                >
                                    <Phone className="w-4 h-4 text-indigo-500" /> Call Patient
                                </button>
                                <button
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-brand-dark/40 flex items-center gap-3 transition-colors"
                                >
                                    <Printer className="w-4 h-4 text-slate-400" /> Print Summary
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-white/5 my-1 mx-2"></div>
                                <button
                                    onClick={() => onDelete(patient.id)}
                                    disabled={!canDelete}
                                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-3 transition-colors ${canDelete ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'text-slate-300 cursor-not-allowed'}`}
                                >
                                    <Trash2 className="w-4 h-4" /> Delete Record
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
});

PatientRow.displayName = 'PatientRow';
export default PatientRow;
