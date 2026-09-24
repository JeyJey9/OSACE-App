/**
 * Building internal walls for each floor extracted from the original SVGs.
 * Data loaded lazily from JSON to optimize JS bundle evaluation and startup time.
 * ViewBox: 0 0 1346.8 1392.0
 */
let cachedFloorWalls = null;

function loadFloorWalls() {
  if (!cachedFloorWalls) {
    cachedFloorWalls = require('./floorWalls.json');
  }
  return cachedFloorWalls;
}

export const getFloorWalls = (floorId) => {
  const walls = loadFloorWalls();
  return walls[floorId] || null;
};

// Backward-compatible export: evaluates floorWalls.json only upon property access
export const floorWalls = new Proxy({}, {
  get: (target, prop) => {
    const walls = loadFloorWalls();
    return walls[prop];
  },
});

export default floorWalls;
