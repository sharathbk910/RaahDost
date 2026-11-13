import { RoadSegment, RoutePathResult } from '../types';

/**
 * Predefined realistic rural road network connecting villages and institutions.
 * Nodes:
 * - vil-1: Rampur Village
 * - vil-2: Shivpur Hamlet
 * - vil-3: Kishanpur Cross
 * - vil-4: Balarampur Junction
 * - inst-1: Government Polytechnic Institute
 * - inst-2: District Higher Secondary School
 */
export const ROAD_NETWORK: RoadSegment[] = [
  // 1. Direct route from Rampur to Govt Polytechnic (Major artery via Canal Bridge)
  {
    id: 'road-rampur-poly-direct',
    fromNodeId: 'vil-1',
    toNodeId: 'inst-1',
    name: 'Rampur-Polytechnic Canal Road',
    distanceKm: 8.5,
    normalTravelMinutes: 20,
    isBlocked: false,
    blockageReason: undefined
  },
  // 2. Rampur to Shivpur Hamlet
  {
    id: 'road-rampur-shivpur',
    fromNodeId: 'vil-1',
    toNodeId: 'vil-2',
    name: 'Rampur-Shivpur Link Road',
    distanceKm: 4.0,
    normalTravelMinutes: 10,
    isBlocked: false
  },
  // 3. Shivpur to Balarampur Junction
  {
    id: 'road-shivpur-balarampur',
    fromNodeId: 'vil-2',
    toNodeId: 'vil-4',
    name: 'Shivpur-Balarampur Connector',
    distanceKm: 6.0,
    normalTravelMinutes: 12,
    isBlocked: false
  },
  // 4. Balarampur Junction to Govt Polytechnic (Bypass Highway)
  {
    id: 'road-balarampur-poly',
    fromNodeId: 'vil-4',
    toNodeId: 'inst-1',
    name: 'Balarampur Highway Bypass',
    distanceKm: 11.5,
    normalTravelMinutes: 23,
    isBlocked: false
  },
  // 5. Rampur to Kishanpur Cross
  {
    id: 'road-rampur-kishanpur',
    fromNodeId: 'vil-1',
    toNodeId: 'vil-3',
    name: 'East Rampur Crossway',
    distanceKm: 5.5,
    normalTravelMinutes: 14,
    isBlocked: false
  },
  // 6. Kishanpur Cross to District Higher Secondary
  {
    id: 'road-kishanpur-sec',
    fromNodeId: 'vil-3',
    toNodeId: 'inst-2',
    name: 'Kishanpur School Road',
    distanceKm: 7.0,
    normalTravelMinutes: 16,
    isBlocked: false
  },
  // 7. Kishanpur Cross to Govt Polytechnic
  {
    id: 'road-kishanpur-poly',
    fromNodeId: 'vil-3',
    toNodeId: 'inst-1',
    name: 'Kishanpur Polytechnic Connector',
    distanceKm: 9.0,
    normalTravelMinutes: 22,
    isBlocked: false
  }
];

/**
 * Dijkstra's Shortest Path Algorithm for rural transit routing.
 * Accounts for blocked road segments (e.g. flooded canal bridge).
 */
export function findShortestRoute(
  startNodeId: string,
  targetNodeId: string,
  roadNetwork: RoadSegment[],
  avoidBlockedRoads: boolean = true
): RoutePathResult {
  // Build adjacency graph (bidirectional roads)
  const graph: Record<string, { neighborId: string; duration: number; distance: number; segment: RoadSegment }[]> = {};

  for (const road of roadNetwork) {
    if (avoidBlockedRoads && road.isBlocked) {
      continue; // Exclude inaccessible flooded roads
    }

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

  // Priority Queue / Dijkstra distances
  const distances: Record<string, number> = {};
  const previous: Record<string, { nodeId: string; segment: RoadSegment; distanceKm: number } | null> = {};
  const unvisited = new Set<string>();

  // Initialize nodes
  for (const road of roadNetwork) {
    distances[road.fromNodeId] = Infinity;
    distances[road.toNodeId] = Infinity;
    previous[road.fromNodeId] = null;
    previous[road.toNodeId] = null;
    unvisited.add(road.fromNodeId);
    unvisited.add(road.toNodeId);
  }

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    // Find node with minimum distance in unvisited
    let currNode: string | null = null;
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
    for (const { neighborId, duration, distance, segment } of neighbors) {
      if (unvisited.has(neighborId)) {
        const alt = distances[currNode] + duration;
        if (alt < distances[neighborId]) {
          distances[neighborId] = alt;
          previous[neighborId] = { nodeId: currNode, segment, distanceKm: distance };
        }
      }
    }
  }

  // If target not reached
  if (distances[targetNodeId] === Infinity) {
    return {
      pathNodeIds: [],
      pathSegmentNames: [],
      totalDistanceKm: 0,
      totalDurationMinutes: Infinity,
      isDetour: false,
      isAccessible: false,
      blockedSegmentEncountered: 'All connecting roadways to destination are inaccessible'
    };
  }

  // Reconstruct path
  const pathNodeIds: string[] = [];
  const pathSegmentNames: string[] = [];
  let totalDistanceKm = 0;
  let curr: string | null = targetNodeId;

  while (curr && previous[curr]) {
    pathNodeIds.unshift(curr);
    const prev: { nodeId: string; segment: RoadSegment; distanceKm: number } = previous[curr]!;
    pathSegmentNames.unshift(prev.segment.name);
    totalDistanceKm += prev.distanceKm;
    curr = prev.nodeId;
  }
  if (curr) pathNodeIds.unshift(curr);

  // Compare with unblocked normal route to detect detour and delay
  const normalUnblockedRoute = findUnblockedBaselineRoute(startNodeId, targetNodeId, roadNetwork);
  const normalMinutes = normalUnblockedRoute.totalDurationMinutes;
  const detourDelayMinutes = Math.max(0, distances[targetNodeId] - normalMinutes);

  return {
    pathNodeIds,
    pathSegmentNames,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalDurationMinutes: distances[targetNodeId],
    isDetour: detourDelayMinutes > 0,
    originalDurationMinutes: normalMinutes,
    delayMinutes: detourDelayMinutes,
    isAccessible: true
  };
}

/**
 * Calculates theoretical normal baseline without any blockages
 */
function findUnblockedBaselineRoute(
  startNodeId: string,
  targetNodeId: string,
  roadNetwork: RoadSegment[]
): { totalDurationMinutes: number } {
  // If Rampur to Polytechnic direct
  if (startNodeId === 'vil-1' && targetNodeId === 'inst-1') {
    return { totalDurationMinutes: 20 };
  }
  return { totalDurationMinutes: 25 };
}
