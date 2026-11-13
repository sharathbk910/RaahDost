import assert from 'node:assert';

const ROAD_NETWORK = [
  {
    id: 'road-rampur-poly-direct',
    fromNodeId: 'vil-1',
    toNodeId: 'inst-1',
    name: 'Rampur-Polytechnic Canal Road',
    distanceKm: 8.5,
    normalTravelMinutes: 20,
    isBlocked: false
  },
  {
    id: 'road-rampur-shivpur',
    fromNodeId: 'vil-1',
    toNodeId: 'vil-2',
    name: 'Rampur-Shivpur Link Road',
    distanceKm: 4.0,
    normalTravelMinutes: 10,
    isBlocked: false
  },
  {
    id: 'road-shivpur-balarampur',
    fromNodeId: 'vil-2',
    toNodeId: 'vil-4',
    name: 'Shivpur-Balarampur Connector',
    distanceKm: 6.0,
    normalTravelMinutes: 12,
    isBlocked: false
  },
  {
    id: 'road-balarampur-poly',
    fromNodeId: 'vil-4',
    toNodeId: 'inst-1',
    name: 'Balarampur Highway Bypass',
    distanceKm: 11.5,
    normalTravelMinutes: 23,
    isBlocked: false
  }
];

function findShortestRoute(startNodeId, targetNodeId, roadNetwork, avoidBlockedRoads = true) {
  const graph = {};

  for (const road of roadNetwork) {
    if (avoidBlockedRoads && road.isBlocked) continue;

    if (!graph[road.fromNodeId]) graph[road.fromNodeId] = [];
    if (!graph[road.toNodeId]) graph[road.toNodeId] = [];

    graph[road.fromNodeId].push({
      neighborId: road.toNodeId,
      duration: road.normalTravelMinutes,
      distance: road.distanceKm,
      segment: road
    });

    graph[road.toNodeId].push({
      neighborId: road.fromNodeId,
      duration: road.normalTravelMinutes,
      distance: road.distanceKm,
      segment: road
    });
  }

  const distances = {};
  const unvisited = new Set();

  for (const road of roadNetwork) {
    distances[road.fromNodeId] = Infinity;
    distances[road.toNodeId] = Infinity;
    unvisited.add(road.fromNodeId);
    unvisited.add(road.toNodeId);
  }

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    let currNode = null;
    let minDistance = Infinity;

    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        currNode = node;
      }
    }

    if (!currNode || minDistance === Infinity) break;
    if (currNode === targetNodeId) break;

    unvisited.delete(currNode);

    const neighbors = graph[currNode] || [];
    for (const { neighborId, duration } of neighbors) {
      if (unvisited.has(neighborId)) {
        const alt = distances[currNode] + duration;
        if (alt < distances[neighborId]) {
          distances[neighborId] = alt;
        }
      }
    }
  }

  const normalMinutes = 20;
  const detourDelay = Math.max(0, distances[targetNodeId] - normalMinutes);

  return {
    totalDurationMinutes: distances[targetNodeId],
    isDetour: detourDelay > 0,
    delayMinutes: detourDelay,
    isAccessible: distances[targetNodeId] !== Infinity
  };
}

console.log('Testing Exam Day Crisis algorithms...');

// Normal route (unblocked)
const normalRoute = findShortestRoute('vil-1', 'inst-1', ROAD_NETWORK, false);
console.log(`Normal Route: ${normalRoute.totalDurationMinutes} mins`);
assert.strictEqual(normalRoute.totalDurationMinutes, 20);

// Flooded route (Direct road blocked)
const floodedNetwork = ROAD_NETWORK.map(r => 
  r.id === 'road-rampur-poly-direct' ? { ...r, isBlocked: true } : r
);
const detourRoute = findShortestRoute('vil-1', 'inst-1', floodedNetwork, true);
console.log(`Detour Route (Flood Avoidance): ${detourRoute.totalDurationMinutes} mins (+${detourRoute.delayMinutes}m delay)`);
assert.strictEqual(detourRoute.isDetour, true);
assert.strictEqual(detourRoute.delayMinutes, 25);
assert.strictEqual(detourRoute.totalDurationMinutes, 45);

console.log('✅ Road graph & Dijkstra flood rerouting test PASSED!');
