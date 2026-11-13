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
  hasExam?: boolean;
  examSubject?: string;
  examStartTime?: string; // e.g. "09:00 AM"
  originalBusId?: string;
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
  currentSpeedKmH?: number;
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
  // Crisis mode metadata
  hasExam?: boolean;
  examSubject?: string;
  examStartTime?: string; // ISO or "09:00 AM"
  minutesToExam?: number;
  originalBusId?: string;
  isSurgeStudent?: boolean;
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

// Road Network Graph Types for Flood Simulation
export interface RoadSegment {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  name: string;
  distanceKm: number;
  normalTravelMinutes: number;
  isBlocked: boolean;
  blockageReason?: string;
}

export interface RoutePathResult {
  pathNodeIds: string[];
  pathSegmentNames: string[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  isDetour: boolean;
  originalDurationMinutes?: number;
  delayMinutes?: number;
  blockedSegmentEncountered?: string;
  isAccessible: boolean;
}

export type CrisisStudentStatus = 
  | 'Successfully Reassigned'
  | 'Examination Priority'
  | 'Expected to Arrive Late'
  | 'Awaiting Confirmation'
  | 'No Vehicle Available'
  | 'No Feasible Route';

export interface CrisisAssignment {
  requestId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  pickupVillageId: string;
  pickupVillageName: string;
  destinationId: string;
  destinationName: string;
  passengerCount: number;
  hasExam: boolean;
  examSubject?: string;
  examStartTime?: string;
  vehicleId?: string;
  vehicleName?: string;
  vehicleType?: VehicleType;
  status: CrisisStudentStatus;
  departureTime?: string;
  expectedArrivalTime?: string;
  expectedTravelMinutes?: number;
  isLateForExam?: boolean;
  isDetour?: boolean;
  explanation: string;
}

export interface CrisisSimulationResult {
  isActive: boolean;
  timestamp: string;
  baselineDemand: number;
  surgeDemand: number;
  totalDemand: number;
  unavailableBuses: Vehicle[];
  availableVehicles: Vehicle[];
  totalAvailableSeats: number;
  examStudentsCount: number;
  rescuedCount: number;
  lateArrivalCount: number;
  unassignedCount: number;
  blockedRoad: RoadSegment;
  alternativeRouteSummary: {
    originalPath: string;
    alternativePath: string;
    originalMinutes: number;
    newMinutes: number;
    delayMinutes: number;
  };
  assignments: CrisisAssignment[];
  vehicleUsage: {
    vehicleId: string;
    vehicleName: string;
    vehicleType: VehicleType;
    totalCapacity: number;
    assignedSeats: number;
    remainingSeats: number;
    assignedStudentsCount: number;
    examStudentsCount: number;
  }[];
  isConfirmed: boolean;
  confirmedAt?: string;
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
