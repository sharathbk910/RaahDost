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
  ExamModeStudentStatus
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
};

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
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_RESCUE);
    localStorage.removeItem(STORAGE_KEYS.ALLOCATIONS);
    localStorage.removeItem(STORAGE_KEYS.CRISIS_SIMULATION);
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

    // Deduct driver seat
    this.adjustDriverSeats(driver.id, -1);
    this.savePickupRequests(list);

    return { success: true, request: current };
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
    return this.getPickupRequests().filter(r => 
      r.driverId === driverId || 
      (r.isBroadcast && (r.status === 'searching' || r.status === 'requested'))
    );
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
