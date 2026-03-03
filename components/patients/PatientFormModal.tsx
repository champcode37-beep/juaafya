import React, { memo } from 'react';
import { X, Save, User, Plus, Loader2 } from 'lucide-react';
import { Gender } from '../../types';

interface PatientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon: React.ReactNode;
    formData: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onVitalChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
}

const PatientFormModal: React.FC<PatientFormModalProps> = memo(({
    isOpen,
    onClose,
    title,
    icon,
    formData,
    onChange,
    onVitalChange,
    onSubmit,
    submitLabel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in no-print">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 sticky top-0 z-10">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        {icon} {title}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Basic Information</h4>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={onChange}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Age</label>
                                    <input
                                        name="age"
                                        type="number"
                                        value={formData.age}
                                        onChange={onChange}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={onChange}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value={Gender.Male}>Male</option>
                                        <option value={Gender.Female}>Female</option>
                                        <option value={Gender.Other}>Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={onChange}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Initial Vitals (Optional)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">BP (e.g. 120/80)</label>
                                <input name="bp" value={formData.vitals.bp} onChange={onVitalChange} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Weight (kg)</label>
                                <input name="weight" value={formData.vitals.weight} onChange={onVitalChange} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medical Notes</h4>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={onChange}
                            rows={3}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                            placeholder="Initial clinical observations..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800 pb-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

PatientFormModal.displayName = 'PatientFormModal';
export default PatientFormModal;
