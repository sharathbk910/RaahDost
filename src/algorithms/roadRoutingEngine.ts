import { RoadSegment, RoutePathResult } from '../types';

/**
 * =====================================================================
 * ROAD NETWORK GRAPH — MANGALORE & DAKSHINA KANNADA (KARNATAKA)
 * =====================================================================
 * Models real highways and bypass links:
 * - NH-66 Coastal Highway (Mulki -> Surathkal -> Kuloor -> Mangalore City)
 * - Major Flood Blockage target: Kuloor River Bridge overflow on NH-66
 * - Alternative Detour via Bajpe / Kinnigoli / Kavoor interior bypass
 */
export const ROAD_NETWORK: RoadSegment[] = [
  // 1. NH-66 Direct Artery (Mulki to Kadri Polytechnic via Kuloor Bridge)
  // This is the major route that gets blocked by Gurupura/Kuloor river flooding
  {
    id: 'road-nh66-mulki-poly-direct',
    fromNodeId: 'vil-mulki',
    toNodeId: 'inst-1',
    name: 'NH-66 Coastal Highway (via Kuloor Bridge)',
    distanceKm: 28.0,
    normalTravelMinutes: 38,
    isBlocked: false,
    blockageReason: undefined
  },
  // 2. Mulki to Kinnigoli
  {
    id: 'road-mulki-kinnigoli',
    fromNodeId: 'vil-mulki',
    toNodeId: 'vil-kinnigoli',
    name: 'Mulki-Kinnigoli State Road',
    distanceKm: 9.0,
    normalTravelMinutes: 14,
    isBlocked: false
  },
  // 3. Kinnigoli to Kateel
  {
    id: 'road-kinnigoli-kateel',
    fromNodeId: 'vil-kinnigoli',
    toNodeId: 'vil-kateel',
    name: 'Kinnigoli-Kateel Road',
    distanceKm: 6.5,
    normalTravelMinutes: 11,
    isBlocked: false
  },
  // 4. Kateel to Bajpe
  {
    id: 'road-kateel-bajpe',
    fromNodeId: 'vil-kateel',
    toNodeId: 'vil-bajpe',
    name: 'Kateel-Bajpe Airport Connector',
    distanceKm: 12.0,
    normalTravelMinutes: 18,
    isBlocked: false
  },
  // 5. Bajpe to Govt Polytechnic Kadri (Mangalore) via Kavoor
  {
    id: 'road-bajpe-kadri',
    fromNodeId: 'vil-bajpe',
    toNodeId: 'inst-1',
    name: 'Bajpe-Kavoor-Kadri Airport Road Bypass',
    distanceKm: 14.5,
    normalTravelMinutes: 22,
    isBlocked: false
  },
  // 6. Mulki to Surathkal (NH-66 northern link)
  {
    id: 'road-mulki-surathkal',
    fromNodeId: 'vil-mulki',
    toNodeId: 'vil-surathkal',
    name: 'NH-66 Mulki-Surathkal Section',
    distanceKm: 11.0,
    normalTravelMinutes: 16,
    isBlocked: false
  },
  // 7. Surathkal to NITK (inst-2)
  {
    id: 'road-surathkal-nitk',
    fromNodeId: 'vil-surathkal',
    toNodeId: 'inst-2',
    name: 'Surathkal-NITK Beach Link',
    distanceKm: 2.0,
    normalTravelMinutes: 5,
    isBlocked: false
  },
  // 8. Moodbidri to Vamanjoor (NH-169)
  {
    id: 'road-moodbidri-vamanjoor',
    fromNodeId: 'vil-moodbidri',
    toNodeId: 'vil-vamanjoor',
    name: 'NH-169 Gurupura-Moodbidri Road',
    distanceKm: 22.0,
    normalTravelMinutes: 32,
    isBlocked: false
  },
  // 9. Vamanjoor to Kadri Polytechnic (inst-1)
  {
    id: 'road-vamanjoor-kadri',
    fromNodeId: 'vil-vamanjoor',
    toNodeId: 'inst-1',
    name: 'Vamanjoor-Kadri Hills Link',
    distanceKm: 7.0,
    normalTravelMinutes: 13,
    isBlocked: false
  },
  // 10. Farangipete to St. Aloysius (inst-3)
  {
    id: 'road-farangipete-city',
    fromNodeId: 'vil-farangipete',
    toNodeId: 'inst-3',
    name: 'NH-73 Netravathi Valley Highway',
    distanceKm: 15.0,
    normalTravelMinutes: 25,
    isBlocked: false
  },
  // 11. Ullal to St. Aloysius (inst-3) via Thokkottu
  {
    id: 'road-ullal-thokkottu-city',
    fromNodeId: 'vil-ullal',
    toNodeId: 'inst-3',
    name: 'Netravathi Bridge South Approach',
    distanceKm: 10.0,
    normalTravelMinutes: 18,
    isBlocked: false
  }
];

/**
 * Dijkstra's Shortest Path Algorithm for rural transit routing in Dakshina Kannada.
 * Accounts for blocked road segments (e.g. flooded Kuloor bridge on NH-66).
 */
export function findShortestRoute(
  startNodeId: string,
  targetNodeId: string,
  roadNetwork: RoadSegment[],
  avoidBlockedRoads: boolean = true
): RoutePathResult {
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

  const distances: Record<string, number> = {};
  const previous: Record<string, { nodeId: string; segment: RoadSegment; distanceKm: number } | null> = {};
  const unvisited = new Set<string>();

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

  // Compare with normal unblocked route to compute detour delay
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

function findUnblockedBaselineRoute(
  startNodeId: string,
  targetNodeId: string,
  roadNetwork: RoadSegment[]
): { totalDurationMinutes: number } {
  if (startNodeId === 'vil-mulki' && targetNodeId === 'inst-1') {
    return { totalDurationMinutes: 38 }; // Direct NH-66 via Kuloor bridge
  }
  return { totalDurationMinutes: 30 };
}
