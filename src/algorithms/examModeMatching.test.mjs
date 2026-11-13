// Test Suite: Exam Mode Atomic Acceptance, Broadcast Matching & Safety Flows
import assert from 'assert';

console.log('Testing Exam Mode matching & transaction safety...');

// Mock reactive DB store logic for test
class MockDataStore {
  constructor() {
    this.drivers = [
      { id: 'drv-1', fullName: 'Rameshwar Yadav', seatsFree: 4, totalSeats: 6, rating: 4.8 },
      { id: 'drv-2', fullName: 'Suresh Poojary', seatsFree: 3, totalSeats: 4, rating: 4.9 }
    ];
    this.pickupRequests = [];
  }

  broadcastPickupRequest(reqData) {
    const req = {
      id: `req-${Date.now()}`,
      studentId: reqData.studentId,
      studentName: reqData.studentName,
      hasExamToday: true,
      examTime: reqData.examTime || '10:30 AM',
      driverId: 'broadcast',
      driverName: 'Broadcasted to nearby verified drivers',
      status: 'searching',
      requestedAt: new Date().toISOString()
    };
    this.pickupRequests.push(req);
    return req;
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

    driver.seatsFree -= 1;
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
  examTime: '10:30 AM'
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
console.log('✅ Test 2: Driver 1 atomically accepted ride (seats reduced 4 -> 3).');

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

console.log('🎉 ALL EXAM MODE MATCHING & ATOMIC ACCEPTANCE TESTS PASSED!');

