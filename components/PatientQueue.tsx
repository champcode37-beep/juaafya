"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type {
  Visit,
  Patient,
  VisitStage,
  InventoryItem,
  PrescriptionItem,
  VisitPriority,
  LabOrder,
  LabTestProfile,
} from "../types"
import { db } from "../services/db"
import {
  Users,
  Activity,
  Stethoscope,
  Pill,
  CreditCard,
  CheckCircle,
  Clock,
  ArrowRight,
  UserPlus,
  Plus,
  X,
  Search,
  FlaskConical,
  AlertTriangle,
  LogOut,
  QrCode,
  Receipt,
  BriefcaseMedical,
  Printer,
} from "lucide-react"
import useStore from '../store'
import { canCurrentUser } from '../lib/roleMapper'
import PaymentModal from './PaymentModal'

interface PatientQueueProps {
  visits: Visit[]
  patients: Patient[]
  inventory: InventoryItem[]
  labTests: LabTestProfile[]
  addVisit: (patientId: string, priority?: VisitPriority, insurance?: any, skipVitals?: boolean) => void
  updateVisit: (visit: Visit) => void
  onCompleteVisit?: (visit: Visit) => void
  restrictedStages?: VisitStage[] // New prop to filter the dashboard view
}

const PatientQueue: React.FC<PatientQueueProps> = ({
  visits,
  patients,
  inventory,
  labTests,
  addVisit,
  updateVisit,
  onCompleteVisit,
  restrictedStages,
}) => {
  // If restricted stages provided, default to the first one, otherwise Check-In
  const [activeStage, setActiveStage] = useState<VisitStage>(restrictedStages ? restrictedStages[0] : "Check-In")
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Modal State
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  // Check-In State
  const [checkInPriority, setCheckInPriority] = useState<VisitPriority>("Normal")
  const [skipVitals, setSkipVitals] = useState(false)

  // Doctor Modal State
  const [doctorTab, setDoctorTab] = useState<"Clinical" | "Orders" | "History">("Clinical")

  // Helper to calculate wait time
  const getWaitTime = (startTime: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000)
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  // Force re-render every minute to update times
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  // Update active stage if props change (e.g. switching views)
  useEffect(() => {
    if (restrictedStages && !restrictedStages.includes(activeStage)) {
      setActiveStage(restrictedStages[0])
    } else if (!restrictedStages && activeStage === undefined) {
      setActiveStage("Check-In")
    }
  }, [restrictedStages, activeStage])

  // Stage Definitions
  const allStages: { id: VisitStage; label: string; icon: any; color: string }[] = [
    { id: "Check-In", label: "Reception", icon: Users, color: "bg-blue-500" },
    { id: "Vitals", label: "Vitals", icon: Activity, color: "bg-orange-500" },
    { id: "Consultation", label: "Doctor", icon: Stethoscope, color: "bg-teal-600" },
    { id: "Lab", label: "Lab", icon: FlaskConical, color: "bg-indigo-500" },
    { id: "Billing", label: "Billing", icon: CreditCard, color: "bg-green-600" },
    { id: "Pharmacy", label: "Pharmacy", icon: Pill, color: "bg-purple-600" },
    { id: "Clearance", label: "Clearance", icon: LogOut, color: "bg-slate-500" },
  ]

  const visibleStages = restrictedStages ? allStages.filter((s) => restrictedStages.includes(s.id)) : allStages

  // Filter Visits based on Stage
  const filteredVisits = visits
    .filter((v) => v.stage === activeStage)
    .sort((a, b) => {
      // Sort by Priority (Emergency > Urgent > Normal) then Time
      const pMap = { Emergency: 3, Urgent: 2, Normal: 1 }
      if (pMap[a.priority] !== pMap[b.priority]) return pMap[b.priority] - pMap[a.priority]
      return new Date(a.stageStartTime).getTime() - new Date(b.stageStartTime).getTime()
    })

  const handleStageChange = (visit: Visit, nextStage: VisitStage) => {
    // Require billing.manage permission to move a visit to Billing
    if (nextStage === "Billing" && !canCurrentUser('billing.manage')) {
      useStore.getState().actions.showToast("You do not have permission to send to Billing.", "error")
      return
    }

    updateVisit({
      ...visit,
      stage: nextStage,
      stageStartTime: new Date().toISOString(), // Reset timer for new stage
    })
    setSelectedVisit(null)
    setDoctorTab("Clinical") // Reset doctor tab
  }

  const calculateTotal = (visit: Visit) => {
    const medCost = visit.prescription.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const labCost = visit.labOrders.reduce((acc, item) => acc + item.price, 0)
    return visit.consultationFee + medCost + labCost
  }

  const getPriorityColor = (p: VisitPriority) => {
    if (p === "Emergency") return "bg-red-100 text-red-700 border-red-200 animate-pulse"
    if (p === "Urgent") return "bg-orange-100 text-orange-700 border-orange-200"
    return "bg-blue-50 text-blue-700 border-blue-200"
  }

  // --- Render Modals ---
  const renderCheckInModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Patient Check-In</h3>
          <button onClick={() => setShowCheckInModal(false)}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            autoFocus
            placeholder="Search name or phone..."
            className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-none outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Visit Priority</label>
          <select
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl outline-none dark:text-white text-sm font-medium"
            value={checkInPriority}
            onChange={(e) => setCheckInPriority(e.target.value as VisitPriority)}
          >
            <option value="Normal">Normal</option>
            <option value="Urgent">Urgent</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>

        <div className="mb-6 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl flex items-center gap-3">
          <input
            type="checkbox"
            id="skipVitals"
            checked={skipVitals}
            onChange={(e) => setSkipVitals(e.target.checked)}
            className="w-5 h-5 text-teal-600 rounded cursor-pointer"
          />
          <label htmlFor="skipVitals" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            Skip Vitals (Direct to Doctor)
          </label>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 border-t border-slate-100 dark:border-slate-700 pt-4">
          <p className="text-xs font-bold text-slate-400 mb-2">Select Patient to Queue:</p>
          {patients
            .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm))
            .slice(0, 5)
            .map((patient) => (
              <div
                key={patient.id}
                className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors cursor-pointer"
                onClick={() => {
                  addVisit(
                    patient.id,
                    checkInPriority,
                    undefined, // No insurance passed
                    skipVitals,
                  )
                  setShowCheckInModal(false)
                  setSearchTerm("")
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs">
                    {patient.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{patient.name}</div>
                    <div className="text-xs text-slate-500">{patient.phone}</div>
                  </div>
                </div>
                <Plus className="w-5 h-5 text-teal-600" />
              </div>
            ))}
        </div>
      </div>
    </div>
  )

  const renderActionModal = (): React.ReactNode => {
    if (!selectedVisit) return null

    const patient = patients.find((p) => p.id === selectedVisit.patientId)

    // --- VITALS FORM ---
    if (activeStage === "Vitals") {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" /> Vitals Check: {selectedVisit.patientName}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Blood Pressure</label>
                <input
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl mt-1 outline-none dark:text-white"
                  placeholder="120/80"
                  value={selectedVisit.vitals?.bp || ""}
                  onChange={(e) =>
                    setSelectedVisit({ ...selectedVisit, vitals: { ...selectedVisit.vitals!, bp: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Temp (°C)</label>
                <input
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl mt-1 outline-none dark:text-white"
                  placeholder="36.5"
                  value={selectedVisit.vitals?.temp || ""}
                  onChange={(e) =>
                    setSelectedVisit({ ...selectedVisit, vitals: { ...selectedVisit.vitals!, temp: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Weight (kg)</label>
                <input
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl mt-1 outline-none dark:text-white"
                  placeholder="70"
                  value={selectedVisit.vitals?.weight || ""}
                  onChange={(e) =>
                    setSelectedVisit({ ...selectedVisit, vitals: { ...selectedVisit.vitals!, weight: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Height (cm)</label>
                <input
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl mt-1 outline-none dark:text-white"
                  placeholder="170"
                  value={selectedVisit.vitals?.height || ""}
                  onChange={(e) =>
                    setSelectedVisit({ ...selectedVisit, vitals: { ...selectedVisit.vitals!, height: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Pulse Rate (bpm)</label>
                <input
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl mt-1 outline-none dark:text-white"
                  placeholder="72"
                  value={selectedVisit.vitals?.heartRate || ""}
                  onChange={(e) =>
                    setSelectedVisit({
                      ...selectedVisit,
                      vitals: { ...selectedVisit.vitals!, heartRate: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Resp Rate (cpm)</label>
                <input
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl mt-1 outline-none dark:text-white"
                  placeholder="18"
                  value={selectedVisit.vitals?.respRate || ""}
                  onChange={(e) =>
                    setSelectedVisit({
                      ...selectedVisit,
                      vitals: { ...selectedVisit.vitals!, respRate: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">SPO2 (%)</label>
                <input
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl mt-1 outline-none dark:text-white"
                  placeholder="98"
                  value={selectedVisit.vitals?.spo2 || ""}
                  onChange={(e) =>
                    setSelectedVisit({
                      ...selectedVisit,
                      vitals: { ...selectedVisit.vitals!, spo2: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">BMI (Calculated)</label>
                <div className="w-full p-3 bg-slate-100 dark:bg-slate-900 rounded-xl mt-1 dark:text-slate-400 font-bold">
                  {(() => {
                    const w = parseFloat(selectedVisit.vitals?.weight || "0")
                    const h = parseFloat(selectedVisit.vitals?.height || "0") / 100
                    if (w > 0 && h > 0) return (w / (h * h)).toFixed(1)
                    return "--"
                  })()}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedVisit(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStageChange(selectedVisit, "Consultation")}
                className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600"
              >
                Save & Send to Doctor
              </button>
            </div>
          </div>
        </div>
      )
    }

    // --- DOCTOR FORM ---
    if (activeStage === "Consultation") {
      const addToPrescription = (item: InventoryItem) => {
        const newItem: PrescriptionItem = {
          inventoryId: item.id,
          name: item.name,
          dosage: "1x2 for 3 days",
          quantity: 1,
          price: item.price,
        }
        setSelectedVisit({
          ...selectedVisit,
          prescription: [...selectedVisit.prescription, newItem],
        })
      }

      const addToLabs = (test: LabTestProfile) => {
        const newOrder: LabOrder = {
          id: `LO-${Date.now()}`,
          testId: test.id,
          testName: test.name,
          price: test.price,
          status: "Pending",
          orderedAt: new Date().toISOString(),
        }
        setSelectedVisit({
          ...selectedVisit,
          labOrders: [...selectedVisit.labOrders, newOrder],
        })
      }

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl p-0 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedVisit.patientName}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${selectedVisit.priority === "Emergency"
                      ? "bg-red-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                  >
                    {selectedVisit.priority}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedVisit(null)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 px-6">
              {["Clinical", "Orders", "History"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDoctorTab(tab as any)}
                  className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${doctorTab === tab
                    ? "border-teal-600 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-800">
              {doctorTab === "Clinical" && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Vitals Summary Card */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Blood Pressure</span>
                      <span className="text-sm font-bold dark:text-white">{selectedVisit.vitals?.bp || '--'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Temperature</span>
                      <span className="text-sm font-bold dark:text-white">{selectedVisit.vitals?.temp ? `${selectedVisit.vitals.temp}°C` : '--'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pulse / Resp</span>
                      <span className="text-sm font-bold dark:text-white">
                        {selectedVisit.vitals?.heartRate || '--'} / {selectedVisit.vitals?.respRate || '--'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">SPO2</span>
                      <span className={`text-sm font-bold ${parseFloat(selectedVisit.vitals?.spo2 || '100') < 94 ? 'text-red-500' : 'dark:text-white'}`}>
                        {selectedVisit.vitals?.spo2 ? `${selectedVisit.vitals.spo2}%` : '--'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Weight / Height</span>
                      <span className="text-sm font-bold dark:text-white">
                        {selectedVisit.vitals?.weight || '--'}kg / {selectedVisit.vitals?.height || '--'}cm
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">BMI</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold dark:text-white">
                          {(() => {
                            const w = parseFloat(selectedVisit.vitals?.weight || "0")
                            const h = parseFloat(selectedVisit.vitals?.height || "0") / 100
                            if (w > 0 && h > 0) {
                              const bmi = (w / (h * h))
                              return bmi.toFixed(1)
                            }
                            return "--"
                          })()}
                        </span>
                        {(() => {
                          const w = parseFloat(selectedVisit.vitals?.weight || "0")
                          const h = parseFloat(selectedVisit.vitals?.height || "0") / 100
                          if (w > 0 && h > 0) {
                            const bmi = (w / (h * h))
                            if (bmi < 18.5) return <span className="text-[8px] px-1 bg-blue-100 text-blue-600 rounded">Underweight</span>
                            if (bmi < 25) return <span className="text-[8px] px-1 bg-green-100 text-green-600 rounded">Healthy</span>
                            if (bmi < 30) return <span className="text-[8px] px-1 bg-orange-100 text-orange-600 rounded">Overweight</span>
                            return <span className="text-[8px] px-1 bg-red-100 text-red-600 rounded">Obese</span>
                          }
                          return null
                        })()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Chief Complaint</label>
                    <textarea
                      className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl mt-1 outline-none dark:text-white text-sm"
                      rows={2}
                      value={selectedVisit.chiefComplaint || ""}
                      onChange={(e) => setSelectedVisit({ ...selectedVisit, chiefComplaint: e.target.value })}
                      placeholder="Patient's primary symptom..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Diagnosis / Impression</label>
                    <input
                      className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl mt-1 outline-none dark:text-white text-sm font-bold"
                      value={selectedVisit.diagnosis || ""}
                      onChange={(e) => setSelectedVisit({ ...selectedVisit, diagnosis: e.target.value })}
                      placeholder="e.g. Malaria, URI..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Detailed Doctor Notes</label>
                    <textarea
                      className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl mt-1 outline-none dark:text-white text-sm"
                      rows={4}
                      value={selectedVisit.doctorNotes || ""}
                      onChange={(e) => setSelectedVisit({ ...selectedVisit, doctorNotes: e.target.value })}
                      placeholder="Clinical observations, examination details..."
                    />
                  </div>
                </div>
              )}

              {doctorTab === "Orders" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in h-full">
                  {/* Lab Orders */}
                  <div className="flex flex-col h-full">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2 text-sm">
                      <FlaskConical className="w-4 h-4 text-indigo-500" /> Lab Requests
                    </h4>

                    <div className="relative group mb-2">
                      <input
                        placeholder="Search labs..."
                        className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg outline-none dark:text-white"
                      />
                      <div className="hidden group-hover:block absolute top-full left-0 right-0 bg-white dark:bg-slate-700 shadow-xl border dark:border-slate-600 z-10 max-h-40 overflow-y-auto rounded-b-lg">
                        {labTests.map((test) => (
                          <div
                            key={test.id}
                            onClick={() => addToLabs(test)}
                            className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer text-sm flex justify-between dark:text-white"
                          >
                            <span>{test.name}</span>
                            <span className="text-xs opacity-50">{test.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-slate-700 overflow-y-auto">
                      {selectedVisit.labOrders.map((order, idx) => (
                        <div
                          key={idx}
                          className={`bg-white dark:bg-slate-800 p-3 rounded-xl border transition-all ${order.flag === 'Critical' ? 'border-red-500 shadow-sm shadow-red-100' :
                            order.flag === 'High' || order.flag === 'Low' ? 'border-orange-300' :
                              'border-slate-200 dark:border-slate-600'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm">{order.testName}</div>
                              {order.result && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-base font-black ${order.flag === 'Critical' ? 'text-red-600' :
                                    order.flag === 'High' ? 'text-orange-600' :
                                      order.flag === 'Low' ? 'text-blue-600' :
                                        'text-teal-600'
                                    }`}>
                                    {order.result}
                                  </span>
                                  {order.flag !== 'Normal' && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${order.flag === 'Critical' ? 'bg-red-100 text-red-700 animate-pulse' :
                                      'bg-orange-100 text-orange-700'
                                      }`}>
                                      {order.flag}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                const updated = selectedVisit.labOrders.filter((_, i) => i !== idx)
                                setSelectedVisit({ ...selectedVisit, labOrders: updated })
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg mt-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === "Completed" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                                }`}
                            >
                              {order.status}
                            </span>
                            {order.notes && (
                              <span className="text-[10px] text-slate-500 italic max-w-[150px] truncate" title={order.notes}>
                                "{order.notes}"
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prescription */}
                  <div className="flex flex-col h-full">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2 text-sm">
                      <Pill className="w-4 h-4 text-purple-500" /> Medication
                    </h4>
                    <div className="relative group mb-2">
                      <input
                        placeholder="Search meds..."
                        className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg outline-none dark:text-white"
                      />
                      <div className="hidden group-hover:block absolute top-full left-0 right-0 bg-white dark:bg-slate-700 shadow-xl border dark:border-slate-600 z-10 max-h-40 overflow-y-auto rounded-b-lg">
                        {inventory
                          .filter((i) => i.stock > 0)
                          .map((item) => (
                            <div
                              key={item.id}
                              onClick={() => addToPrescription(item)}
                              className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer text-sm flex justify-between dark:text-white"
                            >
                              <span>{item.name}</span>
                              <span className="text-xs opacity-50">{item.stock} left</span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 space-y-2 border border-slate-100 dark:border-slate-700">
                      {selectedVisit.prescription.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm"
                        >
                          <div className="flex justify-between font-bold dark:text-white">
                            <span>{item.name}</span>
                            <button
                              onClick={() => {
                                const updated = selectedVisit.prescription.filter((_, i) => i !== idx)
                                setSelectedVisit({ ...selectedVisit, prescription: updated })
                              }}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            value={item.dosage}
                            onChange={(e) => {
                              const updated = [...selectedVisit.prescription]
                              updated[idx] = { ...updated[idx], dosage: e.target.value }
                              setSelectedVisit({ ...selectedVisit, prescription: updated })
                            }}
                            className="bg-slate-50 dark:bg-slate-700 p-1 rounded border-none text-xs w-full mt-1 outline-none dark:text-white"
                            placeholder="Dosage..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {doctorTab === "History" && (
                <div className="space-y-4 animate-in fade-in h-4/5 overflow-y-auto pr-2">
                  {patient && patient.history.length > 0 ? (
                    patient.history.map((record, i) => (
                      <div
                        key={i}
                        className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                            <BriefcaseMedical className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {record.split('. ').map((part, idx) => {
                                if (part.startsWith('Diagnosis:')) return <span key={idx} className="block mb-1"><strong className="text-teal-700 dark:text-teal-400">Diagnosis:</strong> {part.replace('Diagnosis:', '')}.</span>
                                if (part.startsWith('Vitals:')) return <span key={idx} className="block text-xs mb-1 opacity-80"><strong>Vitals:</strong> {part.replace('Vitals:', '')}.</span>
                                if (part.startsWith('Labs:')) return <span key={idx} className="block text-xs mb-1 opacity-80 font-medium text-indigo-600 dark:text-indigo-400"><strong>Labs:</strong> {part.replace('Labs:', '')}.</span>
                                if (part.startsWith('Dr Notes:')) return <span key={idx} className="block mt-2 italic text-slate-500 border-t border-slate-200 dark:border-slate-600 pt-2">{part}</span>
                                return <span key={idx}>{part}. </span>
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <p>No previous visit records found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex gap-3">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-6 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl border border-slate-200 dark:border-slate-600"
              >
                Close
              </button>
              {selectedVisit.labOrders.some((o) => o.status === "Pending") ? (
                <button
                  onClick={() => handleStageChange(selectedVisit, "Lab")}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <FlaskConical className="w-5 h-5" /> Send to Lab
                </button>
              ) : (
                <button
                  onClick={() => handleStageChange(selectedVisit, "Billing")}
                  className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" /> Send to Billing
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }

    // --- LAB FORM ---
    if (activeStage === "Lab") {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-6 h-6 text-indigo-500" /> Lab Results: {selectedVisit.patientName}
              </h3>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2">
              {selectedVisit.labOrders.map((order, idx) => {
                const profile = labTests.find(lt => lt.id === order.testId);
                return (
                  <div
                    key={idx}
                    className="p-5 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white block text-lg">{order.testName}</span>
                        {profile?.referenceRange && (
                          <span className="text-xs text-slate-500 font-medium">
                            Ref: {profile.referenceRange} {profile.unit}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer transition-colors ${order.flag === 'High' ? 'bg-orange-100 text-orange-700' :
                            order.flag === 'Low' ? 'bg-blue-100 text-blue-700' :
                              order.flag === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' :
                                'bg-green-100 text-green-700'
                            }`}
                          value={order.flag || 'Normal'}
                          onChange={(e) => {
                            const updated = [...selectedVisit.labOrders];
                            updated[idx] = { ...updated[idx], flag: e.target.value as any };
                            setSelectedVisit({ ...selectedVisit, labOrders: updated });
                          }}
                        >
                          <option value="Normal">NORMAL</option>
                          <option value="Low">LOW</option>
                          <option value="High">HIGH</option>
                          <option value="Critical">CRITICAL</option>
                        </select>
                        <span className="text-xs px-2.5 py-1 bg-slate-200 dark:bg-slate-600 rounded-full text-slate-600 dark:text-slate-300 font-bold">
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Result Value {profile?.unit ? `(${profile.unit})` : ''}</label>
                        <input
                          autoFocus={idx === 0}
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl mt-1 text-sm outline-none dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                          placeholder="Enter value..."
                          value={order.result || ""}
                          onChange={(e) => {
                            const updated = [...selectedVisit.labOrders]
                            updated[idx] = {
                              ...updated[idx],
                              result: e.target.value,
                              status: e.target.value ? "Completed" : "Pending",
                            }
                            setSelectedVisit({ ...selectedVisit, labOrders: updated })
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lab Notes</label>
                        <input
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl mt-1 text-sm outline-none dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                          placeholder="Technical comments..."
                          value={order.notes || ""}
                          onChange={(e) => {
                            const updated = [...selectedVisit.labOrders]
                            updated[idx] = { ...updated[idx], notes: e.target.value }
                            setSelectedVisit({ ...selectedVisit, labOrders: updated })
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t dark:border-slate-700 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2 transition-all"
              >
                <Printer className="w-5 h-5" /> Print Report
              </button>
              <button
                onClick={() => handleStageChange(selectedVisit, "Consultation")}
                className="flex-[2] py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
              >
                <Stethoscope className="w-5 h-5" /> Results Ready - Return to Doctor
              </button>
            </div>
          </div>
        </div>
      )
    }

    // --- BILLING FORM (Itemized Professional Invoice) ---
    if (activeStage === "Billing") {
      const subTotal = calculateTotal(selectedVisit)
      const vat = Math.round(subTotal * 0.16)
      const grandTotal = subTotal + vat

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-green-600" /> Professional Invoice
              </h3>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Visit ID</p>
                <p className="text-xs font-mono font-bold dark:text-white">{selectedVisit.id}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Patient & Clinic Info */}
              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bill To:</p>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedVisit.patientName}</p>
                  <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Provider:</p>
                  <p className="font-bold text-teal-600">JuaAfya Cloud Clinic</p>
                  <p className="text-xs text-slate-500">Nairobi, Kenya</p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                    {/* Consultation */}
                    <tr>
                      <td className="px-4 py-3">Professional Consultation Fee</td>
                      <td className="px-4 py-3 text-center">1</td>
                      <td className="px-4 py-3 text-right">KSh {selectedVisit.consultationFee.toLocaleString()}</td>
                    </tr>

                    {/* Lab Tests */}
                    {selectedVisit.labOrders.map((lab, i) => (
                      <tr key={`lab-${i}`}>
                        <td className="px-4 py-3">Lab: {lab.testName}</td>
                        <td className="px-4 py-3 text-center">1</td>
                        <td className="px-4 py-3 text-right">KSh {lab.price.toLocaleString()}</td>
                      </tr>
                    ))}

                    {/* Medications */}
                    {selectedVisit.prescription.map((med, i) => (
                      <tr key={`med-${i}`}>
                        <td className="px-4 py-3">Pharma: {med.name}</td>
                        <td className="px-4 py-3 text-center">{med.quantity}</td>
                        <td className="px-4 py-3 text-right">KSh {(med.price * med.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Gross Amount</span>
                    <span className="font-medium dark:text-white">KSh {subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">VAT (16%)</span>
                    <span className="font-medium dark:text-white">KSh {vat.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    <span>Payable</span>
                    <span>KSh {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / eTIMS */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700">

              {/* eTIMS Simulation */}
              <div className="mb-6 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">KRA eTIMS Validated</p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300">CU Serial: KRAMW0023881</p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    Receipt #: {selectedVisit.id.replace("V", "ETIMS")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                  >
                    <CreditCard className="w-4 h-4" /> Pay Online
                  </button>
                  <button
                    onClick={() => {
                      const nextStage = selectedVisit.prescription.length > 0 ? "Pharmacy" : "Clearance"
                      updateVisit({ ...selectedVisit, totalBill: grandTotal, paymentStatus: "Paid", stage: nextStage })
                      setSelectedVisit(null)
                    }}
                    className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Receipt className="w-4 h-4" /> Print & Pay
                  </button>
                </div>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // --- CLEARANCE FORM ---
    if (activeStage === "Clearance") {
      const isPaid = selectedVisit.paymentStatus === "Paid"

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-slate-500" /> Patient Clearance
            </h3>

            {!isPaid ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-6 flex items-center gap-3 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-200">Pending Payment</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">Patient has not cleared their bill yet.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mb-6 flex items-center gap-3 border border-green-200 dark:border-green-800">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Ready for Discharge</p>
                  <p className="text-sm text-slate-500">All bills paid and services rendered.</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedVisit(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={!isPaid}
                onClick={() => {
                  if (onCompleteVisit) {
                    onCompleteVisit(selectedVisit)
                  } else {
                    updateVisit({ ...selectedVisit, stage: "Completed" })
                  }
                  setSelectedVisit(null)
                }}
                className={`flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${isPaid
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                  }`}
              >
                <CheckCircle className="w-4 h-4" /> Complete Visit
              </button>
            </div>
            {!isPaid && (
              <button
                onClick={() => handleStageChange(selectedVisit, "Billing")}
                className="w-full mt-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Go to Billing Desk
              </button>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-200 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {restrictedStages ? "Department Dashboard" : "Patient Queue"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {restrictedStages ? `Managing: ${restrictedStages.join(", ")}` : "Clinic patient flow overview"}
          </p>
        </div>

        <div className="flex items-center justify-center sm:justify-end gap-3">
          {/* Check In Button only for Reception or General Queue */}
          {(activeStage === "Check-In" || !restrictedStages || restrictedStages.includes("Check-In")) && (
            <button
              onClick={() => setShowCheckInModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
            >
              <UserPlus className="w-5 h-5" />
              <span>Check In</span>
            </button>
          )}
        </div>
      </div>

      {/* Stage Tabs (Only show if multiple stages visible) - MOBILE RESPONSIVE */}
      {visibleStages.length > 1 && (
        <div className="flex flex-nowrap md:grid md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mb-6 md:mb-8 overflow-x-auto pb-4 scrollbar-none px-1">
          {visibleStages.map((stage) => {
            const count = visits.filter((v) => v.stage === stage.id).length
            const isActive = activeStage === stage.id

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all border-2 relative flex-shrink-0 min-w-[100px] sm:min-w-[120px] md:min-w-0 ${isActive
                  ? `border-${stage.color.split("-")[1]}-500 bg-white dark:bg-slate-800 shadow-xl transform -translate-y-1`
                  : "border-transparent bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-400"
                  }`}
              >
                {visits.some((v) => v.stage === stage.id && v.priority === "Emergency") && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                )}
                <div className={`p-2 rounded-xl text-white mb-2 ${stage.color} shadow-sm`}>
                  <stage.icon className="w-4 h-4" />
                </div>
                <div className={`text-xs font-bold text-center ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {stage.label}
                </div>
                <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${isActive ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                  {count} patients
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Kanban Board Area - MOBILE RESPONSIVE */}
      <div className="bg-slate-100 dark:bg-slate-800/50 p-3 md:p-6 rounded-3xl min-h-[400px]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 text-xs sm:text-sm">
            <Clock className="w-4 h-4 flex-shrink-0" /> Queue: {activeStage}
          </h3>
          <span className="text-xs font-bold text-slate-400 self-start sm:self-auto">
            {filteredVisits.length} waiting
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {filteredVisits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-3">
                <div
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${getPriorityColor(visit.priority)}`}
                >
                  {visit.priority === "Emergency" && <AlertTriangle className="w-3 h-3" />}
                  {visit.priority}
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {getWaitTime(visit.stageStartTime)}
                </div>
              </div>

              <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{visit.patientName}</h4>
              <p className="text-xs text-slate-500 mb-3 truncate">ID: {visit.patientId}</p>

              <div className="space-y-2 mb-4">
                {visit.stage === "Vitals" && !visit.vitals && (
                  <div className="text-xs text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded w-fit">
                    Waiting Vitals
                  </div>
                )}
                {visit.stage === "Consultation" && (
                  <div className="flex gap-2 text-xs">
                    <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      BP: {visit.vitals?.bp || "--"}
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      Temp: {visit.vitals?.temp || "--"}
                    </span>
                  </div>
                )}
                {visit.stage === "Lab" && (
                  <div className="text-xs text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded w-fit">
                    {visit.labOrders.filter((o) => o.status === "Pending").length} Pending Tests
                  </div>
                )}
                {visit.stage === "Billing" && (
                  <div className="text-sm font-bold text-green-600">
                    Total: KSh {visit.totalBill || calculateTotal(visit)}
                  </div>
                )}
              </div>

              {activeStage !== "Pharmacy" && activeStage !== "Completed" && (
                <button
                  onClick={() => setSelectedVisit(visit)}
                  className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {activeStage === "Check-In"
                    ? "Review & Route"
                    : activeStage === "Vitals"
                      ? "Record Vitals"
                      : activeStage === "Consultation"
                        ? "Open Chart"
                        : activeStage === "Lab"
                          ? "Enter Results"
                          : activeStage === "Billing"
                            ? "Process Payment"
                            : activeStage === "Clearance"
                              ? "Process Exit"
                              : "Manage"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {activeStage === "Pharmacy" && (
                <div className="text-center text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 py-2 rounded-xl border border-purple-100 dark:border-purple-800">
                  {visit.medicationsDispensed ? "Ready for Clearance" : "Dispense in Pharmacy Module"}
                </div>
              )}
            </div>
          ))}

          {filteredVisits.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-bold">Queue Empty</p>
              <p className="text-sm opacity-70">No patients currently in {activeStage}</p>
            </div>
          )}
        </div>
      </div>

      {showCheckInModal && renderCheckInModal()}
      {renderActionModal()}

      {/* Payment Modal Integration */}
      {selectedVisit && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          amount={calculateTotal(selectedVisit)}
          patientId={selectedVisit.patientId}
          patientName={selectedVisit.patientName}
          patientPhone={patients.find(p => p.id === selectedVisit.patientId)?.phone || ""}
          invoiceId={selectedVisit.id}
          onPaymentSuccess={(ref) => {
            const nextStage = selectedVisit.prescription.length > 0 ? "Pharmacy" : "Clearance"
            updateVisit({
              ...selectedVisit,
              totalBill: calculateTotal(selectedVisit),
              paymentStatus: "Paid",
              stage: nextStage,
              metadata: { ...selectedVisit.metadata, payment_ref: ref }
            })
            setIsPaymentModalOpen(false)
            setSelectedVisit(null)
          }}
        />
      )}
    </div>
  )
}

export default PatientQueue
