import React, { useState, useMemo, useEffect, Suspense, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users,
  Calendar,
  Activity,
  LogOut,
  Pill,
} from "lucide-react"
import { AIBriefingCard } from "./dashboard/AIBriefingCard"
import { StatCard } from "./dashboard/StatCard"
import { DashboardHeader } from "./dashboard/DashboardHeader"
import { RecentPatientsTable } from "./dashboard/RecentPatientsTable"
import { UpcomingAppointments } from "./dashboard/UpcomingAppointments"
import useStore from "../store"
import logger from "../lib/logger"

const DashboardCharts = React.lazy(() => import("./dashboard/DashboardCharts").then(m => ({ default: m.DashboardCharts })))

const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  // Granular selectors to prevent unnecessary re-renders
  const appointments = useStore(state => state.appointments)
  const patients = useStore(state => state.patients)
  const inventory = useStore(state => state.inventory)
  const visits = useStore(state => state.visits)
  const actions = useStore(state => state.actions)
  const currentUser = useStore(state => state.currentUser)

  const { logout } = actions

  // Redirect SuperAdmin
  useEffect(() => {
    const role = currentUser?.role?.toString().toLowerCase()
    if (role === "superadmin" || role === "super_admin") {
      actions.setCurrentView("sa-overview")
    }
  }, [currentUser, actions])

  const [searchTerm, setSearchTerm] = useState("")
  const [timeRange, setTimeRange] = useState("Month")
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [systemNotifications, setSystemNotifications] = useState<any[]>([])

  // Dashboard Stats Memoized
  const dashboardStats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return {
      todayPatients: visits.filter(v => v.startTime.startsWith(today)).length,
      todayAppointments: appointments.filter(a => a.date === today).length,
      todayApptsScheduled: appointments.filter(a => a.date === today && a.status === "Scheduled").length,
      completedVisits: visits.filter(v => v.stage === "Completed" && v.startTime.startsWith(today)).length,
      pendingVisitsCount: visits.filter(v => v.stage !== "Completed").length,
      lowStockCount: inventory.filter(i => i.stock <= i.minStockLevel).length,
      todayRevenue: visits.filter(v => v.startTime.startsWith(today)).reduce((acc, v) => acc + (v.totalBill || 0), 0)
    }
  }, [inventory, visits, appointments])

  const handleLogout = useCallback(async () => {
    try {
      if (logout) {
        await logout()
        navigate("/login")
      }
    } catch (error) {
      logger.error("Logout error:", error)
    }
  }, [logout, navigate])

  useEffect(() => {
    const msgs: any[] = []
    if (dashboardStats.lowStockCount > 0) {
      msgs.push({ id: "stock-alert", text: `Low stock alert: ${dashboardStats.lowStockCount} items below threshold`, type: "alert", time: "Now", read: false })
    }
    if (dashboardStats.pendingVisitsCount > 0) {
      msgs.push({ id: "visits-pending", text: `${dashboardStats.pendingVisitsCount} patients in queue today`, type: "info", time: "Now", read: false })
    }
    setSystemNotifications(msgs)
  }, [dashboardStats])

  const unreadCount = systemNotifications.filter((n) => !n.read).length

  const chartData = useMemo(() => {
    if (timeRange === "Weekly") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      return days.map(day => ({
        name: day,
        val: visits.filter(v => {
          try {
            return new Date(v.startTime).toLocaleDateString('en-US', { weekday: 'short' }) === day
          } catch (e) { return false }
        }).length
      }))
    }
    return [
      { name: "Week 1", val: visits.length },
      { name: "Week 2", val: 0 },
      { name: "Week 3", val: 0 },
      { name: "Week 4", val: 0 },
    ]
  }, [timeRange, visits])

  const handlePatientAction = useCallback((id: string, action: string) => {
    logger.log(`Action ${action} for patient ${id}`)
    setActiveMenuId(null)
  }, [])

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 animate-in fade-in transition-all">
      <DashboardHeader
        currentUser={currentUser}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        unreadCount={unreadCount}
        isNotifOpen={isNotifOpen}
        setIsNotifOpen={setIsNotifOpen}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        handleLogout={handleLogout}
        systemNotifications={systemNotifications}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Patients"
          value={patients.length}
          subValue="+12.5% from last month"
          icon={Users}
          trend="up"
          trendValue="12%"
          colorClass="bg-brand-blue"
          iconColorClass="bg-brand-blue/10 text-brand-blue"
        />
        <StatCard
          title="Daily Appointments"
          value={dashboardStats.todayAppointments}
          subValue="Scheduled for today"
          icon={Calendar}
          trend="up"
          trendValue="5%"
          colorClass="bg-brand-teal"
          iconColorClass="bg-brand-teal/10 text-brand-teal"
        />
        <StatCard
          title="Visits Completed"
          value={dashboardStats.completedVisits}
          subValue="Patients served today"
          icon={Activity}
          trendValue="Recently"
          colorClass="bg-brand-yellow"
          iconColorClass="bg-brand-yellow/10 text-brand-yellow"
        />
        <StatCard
          title="Low Stock Items"
          value={dashboardStats.lowStockCount}
          subValue="Requires reordering"
          icon={Pill}
          trend={dashboardStats.lowStockCount > 3 ? "down" : "up"}
          trendValue={dashboardStats.lowStockCount.toString()}
          colorClass="bg-rose-500"
          iconColorClass="bg-rose-500/10 text-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <div className="card-elegant p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Analytics Overview</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Patient visits and engagement</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-[#121721]/60 p-1 rounded-2xl w-full sm:w-auto">
                {["Weekly", "Monthly"].map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${timeRange === range ? 'bg-white dark:bg-slate-800 text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <Suspense fallback={<div className="h-[300px] w-full bg-slate-50 dark:bg-white/5 rounded-3xl animate-pulse" />}>
              <DashboardCharts type="area" data={chartData} height={300} />
            </Suspense>
          </div>

          <RecentPatientsTable
            patients={patients}
            activeMenuId={activeMenuId}
            setActiveMenuId={setActiveMenuId}
            handlePatientAction={handlePatientAction}
          />
        </div>

        <div className="space-y-8">
          <AIBriefingCard stats={dashboardStats} />
          <UpcomingAppointments
            appointments={appointments}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
