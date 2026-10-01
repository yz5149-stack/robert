// three.js rendering of the site model.
import * as THREE from 'three';
import {
  find, segmentLength, connectedSegments, intersectionElevation, dockOf, vaultOf, LIMITS,
} from './model.js';

const EXAG = 3;          // vertical exaggeration of street elevation
const BASE = 0;          // ground level in the scene
const CURB = 0.25;       // sidewalk height above the road
const FLOOR_H = 4;       // building floor height
const BUILDING_DEPTH = 18;
const GARAGE_DEPTH = 22;

const COLORS = {
  asphalt: 0x3b3e44,
  concrete: 0x9c9b96,
  cobblestone: 0x8a7a68,
  sidewalk: 0xc9c4ba,
  pad: 0x45484e,
  shop: 0xd8c3a5,
  restaurant: 0xc9785a,
  loft: 0x8d9aa6,
  foundation: 0x77736b,
  basement: 0x4d3e33,
  dock: 0x4f5b55,
  ramp: 0xd9b23a,
  subway: 0x2e7d4f,
  garage: 0xb3b1ab,
};
const VAULT_COLORS = { intact: 0x8fd3e8, cracked: 0xe0b44c, broken: 0xc0392b };
const AWNING_COLORS = [0x1f6f8b, 0x8b1f3a, 0x2f6b2f, 0x6b4f1f, 0x333366];

// ---------- Procedural textures ----------

function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const TEX = {
  cobble: canvasTexture(128, (g, s) => {
    g.fillStyle = '#6d6052'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 6; x++) {
        const off = (y % 2) * 10;
        const l = 150 + ((x * 37 + y * 53) % 50);
        g.fillStyle = `rgb(${l},${l - 15},${l - 35})`;
        g.fillRect(x * 22 + off - 10 + 2, y * 16 + 2, 18, 12);
      }
    }
  }),
  windows: canvasTexture(64, (g, s) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#2d3640'; g.fillRect(14, 10, 36, 40);
    g.fillStyle = '#5a6b7a'; g.fillRect(16, 12, 32, 18);
  }),
  glass: canvasTexture(64, (g, s) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#d0d0d0';
    for (let i = 0; i <= s; i += 16) { g.fillRect(i, 0, 2, s); g.fillRect(0, i, s, 2); }
  }),
  grate: canvasTexture(32, (g, s) => {
    g.fillStyle = '#1e1e1e'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#5a5a5a';
    for (let i = 2; i < s; i += 6) g.fillRect(i, 0, 3, s);
  }),
};

function tex(name, rx, ry) {
  const t = TEX[name].clone();
  t.needsUpdate = true;
  t.repeat.set(rx, ry);
  return t;
}

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...extra });
}

// ---------- Segment frame: u along the segment, v to the right ----------

function frame(m, seg) {
  const a = find(m, 'Intersection', seg.from);
  const b = find(m, 'Intersection', seg.to);
  const L = segmentLength(m, seg);
  const dx = (b.x - a.x) / L;
  const dz = (b.z - a.z) / L;
  const y0 = elevToY(intersectionElevation(m, a.id));
  const y1 = elevToY(intersectionElevation(m, b.id));
  return {
    seg, a, b, L, dx, dz, rx: -dz, rz: dx, y0, y1,
    angle: Math.atan2(-dz, dx),
    yAt(u) { return y0 + (y1 - y0) * Math.min(1, Math.max(0, u / L)); },
    point(u, v, y = 0) { return new THREE.Vector3(a.x + dx * u + this.rx * v, y, a.z + dz * u + this.rz * v); },
  };
}

export function elevToY(elev) {
  return (elev - 0.5) * EXAG;
}

// A box aligned with the segment between u0..u1 and v0..v1 whose top follows topFn(u)
// and whose bottom follows botFn(u). Heights are absolute scene y values.
function alignedBox(f, u0, u1, v0, v1, topFn, botFn, material) {
  const len = u1 - u0;
  const dep = v1 - v0;
  const geo = new THREE.BoxGeometry(len, 1, dep);
  const pos = geo.attributes.position;
  const um = (u0 + u1) / 2;
  for (let i = 0; i < pos.count; i++) {
    const u = um + pos.getX(i);
    pos.setY(i, pos.getY(i) > 0 ? topFn(u) : botFn(u));
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  const c = f.point(um, (v0 + v1) / 2);
  mesh.position.set(c.x, 0, c.z);
  mesh.rotation.y = f.angle;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function placeAt(f, obj, u, v, y) {
  const p = f.point(u, v, y);
  obj.position.copy(p);
  obj.rotation.y = f.angle;
  return obj;
}

function padHalf(m, intersectionId) {
  return Math.max(...connectedSegments(m, intersectionId).map((s) => s.width / 2 + s.sidewalkWidth));
}

function frontEdge(seg) {
  return seg.width / 2 + seg.sidewalkWidth;
}

// ---------- Labels ----------

function label(text, scale = 1, color = '#1b1f24') {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const font = 'bold 44px system-ui, sans-serif';
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 36;
  c.width = w; c.height = 72;
  g.font = font;
  g.fillStyle = 'rgba(255,255,255,0.88)';
  g.beginPath(); g.roundRect(0, 0, w, 72, 18); g.fill();
  g.fillStyle = color; g.textBaseline = 'middle';
  g.fillText(text, 18, 38);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false }));
  s.scale.set((w / 72) * 5 * scale, 5 * scale, 1);
  s.renderOrder = 10;
  s.raycast = () => {};
  s.userData.isLabel = true;
  return s;
}

// ---------- Entity builders ----------

function entityGroup(kind, id) {
  const g = new THREE.Group();
  g.userData = { kind, id };
  return g;
}

function buildSegment(m, seg) {
  const f = frame(m, seg);
  const g = entityGroup('StreetSegment', seg.id);
  const a0 = padHalf(m, seg.from);
  const a1 = f.L - padHalf(m, seg.to);
  const w = seg.width / 2;
  const sw = seg.sidewalkWidth;
  const bottom = () => BASE;

  let roadMat;
  if (seg.surface === 'cobblestone') roadMat = mat(0xffffff, { map: tex('cobble', (a1 - a0) / 3, seg.width / 3) });
  else roadMat = mat(COLORS[seg.surface], { roughness: seg.surface === 'asphalt' ? 0.95 : 0.8 });
  g.add(alignedBox(f, a0, a1, -w, w, (u) => f.yAt(u), bottom, roadMat));

  // lane markings
  if (seg.surface !== 'cobblestone') {
    const stripe = mat(0xf2d16b, { roughness: 0.6 });
    g.add(alignedBox(f, a0 + 2, a1 - 2, -0.12, 0.12, (u) => f.yAt(u) + 0.03, (u) => f.yAt(u), stripe));
  }
  // crosswalks at signalled ends
  for (const [end, u] of [[seg.from, a0], [seg.to, a1]]) {
    if (!find(m, 'Intersection', end).hasTrafficSignal) continue;
    const dir = u === a0 ? 1 : -1;
    const white = mat(0xf4f4f4, { roughness: 0.6 });
    for (let v = -w + 0.6; v < w - 0.6; v += 1.6) {
      const ua = u + dir * 0.5, ub = u + dir * 3.5;
      g.add(alignedBox(f, Math.min(ua, ub), Math.max(ua, ub), v, v + 0.8, (x) => f.yAt(x) + 0.03, (x) => f.yAt(x), white));
    }
  }
  // sidewalks
  for (const s of [1, -1]) {
    const v0 = s > 0 ? w : -w - sw;
    const v1 = s > 0 ? w + sw : -w;
    g.add(alignedBox(f, a0, a1, v0, v1, (u) => f.yAt(u) + CURB, bottom, mat(COLORS.sidewalk)));
  }
  const lbl = label(`${seg.id} · ${seg.streetName}`, 1);
  lbl.position.copy(f.point(f.L / 2, 0, f.yAt(f.L / 2) + 26));
  g.add(lbl);
  return g;
}

function buildIntersection(m, it) {
  const g = entityGroup('Intersection', it.id);
  const h = padHalf(m, it.id);
  const y = elevToY(intersectionElevation(m, it.id));
  const pad = new THREE.Mesh(new THREE.BoxGeometry(h * 2, Math.max(0.05, y - BASE), h * 2), mat(COLORS.pad));
  pad.position.set(it.x, (y + BASE) / 2, it.z);
  pad.receiveShadow = pad.castShadow = true;
  g.add(pad);

  const corners = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  if (it.hasCurbRamp) {
    const yellow = mat(0xf2c230, { roughness: 0.5 });
    for (const [sx, sz] of corners) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 1.4), yellow);
      r.position.set(it.x + sx * (h - 1), y + 0.06, it.z + sz * (h - 1));
      g.add(r);
    }
  }
  if (it.hasTrafficSignal) {
    for (const [sx, sz] of [[1, 1], [-1, -1]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 6, 8), mat(0x2b2e33, { metalness: 0.5 }));
      pole.position.set(it.x + sx * (h - 0.5), y + 3, it.z + sz * (h - 0.5));
      pole.castShadow = true;
      g.add(pole);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), mat(0x222222));
      head.position.set(pole.position.x, y + 6.4, pole.position.z);
      g.add(head);
      [0xff3b30, 0xffcc00, 0x34c759].forEach((c, i) => {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat(c, { emissive: c, emissiveIntensity: i === 2 ? 1.4 : 0.25 }));
        l.position.set(head.position.x - sx * 0.32, y + 6.95 - i * 0.55, head.position.z - sz * 0.0);
        g.add(l);
      });
    }
  }
  const lbl = label(it.name, 0.75, '#3a3f47');
  lbl.position.set(it.x, y + 14, it.z);
  g.add(lbl);
  return g;
}

function buildBuilding(m, b) {
  const seg = find(m, 'StreetSegment', b.segment);
  const f = frame(m, seg);
  const g = entityGroup('Building', b.id);
  const fe = frontEdge(seg);
  const u0 = b.u - LIMITS.buildingFrontage / 2;
  const u1 = b.u + LIMITS.buildingFrontage / 2;
  const [v0, v1] = b.side > 0 ? [fe, fe + BUILDING_DEPTH] : [-fe - BUILDING_DEPTH, -fe];
  const street = f.yAt(b.u) + CURB;
  const top = street + b.floors * FLOOR_H;

  g.add(alignedBox(f, u0, u1, v0, v1, () => street, () => BASE, mat(b.hasBasement ? COLORS.basement : COLORS.foundation)));
  const facade = mat(COLORS[b.use], { map: tex('windows', LIMITS.buildingFrontage / 4, b.floors) });
  g.add(alignedBox(f, u0, u1, v0, v1, () => top, () => street, [facade, facade, mat(COLORS[b.use]), mat(COLORS[b.use]), facade, facade]));
  // cornice
  g.add(alignedBox(f, u0 - 0.3, u1 + 0.3, v0 - 0.3, v1 + 0.3, () => top + 0.6, () => top, mat(0x6a6660)));

  if (b.hasAwning) {
    const color = AWNING_COLORS[Number(b.id.split('-')[1]) % AWNING_COLORS.length];
    const [a0, a1] = b.side > 0 ? [fe - 2.2, fe] : [-fe, -fe + 2.2];
    g.add(alignedBox(f, u0 + 3, u1 - 3, a0, a1, () => street + 3.4, () => street + 3.1, mat(color, { roughness: 0.6 })));
  }
  // door
  const doorV = b.side > 0 ? fe - 0.05 : -fe + 0.05;
  g.add(alignedBox(f, b.u - 1.2, b.u + 1.2, doorV - 0.1, doorV + 0.1, () => street + 2.6, () => street, mat(0x3a2a20)));

  const lbl = label(b.name, 0.6, '#3a3f47');
  lbl.position.copy(f.point(b.u, b.side * (fe + BUILDING_DEPTH / 2), top + 4));
  g.add(lbl);
  return g;
}

function buildDock(m, d) {
  const b = find(m, 'Building', d.building);
  const seg = find(m, 'StreetSegment', b.segment);
  const f = frame(m, seg);
  const g = entityGroup('LoadingDock', d.id);
  const fe = frontEdge(seg);
  const depth = Math.min(1.8, seg.sidewalkWidth - 0.6);
  const [v0, v1] = b.side > 0 ? [fe - depth, fe] : [-fe, -fe + depth];
  const street = f.yAt(b.u) + CURB;
  const u0 = b.u - 6, u1 = b.u + 3;
  g.add(alignedBox(f, u0, u1, v0, v1, () => street + d.height, () => street, mat(COLORS.dock, { metalness: 0.4 })));
  g.add(alignedBox(f, u0, u1, v0, v1, () => street + d.height + 0.05, () => street + d.height, mat(0xa98f3a, { metalness: 0.3 })));
  if (d.hasRamp) {
    const r0 = u1, r1 = u1 + 4;
    g.add(alignedBox(f, r0, r1, v0, v1, (u) => street + d.height * (1 - (u - r0) / (r1 - r0)) + 0.02, () => street, mat(COLORS.ramp)));
  } else {
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      const h = (d.height * (steps - i)) / (steps + 1);
      g.add(alignedBox(f, u1 + i * 0.4, u1 + (i + 1) * 0.4, v0, v1, () => street + h, () => street, mat(0x6c706d)));
    }
  }
  return g;
}

function buildVault(m, v) {
  const b = find(m, 'Building', v.building);
  const seg = find(m, 'StreetSegment', b.segment);
  const f = frame(m, seg);
  const g = entityGroup('SidewalkVault', v.id);
  const w = seg.width / 2;
  const depth = Math.max(1, seg.sidewalkWidth - 2.2);
  const [v0, v1] = b.side > 0 ? [w + 0.4, w + 0.4 + depth] : [-w - 0.4 - depth, -w - 0.4];
  const len = v.area / depth;
  const u0 = b.u + 4, u1 = Math.min(b.u + 4 + len, b.u + LIMITS.buildingFrontage / 2);
  const street = (u) => f.yAt(u) + CURB;
  const color = VAULT_COLORS[v.condition];
  const material = mat(color, {
    map: tex('glass', (u1 - u0) / 1.5, depth / 1.5),
    emissive: color, emissiveIntensity: v.condition === 'intact' ? 0.25 : 0.12, roughness: 0.3,
  });
  g.add(alignedBox(f, u0, u1, v0, v1, (u) => street(u) + 0.04, street, material));
  if (v.condition === 'broken') {
    const hole = mat(0x0b0b0b);
    g.add(alignedBox(f, u0 + 1, u0 + 2.2, v0 + 0.3, v0 + 1, (u) => street(u) + 0.06, street, hole));
  }
  return g;
}

function buildSubway(m, s) {
  const seg = find(m, 'StreetSegment', s.segment);
  const f = frame(m, seg);
  const g = entityGroup('SubwayEntrance', s.id);
  const w = seg.width / 2;
  const [v0, v1] = s.side > 0 ? [w + 0.5, w + 0.5 + s.width] : [-w - 0.5 - s.width, -w - 0.5];
  const u0 = s.u - 2.5, u1 = s.u + 2.5;
  const street = f.yAt(s.u) + CURB;
  g.add(alignedBox(f, u0, u1, v0, v1, () => street + 0.03, () => street, mat(0x111111)));
  const green = mat(COLORS.subway, { metalness: 0.4, roughness: 0.5 });
  g.add(alignedBox(f, u0, u1, v0 - 0.08, v0, () => street + 1.1, () => street, green));
  g.add(alignedBox(f, u0, u1, v1, v1 + 0.08, () => street + 1.1, () => street, green));
  g.add(alignedBox(f, u1 - 0.08, u1, v0, v1, () => street + 1.1, () => street, green));
  for (const v of [v0, v1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), green);
    placeAt(f, post, u0, v, street + 1.2);
    g.add(post);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), mat(0x3ddc84, { emissive: 0x3ddc84, emissiveIntensity: 0.9 }));
    placeAt(f, globe, u0, v, street + 2.6);
    g.add(globe);
  }
  const lbl = label(`🚇 ${s.station}`, 0.55, '#1e5c38');
  lbl.position.copy(f.point(s.u, (v0 + v1) / 2, street + 6));
  g.add(lbl);
  return g;
}

function buildDrain(m, d) {
  const seg = find(m, 'StreetSegment', d.segment);
  const f = frame(m, seg);
  const g = entityGroup('DrainageInlet', d.id);
  const v = d.side === 0 ? 0 : d.side * (seg.width / 2 - 0.7);
  const y = f.yAt(d.u);
  if (!d.hasCover) {
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 20), mat(0x000000, { roughness: 1 }));
    placeAt(f, hole, d.u, v, y + 0.03);
    g.add(hole);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 12), mat(0xff7a1a, { emissive: 0xff7a1a, emissiveIntensity: 0.3 }));
    placeAt(f, cone, d.u + 1, v, y + 0.4);
    cone.castShadow = true;
    g.add(cone);
  } else if (d.type === 'manhole') {
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 20), mat(0x2a2a2a, { metalness: 0.6, roughness: 0.5 }));
    placeAt(f, lid, d.u, v, y + 0.03);
    g.add(lid);
  } else {
    g.add(alignedBox(f, d.u - 0.6, d.u + 0.6, v - 0.35, v + 0.35, (u) => f.yAt(u) + 0.04, (u) => f.yAt(u), mat(0xffffff, { map: tex('grate', 1, 1), metalness: 0.5 })));
  }
  return g;
}

function buildGarage(m, p) {
  const seg = find(m, 'StreetSegment', p.segment);
  const f = frame(m, seg);
  const g = entityGroup('ParkingGarage', p.id);
  const fe = frontEdge(seg);
  const u0 = p.u - LIMITS.garageFrontage / 2, u1 = p.u + LIMITS.garageFrontage / 2;
  const [v0, v1] = p.side > 0 ? [fe, fe + GARAGE_DEPTH] : [-fe - GARAGE_DEPTH, -fe];
  const street = f.yAt(p.u) + CURB;
  const concrete = mat(COLORS.garage);
  g.add(alignedBox(f, u0, u1, v0, v1, () => street, () => BASE, mat(COLORS.foundation)));
  for (let lvl = 0; lvl <= p.levels; lvl++) {
    const y = street + lvl * 3;
    g.add(alignedBox(f, u0, u1, v0, v1, () => y + 0.35, () => y, concrete));
    if (lvl > 0) {
      for (const [a, b] of [[v0, v0 + 0.25], [v1 - 0.25, v1]]) {
        g.add(alignedBox(f, u0, u1, a, b, () => y + 1.1, () => y + 0.35, mat(0x8f8d88)));
      }
    }
  }
  // columns
  for (const u of [u0 + 0.4, p.u, u1 - 0.4]) {
    for (const v of [v0 + 0.4, v1 - 0.4]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.6, p.levels * 3, 0.6), concrete);
      placeAt(f, col, u, v, street + (p.levels * 3) / 2);
      col.castShadow = true;
      g.add(col);
    }
  }
  const lbl = label(`🅿 Garage (${p.levels} levels)`, 0.6, '#2b4a7a');
  lbl.position.copy(f.point(p.u, (v0 + v1) / 2, street + p.levels * 3 + 5));
  g.add(lbl);
  return g;
}

function buildFurniture(m, s) {
  const seg = find(m, 'StreetSegment', s.segment);
  const f = frame(m, seg);
  const g = entityGroup('StreetFurniture', s.id);
  const v = s.side * (seg.width / 2 + 0.7);
  const y = f.yAt(s.u) + CURB;
  const add = (geo, material, dy, du = 0, dv = 0) => {
    const mesh = new THREE.Mesh(geo, material);
    placeAt(f, mesh, s.u + du, v + dv, y + dy);
    mesh.castShadow = true;
    g.add(mesh);
  };
  const metal = mat(0x2b2e33, { metalness: 0.5, roughness: 0.5 });
  switch (s.type) {
    case 'lamp_post':
      add(new THREE.CylinderGeometry(0.1, 0.14, 6, 8), metal, 3);
      add(new THREE.BoxGeometry(0.5, 0.3, 0.9), mat(0xfff3c4, { emissive: 0xffe08a, emissiveIntensity: 1 }), 6.1, 0, -s.side * 0.4);
      break;
    case 'fire_hydrant':
      add(new THREE.CylinderGeometry(0.22, 0.26, 0.8, 12), mat(0xd0312d), 0.4);
      add(new THREE.SphereGeometry(0.22, 12, 8), mat(0xd0312d), 0.82);
      break;
    case 'tree':
      add(new THREE.CylinderGeometry(0.15, 0.22, 3, 8), mat(0x5b4030), 1.5);
      add(new THREE.IcosahedronGeometry(1.9, 1), mat(0x4f8a3b, { flatShading: true }), 4.2);
      break;
    case 'bench':
      add(new THREE.BoxGeometry(1.8, 0.1, 0.5), mat(0x7a5233), 0.45);
      add(new THREE.BoxGeometry(1.8, 0.5, 0.08), mat(0x7a5233), 0.75, 0, s.side * 0.25);
      add(new THREE.BoxGeometry(0.08, 0.45, 0.45), metal, 0.22, 0.8);
      add(new THREE.BoxGeometry(0.08, 0.45, 0.45), metal, 0.22, -0.8);
      break;
    case 'sign':
      add(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 6), metal, 1.4);
      add(new THREE.BoxGeometry(0.9, 0.3, 0.05), mat(0x1d7a3a), 2.7);
      add(new THREE.BoxGeometry(0.05, 0.3, 0.9), mat(0x1d7a3a), 2.35);
      break;
    case 'newsstand':
      add(new THREE.BoxGeometry(3, 2.4, 1.4), mat(0x2f5d3a), 1.2);
      add(new THREE.BoxGeometry(3.3, 0.12, 1.8), mat(0x24452c), 2.46);
      break;
  }
  return g;
}

// ---------- Scene ----------

export function createView(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfd9e4);
  scene.fog = new THREE.Fog(0xcfd9e4, 500, 1100);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);

  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x4a4a44, 1.1));
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sun.position.set(120, 260, -60);
  sun.target.position.set(-40, 0, 135);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -260, right: 260, top: 260, bottom: -260, near: 10, far: 700 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), mat(0x6b7062, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const world = new THREE.Group();
  scene.add(world);

  function dispose(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      ms.forEach((mm) => { if (mm.map) mm.map.dispose(); mm.dispose(); });
    });
  }

  function render(m) {
    for (const child of [...world.children]) { world.remove(child); dispose(child); }
    m.streetSegments.forEach((s) => world.add(buildSegment(m, s)));
    m.intersections.forEach((i) => world.add(buildIntersection(m, i)));
    m.buildings.forEach((b) => world.add(buildBuilding(m, b)));
    m.loadingDocks.forEach((d) => world.add(buildDock(m, d)));
    m.sidewalkVaults.forEach((v) => world.add(buildVault(m, v)));
    m.subwayEntrances.forEach((s) => world.add(buildSubway(m, s)));
    m.drainageInlets.forEach((d) => world.add(buildDrain(m, d)));
    m.parkingGarages.forEach((p) => world.add(buildGarage(m, p)));
    m.streetFurniture.forEach((s) => world.add(buildFurniture(m, s)));
  }

  function setLabels(visible) {
    world.traverse((o) => { if (o.userData.isLabel) o.visible = visible; });
  }

  function highlight(sel) {
    for (const g of world.children) {
      const on = sel && g.userData.kind === sel.kind && g.userData.id === sel.id;
      g.traverse((o) => {
        if (!o.isMesh) return;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const mm of ms) {
          if (!mm.emissive) continue;
          if (mm.userData.baseEmissive === undefined) {
            mm.userData.baseEmissive = mm.emissive.getHex();
            mm.userData.baseIntensity = mm.emissiveIntensity;
          }
          if (on) { mm.emissive.setHex(0xffa200); mm.emissiveIntensity = 0.45; }
          else { mm.emissive.setHex(mm.userData.baseEmissive); mm.emissiveIntensity = mm.userData.baseIntensity; }
        }
      });
    }
  }

  const raycaster = new THREE.Raycaster();
  function pick(clientX, clientY) {
    const ndc = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    for (const hit of raycaster.intersectObjects(world.children, true)) {
      let o = hit.object;
      while (o && !o.userData.kind) o = o.parent;
      if (o) return { kind: o.userData.kind, id: o.userData.id };
    }
    return null;
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  function focusPoint(m, sel) {
    if (!sel) return null;
    const g = world.children.find((c) => c.userData.kind === sel.kind && c.userData.id === sel.id);
    if (!g) return null;
    const box = new THREE.Box3().setFromObject(g, true);
    return box.getCenter(new THREE.Vector3());
  }

  return { renderer, scene, camera, render, setLabels, highlight, pick, focusPoint };
}
