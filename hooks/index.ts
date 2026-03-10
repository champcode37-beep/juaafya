export * from "./usePatients"
export * from "./useAppointments"
export * from "./useInventory"
export * from "./useVisits" 

// Added a try-catch block to handle potential errors during hook exports
try {
  export * from "./usePatients"
  export * from "./useAppointments"
  export * from "./useInventory"
  export * from "./useVisits"
} catch (error) {
  // Implement logging for any errors that occur
  console.error('Error exporting hooks:', error)
}