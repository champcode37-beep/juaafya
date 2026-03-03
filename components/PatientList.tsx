import React, { useState, useMemo, useCallback, memo } from 'react';
import { Patient, Gender, ClinicSettings } from '../types';
import { Search, Plus, Phone, FileText, Sparkles, X, Activity, MessageSquare, MoreHorizontal, Printer, Filter, Edit2, Save, User, Trash2, Send, Loader2, Eye, ChevronLeft, ChevronRight, Check, Upload, Download } from 'lucide-react';
import { exportService } from '../services/exportService';
import { analyzePatientNotes, draftAppointmentSms } from '../services/geminiService';
import { sendSMS } from '../services/smsService';
import BulkImportPatients from './BulkImportPatients';
import useStore from '../store'
import { canCurrentUser } from '../lib/roleMapper'
import { getAvatarUrl } from '../lib/utils'

// Modular Components
import PatientRow from './patients/PatientRow';
import PatientDetailModal from './patients/PatientDetailModal';
import PatientFormModal from './patients/PatientFormModal';

interface PatientListProps {
    patients: Patient[];
    addPatient: (p: Patient) => void;
    updatePatient: (p: Patient) => void;
    deletePatient: (id: string) => void;
    settings?: ClinicSettings;
}

const PatientList: React.FC<PatientListProps> = ({ patients, addPatient, updatePatient, deletePatient, settings }) => {
    const { actions } = useStore()

    const canDelete = canCurrentUser('patients.delete')
    const canExport = canCurrentUser('patients.export')
    const canCreate = canCurrentUser('patients.create')

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Action Menu State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Add/Edit Modals State
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);

    // Form Data State
    interface PatientFormData {
        id?: string;
        name: string;
        phone: string;
        age: string;
        gender: Gender;
        notes: string;
        allergies: string;
        history: string;
        bloodGroup: string;
        emergencyContactName: string;
        emergencyContactPhone: string;
        emergencyContactRel: string;
        vitals: {
            bp: string;
            heartRate: string;
            temp: string;
            weight: string;
        };
        fullHistory?: string[];
        lastVisit?: string;
    }

    const initialFormData: PatientFormData = {
        name: '', phone: '', age: '', gender: Gender.Male, notes: '',
        allergies: '', history: '', bloodGroup: '',
        emergencyContactName: '', emergencyContactPhone: '', emergencyContactRel: '',
        vitals: { bp: '', heartRate: '', temp: '', weight: '' },
        fullHistory: [],
        lastVisit: ''
    };

    const [formData, setFormData] = useState<PatientFormData>(initialFormData);

    // Detail View Internal States
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [showSmsModal, setShowSmsModal] = useState(false);
    const [draftingSms, setDraftingSms] = useState(false);
    const [sendingSms, setSendingSms] = useState(false);
    const [smsDraft, setSmsDraft] = useState('');
    const [isEditingVitals, setIsEditingVitals] = useState(false);
    const [tempVitals, setTempVitals] = useState({ bp: '', heartRate: '', temp: '', weight: '' });
    const [isAddingHistory, setIsAddingHistory] = useState(false);
    const [newHistoryNote, setNewHistoryNote] = useState('');

    // Filtering & Sorting State
    const [genderFilter, setGenderFilter] = useState<string>('All');
    const [minAge, setMinAge] = useState<string>('');
    const [maxAge, setMaxAge] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [sortBy, setSortBy] = useState<string>('Recent');

    const isPatientActive = useCallback((p: Patient) => {
        if (!p.lastVisit) return false;
        const daysSince = (Date.now() - new Date(p.lastVisit).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 365;
    }, []);

    const filtered = useMemo(() => patients
        .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.phone.includes(searchTerm) ||
                p.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
            const min = minAge ? Number(minAge) : undefined;
            const max = maxAge ? Number(maxAge) : undefined;
            const matchesAge = (!min || p.age >= min) && (!max || p.age <= max);
            const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? isPatientActive(p) : !isPatientActive(p));

            return matchesSearch && matchesGender && matchesAge && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'Name') return a.name.localeCompare(b.name);
            if (sortBy === 'Age') return a.age - b.age;
            return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
        }), [patients, searchTerm, genderFilter, sortBy, minAge, maxAge, statusFilter, isPatientActive]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedPatients = useMemo(() => filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ), [filtered, currentPage, itemsPerPage]);

    // Handlers
    const handleAnalyzeNotes = async (notes: string) => {
        setIsAnalyzing(true);
        setAiAnalysis(null);
        try {
            const result = await analyzePatientNotes(notes);
            setAiAnalysis(result);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDraftSms = async (patient: Patient) => {
        setShowSmsModal(true);
        setDraftingSms(true);
        try {
            const draft = await draftAppointmentSms(patient.name, "next Tuesday", "Follow-up checkup");
            setSmsDraft(draft);
        } finally {
            setDraftingSms(false);
        }
    };

    const handleConfirmSendSms = async () => {
        if (!selectedPatient || !smsDraft) return;
        setSendingSms(true);
        try {
            const result = await sendSMS({ phone_number: selectedPatient.phone, message: smsDraft });
            if (result.success) {
                actions.showToast(`SMS sent successfully to ${selectedPatient.name}!`, 'success');
                setShowSmsModal(false);
                setSmsDraft('');
            } else {
                actions.showToast('Failed to send SMS: ' + (result.error || result.message), 'error');
            }
        } catch (error) {
            actions.showToast('Error sending SMS', 'error');
        } finally {
            setSendingSms(false);
        }
    };

    const handleEditClick = (patient: Patient) => {
        setFormData({
            id: patient.id,
            name: patient.name,
            phone: patient.phone,
            age: String(patient.age),
            gender: patient.gender,
            notes: patient.notes,
            allergies: patient.allergies?.join(', ') || '',
            history: '',
            bloodGroup: patient.bloodGroup || '',
            emergencyContactName: patient.emergencyContact?.name || '',
            emergencyContactPhone: patient.emergencyContact?.phone || '',
            emergencyContactRel: patient.emergencyContact?.relationship || '',
            vitals: {
                bp: patient.vitals?.bp || '',
                heartRate: patient.vitals?.heartRate || '',
                temp: patient.vitals?.temp || '',
                weight: patient.vitals?.weight || ''
            },
            fullHistory: patient.history || [],
            lastVisit: patient.lastVisit
        });
        setIsEditing(true);
        setActiveMenuId(null);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const patientData: Patient = {
            id: isEditing ? (formData as any).id : `P${Math.floor(Math.random() * 9000 + 1000)}`,
            name: formData.name,
            phone: formData.phone,
            age: Number(formData.age),
            gender: formData.gender as Gender,
            lastVisit: isEditing ? (formData as any).lastVisit : new Date().toISOString().split('T')[0],
            notes: formData.notes,
            history: isEditing ? (formData as any).fullHistory : (formData.history ? [formData.history] : []),
            allergies: formData.allergies.split(',').map(s => s.trim()).filter(s => s),
            bloodGroup: formData.bloodGroup,
            emergencyContact: {
                name: formData.emergencyContactName,
                phone: formData.emergencyContactPhone,
                relationship: formData.emergencyContactRel
            },
            vitals: formData.vitals
        };

        if (isEditing) {
            updatePatient(patientData);
            if (selectedPatient?.id === patientData.id) setSelectedPatient(patientData);
            setIsEditing(false);
        } else {
            addPatient(patientData);
            setIsAdding(false);
        }
        setFormData(initialFormData);
    };

    const handleSaveVitals = () => {
        if (!selectedPatient) return;
        const updated = { ...selectedPatient, vitals: tempVitals };
        updatePatient(updated);
        setSelectedPatient(updated);
        setIsEditingVitals(false);
    };

    const handleSaveHistory = () => {
        if (!selectedPatient || !newHistoryNote.trim()) return;
        const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const entry = `${newHistoryNote} (${dateStr})`;
        const updated = { ...selectedPatient, history: [entry, ...selectedPatient.history] };
        updatePatient(updated);
        setSelectedPatient(updated);
        setNewHistoryNote('');
        setIsAddingHistory(false);
    };

    const handleExportAll = async () => {
        try {
            const blob = await exportService.exportPatients({ format: 'csv' });
            const url = window.URL.createObjectURL(blob as Blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `patients_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            actions.showToast('Failed to export patients', 'error');
        }
    };

    const handleCall = (phone: string) => window.location.href = `tel:${phone}`;

    return (
        <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 bg-gray-50/50 dark:bg-slate-900/50 min-h-screen transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 no-print">
                <div className="text-center sm:text-left">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Patient Records</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and monitor patient health history</p>
                </div>
                <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3">
                    {canExport && (
                        <button
                            onClick={handleExportAll}
                            className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <Download className="w-5 h-5" />
                            <span className="hidden md:inline text-xs sm:text-sm">Export List</span>
                        </button>
                    )}
                    {canCreate && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-brand-blue hover:bg-brand-blue/90 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-brand-blue/20 dark:shadow-none transition-all active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
                        >
                            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span>New Profile</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card-elegant p-3 sm:p-5 mb-6 no-print">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
                        <input
                            type="text"
                            placeholder="Search patients by name, phone or ID..."
                            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-brand-blue/30 rounded-2xl outline-none focus:ring-4 focus:ring-brand-blue/5 dark:text-white transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Patient Table */}
            <div className="card-elegant overflow-hidden no-print">
                <div className="table-container">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 uppercase tracking-widest">
                                <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400">Patient</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 hidden sm:table-cell">Contact</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 hidden xl:table-cell text-center">Age</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400">Last Visit</th>
                                <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {paginatedPatients.map(patient => (
                                <PatientRow
                                    key={patient.id}
                                    patient={patient}
                                    onView={setSelectedPatient}
                                    onEdit={handleEditClick}
                                    onDelete={deletePatient}
                                    onSms={handleDraftSms}
                                    onCall={handleCall}
                                    activeMenuId={activeMenuId}
                                    setActiveMenuId={setActiveMenuId}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-50 dark:border-white/5 bg-slate-50/10 dark:bg-slate-900/10">
                    <p className="text-xs sm:text-sm text-slate-500 font-bold order-2 sm:order-1 text-center sm:text-left">Showing {paginatedPatients.length} of {filtered.length} patients</p>
                    <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95 shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white px-3 tracking-tight">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95 shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {selectedPatient && (
                <PatientDetailModal
                    patient={selectedPatient}
                    onClose={() => { setSelectedPatient(null); setAiAnalysis(null); setIsEditingVitals(false); }}
                    onEdit={handleEditClick}
                    onDelete={deletePatient}
                    onAnalyzeNotes={handleAnalyzeNotes}
                    isAnalyzing={isAnalyzing}
                    aiAnalysis={aiAnalysis}
                    onDraftSms={handleDraftSms}
                    showSmsModal={showSmsModal}
                    draftingSms={draftingSms}
                    sendingSms={sendingSms}
                    smsDraft={smsDraft}
                    setSmsDraft={setSmsDraft}
                    onConfirmSendSms={handleConfirmSendSms}
                    setShowSmsModal={setShowSmsModal}
                    isEditingVitals={isEditingVitals}
                    setIsEditingVitals={setIsEditingVitals}
                    tempVitals={tempVitals}
                    setTempVitals={setTempVitals}
                    onSaveVitals={handleSaveVitals}
                    isAddingHistory={isAddingHistory}
                    setIsAddingHistory={setIsAddingHistory}
                    newHistoryNote={newHistoryNote}
                    setNewHistoryNote={setNewHistoryNote}
                    onSaveHistory={handleSaveHistory}
                    canDelete={canDelete}
                />
            )}

            <PatientFormModal
                isOpen={isAdding || isEditing}
                onClose={() => { setIsAdding(false); setIsEditing(false); setFormData(initialFormData); }}
                title={isEditing ? "Edit Patient" : "New Patient Profile"}
                icon={isEditing ? <Edit2 className="w-5 h-5 text-teal-600" /> : <User className="w-5 h-5 text-brand-600" />}
                formData={formData}
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                onVitalChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, [e.target.name]: e.target.value } })}
                onSubmit={handleFormSubmit}
                submitLabel={isEditing ? "Save Changes" : "Create Patient"}
            />

            {showBulkImport && (
                <BulkImportPatients
                    onImport={async (imported) => {
                        await actions.bulkAddPatient(imported as any);
                        setShowBulkImport(false);
                    }}
                    onClose={() => setShowBulkImport(false)}
                />
            )}
        </div>
    );
};

export default PatientList;
