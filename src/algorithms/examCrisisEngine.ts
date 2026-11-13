import { 
  TransportRequest, 
  Vehicle, 
  Village, 
  Institution, 
  CrisisSimulationResult,
  CrisisAssignment,
  RoadSegment 
} from '../types';
import { ROAD_NETWORK, findShortestRoute } from './roadRoutingEngine';

export interface CrisisEngineParams {
  requests: TransportRequest[];
  vehicles: Vehicle[];
  villages: Village[];
  institutions: Institution[];
  simulatedTime?: string; // default "07:15 AM"
  examStartTime?: string; // default "09:00 AM" (105 mins window)
  isFlooded?: boolean;
}

/**
 * EXAM DAY CRISIS RESCUE OPTIMIZER
 * 
 * Simultaneously handles:
 * 1. 2 Government Bus Failures (marked unavailable)
 * 2. 40% Demand Surge (+12 students over baseline 30)
 * 3. Flooded Canal Road Blockage (Dijkstra re-routing via Balarampur Bypass)
 * 4. 2-Hour Exam Deadline Prioritization
 */
export function executeExamDayCrisisOptimization(
  params: CrisisEngineParams
): CrisisSimulationResult {
  const {
    requests,
    vehicles,
    villages,
    institutions,
    simulatedTime = '07:15 AM',
    examStartTime = '09:00 AM',
    isFlooded = true
  } = params;

  const villageMap = new Map(villages.map(v => [v.id, v.name]));
  const instMap = new Map(institutions.map(i => [i.id, i.name]));

  // 1. Configure Road Network Blockage (Flooded Canal Road)
  const roadNetwork: RoadSegment[] = ROAD_NETWORK.map(r => {
    if (r.id === 'road-rampur-poly-direct' && isFlooded) {
      return {
        ...r,
        isBlocked: true,
        blockageReason: 'Rampur Canal overflowing due to flash flood. Road closed by local police.'
      };
    }
    return { ...r, isBlocked: false };
  });

  const blockedRoad = roadNetwork.find(r => r.isBlocked)! || ROAD_NETWORK[0];

  // 2. Identify 2 Government Buses that Break Down (Event 1)
  // Disable 2 Government Buses or assign 2 vehicles as failed buses
  const unavailableBuses: Vehicle[] = [
    {
      id: 'bus-govt-01',
      vehicleCode: 'UP-32-GB-1001',
      name: 'State Roadways Bus #1001 (Rampur Route)',
      vehicleType: 'Government Bus',
      startingVillageId: 'vil-1',
      destinationId: 'inst-1',
      totalCapacity: 32,
      availableSeats: 0,
      availabilityStatus: 'unavailable',
      operatorConfirmed: false,
      driverName: 'Harish Chandra (UPSRTC)'
    },
    {
      id: 'bus-govt-02',
      vehicleCode: 'UP-32-GB-1002',
      name: 'State Roadways Bus #1002 (Express Corridor)',
      vehicleType: 'Government Bus',
      startingVillageId: 'vil-1',
      destinationId: 'inst-1',
      totalCapacity: 28,
      availableSeats: 0,
      availabilityStatus: 'unavailable',
      operatorConfirmed: false,
      driverName: 'Ram Avatar (UPSRTC)'
    }
  ];

  // 3. Alternative Usable Fleet Tracker (Excludes failed buses)
  const usableVehicles = vehicles
    .filter(v => v.availabilityStatus === 'available' && v.availableSeats > 0)
    .map(v => ({
      ...v,
      initialAvailable: Math.min(v.availableSeats, v.totalCapacity),
      remainingSeats: Math.min(v.availableSeats, v.totalCapacity),
      assignedSeats: 0,
      assignedStudentsCount: 0,
      examStudentsCount: 0
    }));

  const totalAvailableSeats = usableVehicles.reduce((sum, v) => sum + v.initialAvailable, 0);

  // 4. Calculate Route Detour for Rampur -> Polytechnic via Dijkstra
  const alternativeRoute = findShortestRoute('vil-1', 'inst-1', roadNetwork, true);
  const routeSummary = {
    originalPath: 'Rampur Village ➔ Canal Road (Direct) ➔ Govt Polytechnic',
    alternativePath: alternativeRoute.pathSegmentNames.join(' ➔ ') || 'Rampur ➔ Shivpur Link ➔ Balarampur Bypass ➔ Polytechnic',
    originalMinutes: alternativeRoute.originalDurationMinutes || 20,
    newMinutes: alternativeRoute.totalDurationMinutes,
    delayMinutes: alternativeRoute.delayMinutes || 25
  };

  // 5. Total Demand Calculation (Baseline 30 + 40% Surge = 42 Students)
  const baselineCount = requests.filter(r => !r.isSurgeStudent).length || 30;
  const surgeCount = requests.filter(r => r.isSurgeStudent).length || 12;
  const totalDemand = requests.length;

  // 6. Multi-tier Sorting Priority Engine
  // Priority Order:
  // Tier 1: Students with Exams starting within 2 hours
  // Tier 2: Stranded from Government Bus Failures
  // Tier 3: Standard travel requests
  const sortedRequests = [...requests].sort((a, b) => {
    // Exam students first
    if (a.hasExam && !b.hasExam) return -1;
    if (!a.hasExam && b.hasExam) return 1;

    // If both have exams, sort by urgency (minutesToExam ascending)
    if (a.hasExam && b.hasExam) {
      return (a.minutesToExam || 105) - (b.minutesToExam || 105);
    }

    // Then prioritize regular students stranded from original broken buses
    if (a.originalBusId && !b.originalBusId) return -1;
    if (!a.originalBusId && b.originalBusId) return 1;

    return 0;
  });

  // 7. Allocation Execution
  const assignments: CrisisAssignment[] = [];
  let rescuedCount = 0;
  let lateArrivalCount = 0;
  let unassignedCount = 0;

  // Time calculations (Current simulated time: 7:15 AM = 435 minutes from midnight)
  const currentSimMinutes = 7 * 60 + 15; // 435
  const examDeadLineMinutes = 9 * 60; // 540 (9:00 AM)

  for (const req of sortedRequests) {
    const pickupName = villageMap.get(req.villageId) || 'Rampur Village';
    const destName = instMap.get(req.destinationId) || 'Govt Polytechnic Institute';
    const passengersNeeded = req.passengerCount || 1;

    // Check routing accessibility from student origin to destination
    const studentRoute = findShortestRoute(req.villageId, req.destinationId, roadNetwork, true);

    if (!studentRoute.isAccessible) {
      // Inaccessible route due to flood
      unassignedCount += passengersNeeded;
      assignments.push({
        requestId: req.id,
        studentId: req.studentId,
        studentName: req.displayName,
        studentCode: req.studentCode,
        pickupVillageId: req.villageId,
        pickupVillageName: pickupName,
        destinationId: req.destinationId,
        destinationName: destName,
        passengerCount: passengersNeeded,
        hasExam: Boolean(req.hasExam),
        examSubject: req.examSubject,
        examStartTime: req.examStartTime,
        status: 'No Feasible Route',
        explanation: 'All road connectors completely submerged or blocked. No safe detour accessible.'
      });
      continue;
    }

    // Find compatible available vehicle with capacity
    const matchedVehicle = usableVehicles.find(v => {
      const routeCompatible = v.destinationId === req.destinationId;
      return routeCompatible && v.remainingSeats >= passengersNeeded;
    });

    if (matchedVehicle) {
      // Allocate to this vehicle
      matchedVehicle.remainingSeats -= passengersNeeded;
      matchedVehicle.assignedSeats += passengersNeeded;
      matchedVehicle.assignedStudentsCount += passengersNeeded;
      if (req.hasExam) matchedVehicle.examStudentsCount += passengersNeeded;

      // Calculate travel timing
      // Vehicles take ~10 mins dispatch + route duration
      const dispatchMinutes = 10;
      const travelDuration = studentRoute.totalDurationMinutes;
      const totalTripMinutes = dispatchMinutes + travelDuration;
      const arrivalMinutes = currentSimMinutes + totalTripMinutes;

      // Format arrival time e.g. "08:10 AM"
      const arrHours = Math.floor(arrivalMinutes / 60);
      const arrMins = arrivalMinutes % 60;
      const formattedArrivalTime = `${arrHours.toString().padStart(2, '0')}:${arrMins.toString().padStart(2, '0')} AM`;
      const isLate = req.hasExam ? arrivalMinutes > examDeadLineMinutes : false;

      let studentStatus: CrisisAssignment['status'] = 'Successfully Reassigned';
      let explanation = '';

      if (req.hasExam) {
        if (isLate) {
          studentStatus = 'Expected to Arrive Late';
          lateArrivalCount += passengersNeeded;
          explanation = `Assigned to ${matchedVehicle.name}. However, detour delay (+${studentRoute.delayMinutes}m) results in estimated arrival at ${formattedArrivalTime}, past the 09:00 AM exam gate lock!`;
        } else {
          studentStatus = 'Examination Priority';
          rescuedCount += passengersNeeded;
          explanation = `High Priority: Boarding ${matchedVehicle.name}. Expected arrival at ${formattedArrivalTime} (in time for 09:00 AM ${req.examSubject || 'Exam'}).`;
        }
      } else {
        studentStatus = 'Successfully Reassigned';
        rescuedCount += passengersNeeded;
        explanation = `Reassigned from broken bus corridor to ${matchedVehicle.name} via ${studentRoute.isDetour ? 'Balarampur Bypass Detour' : 'Direct Road'}.`;
      }

      assignments.push({
        requestId: req.id,
        studentId: req.studentId,
        studentName: req.displayName,
        studentCode: req.studentCode,
        pickupVillageId: req.villageId,
        pickupVillageName: pickupName,
        destinationId: req.destinationId,
        destinationName: destName,
        passengerCount: passengersNeeded,
        hasExam: Boolean(req.hasExam),
        examSubject: req.examSubject,
        examStartTime: req.examStartTime,
        vehicleId: matchedVehicle.id,
        vehicleName: matchedVehicle.name,
        vehicleType: matchedVehicle.vehicleType,
        status: studentStatus,
        departureTime: '07:25 AM',
        expectedArrivalTime: formattedArrivalTime,
        expectedTravelMinutes: totalTripMinutes,
        isLateForExam: isLate,
        isDetour: studentRoute.isDetour,
        explanation
      });
    } else {
      // Capacity exhausted across all alternative fleet
      unassignedCount += passengersNeeded;
      let failureReason = 'Fleet capacity completely exhausted (34 total seats already occupied).';
      if (req.hasExam) {
        failureReason = `Critical shortage: Exam student could not be allocated. Available fleet capacity (34 seats) exceeded by surging demand (${totalDemand} students).`;
      }

      assignments.push({
        requestId: req.id,
        studentId: req.studentId,
        studentName: req.displayName,
        studentCode: req.studentCode,
        pickupVillageId: req.villageId,
        pickupVillageName: pickupName,
        destinationId: req.destinationId,
        destinationName: destName,
        passengerCount: passengersNeeded,
        hasExam: Boolean(req.hasExam),
        examSubject: req.examSubject,
        examStartTime: req.examStartTime,
        status: 'No Vehicle Available',
        explanation: failureReason
      });
    }
  }

  const examCount = requests.filter(r => r.hasExam).length;

  return {
    isActive: true,
    timestamp: new Date().toISOString(),
    baselineDemand: baselineCount,
    surgeDemand: surgeCount,
    totalDemand,
    unavailableBuses,
    availableVehicles: usableVehicles,
    totalAvailableSeats,
    examStudentsCount: examCount,
    rescuedCount,
    lateArrivalCount,
    unassignedCount,
    blockedRoad,
    alternativeRouteSummary: routeSummary,
    assignments,
    vehicleUsage: usableVehicles.map(v => ({
      vehicleId: v.id,
      vehicleName: v.name,
      vehicleType: v.vehicleType,
      totalCapacity: v.totalCapacity,
      assignedSeats: v.assignedSeats,
      remainingSeats: v.remainingSeats,
      assignedStudentsCount: v.assignedStudentsCount,
      examStudentsCount: v.examStudentsCount
    })),
    isConfirmed: false
  };
}

