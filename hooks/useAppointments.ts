import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { db } from "../services/db"
import type { Appointment } from "../types"
import useStore from "../store"

// Query keys
export const appointmentKeys = {
    all: ["appointments"] as const,
    byDate: (date: string) => [...appointmentKeys.all, "date", date] as const,
    detail: (id: string) => [...appointmentKeys.all, id] as const,
}

// Fetch all appointments
export function useAppointments() {
    return useQuery({
        queryKey: appointmentKeys.all,
        queryFn: async () => {
            try {
                return await db.getAppointments()
            } catch (error) {
                console.error("Error fetching appointments:", error)
                throw error
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        onError: (error) => {
            console.error("Error fetching appointments:", error)
        },
    })
}

// Create appointment mutation
export function useCreateAppointment() {
    const queryClient = useQueryClient()
    const { actions } = useStore()

    return useMutation({
        mutationFn: async (appointment: Appointment) => {
            try {
                return await db.createAppointment(appointment)
            } catch (error) {
                console.error("Error creating appointment:", error)
                throw error
            }
        },
        onSuccess: (newAppt) => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
            actions.showToast(`Appointment scheduled for ${newAppt.patientName}.`)
        },
        onError: (error) => {
            console.error("Error scheduling appointment:", error)
            actions.showToast("Error scheduling appointment", "error")
        },
    })
}

// Update appointment mutation
export function useUpdateAppointment() {
    const queryClient = useQueryClient()
    const { actions } = useStore()

    return useMutation({
        mutationFn: async (appointment: Appointment) => {
            try {
                await db.updateAppointment(appointment)
                return appointment
            } catch (error) {
                console.error("Error updating appointment:", error)
                throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
        },
        onError: (error) => {
            console.error("Error updating appointment:", error)
            actions.showToast("Error updating appointment", "error")
        },
    })
}