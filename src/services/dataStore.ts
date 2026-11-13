import { 
  Vehicle, 
  TransportRequest, 
  Disruption, 
  Village, 
  Institution, 
  AllocationResult,
  CrisisSimulationResult
} from '../types';
import { 
  DEMO_VILLAGES, 
  DEMO_INSTITUTIONS, 
  INITIAL_VEHICLES, 
  generateDemoStudents, 
  generateSurgeStudents,
  INITIAL_DISRUPTION 
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
};

class LocalDataStore {
  constructor() {
    this.initializeIfEmpty();
  }

  private initializeIfEmpty() {
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
  }

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.VILLAGES, JSON.stringify(DEMO_VILLAGES));
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(DEMO_INSTITUTIONS));
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(generateDemoStudents()));
    localStorage.setItem(STORAGE_KEYS.DISRUPTIONS, JSON.stringify([INITIAL_DISRUPTION]));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_RESCUE);
    localStorage.removeItem(STORAGE_KEYS.ALLOCATIONS);
    localStorage.removeItem(STORAGE_KEYS.CRISIS_SIMULATION);
  }

  getVillages(): Village[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VILLAGES) || '[]');
  }

  getInstitutions(): Institution[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INSTITUTIONS) || '[]');
  }

  getVehicles(): Vehicle[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  }

  saveVehicles(vehicles: Vehicle[]) {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
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

  getRequests(): TransportRequest[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]');
  }

  saveRequests(requests: TransportRequest[]) {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
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
  }

  // Load Combined Requests including 40% Surge
  getCombinedCrisisRequests(): TransportRequest[] {
    const baseline = this.getRequests().filter(r => !r.isSurgeStudent);
    const surge = generateSurgeStudents();
    return [...baseline, ...surge];
  }
}

export const db = new LocalDataStore();
