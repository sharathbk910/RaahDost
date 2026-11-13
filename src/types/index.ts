export type VehicleType = 
  | 'Government Bus' 
  | 'Private Bus' 
  | 'Shared Van' 
  | 'Auto Rickshaw' 
  | 'Mini Bus';

export type VehicleStatus = 'available' | 'full' | 'unavailable';

export type RequestStatus = 'pending' | 'proposed' | 'confirmed' | 'unassigned' | 'cancelled';

export type DisruptionType = 'breakdown' | 'route_closure' | 'delay' | 'overcrowding';

export type DisruptionStatus = 'active' | 'resolved';

export interface Village {
  id: string;
  name: string;
  coordinates?: { lat: number; lng: number };
}

export interface Institution {
  id: string;
  name: string;
  coordinates?: { lat: number; lng: number };
}

export interface Student {
  id: string;
  studentCode: string;
  displayName: string;
  villageId: string;
  destinationId: string;
}

export interface Vehicle {
  id: string;
  vehicleCode: string;
  name: string;
  vehicleType: VehicleType;
  startingVillageId: string;
  destinationId: string;
  totalCapacity: number;
  availableSeats: number;
  availabilityStatus: VehicleStatus;
  operatorConfirmed: boolean;
  contactNumber?: string;
  driverName?: string;
}

export interface TransportRequest {
  id: string;
  studentId: string;
  studentCode: string;
  displayName: string;
  villageId: string;
  destinationId: string;
  passengerCount: number;
  status: RequestStatus;
  allocatedVehicleId?: string;
  allocatedVehicleName?: string;
  createdAt: string;
}

export interface Disruption {
  id: string;
  affectedRoute: string;
  disruptionType: DisruptionType;
  description: string;
  affectedStudentCount: number;
  status: DisruptionStatus;
  timestamp: string;
  startingVillageId?: string;
  destinationId?: string;
}

export interface AllocationResult {
  disruptionId: string;
  affectedStudents: number;
  allocatedStudents: number;
  unassignedStudents: number;
  assignments: {
    requestId: string;
    studentId: string;
    studentName: string;
    studentCode: string;
    pickupVillage: string;
    destination: string;
    passengerCount: number;
    vehicleId?: string;
    vehicleName?: string;
    vehicleType?: VehicleType;
    status: 'proposed' | 'confirmed' | 'unassigned';
    reason?: string;
  }[];
  vehicleUsage: {
    vehicleId: string;
    vehicleName: string;
    vehicleType: VehicleType;
    initialAvailableSeats: number;
    assignedSeats: number;
    remainingSeats: number;
  }[];
  version: number;
  timestamp: string;
  isConfirmed: boolean;
}
