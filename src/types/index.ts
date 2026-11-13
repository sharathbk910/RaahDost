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
  examStartTime?: string;
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
  stops?: string[];
  departureTimes?: string[];
  routeName?: string;
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
  examStartTime?: string; // e.g. "09:00 AM"
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
  | 'Assigned'
  | 'Rerouted'
  | 'At risk'
  | 'Alternative Arranged'
  | 'Stranded';

export type AlternativeOptionType = 
  | 'Shared Auto Pool'
  | 'Staggered Wave Bus'
  | 'Merged Route Shuttle'
  | 'Nearby Pickup Point Walkway';

export interface CrisisAlternativeOption {
  type: AlternativeOptionType;
  title: string;
  description: string;
  estimatedDeparture: string;
  estimatedArrival: string;
  capacityAllocated: number;
  assignedStudentIds: string[];
}

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
  alternativeOption?: AlternativeOptionType;
  explanation: string;
}

export interface BeforeAfterComparison {
  before: {
    totalStudents: number;
    availableBuses: number;
    totalSeats: number;
    onTimeStudents: number;
    atRiskStudents: number;
    strandedStudents: number;
    busUtilizationPercent: number;
  };
  after: {
    totalStudents: number;
    availableBuses: number;
    totalSeats: number;
    onTimeStudents: number;
    atRiskStudents: number;
    strandedStudents: number;
    busUtilizationPercent: number;
  };
}

export interface AIDecisionExplanation {
  studentName: string;
  studentCode: string;
  decision: string;
  factorUrgency: string;
  factorRoute: string;
  factorCapacity: string;
  aiReasoningText: string;
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
  atRiskCount: number;
  strandedCount: number;
  alternativeAssignedCount: number;
  blockedRoad: RoadSegment;
  alternativeRouteSummary: {
    originalPath: string;
    alternativePath: string;
    originalMinutes: number;
    newMinutes: number;
    delayMinutes: number;
  };
  assignments: CrisisAssignment[];
  alternativeOptions: CrisisAlternativeOption[];
  beforeAfter: BeforeAfterComparison;
  aiExplanations: AIDecisionExplanation[];
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

// ==========================================
// DRIVER PORTAL & REALTIME MOBILITY TYPES
// ==========================================
export type DriverApprovalStatus = 'approved' | 'pending' | 'rejected' | 'suspended';
export type DriverType = 'bus_driver' | 'community_driver';
export type VehicleCategory = 'Bike' | 'Car' | 'Auto' | 'Shared Van' | 'Mini Bus' | 'Government Bus' | 'Private Bus' | 'Tempo';

export interface DriverRegularRoute {
  id: string;
  startLocation: string; // e.g. "Mulki"
  startCoordinates?: { lat: number; lng: number };
  destinationLocation: string; // e.g. "Kadri Polytechnic, Mangalore"
  destinationCoordinates?: { lat: number; lng: number };
  viaPoints?: string[];
  usualDepartureTime: string; // e.g. "07:30 AM"
  operatingDays: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
}

export interface DriverProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  photoUrl: string;
  driverType: DriverType;
  vehicleType: VehicleCategory;
  vehicleNumberPlate: string;
  totalSeats: number;
  vehiclePhotoUrl?: string;
  licensePhotoUrl?: string;
  approvalStatus: DriverApprovalStatus;
  rejectionReason?: string;
  registeredAt: string;
  
  // Daily Live Availability State
  isAvailable: boolean;
  activeRoute?: DriverRegularRoute;
  departureTime?: string;
  seatsFree: number;
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
  assignedBusId?: string; // If government/private bus driver
  assignedBusCode?: string;
  busStatus?: 'Running' | 'Delayed' | 'Full' | 'Broken Down';
  rating: number; // e.g. 4.9
  tripsCompleted: number;
  studentsHelpedCount: number;
  isDemo?: boolean;
}

export type PickupRequestStatus = 
  | 'searching'
  | 'requested' 
  | 'accepted' 
  | 'preparing'
  | 'on_the_way'
  | 'near_pickup'
  | 'picked_up' 
  | 'en_route_destination'
  | 'reached'
  | 'dropped' 
  | 'delayed'
  | 'declined' 
  | 'cancelled';

export interface PickupRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  studentAvatar?: string;
  seatsRequested?: number;
  pickupLocationName: string;
  pickupCoordinates?: { lat: number; lng: number };
  destinationName: string;
  destinationCoordinates?: { lat: number; lng: number };
  departureTime?: string;
  hasExamToday?: boolean;
  examTime?: string;
  latestArrivalTime?: string;
  urgency?: 'high' | 'critical' | 'normal';
  isBroadcast?: boolean;
  driverId: string;
  driverName: string;
  driverPhone?: string;
  driverPhotoUrl?: string;
  driverRating?: number;
  driverVehiclePlate?: string;
  driverVehicleType?: string;
  driverEtaMinutes?: number;
  status: PickupRequestStatus;
  requestedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  updatedAt?: string;
  statusUpdatedAt?: string;
  lastStatusUpdateMessage?: string;
  guardianAlertSent?: boolean;
  guardianPhone?: string;
  notes?: string;
  studentRating?: number;
  studentFeedback?: string;
}

export type ExamStudentTripStatus = 'Assigned' | 'On the way' | 'Reached' | 'At risk';

export interface ExamModeStudentStatus {
  studentId: string;
  studentName: string;
  villageName: string;
  examCenterName: string;
  examTime: string;
  latestArrivalTime: string;
  leaveByTime: string;
  timeRemainingText: string;
  status: ExamStudentTripStatus;
  allocatedTransportName: string;
  driverContact?: string;
  isLateRisk: boolean;
}

export interface DriverReport {
  id: string;
  driverId: string;
  driverName: string;
  studentId: string;
  studentName: string;
  reason: string;
  details: string;
  timestamp: string;
  status: 'pending' | 'resolved';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  performedBy: string;
  userRole: 'admin' | 'student' | 'driver' | 'system';
  action: string;
  targetEntity: string;
  details: string;
}

export interface StudentNotification {
  id: string;
  studentId?: string; // specific student or undefined for broadcast
  title: string;
  message: string;
  timestamp: string;
  type: 'timing_change' | 'route_change' | 'crisis_alert' | 'pickup_status';
  isRead: boolean;
}
