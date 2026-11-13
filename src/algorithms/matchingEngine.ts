import { Vehicle, TransportRequest, AllocationResult, Village, Institution } from '../types';

/**
 * Deterministic Greedy Capacity-Constrained Matching Engine
 * 
 * Rules:
 * 1. Destination compatibility must match.
 * 2. Origin/Village compatibility must match.
 * 3. Never allocate more than vehicle.availableSeats.
 * 4. Vehicles with status 'unavailable' or 'full' are excluded.
 * 5. Available seats must strictly be <= totalCapacity.
 * 6. If seats are exhausted, remaining students are tagged 'unassigned' with clear reason.
 * 7. Pure algorithmic calculation without random LLM hallucination.
 */
export function calculateAllocations(
  disruptionId: string,
  requests: TransportRequest[],
  vehicles: Vehicle[],
  villages: Village[],
  institutions: Institution[],
  version: number = 1
): AllocationResult {
  const villageMap = new Map(villages.map(v => [v.id, v.name]));
  const instMap = new Map(institutions.map(i => [i.id, i.name]));

  // 1. Deep clone vehicle capacity tracking so we don't mutate input directly
  const vehicleTracker = vehicles.map(v => {
    // Sanity enforce: availableSeats cannot exceed totalCapacity or be negative
    const validSeats = Math.max(0, Math.min(v.availableSeats, v.totalCapacity));
    return {
      vehicleId: v.id,
      vehicleName: v.name,
      vehicleType: v.vehicleType,
      startingVillageId: v.startingVillageId,
      destinationId: v.destinationId,
      availabilityStatus: v.availabilityStatus,
      totalCapacity: v.totalCapacity,
      initialAvailableSeats: validSeats,
      remainingSeats: v.availabilityStatus === 'available' ? validSeats : 0,
      assignedSeats: 0,
    };
  });

  // Filter only eligible available vehicles with remaining seats > 0
  const eligibleVehicles = vehicleTracker.filter(
    v => v.availabilityStatus === 'available' && v.remainingSeats > 0
  );

  const assignments: AllocationResult['assignments'] = [];
  let allocatedCount = 0;
  let unassignedCount = 0;

  // 2. Iterate each student transport request deterministically
  for (const req of requests) {
    const pickupName = villageMap.get(req.villageId) || 'Unknown Village';
    const destName = instMap.get(req.destinationId) || 'Unknown Institution';
    const passengersNeeded = req.passengerCount || 1;

    // Find first compatible vehicle with enough remaining seats
    // Compatibility: matches pickup (or on route) AND destination
    const compatibleVehicle = eligibleVehicles.find(v => {
      const isRouteMatch = 
        v.destinationId === req.destinationId &&
        (v.startingVillageId === req.villageId || !v.startingVillageId);
      return isRouteMatch && v.remainingSeats >= passengersNeeded;
    });

    if (compatibleVehicle) {
      // Allocate to this vehicle
      compatibleVehicle.remainingSeats -= passengersNeeded;
      compatibleVehicle.assignedSeats += passengersNeeded;
      allocatedCount += passengersNeeded;

      assignments.push({
        requestId: req.id,
        studentId: req.studentId,
        studentName: req.displayName,
        studentCode: req.studentCode,
        pickupVillage: pickupName,
        destination: destName,
        passengerCount: passengersNeeded,
        vehicleId: compatibleVehicle.vehicleId,
        vehicleName: compatibleVehicle.vehicleName,
        vehicleType: compatibleVehicle.vehicleType,
        status: 'proposed',
        reason: 'Matched to available seats on compatible route'
      });
    } else {
      // Cannot accommodate: check why
      unassignedCount += passengersNeeded;
      let failureReason = 'Insufficient seats across all registered alternative vehicles';

      const potentialVehiclesOnRoute = eligibleVehicles.filter(
        v => v.destinationId === req.destinationId
      );

      if (potentialVehiclesOnRoute.length === 0) {
        failureReason = 'No active alternative vehicles heading towards destination';
      } else {
        const totalRemainingOnRoute = potentialVehiclesOnRoute.reduce(
          (sum, v) => sum + v.remainingSeats, 
          0
        );
        if (totalRemainingOnRoute === 0) {
          failureReason = 'All alternative vehicles on this route have reached 100% capacity';
        } else if (totalRemainingOnRoute < passengersNeeded) {
          failureReason = `Only ${totalRemainingOnRoute} seat(s) left; cannot accommodate group of ${passengersNeeded}`;
        }
      }

      assignments.push({
        requestId: req.id,
        studentId: req.studentId,
        studentName: req.displayName,
        studentCode: req.studentCode,
        pickupVillage: pickupName,
        destination: destName,
        passengerCount: passengersNeeded,
        status: 'unassigned',
        reason: failureReason
      });
    }
  }

  return {
    disruptionId,
    affectedStudents: requests.reduce((sum, r) => sum + (r.passengerCount || 1), 0),
    allocatedStudents: allocatedCount,
    unassignedStudents: unassignedCount,
    assignments,
    vehicleUsage: vehicleTracker.map(v => ({
      vehicleId: v.vehicleId,
      vehicleName: v.vehicleName,
      vehicleType: v.vehicleType,
      initialAvailableSeats: v.initialAvailableSeats,
      assignedSeats: v.assignedSeats,
      remainingSeats: v.remainingSeats,
    })),
    version,
    timestamp: new Date().toISOString(),
    isConfirmed: false,
  };
}

