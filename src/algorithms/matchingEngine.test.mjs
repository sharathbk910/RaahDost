import assert from 'node:assert';

function calculateAllocations(disruptionId, requests, vehicles, villages, institutions, version = 1) {
  const villageMap = new Map(villages.map(v => [v.id, v.name]));
  const instMap = new Map(institutions.map(i => [i.id, i.name]));

  const vehicleTracker = vehicles.map(v => {
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

  const eligibleVehicles = vehicleTracker.filter(
    v => v.availabilityStatus === 'available' && v.remainingSeats > 0
  );

  const assignments = [];
  let allocatedCount = 0;
  let unassignedCount = 0;

  for (const req of requests) {
    const pickupName = villageMap.get(req.villageId) || 'Unknown Village';
    const destName = instMap.get(req.destinationId) || 'Unknown Institution';
    const passengersNeeded = req.passengerCount || 1;

    const compatibleVehicle = eligibleVehicles.find(v => {
      const isRouteMatch = 
        v.destinationId === req.destinationId &&
        (v.startingVillageId === req.villageId || !v.startingVillageId);
      return isRouteMatch && v.remainingSeats >= passengersNeeded;
    });

    if (compatibleVehicle) {
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
      unassignedCount += passengersNeeded;
      assignments.push({
        requestId: req.id,
        studentId: req.studentId,
        studentName: req.displayName,
        studentCode: req.studentCode,
        pickupVillage: pickupName,
        destination: destName,
        passengerCount: passengersNeeded,
        status: 'unassigned',
        reason: 'Insufficient seats across all registered alternative vehicles'
      });
    }
  }

  return {
    disruptionId,
    affectedStudents: requests.reduce((sum, r) => sum + (r.passengerCount || 1), 0),
    allocatedStudents: allocatedCount,
    unassignedStudents: unassignedCount,
    assignments,
    vehicleUsage: vehicleTracker,
    version,
  };
}

console.log('Testing calculateAllocations deterministic matching engine...');

const villages = [{ id: 'v1', name: 'Rampur' }];
const institutions = [{ id: 'i1', name: 'Polytechnic' }];

const requests = Array.from({ length: 30 }, (_, idx) => ({
  id: `req-${idx + 1}`,
  studentId: `s-${idx + 1}`,
  studentCode: `RD-${idx + 1}`,
  displayName: `Student ${idx + 1}`,
  villageId: 'v1',
  destinationId: 'i1',
  passengerCount: 1,
  status: 'pending',
  createdAt: new Date().toISOString()
}));

const vehicles = [
  {
    id: 'veh-1',
    vehicleCode: 'VAN-A',
    name: 'Van A',
    vehicleType: 'Shared Van',
    startingVillageId: 'v1',
    destinationId: 'i1',
    totalCapacity: 14,
    availableSeats: 12,
    availabilityStatus: 'available',
    operatorConfirmed: true
  },
  {
    id: 'veh-2',
    vehicleCode: 'VAN-B',
    name: 'Van B',
    vehicleType: 'Shared Van',
    startingVillageId: 'v1',
    destinationId: 'i1',
    totalCapacity: 12,
    availableSeats: 10,
    availabilityStatus: 'available',
    operatorConfirmed: true
  },
  {
    id: 'veh-3',
    vehicleCode: 'AUTO-C',
    name: 'Auto C',
    vehicleType: 'Auto Rickshaw',
    startingVillageId: 'v1',
    destinationId: 'i1',
    totalCapacity: 6,
    availableSeats: 4,
    availabilityStatus: 'available',
    operatorConfirmed: true
  },
  {
    id: 'veh-4',
    vehicleCode: 'BUS-D',
    name: 'Mini Bus D',
    vehicleType: 'Mini Bus',
    startingVillageId: 'v1',
    destinationId: 'i1',
    totalCapacity: 18,
    availableSeats: 8,
    availabilityStatus: 'available',
    operatorConfirmed: true
  }
];

// Test 1: Full allocation of 30 students across 34 seats
const res1 = calculateAllocations('dis-1', requests, vehicles, villages, institutions);
console.log(`Test 1: Allocated ${res1.allocatedStudents}/${res1.affectedStudents}, Unassigned: ${res1.unassignedStudents}`);
assert.strictEqual(res1.allocatedStudents, 30);
assert.strictEqual(res1.unassignedStudents, 0);

// Test 2: Capacity drop (reduce Van A to 2 seats => total seats = 24 < 30)
const reducedVehicles = vehicles.map(v => v.id === 'veh-1' ? { ...v, availableSeats: 2 } : v);
const res2 = calculateAllocations('dis-1', requests, reducedVehicles, villages, institutions);
console.log(`Test 2 (Capacity shortage): Allocated ${res2.allocatedStudents}/${res2.affectedStudents}, Unassigned: ${res2.unassignedStudents}`);
assert.strictEqual(res2.allocatedStudents, 24);
assert.strictEqual(res2.unassignedStudents, 6);

// Test 3: Destination mismatch
const wrongDestVehicles = vehicles.map(v => ({ ...v, destinationId: 'wrong-inst' }));
const res3 = calculateAllocations('dis-1', requests, wrongDestVehicles, villages, institutions);
console.log(`Test 3 (Route mismatch): Allocated ${res3.allocatedStudents}/${res3.affectedStudents}, Unassigned: ${res3.unassignedStudents}`);
assert.strictEqual(res3.allocatedStudents, 0);
assert.strictEqual(res3.unassignedStudents, 30);

console.log('✅ All deterministic matching engine algorithmic tests PASSED!');
