import { 
  Vehicle, 
  TransportRequest, 
  Disruption, 
  Village, 
  Institution, 
  AllocationResult,
  CrisisSimulationResult,
  DriverProfile,
  PickupRequest,
  DriverReport,
  PickupRequestStatus,
  ExamModeStudentStatus,
  RoadSegment,
  AuditLogEntry,
  StudentNotification
} from '../types';
import { 
  DEMO_VILLAGES, 
  DEMO_INSTITUTIONS, 
  INITIAL_VEHICLES, 
  generateDemoStudents, 
  generateSurgeStudents,
  INITIAL_DISRUPTION,
  DEMO_DRIVERS,
  DEMO_PICKUP_REQUESTS
} from '../data/demoData';
import { ROAD_NETWORK } from '../algorithms/roadRoutingEngine';

const STORAGE_KEYS = {
  VILLAGES: 'raahdost_villages',
  INSTITUTIONS: 'raahdost_institutions',
  VEHICLES: 'raahdost_vehicles',
  REQUESTS: 'raahdost_requests',
  DISRUPTIONS: 'raahdost_disruptions',
  ALLOCATIONS: 'raahdost_allocations',
  ACTIVE_RESCUE: 'raahdost_active_rescue',
  CRISIS_SIMULATION: 'raahdost_crisis_simulation',
  DRIVERS: 'raahdost_drivers',
  PICKUP_REQUESTS: 'raahdost_pickup_requests',
  REPORTS: 'raahdost_driver_reports',
  ROADS: 'raahdost_roads',
  AUDIT_LOGS: 'raahdost_audit_logs',
  NOTIFICATIONS: 'raahdost_notifications',
  EXAM_MODE_SETTINGS: 'raahdost_exam_mode_settings',
};

export interface ExamModeSettings {
  examTime: string;
  examCenter: string;
  latestArrival: string;
  leaveByTime: string;
  isActive: boolean;
}

export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 10 * 60; // default 10:00 AM (600 mins)
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/(\d+):(\d+)\s*(AM|PM)?/);
  if (!match) return 10 * 60;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3];

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  let mins = totalMinutes % (24 * 60);
  if (mins < 0) mins += 24 * 60;
  const hours24 = Math.floor(mins / 60);
  const minutes = mins % 60;
  const modifier = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${modifier}`;
}

export function calculateExamTimingDetails(examTime?: string) {
  const safeTime = (examTime && examTime.trim()) ? examTime.trim() : '10:00 AM';
  const examMins = parseTimeToMinutes(safeTime);
  // 15 mins before exam for hall gate cutoff
  const latestArrivalMins = examMins - 15;
  // 60 mins before arrival (45 min transit + 15 min buffer)
  const leaveByMins = latestArrivalMins - 60;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let diff = examMins - nowMinutes;
  let countdownText = '';
  if (diff > 0) {
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    countdownText = h > 0 ? `${h}h ${m}m` : `${m}m`;
  } else if (diff >= -120) {
    countdownText = 'Exam in Session';
  } else {
    // If exam time is scheduled for tomorrow or relative baseline
    const fullDayDiff = (24 * 60) + diff;
    const h = Math.floor(fullDayDiff / 60);
    const m = fullDayDiff % 60;
    countdownText = `${h}h ${m}m`;
  }

  return {
    examTimeFormatted: formatMinutesToTime(examMins),
    latestArrivalTime: formatMinutesToTime(latestArrivalMins),
    leaveByTime: formatMinutesToTime(leaveByMins),
    countdownText: countdownText || '1h 30m',
    bufferMinutes: 30
  };
}

class LocalDataStore {
  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.initializeIfEmpty();
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('raahdost_live_sync');
          this.broadcastChannel.onmessage = () => {
            this.notifyListenersLocally();
          };
        }
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }

      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('raahdost_')) {
          this.notifyListenersLocally();
        }
      });
    }
  }

  // Reactive subscription pattern for live React components
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.notifyListenersLocally();
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'sync', timestamp: Date.now() });
      } catch (err) {
        // Ignore broadcast error
      }
    }
  }

  private notifyListenersLocally() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Error in store subscriber:', e);
      }
    });
  }

  private initializeIfEmpty() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.VILLAGES)) {
      localStorage.setItem(STORAGE_KEYS.VILLAGES, JSON.stringify(DEMO_VILLAGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INSTITUTIONS)) {
      localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(DEMO_INSTITUTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(generateDemoStudents()));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DISRUPTIONS)) {
      localStorage.setItem(STORAGE_KEYS.DISRUPTIONS, JSON.stringify([INITIAL_DISRUPTION]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DRIVERS)) {
      localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(DEMO_DRIVERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PICKUP_REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.PICKUP_REQUESTS, JSON.stringify(DEMO_PICKUP_REQUESTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROADS)) {
      localStorage.setItem(STORAGE_KEYS.ROADS, JSON.stringify(ROAD_NETWORK));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    }
  }

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.VILLAGES, JSON.stringify(DEMO_VILLAGES));
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(DEMO_INSTITUTIONS));
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(generateDemoStudents()));
    localStorage.setItem(STORAGE_KEYS.DISRUPTIONS, JSON.stringify([INITIAL_DISRUPTION]));
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(DEMO_DRIVERS));
    localStorage.setItem(STORAGE_KEYS.PICKUP_REQUESTS, JSON.stringify(DEMO_PICKUP_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ROADS, JSON.stringify(ROAD_NETWORK));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_RESCUE);
    localStorage.removeItem(STORAGE_KEYS.ALLOCATIONS);
    localStorage.removeItem(STORAGE_KEYS.CRISIS_SIMULATION);
    this.logEdit('Reset Demo Environment', 'System', 'Demo environment reset to baseline Mangalore transit network', 'admin', 'Dr. Srivastava');
    this.notify();
  }

  // -------------------------------------------------------------
  // VILLAGES & INSTITUTIONS
  // -------------------------------------------------------------
  getVillages(): Village[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VILLAGES) || '[]');
  }

  getInstitutions(): Institution[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INSTITUTIONS) || '[]');
  }

  addInstitution(name: string, coordinates?: { lat: number; lng: number }): Institution {
    const list = this.getInstitutions();
    const newInst: Institution = {
      id: `inst-custom-${Date.now()}`,
      name,
      coordinates: coordinates || { lat: 12.8700, lng: 74.8500 }
    };
    list.push(newInst);
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(list));
    this.notify();
    return newInst;
  }

  // -------------------------------------------------------------
  // BUSES & VEHICLES (KSRTC & CITY TRANSIT)
  // -------------------------------------------------------------
  getVehicles(): Vehicle[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  }

  saveVehicles(vehicles: Vehicle[]) {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    this.notify();
  }

  addVehicle(vehicle: Vehicle) {
    const list = this.getVehicles();
    list.unshift(vehicle);
    this.saveVehicles(list);
  }

  updateVehicle(id: string, updates: Partial<Vehicle>) {
    const list = this.getVehicles();
    const index = list.findIndex(v => v.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      if (list[index].availableSeats > list[index].totalCapacity) {
        list[index].availableSeats = list[index].totalCapacity;
      }
      if (list[index].availableSeats < 0) {
        list[index].availableSeats = 0;
      }
      this.saveVehicles(list);
    }
  }

  deleteVehicle(id: string) {
    const list = this.getVehicles().filter(v => v.id !== id);
    this.saveVehicles(list);
  }

  // -------------------------------------------------------------
  // ROAD NETWORK GRAPH (BLOCKED / OPEN ROADS)
  // -------------------------------------------------------------
  getRoads(): RoadSegment[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ROADS) || JSON.stringify(ROAD_NETWORK));
  }

  saveRoads(roads: RoadSegment[]) {
    localStorage.setItem(STORAGE_KEYS.ROADS, JSON.stringify(roads));
    this.notify();
  }

  toggleRoadBlocked(roadId: string, isBlocked: boolean, reason?: string) {
    const roads = this.getRoads();
    const index = roads.findIndex(r => r.id === roadId);
    if (index !== -1) {
      roads[index].isBlocked = isBlocked;
      roads[index].blockageReason = isBlocked ? (reason || 'Flooding & high water surge') : undefined;
      this.saveRoads(roads);

      this.logEdit(
        isBlocked ? 'Blocked Road' : 'Reopened Road',
        'Road Network',
        `${roads[index].name} marked ${isBlocked ? 'BLOCKED' : 'OPEN'}`,
        'admin',
        'District Transport Officer'
      );

      // Trigger automatic recalculation notification for affected students
      if (isBlocked) {
        this.addNotification({
          title: 'Road Blockage Advisory',
          message: `${roads[index].name} is currently BLOCKED. All student transits are rerouted via inland bypass.`,
          type: 'route_change'
        });
      }
    }
  }

  updateRoad(roadId: string, updates: Partial<RoadSegment>) {
    const roads = this.getRoads();
    const index = roads.findIndex(r => r.id === roadId);
    if (index !== -1) {
      roads[index] = { ...roads[index], ...updates };
      this.saveRoads(roads);
    }
  }

  // -------------------------------------------------------------
  // AUDIT & EDIT HISTORY LOGS
  // -------------------------------------------------------------
  getAuditLogs(): AuditLogEntry[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
  }

  logEdit(
    action: string, 
    targetEntity: string, 
    details: string, 
    userRole: 'admin' | 'student' | 'driver' | 'system' = 'admin',
    performedBy: string = 'User'
  ) {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      performedBy,
      userRole,
      action,
      targetEntity,
      details
    };
    logs.unshift(newEntry);
    // Keep last 100 logs
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
    this.notify();
  }

  // -------------------------------------------------------------
  // REAL-TIME NOTIFICATIONS FOR AFFECTED STUDENTS
  // -------------------------------------------------------------
  getNotifications(studentId?: string): StudentNotification[] {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]') as StudentNotification[];
    if (!studentId) return all;
    return all.filter(n => !n.studentId || n.studentId === studentId);
  }

  addNotification(notif: Omit<StudentNotification, 'id' | 'timestamp' | 'isRead'>) {
    const list = this.getNotifications();
    // Anti-spam check: avoid repeated duplicate notification within 1 minute
    const recentDuplicate = list.find(n => 
      n.title === notif.title && 
      n.message === notif.message && 
      (Date.now() - new Date(n.timestamp).getTime()) < 60000
    );
    if (recentDuplicate) return;

    const newNotif: StudentNotification = {
      id: `notif-${Date.now()}`,
      ...notif,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    list.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list.slice(0, 50)));
    this.notify();
  }

  markNotificationRead(id: string) {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
      this.notify();
    }
  }

  notifyAffectedStudentsOnBusTimingChange(busId: string, oldTiming: string, newTiming: string) {
    const bus = this.getVehicles().find(v => v.id === busId);
    const busName = bus?.name || bus?.vehicleCode || 'Your bus';

    this.addNotification({
      title: 'Bus Timing Updated',
      message: `${busName} departure updated from ${oldTiming} to ${newTiming}. Check your live countdown.`,
      type: 'timing_change'
    });
  }

  // -------------------------------------------------------------
  // DRIVER PORTAL STATE & LIVE QUEUE
  // -------------------------------------------------------------
  getDrivers(): DriverProfile[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DRIVERS) || '[]');
  }

  saveDrivers(drivers: DriverProfile[]) {
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
    this.notify();
  }

  getDriverById(id: string): DriverProfile | undefined {
    return this.getDrivers().find(d => d.id === id || d.userId === id);
  }

  addDriver(driver: DriverProfile) {
    const list = this.getDrivers();
    list.unshift(driver);
    this.saveDrivers(list);
  }

  updateDriver(id: string, updates: Partial<DriverProfile>) {
    const list = this.getDrivers();
    const index = list.findIndex(d => d.id === id || d.userId === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      this.saveDrivers(list);
    }
  }

  // Driver Availability Switch
  setDriverAvailability(
    driverId: string, 
    isAvailable: boolean, 
    seatsFree?: number, 
    activeRoute?: any,
    departureTime?: string
  ) {
    const list = this.getDrivers();
    const index = list.findIndex(d => d.id === driverId || d.userId === driverId);
    if (index !== -1) {
      list[index].isAvailable = isAvailable;
      if (typeof seatsFree === 'number') list[index].seatsFree = seatsFree;
      if (activeRoute) list[index].activeRoute = activeRoute;
      if (departureTime) list[index].departureTime = departureTime;
      this.saveDrivers(list);
    }
  }

  // Driver Live GPS Movement (Called every 5 seconds)
  updateDriverLocation(driverId: string, lat: number, lng: number) {
    const list = this.getDrivers();
    const index = list.findIndex(d => d.id === driverId || d.userId === driverId);
    if (index !== -1) {
      list[index].currentLocation = {
        lat,
        lng,
        updatedAt: new Date().toISOString()
      };
      this.saveDrivers(list);
    }
  }

  // Driver Seat Counter Adjustment
  adjustDriverSeats(driverId: string, delta: number) {
    const list = this.getDrivers();
    const index = list.findIndex(d => d.id === driverId || d.userId === driverId);
    if (index !== -1) {
      let newSeats = (list[index].seatsFree || 0) + delta;
      if (newSeats < 0) newSeats = 0;
      if (newSeats > list[index].totalSeats) newSeats = list[index].totalSeats;
      list[index].seatsFree = newSeats;
      
      // Auto-hide rule: When seats free reach 0, driver is not shown to new students
      if (newSeats === 0) {
        // Driver remains available in profile but seatsFree is 0
      }
      this.saveDrivers(list);
    }
  }

  // Admin Driver Approval Controls
  approveDriver(driverId: string) {
    this.updateDriver(driverId, { approvalStatus: 'approved', rejectionReason: undefined });
  }

  rejectDriver(driverId: string, reason: string) {
    this.updateDriver(driverId, { approvalStatus: 'rejected', rejectionReason: reason, isAvailable: false });
  }

  suspendDriver(driverId: string) {
    this.updateDriver(driverId, { approvalStatus: 'suspended', isAvailable: false });
  }

  // Filter only active, approved drivers with available seats for students
  getAvailableDriversForStudents(): DriverProfile[] {
    return this.getDrivers().filter(d => 
      d.approvalStatus === 'approved' && 
      d.isAvailable && 
      d.seatsFree > 0
    );
  }

  // -------------------------------------------------------------
  // PICKUP REQUESTS (STUDENT <-> DRIVER TRIP LIFECYCLE)
  // -------------------------------------------------------------
  getPickupRequests(): PickupRequest[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PICKUP_REQUESTS) || '[]');
  }

  savePickupRequests(requests: PickupRequest[]) {
    localStorage.setItem(STORAGE_KEYS.PICKUP_REQUESTS, JSON.stringify(requests));
    this.notify();
  }

  updatePickupRequest(requestId: string, updates: Partial<PickupRequest>): { success: boolean; error?: string } {
    const list = this.getPickupRequests();
    const index = list.findIndex(r => r.id === requestId);
    if (index === -1) return { success: false, error: 'Pickup request not found.' };

    const current = list[index];
    if (current.status === 'accepted' || current.status === 'on_the_way' || current.status === 'picked_up') {
      return { 
        success: false, 
        error: 'Cannot edit request once accepted by a driver. You can cancel and submit a new request.' 
      };
    }

    list[index] = { ...current, ...updates };
    this.savePickupRequests(list);
    return { success: true };
  }

  createPickupRequest(req: PickupRequest) {
    const list = this.getPickupRequests();
    list.unshift(req);
    this.savePickupRequests(list);
  }

  // Broadcast request to all matching drivers heading towards student's destination
  broadcastPickupRequest(reqData: {
    studentId: string;
    studentName: string;
    studentPhone?: string;
    pickupLocationName: string;
    pickupCoordinates?: { lat: number; lng: number };
    destinationName: string;
    destinationCoordinates?: { lat: number; lng: number };
    hasExamToday?: boolean;
    examTime?: string;
    latestArrivalTime?: string;
    urgency?: 'high' | 'critical' | 'normal';
    guardianPhone?: string;
    notes?: string;
  }): PickupRequest {
    const newReq: PickupRequest = {
      id: `req-bcast-${Date.now()}`,
      studentId: reqData.studentId,
      studentName: reqData.studentName,
      studentPhone: reqData.studentPhone,
      pickupLocationName: reqData.pickupLocationName,
      pickupCoordinates: reqData.pickupCoordinates,
      destinationName: reqData.destinationName,
      destinationCoordinates: reqData.destinationCoordinates,
      hasExamToday: reqData.hasExamToday !== undefined ? reqData.hasExamToday : true,
      examTime: reqData.examTime || '10:30 AM',
      latestArrivalTime: reqData.latestArrivalTime || '10:15 AM',
      urgency: reqData.urgency || 'critical',
      isBroadcast: true,
      driverId: 'broadcast',
      driverName: 'Broadcasting to nearby verified drivers',
      status: 'searching',
      requestedAt: new Date().toISOString(),
      guardianAlertSent: !!reqData.guardianPhone,
      guardianPhone: reqData.guardianPhone,
      notes: reqData.notes || 'Broadcasted Exam Priority Ride'
    };

    this.createPickupRequest(newReq);
    return newReq;
  }

  // Atomic acceptance of a pickup request (Prevents race conditions where two drivers both accept)
  atomicAcceptPickupRequest(
    requestId: string, 
    driver: DriverProfile
  ): { success: boolean; request?: PickupRequest; error?: string } {
    const list = this.getPickupRequests();
    const index = list.findIndex(r => r.id === requestId);

    if (index === -1) {
      return { success: false, error: 'Pickup request not found.' };
    }

    const current = list[index];

    // Transaction-safe check: Only allow if still in 'searching' or 'requested'
    if (current.status !== 'searching' && current.status !== 'requested') {
      return { 
        success: false, 
        error: `Ride already ${current.status === 'accepted' ? 'accepted by another driver' : current.status}.` 
      };
    }

    // Check driver available seats
    if (driver.seatsFree <= 0) {
      return { success: false, error: 'No available seats free in your vehicle.' };
    }

    // Atomic update
    current.status = 'accepted';
    current.driverId = driver.id;
    current.driverName = driver.fullName;
    current.driverPhone = driver.phone;
    current.driverPhotoUrl = driver.photoUrl;
    current.driverRating = driver.rating;
    current.driverVehiclePlate = driver.vehicleNumberPlate;
    current.driverVehicleType = driver.vehicleType;
    current.driverEtaMinutes = 6;
    current.acceptedAt = new Date().toISOString();
    current.statusUpdatedAt = new Date().toISOString();
    current.updatedAt = new Date().toISOString();
    current.lastStatusUpdateMessage = 'Driver Confirmed — Trip Accepted';

    // Update driver active destination dynamically to match student's destination
    if (driver.activeRoute) {
      this.updateDriver(driver.id, {
        activeRoute: {
          ...driver.activeRoute,
          startLocation: current.pickupLocationName,
          destinationLocation: current.destinationName
        }
      });
    }

    // Deduct driver seat
    this.adjustDriverSeats(driver.id, -1);
    this.savePickupRequests(list);

    return { success: true, request: current };
  }

  // Update driver trip status with human-readable messaging & timestamp
  updateDriverTripStatus(
    requestId: string, 
    status: PickupRequestStatus, 
    driverId: string, 
    customNote?: string
  ): { success: boolean; request?: PickupRequest; error?: string } {
    const list = this.getPickupRequests();
    const index = list.findIndex(r => r.id === requestId);
    if (index === -1) {
      return { success: false, error: 'Pickup request not found.' };
    }

    const current = list[index];
    if (current.driverId !== driverId && current.driverId !== 'broadcast') {
      return { success: false, error: 'Unauthorized: This trip belongs to another driver.' };
    }

    const STATUS_MESSAGES: Record<PickupRequestStatus, string> = {
      searching: 'Searching for nearest verified driver...',
      requested: 'Ride request received',
      accepted: 'Driver Confirmed',
      preparing: 'Preparing for Departure',
      on_the_way: 'Your driver is on the way',
      near_pickup: 'Driver approaching your pickup point',
      picked_up: 'You have been picked up',
      en_route_destination: 'On the way to destination',
      reached: 'Trip Completed',
      dropped: 'Trip Completed',
      delayed: '⚠️ Driver Delayed — Detour or heavy traffic',
      declined: 'Trip request declined',
      cancelled: 'Trip Cancelled'
    };

    current.status = status;
    current.lastStatusUpdateMessage = customNote || STATUS_MESSAGES[status] || `Trip status: ${status}`;
    current.statusUpdatedAt = new Date().toISOString();
    current.updatedAt = new Date().toISOString();

    if (status === 'accepted') {
      current.acceptedAt = new Date().toISOString();
    } else if (status === 'reached' || status === 'dropped') {
      current.completedAt = new Date().toISOString();
      const driver = this.getDriverById(driverId);
      if (driver) {
        this.updateDriver(driverId, {
          studentsHelpedCount: (driver.studentsHelpedCount || 0) + 1,
          tripsCompleted: (driver.tripsCompleted || 0) + 1
        });
      }
    } else if (status === 'cancelled') {
      this.adjustDriverSeats(driverId, 1);
    }

    this.savePickupRequests(list);
    return { success: true, request: current };
  }

  // Update trip destination dynamically
  updateTripDestination(
    requestId: string, 
    newDestination: string, 
    driverId: string
  ): { success: boolean; request?: PickupRequest } {
    const list = this.getPickupRequests();
    const index = list.findIndex(r => r.id === requestId);
    if (index === -1) return { success: false };

    const current = list[index];
    current.destinationName = newDestination;
    current.updatedAt = new Date().toISOString();
    current.lastStatusUpdateMessage = `Destination updated to ${newDestination}`;

    const driver = this.getDriverById(driverId);
    if (driver && driver.activeRoute) {
      this.updateDriver(driverId, {
        activeRoute: {
          ...driver.activeRoute,
          destinationLocation: newDestination
        }
      });
    }

    this.savePickupRequests(list);
    return { success: true, request: current };
  }

  // Create Student Journey Request with duplicate prevention
  createStudentJourneyRequest(reqData: {
    studentId: string;
    studentName: string;
    studentPhone?: string;
    pickupLocationName: string;
    pickupCoordinates?: { lat: number; lng: number };
    destinationName: string;
    destinationCoordinates?: { lat: number; lng: number };
    departureTime?: string;
    hasExamToday?: boolean;
    examTime?: string;
    latestArrivalTime?: string;
    urgency?: 'high' | 'critical' | 'normal';
    guardianPhone?: string;
    notes?: string;
  }): { success: boolean; request?: PickupRequest; error?: string } {
    const studentRequests = this.getRequestsForStudent(reqData.studentId);
    const activeReq = studentRequests.find(
      r => r.status !== 'dropped' && r.status !== 'reached' && r.status !== 'cancelled'
    );
    if (activeReq) {
      return { 
        success: false, 
        request: activeReq, 
        error: 'You already have an active transport request in progress.' 
      };
    }

    const newReq: PickupRequest = {
      id: `req-${Date.now()}`,
      studentId: reqData.studentId,
      studentName: reqData.studentName,
      studentPhone: reqData.studentPhone,
      pickupLocationName: reqData.pickupLocationName,
      pickupCoordinates: reqData.pickupCoordinates,
      destinationName: reqData.destinationName,
      destinationCoordinates: reqData.destinationCoordinates,
      departureTime: reqData.departureTime || '07:25 AM',
      hasExamToday: reqData.hasExamToday !== undefined ? reqData.hasExamToday : false,
      examTime: reqData.examTime,
      latestArrivalTime: reqData.latestArrivalTime,
      urgency: reqData.urgency || (reqData.hasExamToday ? 'critical' : 'normal'),
      isBroadcast: true,
      driverId: 'broadcast',
      driverName: 'Broadcasting to nearby verified drivers',
      status: 'searching',
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusUpdatedAt: new Date().toISOString(),
      lastStatusUpdateMessage: 'Searching for nearest verified driver...',
      guardianAlertSent: !!reqData.guardianPhone,
      guardianPhone: reqData.guardianPhone,
      notes: reqData.notes || (reqData.hasExamToday ? `⚡ EXAM PRIORITY: Exam at ${reqData.examTime || '10:00 AM'}` : 'Student Commute Request')
    };

    this.createPickupRequest(newReq);
    return { success: true, request: newReq };
  }

  // Cancel or Re-open request
  cancelPickupRequest(
    requestId: string, 
    cancelledBy: 'student' | 'driver'
  ): { success: boolean; request?: PickupRequest } {
    const list = this.getPickupRequests();
    const index = list.findIndex(r => r.id === requestId);

    if (index === -1) return { success: false };

    const req = list[index];

    if (cancelledBy === 'driver') {
      // Restore driver seat
      if (req.driverId && req.driverId !== 'broadcast') {
        this.adjustDriverSeats(req.driverId, 1);
      }
      // Re-open request to searching pool
      req.status = 'searching';
      req.driverId = 'broadcast';
      req.driverName = 'Broadcasting to nearby verified drivers';
      req.driverVehiclePlate = undefined;
      req.acceptedAt = undefined;
    } else {
      // Cancelled by student
      if (req.status === 'accepted' && req.driverId && req.driverId !== 'broadcast') {
        this.adjustDriverSeats(req.driverId, 1);
      }
      req.status = 'cancelled';
    }

    this.savePickupRequests(list);
    return { success: true, request: req };
  }

  // Rate driver after trip
  rateDriver(requestId: string, rating: number, feedback?: string) {
    const list = this.getPickupRequests();
    const index = list.findIndex(r => r.id === requestId);
    if (index !== -1) {
      list[index].studentRating = rating;
      if (feedback) list[index].studentFeedback = feedback;
      
      const driverId = list[index].driverId;
      const driver = this.getDriverById(driverId);
      if (driver) {
        const oldRating = driver.rating || 5.0;
        const newRating = parseFloat(((oldRating * 4 + rating) / 5).toFixed(1));
        this.updateDriver(driverId, { rating: newRating });
      }
      this.savePickupRequests(list);
    }
  }

  updatePickupRequestStatus(
    requestId: string, 
    status: PickupRequestStatus, 
    notes?: string
  ) {
    const list = this.getPickupRequests();
    const index = list.findIndex(r => r.id === requestId);
    if (index !== -1) {
      list[index].status = status;
      if (notes) list[index].notes = notes;
      if (status === 'accepted') {
        list[index].acceptedAt = new Date().toISOString();
      } else if (status === 'dropped' || status === 'reached') {
        list[index].completedAt = new Date().toISOString();
        const driverId = list[index].driverId;
        const driver = this.getDriverById(driverId);
        if (driver) {
          this.updateDriver(driverId, {
            studentsHelpedCount: (driver.studentsHelpedCount || 0) + 1,
            tripsCompleted: (driver.tripsCompleted || 0) + 1
          });
        }
      }
      this.savePickupRequests(list);
    }
  }

  getRequestsForDriver(driverId: string): PickupRequest[] {
    const driver = this.getDriverById(driverId);
    return this.getPickupRequests().filter(r => {
      // 1. Direct requests for this driver
      if (r.driverId === driverId) return true;

      // 2. Broadcast / searching requests available for this driver to accept
      if (r.isBroadcast && (r.status === 'searching' || r.status === 'requested')) {
        // Driver must be available and have seats free
        if (driver && (!driver.isAvailable || driver.seatsFree <= 0)) {
          return false;
        }
        return true;
      }

      return false;
    });
  }

  // Single Source of Truth for Student Exam Mode Settings & Timings
  getExamModeSettings(): ExamModeSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAM_MODE_SETTINGS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const timings = calculateExamTimingDetails(parsed.examTime || '10:00 AM');
        return {
          examTime: parsed.examTime || '10:00 AM',
          examCenter: parsed.examCenter || 'Government Polytechnic College Mangalore (Kadri Hills)',
          latestArrival: timings.latestArrivalTime,
          leaveByTime: timings.leaveByTime,
          isActive: parsed.isActive !== undefined ? parsed.isActive : true
        };
      } catch (e) {}
    }

    const defaultTimings = calculateExamTimingDetails('10:00 AM');
    return {
      examTime: '10:00 AM',
      examCenter: 'Government Polytechnic College Mangalore (Kadri Hills)',
      latestArrival: defaultTimings.latestArrivalTime,
      leaveByTime: defaultTimings.leaveByTime,
      isActive: true
    };
  }

  saveExamModeSettings(updates: Partial<ExamModeSettings>) {
    const current = this.getExamModeSettings();
    const newExamTime = (updates.examTime && updates.examTime.trim()) ? updates.examTime.trim() : current.examTime;
    const timings = calculateExamTimingDetails(newExamTime);

    const merged: ExamModeSettings = {
      examTime: newExamTime,
      examCenter: updates.examCenter || current.examCenter,
      latestArrival: timings.latestArrivalTime,
      leaveByTime: timings.leaveByTime,
      isActive: updates.isActive !== undefined ? updates.isActive : current.isActive
    };

    localStorage.setItem(STORAGE_KEYS.EXAM_MODE_SETTINGS, JSON.stringify(merged));
    this.notify();
  }

  getRequestsForStudent(studentId: string): PickupRequest[] {
    return this.getPickupRequests().filter(r => r.studentId === studentId);
  }

  // Live Exam Mode Students Monitor List for Admin
  getExamModeStudentsList(): ExamModeStudentStatus[] {
    const requests = this.getRequests().filter(r => r.hasExam);
    const pickupReqs = this.getPickupRequests().filter(p => p.hasExamToday);

    return requests.map((r, i) => {
      const matchPickup = pickupReqs.find(p => p.studentId === r.studentId || p.studentName === r.displayName);
      const village = this.getVillages().find(v => v.id === r.villageId)?.name || 'Mulki';
      const inst = this.getInstitutions().find(inst => inst.id === r.destinationId)?.name || 'Kadri Polytechnic';

      let status: 'Assigned' | 'On the way' | 'Reached' | 'At risk' = 'Assigned';
      let allocated = r.allocatedVehicleName || 'KSRTC Express #1101';

      if (matchPickup) {
        if (matchPickup.status === 'reached' || matchPickup.status === 'dropped') {
          status = 'Reached';
        } else if (matchPickup.status === 'accepted' || matchPickup.status === 'on_the_way' || matchPickup.status === 'picked_up') {
          status = 'On the way';
          allocated = `${matchPickup.driverName} (${matchPickup.driverVehiclePlate})`;
        } else if (matchPickup.status === 'searching') {
          status = 'At risk';
          allocated = 'Searching for driver...';
        }
      } else if (r.status === 'unassigned' || r.status === 'pending') {
        status = 'At risk';
        allocated = 'Unassigned';
      }

      return {
        studentId: r.studentId,
        studentName: r.displayName,
        villageName: village,
        examCenterName: inst.split('(')[0].trim(),
        examTime: r.examStartTime || '10:30 AM',
        latestArrivalTime: '10:15 AM',
        leaveByTime: '08:35 AM',
        timeRemainingText: '1h 25m',
        status,
        allocatedTransportName: allocated,
        driverContact: matchPickup?.driverPhone || '+91 98450 22001',
        isLateRisk: status === 'At risk'
      };
    });
  }

  // -------------------------------------------------------------
  // SAFETY & REPORTS
  // -------------------------------------------------------------
  getReports(): DriverReport[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]');
  }

  addReport(report: DriverReport) {
    const list = this.getReports();
    list.unshift(report);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(list));
    this.notify();
  }

  // -------------------------------------------------------------
  // STUDENT TRANSPORT REQUESTS & DISRUPTIONS
  // -------------------------------------------------------------
  getRequests(): TransportRequest[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]');
  }

  saveRequests(requests: TransportRequest[]) {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    this.notify();
  }

  addRequest(req: TransportRequest) {
    const list = this.getRequests();
    list.unshift(req);
    this.saveRequests(list);
  }

  updateRequestStatus(id: string, status: TransportRequest['status'], vehicleId?: string, vehicleName?: string) {
    const list = this.getRequests();
    const index = list.findIndex(r => r.id === id);
    if (index !== -1) {
      list[index].status = status;
      if (vehicleId) list[index].allocatedVehicleId = vehicleId;
      if (vehicleName) list[index].allocatedVehicleName = vehicleName;
      this.saveRequests(list);
    }
  }

  getDisruptions(): Disruption[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DISRUPTIONS) || '[]');
  }

  saveDisruptions(disruptions: Disruption[]) {
    localStorage.setItem(STORAGE_KEYS.DISRUPTIONS, JSON.stringify(disruptions));
    this.notify();
  }

  addDisruption(disruption: Disruption) {
    const list = this.getDisruptions();
    list.unshift(disruption);
    this.saveDisruptions(list);
  }

  getActiveRescue(): AllocationResult | null {
    const val = localStorage.getItem(STORAGE_KEYS.ACTIVE_RESCUE);
    return val ? JSON.parse(val) : null;
  }

  saveActiveRescue(allocation: AllocationResult | null) {
    if (allocation) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_RESCUE, JSON.stringify(allocation));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_RESCUE);
    }
    this.notify();
  }

  // Crisis Simulation State
  getCrisisSimulation(): CrisisSimulationResult | null {
    const val = localStorage.getItem(STORAGE_KEYS.CRISIS_SIMULATION);
    return val ? JSON.parse(val) : null;
  }

  saveCrisisSimulation(result: CrisisSimulationResult | null) {
    if (result) {
      localStorage.setItem(STORAGE_KEYS.CRISIS_SIMULATION, JSON.stringify(result));
      if (result.isActive) {
        this.addNotification({
          title: '⚠️ Exam Day Crisis Plan Activated',
          message: '2 KSRTC coastal buses disrupted & Kuloor bridge flooded. Priority exam detours via Kinnigoli-Bajpe and relief shuttles are active.',
          type: 'crisis_alert'
        });
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CRISIS_SIMULATION);
    }
    this.notify();
  }

  getCombinedCrisisRequests(): TransportRequest[] {
    const baseline = this.getRequests().filter(r => !r.isSurgeStudent);
    const surge = generateSurgeStudents();
    return [...baseline, ...surge];
  }
}

export const db = new LocalDataStore();
