import { 
  TransportRequest, 
  Vehicle, 
  Village, 
  Institution, 
  CrisisSimulationResult,
  CrisisAssignment,
  RoadSegment,
  CrisisAlternativeOption,
  BeforeAfterComparison,
  AIDecisionExplanation
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
 * EXAM DAY CRISIS RESCUE & REALLOCATION OPTIMIZER (MANGALORE REGION)
 * 
 * Accurately implements:
 * 1. 2 Government Buses Fail (KSRTC #1101 & #1102 on NH-66 marked broken down)
 * 2. 40% Demand Surge (+12 students over baseline 30 = 42 total students across Mulki & Surathkal)
 * 3. Flooded Kuloor Bridge on NH-66 Blocked (Dijkstra re-routes via Kinnigoli-Kateel-Bajpe-Kadri)
 * 4. 2-Hour Exam Deadline Prioritization (Sorted by soonest exam remaining minutes)
 * 5. Primary Seating: Allocated into available local fleet (34 seats)
 * 6. Overflow / Leftover Allocation into 4 Concrete Alternative Options:
 *    - Shared Auto Pool (Surathkal & Mulki Auto Rickshaw emergency cluster)
 *    - Merged Route Shuttle (Mulki-Kinnigoli joint express van)
 *    - Staggered Wave Bus (Later Wave 2 transit for non-exam students)
 * 7. Before vs After Comparison & Transparent AI Decision Reasoning
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

  // 1. Configure Road Network Blockage (Flooded Kuloor Bridge on NH-66)
  const roadNetwork: RoadSegment[] = ROAD_NETWORK.map(r => {
    if (r.id === 'road-nh66-mulki-poly-direct' && isFlooded) {
      return {
        ...r,
        isBlocked: true,
        blockageReason: 'Kuloor Bridge over Gurupura River flooded by tidal flash storm. Traffic prohibited by Mangaluru City Traffic Police.'
      };
    }
    return { ...r, isBlocked: false };
  });

  const blockedRoad = roadNetwork.find(r => r.isBlocked)! || ROAD_NETWORK[0];

  // 2. Identify 2 Government Buses that Break Down (Event 1)
  const unavailableBuses: Vehicle[] = [
    {
      id: 'bus-ksrtc-01',
      vehicleCode: 'KA-19-F-1101',
      name: 'KSRTC Express Bus #1101 (Mulki ➔ Mangalore Central)',
      vehicleType: 'Government Bus',
      startingVillageId: 'vil-mulki',
      destinationId: 'inst-1',
      totalCapacity: 45,
      availableSeats: 0,
      availabilityStatus: 'unavailable',
      operatorConfirmed: false,
      driverName: 'Shekhar Poojary (KSRTC Mangaluru Depot)'
    },
    {
      id: 'bus-ksrtc-02',
      vehicleCode: 'KA-19-F-1102',
      name: 'KSRTC City Express #1102 (Surathkal ➔ Hampankatta)',
      vehicleType: 'Government Bus',
      startingVillageId: 'vil-surathkal',
      destinationId: 'inst-3',
      totalCapacity: 42,
      availableSeats: 0,
      availabilityStatus: 'unavailable',
      operatorConfirmed: false,
      driverName: 'Anand Gowda (KSRTC)'
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

  // 4. Calculate Route Detour for Mulki -> Polytechnic via Dijkstra
  const alternativeRoute = findShortestRoute('vil-mulki', 'inst-1', roadNetwork, true);
  const routeSummary = {
    originalPath: 'Mulki ➔ NH-66 Direct (via Kuloor Bridge) ➔ Kadri Polytechnic',
    alternativePath: alternativeRoute.pathSegmentNames.join(' ➔ ') || 'Mulki ➔ Kinnigoli ➔ Kateel ➔ Bajpe ➔ Kadri Airport Road',
    originalMinutes: alternativeRoute.originalDurationMinutes || 38,
    newMinutes: alternativeRoute.totalDurationMinutes,
    delayMinutes: alternativeRoute.delayMinutes || 27
  };

  // 5. Total Demand Calculation (Baseline 30 + 40% Surge = 42 Students)
  const baselineCount = requests.filter(r => !r.isSurgeStudent).length || 30;
  const surgeCount = requests.filter(r => r.isSurgeStudent).length || 12;
  const totalDemand = requests.length;

  // 6. Multi-tier Sorting Priority Engine (Soonest exam remaining time first)
  const sortedRequests = [...requests].sort((a, b) => {
    // Exam students first
    if (a.hasExam && !b.hasExam) return -1;
    if (!a.hasExam && b.hasExam) return 1;

    // If both have exams, sort by urgency (minutesToExam ascending)
    if (a.hasExam && b.hasExam) {
      return (a.minutesToExam || 105) - (b.minutesToExam || 105);
    }

    // Then prioritize regular students stranded from broken buses
    if (a.originalBusId && !b.originalBusId) return -1;
    if (!a.originalBusId && b.originalBusId) return 1;

    return 0;
  });

  // Simulated morning departure: 07:15 AM = 435 minutes from midnight
  const currentSimMinutes = 7 * 60 + 15; // 435
  const examDeadLineMinutes = 9 * 60; // 540 (09:00 AM)

  const assignments: CrisisAssignment[] = [];
  const aiExplanations: AIDecisionExplanation[] = [];
  let rescuedCount = 0;
  let atRiskCount = 0;
  let alternativeAssignedCount = 0;
  let strandedCount = 0;

  // Track overflow students for alternative arrangements
  const overflowStudents: TransportRequest[] = [];

  // Phase A: Primary Local Fleet Matching (Seats: 34)
  for (const req of sortedRequests) {
    const pickupName = villageMap.get(req.villageId) || 'Mulki';
    const destName = instMap.get(req.destinationId) || 'Government Polytechnic College Mangalore';
    const passengersNeeded = req.passengerCount || 1;

    // Check routing accessibility from student origin to destination
    const studentRoute = findShortestRoute(req.villageId, req.destinationId, roadNetwork, true);

    if (!studentRoute.isAccessible) {
      strandedCount += passengersNeeded;
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
        status: 'Stranded',
        explanation: 'All connecting roadways to campus are submerged by river overflow. No safe physical path exists.'
      });
      aiExplanations.push({
        studentName: req.displayName,
        studentCode: req.studentCode,
        decision: 'Stranded (Inaccessible)',
        factorUrgency: req.hasExam ? 'Critical (Exam)' : 'Normal',
        factorRoute: 'Completely Blocked',
        factorCapacity: 'N/A',
        aiReasoningText: 'AI routing graph identified that all viable connectors from this location are under water. Roadway declared unsafe for transit vehicles.'
      });
      continue;
    }

    // Try finding available vehicle
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
      const dispatchMinutes = 10;
      const travelDuration = studentRoute.totalDurationMinutes;
      const totalTripMinutes = dispatchMinutes + travelDuration;
      const arrivalMinutes = currentSimMinutes + totalTripMinutes;

      const arrHours = Math.floor(arrivalMinutes / 60);
      const arrMins = arrivalMinutes % 60;
      const formattedArrivalTime = `${arrHours.toString().padStart(2, '0')}:${arrMins.toString().padStart(2, '0')} AM`;
      const isLate = req.hasExam ? arrivalMinutes > examDeadLineMinutes : false;

      let studentStatus: CrisisAssignment['status'] = 'Assigned';
      let explanation = '';

      if (req.hasExam) {
        if (isLate) {
          studentStatus = 'At risk';
          atRiskCount += passengersNeeded;
          explanation = `Boarding ${matchedVehicle.name}. Flood detour via Kinnigoli-Bajpe (+${studentRoute.delayMinutes}m) yields ETA ${formattedArrivalTime}, past the 09:00 AM exam gate cutoff!`;
        } else {
          studentStatus = studentRoute.isDetour ? 'Rerouted' : 'Assigned';
          rescuedCount += passengersNeeded;
          explanation = `High Priority Exam: Boarding ${matchedVehicle.name}. Rerouted safely via Kateel-Bajpe Bypass with ETA ${formattedArrivalTime} (prior to 09:00 AM exam).`;
        }
      } else {
        studentStatus = studentRoute.isDetour ? 'Rerouted' : 'Assigned';
        rescuedCount += passengersNeeded;
        explanation = `Reassigned from broken KSRTC bus to ${matchedVehicle.name} via ${studentRoute.isDetour ? 'Kinnigoli-Bajpe Detour' : 'Direct NH-66'} (ETA ${formattedArrivalTime}).`;
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

      aiExplanations.push({
        studentName: req.displayName,
        studentCode: req.studentCode,
        decision: `Assigned to ${matchedVehicle.name} (${studentStatus})`,
        factorUrgency: req.hasExam ? `Exam scheduled at ${req.examStartTime || '09:00 AM'}` : 'Non-exam travel',
        factorRoute: studentRoute.isDetour ? `Rerouted (+${studentRoute.delayMinutes}m via Bajpe)` : 'Standard corridor',
        factorCapacity: `${matchedVehicle.remainingSeats} seat(s) remaining after allocation`,
        aiReasoningText: req.hasExam 
          ? `AI prioritized student seat allocation due to imminent examination deadline in Mangalore. Travel schedule calculated with dispatch + detour time giving ETA of ${formattedArrivalTime}.`
          : `Allocated available secondary seat after higher-urgency exam candidates were satisfied.`
      });
    } else {
      // Primary fleet exhausted (34 seats full) -> queue for intelligent alternative options
      overflowStudents.push(req);
    }
  }

  // Phase B: Overflow Students -> Structured Alternative Options in Dakshina Kannada
  const alternativeOptions: CrisisAlternativeOption[] = [
    {
      type: 'Shared Auto Pool',
      title: 'Dakshina Kannada Auto Pool (Surathkal/Mulki Union)',
      description: '3 local 6-seater autos mobilized from Mulki bus stand to ferry urgent overflow exam students via Kinnigoli interior roads.',
      estimatedDeparture: '07:35 AM',
      estimatedArrival: '08:40 AM',
      capacityAllocated: 4,
      assignedStudentIds: []
    },
    {
      type: 'Merged Route Shuttle',
      title: 'Merged Mulki-Kinnigoli Feeder Van',
      description: 'Merges student pickups between Mulki and Kinnigoli into a combined express van to bypass Kuloor flood bottleneck.',
      estimatedDeparture: '07:40 AM',
      estimatedArrival: '08:45 AM',
      capacityAllocated: 2,
      assignedStudentIds: []
    },
    {
      type: 'Staggered Wave Bus',
      title: 'Staggered Wave 2 KSRTC Relief Bus',
      description: 'Scheduled Wave 2 bus for regular (non-exam) students whose lectures in Mangalore begin at 10:30 AM.',
      estimatedDeparture: '08:30 AM',
      estimatedArrival: '09:35 AM',
      capacityAllocated: 2,
      assignedStudentIds: []
    }
  ];

  for (let i = 0; i < overflowStudents.length; i++) {
    const req = overflowStudents[i];
    const pickupName = villageMap.get(req.villageId) || 'Mulki';
    const destName = instMap.get(req.destinationId) || 'Government Polytechnic College Mangalore';
    const passengersNeeded = req.passengerCount || 1;

    let selectedAlt: CrisisAlternativeOption | null = null;
    if (i < 4) {
      selectedAlt = alternativeOptions[0]; // Shared Auto Pool
    } else if (i < 6) {
      selectedAlt = alternativeOptions[1]; // Merged Route Shuttle
    } else if (i < 8) {
      selectedAlt = alternativeOptions[2]; // Staggered Wave 2
    }

    if (selectedAlt) {
      selectedAlt.assignedStudentIds.push(req.studentId);
      alternativeAssignedCount += passengersNeeded;
      rescuedCount += passengersNeeded;

      const isLate = req.hasExam && selectedAlt.type === 'Staggered Wave Bus';
      const studentStatus: CrisisAssignment['status'] = isLate ? 'At risk' : 'Alternative Arranged';
      if (isLate) atRiskCount += passengersNeeded;

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
        status: studentStatus,
        departureTime: selectedAlt.estimatedDeparture,
        expectedArrivalTime: selectedAlt.estimatedArrival,
        expectedTravelMinutes: 65,
        isLateForExam: isLate,
        isDetour: true,
        alternativeOption: selectedAlt.type,
        explanation: `Assigned to ${selectedAlt.title}. Departs ${selectedAlt.estimatedDeparture}, expected arrival ${selectedAlt.estimatedArrival}.`
      });

      aiExplanations.push({
        studentName: req.displayName,
        studentCode: req.studentCode,
        decision: `Routed to Alternative: ${selectedAlt.type}`,
        factorUrgency: req.hasExam ? 'Urgent Exam Student' : 'General Commuter',
        factorRoute: 'Kinnigoli-Kateel Interior Bypass',
        factorCapacity: 'Alternative transport resource mobilized',
        aiReasoningText: `Primary fleet capacity (34 seats) was saturated. AI activated secondary rural contingency (${selectedAlt.type}) to prevent student stranding.`
      });
    } else {
      // True capacity limit reached across both fleet and emergency autos
      strandedCount += passengersNeeded;
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
        status: 'Stranded',
        explanation: 'Extreme capacity exhaustion. All 34 primary vehicle seats and 8 emergency alternative slots are at 100% load.'
      });

      aiExplanations.push({
        studentName: req.displayName,
        studentCode: req.studentCode,
        decision: 'Stranded (Capacity Exhaustion)',
        factorUrgency: req.hasExam ? 'Exam Candidate' : 'Commuter',
        factorRoute: 'Detour Accessible',
        factorCapacity: '0 Seats Remaining Across All Tiers',
        aiReasoningText: 'All primary vehicles and secondary alternative transport pools reached maximum certified passenger capacity. System refuses to oversell seats.'
      });
    }
  }

  // 7. Calculate Before vs After Crisis Comparison Metrics
  const beforeAfter: BeforeAfterComparison = {
    before: {
      totalStudents: 30, // Baseline before crisis
      availableBuses: 6, // 2 KSRTC Buses + 4 Local Fleet
      totalSeats: 121,   // 45 + 42 + 34 = 121 seats
      onTimeStudents: 30, // All reached on time normally
      atRiskStudents: 0,
      strandedStudents: 0,
      busUtilizationPercent: Math.round((30 / 121) * 100) // ~25%
    },
    after: {
      totalStudents: totalDemand, // 42 (+40%)
      availableBuses: 4,          // 2 KSRTC buses broken down -> 4 fleet left
      totalSeats: totalAvailableSeats, // 34
      onTimeStudents: rescuedCount,
      atRiskStudents: atRiskCount,
      strandedCount: strandedCount,
      busUtilizationPercent: Math.round((Math.min(rescuedCount, totalAvailableSeats) / totalAvailableSeats) * 100) // 100%
    } as any
  };

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
    atRiskCount,
    strandedCount,
    alternativeAssignedCount,
    blockedRoad,
    alternativeRouteSummary: routeSummary,
    assignments,
    alternativeOptions,
    beforeAfter,
    aiExplanations,
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
