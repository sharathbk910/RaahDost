// Test Suite: Exam Mode Atomic Acceptance, Broadcast Matching & Safety Flows
import assert from 'assert';

console.log('Testing Exam Mode matching & transaction safety...');

// Helper timing functions matching dataStore.ts
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 10 * 60;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 10 * 60;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes) {
  let normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

function calculateExamTimingDetails(examTime) {
  const examMinutes = parseTimeToMinutes(examTime);
  const arrivalMinutes = examMinutes - 15; // 15 mins before exam
  const leaveMinutes = arrivalMinutes - 60; // 60 mins transit
  return {
    examTime,
    arrivalBy: formatMinutesToTime(arrivalMinutes),
    leaveBy: formatMinutesToTime(leaveMinutes),
    bufferMinutes: 15
  };
}

const STATUS_MESSAGES = {
  preparing: 'Driver is preparing for departure',
  on_the_way: 'Driver is on the way to your pickup point',
  near_pickup: 'Driver is arriving at your pickup point',
  picked_up: 'Picked up — heading to your destination',
  en_route_destination: 'On the way to your destination',
  delayed: 'Driver is delayed (traffic/detour)',
  reached: 'You have reached your destination',
  dropped: 'You have reached your destination',
  cancelled: 'Driver cancelled this trip. Search for another ride.'
};

// Mock reactive DB store logic for test
class MockDataStore {
  constructor() {
    this.drivers = [
      { id: 'drv-1', fullName: 'Rameshwar Yadav', seatsFree: 4, totalSeats: 6, rating: 4.8, activeRoute: { destinationLocation: 'Kadri Polytechnic' } },
      { id: 'drv-2', fullName: 'Suresh Poojary', seatsFree: 3, totalSeats: 4, rating: 4.9, activeRoute: { destinationLocation: 'Kadri Polytechnic' } }
    ];
    this.pickupRequests = [];
  }

  createStudentJourneyRequest(data) {
    const hasActive = this.pickupRequests.some(
      r => r.studentId === data.studentId && 
           r.status !== 'dropped' && 
           r.status !== 'reached' && 
           r.status !== 'cancelled'
    );
    if (hasActive) {
      throw new Error('You already have an active transport request in progress.');
    }
    const req = {
      id: `req-${Date.now()}`,
      studentId: data.studentId,
      studentName: data.studentName,
      hasExamToday: !!data.hasExamToday,
      examTime: data.examTime || '10:00 AM',
      pickupLocationName: data.pickupLocationName,
      destinationName: data.destinationName,
      driverId: 'broadcast',
      driverName: 'Broadcasted to nearby verified drivers',
      status: 'searching',
      requestedAt: new Date().toISOString()
    };
    this.pickupRequests.push(req);
    return req;
  }

  broadcastPickupRequest(reqData) {
    return this.createStudentJourneyRequest(reqData);
  }

  atomicAcceptPickupRequest(requestId, driver) {
    const req = this.pickupRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Not found' };

    // Transaction-safe check
    if (req.status !== 'searching' && req.status !== 'requested') {
      return { success: false, error: 'Ride already accepted by another driver.' };
    }

    if (driver.seatsFree <= 0) {
      return { success: false, error: 'No seats free' };
    }

    req.status = 'accepted';
    req.driverId = driver.id;
    req.driverName = driver.fullName;
    req.acceptedAt = new Date().toISOString();
    req.lastStatusUpdateMessage = `Driver ${driver.fullName} accepted your pickup request.`;

    driver.seatsFree -= 1;
    if (driver.activeRoute && req.destinationName) {
      driver.activeRoute.destinationLocation = req.destinationName;
    }
    return { success: true, request: req };
  }

  updateDriverTripStatus(requestId, newStatus, driverId) {
    const req = this.pickupRequests.find(r => r.id === requestId);
    if (!req || req.driverId !== driverId) return { success: false, error: 'Unauthorized' };

    req.status = newStatus;
    req.statusUpdatedAt = new Date().toISOString();
    req.lastStatusUpdateMessage = STATUS_MESSAGES[newStatus] || `Trip status updated to ${newStatus}`;

    if (newStatus === 'dropped' || newStatus === 'reached' || newStatus === 'cancelled') {
      const driver = this.drivers.find(d => d.id === driverId);
      if (driver && driver.seatsFree < driver.totalSeats) {
        driver.seatsFree += 1;
      }
    }
    return { success: true, request: req };
  }

  updateTripDestination(requestId, destinationName, driverId) {
    const req = this.pickupRequests.find(r => r.id === requestId);
    if (!req || req.driverId !== driverId) return { success: false, error: 'Unauthorized' };
    req.destinationName = destinationName;
    const driver = this.drivers.find(d => d.id === driverId);
    if (driver && driver.activeRoute) {
      driver.activeRoute.destinationLocation = destinationName;
    }
    return { success: true, request: req };
  }

  cancelPickupRequest(requestId, cancelledBy) {
    const req = this.pickupRequests.find(r => r.id === requestId);
    if (!req) return { success: false };

    if (cancelledBy === 'driver') {
      const driver = this.drivers.find(d => d.id === req.driverId);
      if (driver) driver.seatsFree += 1;

      // Re-open request
      req.status = 'searching';
      req.driverId = 'broadcast';
    } else {
      req.status = 'cancelled';
    }
    return { success: true, request: req };
  }

  rateDriver(requestId, rating) {
    const req = this.pickupRequests.find(r => r.id === requestId);
    if (!req) return;
    const driver = this.drivers.find(d => d.id === req.driverId);
    if (driver) {
      driver.rating = parseFloat(((driver.rating * 4 + rating) / 5).toFixed(1));
    }
  }
}

const store = new MockDataStore();

// Test 1: Broadcast Exam Request
const broadcastReq = store.broadcastPickupRequest({
  studentId: 'stu-aarav',
  studentName: 'Aarav Sharma',
  examTime: '10:00 AM',
  pickupLocationName: 'Mulki Bus Stand',
  destinationName: 'Government Polytechnic College Mangalore (Kadri Hills)'
});

assert.strictEqual(broadcastReq.status, 'searching');
assert.strictEqual(broadcastReq.driverId, 'broadcast');
console.log('✅ Test 1: Student Exam broadcast request created in "searching" state.');

// Test 2: Driver 1 Accepts
const driver1 = store.drivers[0];
const acceptRes1 = store.atomicAcceptPickupRequest(broadcastReq.id, driver1);
assert.strictEqual(acceptRes1.success, true);
assert.strictEqual(broadcastReq.status, 'accepted');
assert.strictEqual(broadcastReq.driverId, 'drv-1');
assert.strictEqual(driver1.seatsFree, 3);
assert.strictEqual(driver1.activeRoute.destinationLocation, 'Government Polytechnic College Mangalore (Kadri Hills)');
console.log('✅ Test 2: Driver 1 atomically accepted ride (seats reduced 4 -> 3, destination synced).');

// Test 3: Concurrency / Race Condition - Driver 2 attempts to accept already-accepted ride
const driver2 = store.drivers[1];
const acceptRes2 = store.atomicAcceptPickupRequest(broadcastReq.id, driver2);
assert.strictEqual(acceptRes2.success, false);
assert.strictEqual(acceptRes2.error, 'Ride already accepted by another driver.');
assert.strictEqual(driver2.seatsFree, 3); // Unchanged
console.log('✅ Test 3: Race condition prevented: Driver 2 atomically rejected.');

// Test 4: Driver 1 Cancels -> Auto Re-opens Request
store.cancelPickupRequest(broadcastReq.id, 'driver');
assert.strictEqual(broadcastReq.status, 'searching');
assert.strictEqual(broadcastReq.driverId, 'broadcast');
assert.strictEqual(driver1.seatsFree, 4); // Restored
console.log('✅ Test 4: Driver cancellation safely re-opened request & restored seat.');

// Test 5: Driver 2 Accepts re-opened request
const acceptRes3 = store.atomicAcceptPickupRequest(broadcastReq.id, driver2);
assert.strictEqual(acceptRes3.success, true);
assert.strictEqual(broadcastReq.driverId, 'drv-2');
assert.strictEqual(driver2.seatsFree, 2);
console.log('✅ Test 5: Driver 2 accepted re-opened request.');

// Test 6: Student Rating
store.rateDriver(broadcastReq.id, 5);
assert.strictEqual(driver2.rating, 4.9);
console.log('✅ Test 6: Post-trip driver rating updated.');

// Test 7: Driver Trip Status Lifecycle Updates & Real-time Messages
const lifecycleSteps = [
  { status: 'preparing', expectedMsg: 'Driver is preparing for departure' },
  { status: 'on_the_way', expectedMsg: 'Driver is on the way to your pickup point' },
  { status: 'near_pickup', expectedMsg: 'Driver is arriving at your pickup point' },
  { status: 'picked_up', expectedMsg: 'Picked up — heading to your destination' },
  { status: 'en_route_destination', expectedMsg: 'On the way to your destination' },
  { status: 'delayed', expectedMsg: 'Driver is delayed (traffic/detour)' },
  { status: 'reached', expectedMsg: 'You have reached your destination' }
];

for (const step of lifecycleSteps) {
  const res = store.updateDriverTripStatus(broadcastReq.id, step.status, driver2.id);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.request.status, step.status);
  assert.strictEqual(res.request.lastStatusUpdateMessage, step.expectedMsg);
}
assert.strictEqual(driver2.seatsFree, 3); // Restored upon reaching destination
console.log('✅ Test 7: Complete driver trip status lifecycle & student messages verified.');

// Test 8: Dynamic Destination Sync
const destRes = store.updateTripDestination(broadcastReq.id, 'Canara Engineering College Benjanapadavu', driver2.id);
assert.strictEqual(destRes.success, true);
assert.strictEqual(driver2.activeRoute.destinationLocation, 'Canara Engineering College Benjanapadavu');
console.log('✅ Test 8: Dynamic destination updates synced between driver and student.');

// Test 9: Dynamic Exam Timing Calculation
const timing10am = calculateExamTimingDetails('10:00 AM');
assert.strictEqual(timing10am.arrivalBy, '09:45 AM');
assert.strictEqual(timing10am.leaveBy, '08:45 AM');

const timing1030am = calculateExamTimingDetails('10:30 AM');
assert.strictEqual(timing1030am.arrivalBy, '10:15 AM');
assert.strictEqual(timing1030am.leaveBy, '09:15 AM');
console.log('✅ Test 9: Dynamic exam countdown, leave-by (08:45 AM for 10:00 AM) and arrival times verified.');

// Test 10: Active Journey Duplicate Prevention
assert.throws(() => {
  store.createStudentJourneyRequest({
    studentId: 'stu-duplicate',
    studentName: 'Duplicate Student'
  });
  store.createStudentJourneyRequest({
    studentId: 'stu-duplicate',
    studentName: 'Duplicate Student'
  });
}, /already have an active transport request/);
console.log('✅ Test 10: Prevention of duplicate active journey requests verified.');

console.log('🎉 ALL EXAM MODE MATCHING & ATOMIC ACCEPTANCE TESTS PASSED!');

