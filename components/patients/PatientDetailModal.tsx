import React, { memo } from 'react';
import { Activity, FileText, Sparkles, X, MessageSquare, Phone, Printer, Edit2, Trash2, Loader2, Send, Check, Plus } from 'lucide-react';
import { Patient } from '../../types';
import { getAvatarUrl } from '../../lib/utils';
import { formatAmount } from '../../services/paymentService';

interface PatientDetailModalProps {
    patient: Patient;
    onClose: () => void;
    onEdit: (p: Patient) => void;
    onDelete: (id: string) => void;
    onAnalyzeNotes: (notes: string) => void;
    isAnalyzing: boolean;
    aiAnalysis: string | null;
    onDraftSms: (p: Patient) => void;
    showSmsModal: boolean;
    draftingSms: boolean;
    sendingSms: boolean;
    smsDraft: string;
    setSmsDraft: (s: string) => void;
    onConfirmSendSms: () => void;
    setShowSmsModal: (b: boolean) => void;
    isEditingVitals: boolean;
    setIsEditingVitals: (b: boolean) => void;
    tempVitals: { bp: string; heartRate: string; temp: string; weight: string };
    setTempVitals: (v: any) => void;
    onSaveVitals: () => void;
    isAddingHistory: boolean;
    setIsAddingHistory: (b: boolean) => void;
    newHistoryNote: string;
    setNewHistoryNote: (s: string) => void;
    onSaveHistory: () => void;
    canDelete: boolean;
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = memo(({
    patient,
    onClose,
    onEdit,
    onDelete,
    onAnalyzeNotes,
    isAnalyzing,
    aiAnalysis,
    onDraftSms,
    showSmsModal,
    draftingSms,
    sendingSms,
    smsDraft,
    setSmsDraft,
    onConfirmSendSms,
    setShowSmsModal,
    isEditingVitals,
    setIsEditingVitals,
    tempVitals,
    setTempVitals,
    onSaveVitals,
    isAddingHistory,
    setIsAddingHistory,
    newHistoryNote,
    setNewHistoryNote,
    onSaveHistory,
    canDelete
}) => {
    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-0 md:p-6 no-print">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="bg-white dark:bg-slate-800 w-full md:max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-4 sm:p-6 flex items-start justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 shrink-0">
                            <img src={getAvatarUrl(patient.name)} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                {patient.name}
                                <span className="hidden sm:inline text-sm font-normal text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{patient.id}</span>
                            </h2>
                            <div className="flex flex-wrap items-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5 sm:mt-1 gap-x-3 gap-y-1">
                                <span>{patient.gender}</span>
                                <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                <span>{patient.age} Years</span>
                                <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                <span className="truncate">{patient.phone}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button
                            onClick={() => onEdit(patient)}
                            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                            title="Edit Patient"
                        >
                            <Edit2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-8 bg-gray-50/50 dark:bg-slate-900/50">
                    {/* Quick Actions Row */}
                    <div className="flex gap-2.5 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => onDraftSms(patient)}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-xl font-bold text-[11px] sm:text-xs hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors whitespace-nowrap shadow-sm"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Draft AI Reminder
                        </button>
                        <button
                            onClick={() => onEdit(patient)}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-xl font-bold text-[11px] sm:text-xs hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors whitespace-nowrap shadow-sm"
                        >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                            onClick={() => window.location.href = `tel:${patient.phone}`}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-xl font-bold text-[11px] sm:text-xs hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors whitespace-nowrap shadow-sm"
                        >
                            <Phone className="w-3.5 h-3.5" /> Call
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-xl font-bold text-[11px] sm:text-xs hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors whitespace-nowrap shadow-sm"
                        >
                            <Printer className="w-3.5 h-3.5" /> Export
                        </button>
                        <button
                            onClick={() => onDelete(patient.id)}
                            disabled={!canDelete}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-2 ${canDelete ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-200 dark:border-red-900/30 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'} border rounded-xl font-bold text-[11px] sm:text-xs transition-colors whitespace-nowrap`}
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </div>

                    {/* SMS Modal */}
                    {showSmsModal && (
                        <div className="bg-white dark:bg-slate-800 border border-brand-100 dark:border-slate-600 rounded-2xl p-4 shadow-xl animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-brand-800 dark:text-brand-300 flex items-center gap-2 text-sm">
                                    <Sparkles className="w-4 h-4" /> AI Generated SMS Draft
                                </h4>
                                <button onClick={() => setShowSmsModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                            </div>
                            {draftingSms ? (
                                <div className="py-4 flex items-center justify-center text-slate-400 text-sm">
                                    <Activity className="w-4 h-4 animate-spin mr-2" /> Drafting message...
                                </div>
                            ) : (
                                <textarea
                                    className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-slate-700 dark:text-slate-200 text-sm border border-slate-200 dark:border-slate-600 w-full h-24 focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                                    value={smsDraft}
                                    onChange={(e) => setSmsDraft(e.target.value)}
                                />
                            )}
                            {!draftingSms && (
                                <div className="mt-3 flex justify-end gap-2">
                                    <button
                                        onClick={onConfirmSendSms}
                                        disabled={sendingSms}
                                        className="text-xs font-semibold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {sendingSms ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                        Send SMS
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Detailed Notes with AI */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                        Clinical Notes
                                    </h3>
                                    <button
                                        onClick={() => onAnalyzeNotes(patient.notes)}
                                        disabled={isAnalyzing}
                                        className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        {isAnalyzing ? <Activity className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                        Summarize with AI
                                    </button>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{patient.notes}</p>

                                {aiAnalysis && (
                                    <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-sm whitespace-pre-line animate-in fade-in">
                                        <div className="flex items-center gap-2 mb-2 font-bold text-indigo-700 dark:text-indigo-300">
                                            <Sparkles className="w-4 h-4" /> Smart Summary
                                        </div>
                                        {aiAnalysis}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Visit History</h3>
                                    <button
                                        onClick={() => setIsAddingHistory(!isAddingHistory)}
                                        className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Visit
                                    </button>
                                </div>

                                {isAddingHistory && (
                                    <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-2">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">New Visit Summary</label>
                                        <textarea
                                            value={newHistoryNote}
                                            onChange={(e) => setNewHistoryNote(e.target.value)}
                                            placeholder="Enter visit summary (e.g. 'Routine Checkup - Prescribed Antibiotics')..."
                                            className="w-full text-sm p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white mb-3 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                                            rows={3}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setIsAddingHistory(false)}
                                                className="text-xs px-3 py-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors font-medium"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={onSaveHistory}
                                                className="text-xs px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold"
                                            >
                                                Save Record
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {patient.history.length > 0 ? patient.history.map((record: string, i: number) => (
                                        <div key={i} className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-700 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                                <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">{record}</span>
                                            </div>
                                            <button className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">View Report</button>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-slate-400 italic">No previous visit history.</p>
                                    )}
                                </div>
                            </div>

                            {/* Medical Information & Emergency Contact */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-red-500" />
                                        Medical Info
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase block">Blood Group</span>
                                            <span className="text-sm font-bold text-red-600 dark:text-red-400">{patient.bloodGroup || 'Not Specified'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase block">Allergies</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {patient.allergies && patient.allergies.length > 0 ? (
                                                    patient.allergies.map((a: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs font-medium border border-red-100 dark:border-red-900/30">{a}</span>
                                                    ))
                                                ) : <span className="text-sm text-slate-500 italic">None reported</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase block">Medical History</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {patient.history && patient.history.length > 0 ? (
                                                    patient.history.map((h: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded text-xs font-medium border border-orange-100 dark:border-orange-900/30">{h}</span>
                                                    ))
                                                ) : <span className="text-sm text-slate-500 italic">None reported</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Phone className="w-5 h-5 text-blue-500" />
                                        Emergency Contact
                                    </h3>
                                    {patient.emergencyContact?.name ? (
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase block">Name</span>
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{patient.emergencyContact.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase block">Relationship</span>
                                                <span className="text-sm text-slate-600 dark:text-slate-400">{patient.emergencyContact.relationship}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase block">Phone</span>
                                                <a href={`tel:${patient.emergencyContact.phone}`} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">{patient.emergencyContact.phone}</a>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No emergency contact provided.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Vitals Sidebar */}
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase">Vitals (Latest)</h4>
                                    {!isEditingVitals ? (
                                        <button
                                            onClick={() => {
                                                setTempVitals({
                                                    bp: patient.vitals?.bp || '',
                                                    heartRate: patient.vitals?.heartRate || '',
                                                    temp: patient.vitals?.temp || '',
                                                    weight: patient.vitals?.weight || ''
                                                });
                                                setIsEditingVitals(true);
                                            }}
                                            className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-bold"
                                        >
                                            <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsEditingVitals(false)}
                                                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={onSaveVitals}
                                                className="text-xs text-teal-600 font-bold hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1"
                                            >
                                                <Check className="w-3 h-3" /> Save
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Blood Pressure</div>
                                        {isEditingVitals ? (
                                            <input
                                                value={tempVitals.bp}
                                                onChange={(e) => setTempVitals({ ...tempVitals, bp: e.target.value })}
                                                className="w-full text-lg font-bold p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                                                placeholder="120/80"
                                            />
                                        ) : (
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{patient.vitals?.bp || '--/--'}</div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Heart Rate</div>
                                        <div className="flex items-center gap-2">
                                            {isEditingVitals ? (
                                                <input
                                                    value={tempVitals.heartRate}
                                                    onChange={(e) => setTempVitals({ ...tempVitals, heartRate: e.target.value })}
                                                    className="w-full text-lg font-bold p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                                                    placeholder="72"
                                                />
                                            ) : (
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{patient.vitals?.heartRate || '--'}</span>
                                            )}
                                            <span className="text-sm font-normal text-slate-400">bpm</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Temperature</div>
                                        <div className="flex items-center gap-2">
                                            {isEditingVitals ? (
                                                <input
                                                    value={tempVitals.temp}
                                                    onChange={(e) => setTempVitals({ ...tempVitals, temp: e.target.value })}
                                                    className="w-full text-lg font-bold p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                                                    placeholder="36.5"
                                                />
                                            ) : (
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{patient.vitals?.temp || '--'}</span>
                                            )}
                                            <span className="text-sm font-normal text-slate-400">°C</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Weight</div>
                                        <div className="flex items-center gap-2">
                                            {isEditingVitals ? (
                                                <input
                                                    value={tempVitals.weight}
                                                    onChange={(e) => setTempVitals({ ...tempVitals, weight: e.target.value })}
                                                    className="w-full text-lg font-bold p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                                                    placeholder="70"
                                                />
                                            ) : (
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{patient.vitals?.weight || '--'}</span>
                                            )}
                                            <span className="text-sm font-normal text-slate-400">kg</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
});

PatientDetailModal.displayName = 'PatientDetailModal';
export default PatientDetailModal;
