// Semantic model of the SoHo site: entities, rules and actions (see semantic_model.md).

export const LIMITS = {
  buildingFrontage: 20,
  garageFrontage: 30,
  endMargin: 8,
  floors: [1, 12],
  garageLevels: [1, 8],
  dockHeight: [0.6, 1.0],
  subwayMinSidewalk: 3,
  furniturePerMeters: 15,
  furnitureGap: 4,
  elevation: [0.5, 5.0],
};

export const SURFACES = ['asphalt', 'concrete', 'cobblestone'];
export const USES = ['shop', 'restaurant', 'loft'];
export const VAULT_CONDITIONS = ['intact', 'cracked', 'broken'];
export const FURNITURE_TYPES = ['lamp_post', 'fire_hydrant', 'tree', 'bench', 'sign', 'newsstand'];

const FURNITURE_WIDTH = { lamp_post: 0.6, fire_hydrant: 0.6, tree: 2, bench: 1.8, sign: 0.6, newsstand: 3 };
const SUBWAY_LENGTH = 5;

function initialSite() {
  return {
    name: 'SoHo, Manhattan',
    intersections: [
      { id: 'INT-0', name: 'Prince St (east end)', x: 40, z: 0, hasTrafficSignal: false, hasCurbRamp: true },
      { id: 'INT-1', name: 'Prince & Broadway', x: 0, z: 0, hasTrafficSignal: true, hasCurbRamp: true },
      { id: 'INT-2', name: 'Prince & Greene', x: -150, z: 0, hasTrafficSignal: false, hasCurbRamp: true },
      { id: 'INT-3', name: 'Spring & Broadway', x: 0, z: 85, hasTrafficSignal: true, hasCurbRamp: true },
      { id: 'INT-4', name: 'Broome & Broadway', x: 0, z: 170, hasTrafficSignal: true, hasCurbRamp: true },
      { id: 'INT-5', name: 'Broome & Greene', x: -150, z: 170, hasTrafficSignal: false, hasCurbRamp: false },
      { id: 'INT-6', name: 'Canal & Broadway', x: 0, z: 270, hasTrafficSignal: true, hasCurbRamp: true },
      { id: 'INT-7', name: 'Canal St (west end)', x: -100, z: 270, hasTrafficSignal: false, hasCurbRamp: true },
    ],
    // from -> to; side +1 is the right-hand side when walking from -> to.
    streetSegments: [
      { id: 'SEG-01', streetName: 'Prince St', from: 'INT-0', to: 'INT-1', width: 10, sidewalkWidth: 3.5, elevation: 3.0, surface: 'asphalt' },
      { id: 'SEG-07', streetName: 'Prince St', from: 'INT-1', to: 'INT-2', width: 10, sidewalkWidth: 3.5, elevation: 2.9, surface: 'asphalt' },
      { id: 'SEG-02', streetName: 'Broadway', from: 'INT-1', to: 'INT-3', width: 15, sidewalkWidth: 5, elevation: 2.6, surface: 'concrete' },
      { id: 'SEG-03', streetName: 'Broadway', from: 'INT-3', to: 'INT-4', width: 15, sidewalkWidth: 5, elevation: 2.0, surface: 'concrete' },
      { id: 'SEG-04', streetName: 'Greene St', from: 'INT-2', to: 'INT-5', width: 9, sidewalkWidth: 2.5, elevation: 2.4, surface: 'cobblestone' },
      { id: 'SEG-05', streetName: 'Broome St', from: 'INT-5', to: 'INT-4', width: 11, sidewalkWidth: 3.5, elevation: 2.2, surface: 'asphalt' },
      { id: 'SEG-08', streetName: 'Broadway', from: 'INT-4', to: 'INT-6', width: 15, sidewalkWidth: 5, elevation: 1.6, surface: 'concrete' },
      { id: 'SEG-06', streetName: 'Canal St', from: 'INT-6', to: 'INT-7', width: 18, sidewalkWidth: 5, elevation: 1.2, surface: 'asphalt' },
    ],
    buildings: [
      { id: 'B-1', name: 'Noodle House', use: 'restaurant', segment: 'SEG-01', side: -1, u: 20, floors: 4, hasBasement: false, hasAwning: true },
      { id: 'B-2', name: 'Corner Boutique', use: 'shop', segment: 'SEG-01', side: 1, u: 20, floors: 3, hasBasement: true, hasAwning: false },
      { id: 'B-3', name: 'Prince St Gallery', use: 'shop', segment: 'SEG-07', side: 1, u: 40, floors: 5, hasBasement: false, hasAwning: true },
      { id: 'B-4', name: 'Shoe Store', use: 'shop', segment: 'SEG-07', side: 1, u: 80, floors: 4, hasBasement: true, hasAwning: false },
      { id: 'B-5', name: 'Prince Loft', use: 'loft', segment: 'SEG-07', side: -1, u: 110, floors: 6, hasBasement: true, hasAwning: false },
      { id: 'B-6', name: 'Broadway Sneakers', use: 'shop', segment: 'SEG-02', side: 1, u: 30, floors: 5, hasBasement: false, hasAwning: true },
      { id: 'B-7', name: 'Department Store', use: 'shop', segment: 'SEG-02', side: -1, u: 45, floors: 7, hasBasement: true, hasAwning: false },
      { id: 'B-8', name: 'Electronics', use: 'shop', segment: 'SEG-03', side: 1, u: 30, floors: 5, hasBasement: true, hasAwning: false },
      { id: 'B-9', name: 'Broadway Loft', use: 'loft', segment: 'SEG-03', side: -1, u: 50, floors: 6, hasBasement: true, hasAwning: false },
      { id: 'B-10', name: 'Greene St Loft A', use: 'loft', segment: 'SEG-04', side: -1, u: 40, floors: 5, hasBasement: true, hasAwning: false },
      { id: 'B-11', name: 'Greene St Loft B', use: 'loft', segment: 'SEG-04', side: -1, u: 95, floors: 5, hasBasement: false, hasAwning: false },
      { id: 'B-12', name: 'Greene St Loft C', use: 'loft', segment: 'SEG-04', side: 1, u: 60, floors: 6, hasBasement: false, hasAwning: false },
      { id: 'B-13', name: 'Greene St Loft D', use: 'loft', segment: 'SEG-04', side: 1, u: 125, floors: 5, hasBasement: true, hasAwning: false },
      { id: 'B-14', name: 'Broome St Loft', use: 'loft', segment: 'SEG-05', side: 1, u: 40, floors: 6, hasBasement: true, hasAwning: false },
      { id: 'B-15', name: 'Broome Cafe', use: 'restaurant', segment: 'SEG-05', side: -1, u: 75, floors: 4, hasBasement: false, hasAwning: true },
      { id: 'B-16', name: 'Broadway Outlet', use: 'shop', segment: 'SEG-08', side: 1, u: 50, floors: 5, hasBasement: true, hasAwning: false },
      { id: 'B-17', name: 'Phone Repair', use: 'shop', segment: 'SEG-08', side: -1, u: 40, floors: 4, hasBasement: false, hasAwning: true },
      { id: 'B-18', name: 'Canal Electronics', use: 'shop', segment: 'SEG-06', side: 1, u: 50, floors: 4, hasBasement: true, hasAwning: true },
    ],
    loadingDocks: [
      { id: 'LD-1', building: 'B-10', height: 0.9, hasRamp: false },
      { id: 'LD-2', building: 'B-13', height: 0.8, hasRamp: true },
      { id: 'LD-3', building: 'B-14', height: 0.8, hasRamp: true },
    ],
    sidewalkVaults: [
      { id: 'SV-1', building: 'B-8', area: 12, condition: 'cracked' },
      { id: 'SV-2', building: 'B-9', area: 12, condition: 'intact' },
      { id: 'SV-3', building: 'B-4', area: 12, condition: 'broken' },
    ],
    subwayEntrances: [
      { id: 'SUB-1', station: 'Spring St', segment: 'SEG-02', side: 1, u: 70, width: 2 },
      { id: 'SUB-2', station: 'Prince St (R/W)', segment: 'SEG-07', side: -1, u: 20, width: 2 },
      { id: 'SUB-3', station: 'Canal St', segment: 'SEG-06', side: -1, u: 20, width: 2 },
    ],
    drainageInlets: [
      { id: 'DR-1', segment: 'SEG-06', side: 1, u: 80, type: 'storm_drain', hasCover: true },
      { id: 'DR-2', segment: 'SEG-03', side: 0, u: 40, type: 'manhole', hasCover: true },
      { id: 'DR-3', segment: 'SEG-04', side: 0, u: 85, type: 'manhole', hasCover: false },
      { id: 'DR-4', segment: 'SEG-05', side: -1, u: 120, type: 'storm_drain', hasCover: true },
    ],
    parkingGarages: [
      { id: 'PG-1', segment: 'SEG-05', side: 1, u: 100, levels: 4 },
    ],
    streetFurniture: [
      { id: 'SF-1', segment: 'SEG-07', side: 1, u: 20, type: 'lamp_post' },
      { id: 'SF-2', segment: 'SEG-07', side: 1, u: 60, type: 'lamp_post' },
      { id: 'SF-3', segment: 'SEG-07', side: -1, u: 50, type: 'tree' },
      { id: 'SF-4', segment: 'SEG-07', side: -1, u: 80, type: 'tree' },
      { id: 'SF-5', segment: 'SEG-02', side: -1, u: 15, type: 'newsstand' },
      { id: 'SF-6', segment: 'SEG-02', side: 1, u: 45, type: 'lamp_post' },
      { id: 'SF-7', segment: 'SEG-05', side: 1, u: 70, type: 'fire_hydrant' },
      { id: 'SF-8', segment: 'SEG-01', side: 1, u: 33, type: 'sign' },
      { id: 'SF-9', segment: 'SEG-03', side: -1, u: 20, type: 'bench' },
      { id: 'SF-10', segment: 'SEG-08', side: 1, u: 20, type: 'tree' },
      { id: 'SF-11', segment: 'SEG-06', side: 1, u: 25, type: 'lamp_post' },
    ],
  };
}

export function createModel() {
  const site = initialSite();
  site.counters = {};
  return site;
}

// Entity kinds and the model collection that holds them.
export const KINDS = {
  StreetSegment: 'streetSegments',
  Intersection: 'intersections',
  Building: 'buildings',
  LoadingDock: 'loadingDocks',
  SidewalkVault: 'sidewalkVaults',
  SubwayEntrance: 'subwayEntrances',
  DrainageInlet: 'drainageInlets',
  ParkingGarage: 'parkingGarages',
  StreetFurniture: 'streetFurniture',
};

export function find(m, kind, id) {
  return m[KINDS[kind]].find((e) => e.id === id);
}

function nextId(m, kind, prefix) {
  const used = m[KINDS[kind]].map((e) => Number(e.id.split('-')[1]) || 0);
  return `${prefix}-${Math.max(0, ...used) + 1}`;
}

const ok = (msg, select) => ({ ok: true, msg, select });
const fail = (msg) => ({ ok: false, msg });

// ---------- Derived values (Rule 8) ----------

export function segmentLength(m, seg) {
  const a = find(m, 'Intersection', seg.from);
  const b = find(m, 'Intersection', seg.to);
  return Math.hypot(b.x - a.x, b.z - a.z);
}

export function connectedSegments(m, intersectionId) {
  return m.streetSegments.filter((s) => s.from === intersectionId || s.to === intersectionId);
}

export function intersectionElevation(m, intersectionId) {
  const segs = connectedSegments(m, intersectionId);
  return segs.reduce((sum, s) => sum + s.elevation, 0) / segs.length;
}

export function segmentSlope(m, seg) {
  const rise = intersectionElevation(m, seg.to) - intersectionElevation(m, seg.from);
  return (rise / segmentLength(m, seg)) * 100;
}

export function garageUpperLevelElevation(m, garage) {
  return find(m, 'StreetSegment', garage.segment).elevation + garage.levels * 3;
}

export function dockOf(m, buildingId) {
  return m.loadingDocks.find((d) => d.building === buildingId);
}

export function vaultOf(m, buildingId) {
  return m.sidewalkVaults.find((v) => v.building === buildingId);
}

// ---------- Placement helpers (Rules 1, 6) ----------

function frontageOccupants(m, segId, side) {
  const items = [];
  for (const b of m.buildings) {
    if (b.segment === segId && b.side === side) items.push([b.u - LIMITS.buildingFrontage / 2, b.u + LIMITS.buildingFrontage / 2]);
  }
  for (const g of m.parkingGarages) {
    if (g.segment === segId && g.side === side) items.push([g.u - LIMITS.garageFrontage / 2, g.u + LIMITS.garageFrontage / 2]);
  }
  return items;
}

function sidewalkOccupants(m, segId, side) {
  const items = [];
  for (const f of m.streetFurniture) {
    if (f.segment === segId && f.side === side) items.push([f.u - FURNITURE_WIDTH[f.type] / 2, f.u + FURNITURE_WIDTH[f.type] / 2]);
  }
  for (const s of m.subwayEntrances) {
    if (s.segment === segId && s.side === side) items.push([s.u - SUBWAY_LENGTH / 2, s.u + SUBWAY_LENGTH / 2]);
  }
  return items;
}

function findFreeSpot(length, size, occupied, gap, margin) {
  for (let u = margin + size / 2; u <= length - margin - size / 2; u += 1) {
    const a = u - size / 2 - gap;
    const b = u + size / 2 + gap;
    if (occupied.every(([x, y]) => b <= x || a >= y)) return u;
  }
  return null;
}

function placeOnSides(m, seg, size, occupantsFn, gap, margin) {
  const length = segmentLength(m, seg);
  for (const side of [1, -1]) {
    const u = findFreeSpot(length, size, occupantsFn(m, seg.id, side), gap, margin);
    if (u !== null) return { side, u };
  }
  return null;
}

// ---------- Actions ----------

export const actions = {
  addBuilding(m, seg) {
    const spot = placeOnSides(m, seg, LIMITS.buildingFrontage, frontageOccupants, 0, LIMITS.endMargin);
    if (!spot) return fail(`Rule 1: no free ${LIMITS.buildingFrontage} m frontage left on ${seg.id}.`);
    const id = nextId(m, 'Building', 'B');
    m.buildings.push({ id, name: `New Building ${id.split('-')[1]}`, use: 'shop', segment: seg.id, ...spot, floors: 4, hasBasement: false, hasAwning: false });
    return ok(`Added building ${id} on ${seg.id}.`, { kind: 'Building', id });
  },

  addGarage(m, seg) {
    const spot = placeOnSides(m, seg, LIMITS.garageFrontage, frontageOccupants, 0, LIMITS.endMargin);
    if (!spot) return fail(`Rule 1: no free ${LIMITS.garageFrontage} m frontage left on ${seg.id}.`);
    const id = nextId(m, 'ParkingGarage', 'PG');
    m.parkingGarages.push({ id, segment: seg.id, ...spot, levels: 3 });
    return ok(`Added parking garage ${id} on ${seg.id}.`, { kind: 'ParkingGarage', id });
  },

  addSubwayEntrance(m, seg) {
    if (seg.sidewalkWidth < LIMITS.subwayMinSidewalk) {
      return fail(`Rule 5: ${seg.id} sidewalk is ${seg.sidewalkWidth} m; a subway entrance needs ${LIMITS.subwayMinSidewalk} m.`);
    }
    const spot = placeOnSides(m, seg, SUBWAY_LENGTH, sidewalkOccupants, LIMITS.furnitureGap, LIMITS.endMargin);
    if (!spot) return fail(`Rule 6: no free sidewalk space on ${seg.id}.`);
    const id = nextId(m, 'SubwayEntrance', 'SUB');
    m.subwayEntrances.push({ id, station: `${seg.streetName} station`, segment: seg.id, ...spot, width: 2 });
    return ok(`Added subway entrance ${id} on ${seg.id}.`, { kind: 'SubwayEntrance', id });
  },

  addDrain(m, seg) {
    const length = segmentLength(m, seg);
    const taken = m.drainageInlets.filter((d) => d.segment === seg.id).map((d) => [d.u - 1, d.u + 1]);
    const u = findFreeSpot(length, 1, taken, 8, LIMITS.endMargin);
    if (u === null) return fail(`No room for another drain on ${seg.id}.`);
    const id = nextId(m, 'DrainageInlet', 'DR');
    m.drainageInlets.push({ id, segment: seg.id, side: 1, u, type: 'storm_drain', hasCover: true });
    return ok(`Added storm drain ${id} on ${seg.id}.`, { kind: 'DrainageInlet', id });
  },

  addFurniture(m, seg, type) {
    const max = Math.floor(segmentLength(m, seg) / LIMITS.furniturePerMeters);
    const count = m.streetFurniture.filter((f) => f.segment === seg.id).length;
    if (count >= max) return fail(`Rule 6: ${seg.id} already has ${count} items (max ${max}, one per ${LIMITS.furniturePerMeters} m).`);
    const spot = placeOnSides(m, seg, FURNITURE_WIDTH[type], sidewalkOccupants, LIMITS.furnitureGap, 2);
    if (!spot) return fail(`Rule 6: no free sidewalk space on ${seg.id}.`);
    const id = nextId(m, 'StreetFurniture', 'SF');
    m.streetFurniture.push({ id, segment: seg.id, ...spot, type });
    return ok(`Added ${type.replace('_', ' ')} ${id} on ${seg.id}.`, { kind: 'StreetFurniture', id });
  },

  changeSurface(m, seg) {
    seg.surface = SURFACES[(SURFACES.indexOf(seg.surface) + 1) % SURFACES.length];
    return ok(`${seg.id} surface is now ${seg.surface}.`);
  },

  changeElevation(m, seg, delta) {
    const next = Math.round((seg.elevation + delta) * 10) / 10;
    const [lo, hi] = LIMITS.elevation;
    if (next < lo || next > hi) return fail(`Rule 7: elevation must stay between ${lo} m and ${hi} m.`);
    seg.elevation = next;
    return ok(`${seg.id} elevation is now ${next.toFixed(1)} m; slopes updated.`);
  },

  changeFloors(m, b, delta) {
    const [lo, hi] = LIMITS.floors;
    if (b.floors + delta < lo || b.floors + delta > hi) return fail(`Rule 2: a building has ${lo}–${hi} floors.`);
    b.floors += delta;
    return ok(`${b.id} now has ${b.floors} floors.`);
  },

  changeLevels(m, g, delta) {
    const [lo, hi] = LIMITS.garageLevels;
    if (g.levels + delta < lo || g.levels + delta > hi) return fail(`Rule 2: a parking garage has ${lo}–${hi} levels.`);
    g.levels += delta;
    return ok(`${g.id} now has ${g.levels} levels (upper level ${garageUpperLevelElevation(m, g).toFixed(1)} m).`);
  },

  changeUse(m, b) {
    if (dockOf(m, b.id)) return fail(`Rule 3: ${b.id} has a loading dock, so it must stay a loft.`);
    b.use = USES[(USES.indexOf(b.use) + 1) % USES.length];
    return ok(`${b.id} is now a ${b.use}.`);
  },

  toggleAwning(m, b) {
    b.hasAwning = !b.hasAwning;
    return ok(`${b.id} ${b.hasAwning ? 'now has' : 'no longer has'} an awning.`);
  },

  toggleBasement(m, b) {
    b.hasBasement = !b.hasBasement;
    if (!b.hasBasement) {
      const v = vaultOf(m, b.id);
      if (v) {
        m.sidewalkVaults = m.sidewalkVaults.filter((x) => x !== v);
        return ok(`Rule 4: ${b.id} has no basement now, so vault ${v.id} was removed.`);
      }
    }
    return ok(`${b.id} ${b.hasBasement ? 'now has' : 'no longer has'} a basement.`);
  },

  addLoadingDock(m, b) {
    if (b.use !== 'loft') return fail(`Rule 3: only a loft can have a loading dock (${b.id} is a ${b.use}).`);
    if (dockOf(m, b.id)) return fail(`Rule 3: ${b.id} already has a loading dock.`);
    const id = nextId(m, 'LoadingDock', 'LD');
    m.loadingDocks.push({ id, building: b.id, height: 0.8, hasRamp: false });
    return ok(`Added loading dock ${id} to ${b.id}.`, { kind: 'LoadingDock', id });
  },

  addVault(m, b) {
    if (!b.hasBasement) return fail(`Rule 4: ${b.id} has no basement, so it cannot have vault lights.`);
    if (vaultOf(m, b.id)) return fail(`Rule 4: ${b.id} already has vault lights.`);
    const id = nextId(m, 'SidewalkVault', 'SV');
    m.sidewalkVaults.push({ id, building: b.id, area: 12, condition: 'intact' });
    return ok(`Added sidewalk vault ${id} in front of ${b.id}.`, { kind: 'SidewalkVault', id });
  },

  toggleRamp(m, d) {
    d.hasRamp = !d.hasRamp;
    return ok(`${d.id} ${d.hasRamp ? 'now has a ramp' : 'now has steps only'}.`);
  },

  changeDockHeight(m, d, delta) {
    const next = Math.round((d.height + delta) * 10) / 10;
    const [lo, hi] = LIMITS.dockHeight;
    if (next < lo || next > hi) return fail(`Rule 3: dock height must stay between ${lo} m and ${hi} m.`);
    d.height = next;
    return ok(`${d.id} height is now ${next.toFixed(1)} m.`);
  },

  changeCondition(m, v) {
    v.condition = VAULT_CONDITIONS[(VAULT_CONDITIONS.indexOf(v.condition) + 1) % VAULT_CONDITIONS.length];
    return ok(`${v.id} is now ${v.condition}.`);
  },

  toggleCover(m, d) {
    d.hasCover = !d.hasCover;
    return ok(`${d.id} ${d.hasCover ? 'cover replaced' : 'cover removed (open hole)'}.`);
  },

  toggleDrainType(m, d) {
    d.type = d.type === 'manhole' ? 'storm_drain' : 'manhole';
    return ok(`${d.id} is now a ${d.type.replace('_', ' ')}.`);
  },

  toggleSignal(m, i) {
    i.hasTrafficSignal = !i.hasTrafficSignal;
    return ok(`${i.name}: traffic signal ${i.hasTrafficSignal ? 'added' : 'removed'}.`);
  },

  toggleCurbRamp(m, i) {
    i.hasCurbRamp = !i.hasCurbRamp;
    return ok(`${i.name}: curb ramps ${i.hasCurbRamp ? 'added' : 'removed'}.`);
  },

  changeFurnitureType(m, f) {
    f.type = FURNITURE_TYPES[(FURNITURE_TYPES.indexOf(f.type) + 1) % FURNITURE_TYPES.length];
    return ok(`${f.id} is now a ${f.type.replace('_', ' ')}.`);
  },

  remove(m, kind, entity) {
    if (kind === 'StreetSegment' || kind === 'Intersection') return fail('Rule 10: the street network cannot be deleted.');
    const key = KINDS[kind];
    m[key] = m[key].filter((e) => e !== entity);
    if (kind === 'Building') {
      const extra = [];
      const d = dockOf(m, entity.id);
      const v = vaultOf(m, entity.id);
      if (d) { m.loadingDocks = m.loadingDocks.filter((x) => x !== d); extra.push(d.id); }
      if (v) { m.sidewalkVaults = m.sidewalkVaults.filter((x) => x !== v); extra.push(v.id); }
      if (extra.length) return ok(`Removed ${entity.id}; Rule 9 also removed ${extra.join(' and ')}.`);
    }
    return ok(`Removed ${entity.id}.`);
  },
};
