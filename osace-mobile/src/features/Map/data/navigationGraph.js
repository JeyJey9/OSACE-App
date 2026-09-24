/**
 * Navigation Graph and A* Pathfinding for OSACE Indoor Map.
 * Provides full single-floor and multi-floor routing.
 */

import NAV_NODES from './navigationNodes.json';
import NAV_EDGES from './navigationEdges.json';

export { NAV_NODES, NAV_EDGES };

// Adjacency graph built at initialization
const adjacencyList = {};

function initGraph() {
  for (const nId of Object.keys(NAV_NODES)) {
    adjacencyList[nId] = [];
  }
  for (const edge of NAV_EDGES) {
    if (!adjacencyList[edge.from]) adjacencyList[edge.from] = [];
    if (!adjacencyList[edge.to]) adjacencyList[edge.to] = [];
    adjacencyList[edge.from].push({ to: edge.to, kind: edge.kind, weight: edge.weight });
    adjacencyList[edge.to].push({ to: edge.from, kind: edge.kind, weight: edge.weight });
  }
}

initGraph();

// Resolve a room identifier (id, code, or node id) to a nav node id
export function resolveToNodeId(roomOrCode) {
  if (!roomOrCode) return null;
  if (typeof roomOrCode === 'object') {
    if (roomOrCode.id) {
      const candidateId = `${roomOrCode.floor}-R-${roomOrCode.id.replace('room-', '')}`;
      if (NAV_NODES[candidateId]) return candidateId;
      const res = resolveToNodeId(roomOrCode.id);
      if (res && res !== 'B-entrance-main') return res;
    }
    if (roomOrCode.code) return resolveToNodeId(roomOrCode.code);
  }

  const str = String(roomOrCode).trim();
  const upper = str.toUpperCase().replace('ROOM-', '');

  // Intrarea Principală Facultate (Demisol GD04)
  if (
    upper.includes('INTRARE') ||
    upper.includes('FACULTATE') ||
    upper === 'GD04' ||
    upper === 'ROOM-GD04' ||
    upper === 'B-ENTRANCE-MAIN' ||
    upper.includes('ENTRANCE')
  ) {
    return 'B-entrance-main';
  }

  // Aula Constantin Belea (ACB) -> rutează direct la Punctul Informativ (Intrare Aula B-S08)
  if (
    upper === 'ACB' ||
    upper === 'ROOM-B-AMFITEATRU' ||
    upper.includes('BELEA') ||
    upper.includes('AULA') ||
    upper.includes('B-AMFITEATRU') ||
    upper === 'STAIR-B-08' ||
    upper === 'B-S08'
  ) {
    return 'B-S08';
  }

  // Amfiteatrul Parter (AK1)
  if (
    upper === 'AK1' ||
    upper === 'P-AMFITEATRU' ||
    upper === 'ROOM-P-AMFITEATRU' ||
    upper.includes('AMFITEATRU')
  ) {
    return 'P-R-P-amfiteatru';
  }

  if (NAV_NODES[str]) return str;
  for (const [id, node] of Object.entries(NAV_NODES)) {
    if (node.roomCode && node.roomCode.toUpperCase() === upper) {
      return id;
    }
  }

  // Fallback: search node ID ending with the code (case-insensitive)
  for (const id of Object.keys(NAV_NODES)) {
    const idUpper = id.toUpperCase();
    if (idUpper.endsWith('-' + upper) || idUpper.endsWith(upper)) {
      return id;
    }
  }

  // Nu s-a găsit niciun nod pentru acest identificator — returnăm null
  // pentru ca findPath să afișeze alerta "Rută Indisponibilă"
  return null;
}

const FLOOR_LEVEL_INDEX = { 'B': 0, 'P': 1, 'E1': 2, 'E2': 3, 'E3': 4 };

/**
 * Euristică A* admisibilă și calibrată:
 * Distanța 2D euclidiană pe plan + costul real de urcat/coborât scările (150 unități per nivel).
 */
function calculatePathHeuristic(nodeA, nodeB) {
  const dist2D = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
  const floorA = FLOOR_LEVEL_INDEX[nodeA.floor] ?? 0;
  const floorB = FLOOR_LEVEL_INDEX[nodeB.floor] ?? 0;
  const floorPenalty = Math.abs(floorA - floorB) * 150;
  return dist2D + floorPenalty;
}

/**
 * A* Pathfinding algorithm across single or multiple floors.
 */
export function findPath(fromRoom, toRoom) {
  const startId = resolveToNodeId(fromRoom);
  const goalId = resolveToNodeId(toRoom);

  if (!NAV_NODES[startId] || !NAV_NODES[goalId]) return null;
  if (startId === goalId) {
    return {
      nodes: [NAV_NODES[startId]],
      floors: [NAV_NODES[startId].floor],
      totalDistanceMeters: 0,
      instructions: ['Te afli deja la destinație.'],
    };
  }

  const openSet = new Set([startId]);
  const cameFrom = {};
  const gScore = { [startId]: 0 };
  const goalNode = NAV_NODES[goalId];

  const fScore = {
    [startId]: calculatePathHeuristic(NAV_NODES[startId], goalNode),
  };

  while (openSet.size > 0) {
    let current = null;
    let lowestF = Infinity;
    for (const id of openSet) {
      if (fScore[id] < lowestF) {
        lowestF = fScore[id];
        current = id;
      }
    }

    if (current === goalId) {
      const pathIds = [current];
      while (cameFrom[pathIds[0]]) {
        pathIds.unshift(cameFrom[pathIds[0]]);
      }

      const pathNodes = pathIds.map((id) => NAV_NODES[id]);
      const floorsVisited = [...new Set(pathNodes.map((n) => n.floor))];

      // Convert units to approx meters (20 units = 1 meter from metadata)
      const totalUnits = gScore[goalId] || 0;
      const totalDistanceMeters = Math.round((totalUnits / 20) * 10) / 10;

      return {
        nodes: pathNodes,
        floors: floorsVisited,
        totalDistanceMeters,
        isMultiFloor: floorsVisited.length > 1,
      };
    }

    openSet.delete(current);
    const neighbors = adjacencyList[current] || [];

    for (const edge of neighbors) {
      const tentativeG = gScore[current] + edge.weight;
      if (tentativeG < (gScore[edge.to] ?? Infinity)) {
        cameFrom[edge.to] = current;
        gScore[edge.to] = tentativeG;
        const targetNode = NAV_NODES[edge.to];
        const h = calculatePathHeuristic(targetNode, goalNode);
        fScore[edge.to] = tentativeG + h;
        openSet.add(edge.to);
      }
    }
  }

  return null;
}

export default {
  NAV_NODES,
  NAV_EDGES,
  resolveToNodeId,
  findPath,
};


