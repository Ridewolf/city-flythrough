/**
 * The renderer: pure drawing over a 2D context. It reads simulation and sky
 * state, holds none of its own (palette aside), and is the only module that
 * touches canvas APIs.
 */
import type { Aircraft, Cloud } from './sky';
import { CLOUD_SHAPES } from './sky';
import type { Agent, Incident, Viewport } from './traffic';
import {
  type Axis,
  type Box,
  blockBox,
  blockKind,
  CELL,
  hash,
  hasRoundabout,
  lightGreen,
  ROUNDABOUT_R,
  roadInfo,
  roadWidth,
} from './world';

export interface Palette {
  bg: string;
  road: string;
  line: string;
  park: string;
  plaza: string;
  island: string;
  buildingLo: number;
  buildingRange: number;
  tree: string[];
  /** `r, g, b` triplet string for cloud gradients. */
  cloud: string;
  /** Base alpha multiplier for clouds (light themes need more opacity). */
  cloudAlpha: number;
  aircraftBody: string;
  aircraftBlade: string;
}

export const PALETTE_DARK: Palette = {
  bg: '#0a0b10',
  road: '#1c1d26',
  line: 'rgba(120,122,140,0.22)',
  park: 'rgb(18, 30, 20)',
  plaza: 'rgb(30, 31, 40)',
  island: 'rgb(20, 30, 22)',
  buildingLo: 24,
  buildingRange: 26,
  tree: ['#2f6b3a', '#357a42', '#2a5f37', '#3b7d4a'],
  cloud: '210, 220, 240',
  cloudAlpha: 0.16,
  aircraftBody: '#cbd5e1',
  aircraftBlade: 'rgba(203,213,225,0.6)',
};

export const PALETTE_LIGHT: Palette = {
  bg: '#e8edf3',
  road: '#c2cbd7',
  line: 'rgba(70,80,100,0.35)',
  park: 'rgb(200, 224, 198)',
  plaza: 'rgb(214, 219, 228)',
  island: 'rgb(198, 222, 196)',
  buildingLo: 196,
  buildingRange: 36,
  tree: ['#4e9c5e', '#57a868', '#46905a', '#5cb070'],
  cloud: '255, 255, 255',
  cloudAlpha: 0.7,
  aircraftBody: '#475569',
  aircraftBlade: 'rgba(71,85,105,0.55)',
};

const PARKED_COLORS = ['#64748b', '#7c6f9c', '#9c6f6f', '#6f9c84', '#9c916f'];

type Ctx = CanvasRenderingContext2D;

/** Rounded rectangle path. */
function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rad, y);
  c.arcTo(x + w, y, x + w, y + h, rad);
  c.arcTo(x + w, y + h, x, y + h, rad);
  c.arcTo(x, y + h, x, y, rad);
  c.arcTo(x, y, x + w, y, rad);
  c.closePath();
}

function drawTree(c: Ctx, pal: Palette, x: number, y: number, r: number, seed: number): void {
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.beginPath();
  c.arc(x + 1, y + 1.5, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = pal.tree[Math.floor(seed * pal.tree.length) % pal.tree.length] ?? '#3a3';
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.06)';
  c.beginPath();
  c.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, Math.PI * 2);
  c.fill();
}

function drawBuildings(c: Ctx, pal: Palette, i: number, j: number, box: Box): void {
  const count = 1 + Math.floor(hash(i, j, 11) * 3);
  for (let n = 0; n < count; n += 1) {
    const h1 = hash(i * 13 + n, j * 17 + n, 12);
    const h2 = hash(i * 7 + n, j * 11 + n, 13);
    const w = box.w * (0.38 + h1 * 0.5);
    const h = box.h * (0.38 + h2 * 0.5);
    const px = box.x + (box.w - w) * hash(i * 5 + n, j * 3 + n, 14);
    const py = box.y + (box.h - h) * hash(i + n, j + n, 15);
    const shade = pal.buildingLo + Math.floor(h1 * pal.buildingRange);
    const angle = (hash(i + n, j - n, 16) - 0.5) * 0.18;
    c.save();
    c.translate(px + w / 2, py + h / 2);
    c.rotate(angle);
    c.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 9})`;
    if (hash(i - n, j + n, 17) > 0.6) {
      rr(c, -w / 2, -h / 2, w * 0.62, h, 2);
      c.fill();
      rr(c, -w / 2, h / 2 - h * 0.55, w, h * 0.55, 2);
      c.fill();
    } else {
      rr(c, -w / 2, -h / 2, w, h, 2.5);
      c.fill();
    }
    c.restore();
  }
}

function drawPark(c: Ctx, pal: Palette, i: number, j: number, box: Box): void {
  c.fillStyle = pal.park;
  rr(c, box.x, box.y, box.w, box.h, 8);
  c.fill();
  const trees = 4 + Math.floor(hash(i, j, 20) * 6);
  for (let n = 0; n < trees; n += 1) {
    const tx = box.x + 8 + hash(i + n, j * 2 + n, 21) * (box.w - 16);
    const ty = box.y + 8 + hash(i * 2 + n, j + n, 22) * (box.h - 16);
    drawTree(c, pal, tx, ty, 4 + hash(i + n, j + n, 23) * 5, hash(i - n, j + n, 24));
  }
}

function drawPlaza(c: Ctx, pal: Palette, i: number, j: number, box: Box): void {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) / 2;
  if (r <= 0) return;
  c.fillStyle = pal.plaza;
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(56, 120, 180, 0.55)';
  c.beginPath();
  c.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
  c.fill();
  for (let n = 0; n < 6; n += 1) {
    const a = (n / 6) * Math.PI * 2 + hash(i, j, 25) * 6;
    drawTree(
      c,
      pal,
      cx + Math.cos(a) * r * 0.7,
      cy + Math.sin(a) * r * 0.7,
      4.5,
      hash(i + n, j, 26),
    );
  }
}

function drawBlock(c: Ctx, pal: Palette, i: number, j: number): void {
  const box = blockBox(i, j);
  if (box.w <= 4 || box.h <= 4) return;
  const kind = blockKind(i, j);
  if (kind === 'park') drawPark(c, pal, i, j, box);
  else if (kind === 'plaza') drawPlaza(c, pal, i, j, box);
  else drawBuildings(c, pal, i, j, box);
}

function drawRoundabout(c: Ctx, pal: Palette, i: number, j: number): void {
  if (!hasRoundabout(i, j)) return;
  const cx = i * CELL;
  const cy = j * CELL;
  c.strokeStyle = pal.road;
  c.lineWidth = 10;
  c.beginPath();
  c.arc(cx, cy, ROUNDABOUT_R, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = pal.island;
  c.beginPath();
  c.arc(cx, cy, ROUNDABOUT_R - 6, 0, Math.PI * 2);
  c.fill();
  drawTree(c, pal, cx, cy, 6, hash(i, j, 31));
}

function drawTrafficLights(c: Ctx, elapsed: number, i: number, j: number): void {
  if (hasRoundabout(i, j)) return;
  const cx = i * CELL;
  const cy = j * CELL;
  const d = Math.max(roadWidth(roadInfo('h', j)), roadWidth(roadInfo('v', i))) / 2 + 3;
  const on = '#22c55e';
  const off = '#ef4444';
  c.fillStyle = lightGreen(elapsed, i, j, 'h') ? on : off;
  c.beginPath();
  c.arc(cx - d, cy - d, 1.6, 0, Math.PI * 2);
  c.arc(cx + d, cy + d, 1.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = lightGreen(elapsed, i, j, 'v') ? on : off;
  c.beginPath();
  c.arc(cx + d, cy - d, 1.6, 0, Math.PI * 2);
  c.arc(cx - d, cy + d, 1.6, 0, Math.PI * 2);
  c.fill();
}

function drawParked(c: Ctx, i: number, j: number): void {
  const topHalf = roadWidth(roadInfo('h', j)) / 2;
  const leftHalf = roadWidth(roadInfo('v', i)) / 2;
  const topN = Math.floor(hash(i, j, 50) * 4);
  for (let n = 0; n < topN; n += 1) {
    const x = i * CELL + 16 + hash(i + n, j, 51) * (CELL - 32);
    c.fillStyle =
      PARKED_COLORS[Math.floor(hash(i + n, j, 52) * PARKED_COLORS.length) % PARKED_COLORS.length] ??
      '#666';
    rr(c, x, j * CELL + topHalf + 1.5, 6.5, 3.2, 1.2);
    c.fill();
  }
  const leftN = Math.floor(hash(i, j, 53) * 4);
  for (let n = 0; n < leftN; n += 1) {
    const y = j * CELL + 16 + hash(i, j + n, 54) * (CELL - 32);
    c.fillStyle =
      PARKED_COLORS[Math.floor(hash(i, j + n, 55) * PARKED_COLORS.length) % PARKED_COLORS.length] ??
      '#666';
    rr(c, i * CELL + leftHalf + 1.5, y, 3.2, 6.5, 1.2);
    c.fill();
  }
}

function agentDrawPos(a: Agent): { px: number; py: number } {
  let px = a.x;
  let py = a.y;
  if (a.mode === 'road') {
    if (a.axis === 'h') py += a.perp;
    else px += a.perp;
  }
  return { px, py };
}

function headingAngle(a: Agent): number {
  if (a.mode === 'ring' || a.mode === 'turn') return a.theta + a.angDir * (Math.PI / 2);
  return a.axis === 'h' ? (a.dir > 0 ? 0 : Math.PI) : a.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
}

function drawArrow(c: Ctx, a: Agent): void {
  const { px, py } = agentDrawPos(a);
  c.save();
  c.translate(px, py);
  c.rotate(headingAngle(a));
  c.fillStyle = a.color;
  c.shadowColor = a.color;
  c.shadowBlur = 9;
  c.beginPath();
  c.moveTo(6.5, 0);
  c.lineTo(-4.5, -4);
  c.lineTo(-2.5, 0);
  c.lineTo(-4.5, 4);
  c.closePath();
  c.fill();
  c.restore();
}

function drawIncidents(c: Ctx, incidents: readonly Incident[]): void {
  for (const inc of incidents) {
    const { px, py } = agentDrawPos(inc.agent);
    c.save();
    c.translate(px, py - 12);
    c.fillStyle = '#f59e0b';
    c.beginPath();
    c.moveTo(0, -4.5);
    c.lineTo(4.5, 3.5);
    c.lineTo(-4.5, 3.5);
    c.closePath();
    c.fill();
    c.fillStyle = '#1f1300';
    c.font = '700 6px ui-sans-serif, system-ui';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('!', 0, 0.5);
    c.restore();
  }
}

function drawClouds(c: Ctx, pal: Palette, clouds: readonly Cloud[]): void {
  for (const cl of clouds) {
    for (const [ox, oy, rf] of CLOUD_SHAPES[cl.shape] ?? []) {
      const bx = cl.x + ox * cl.r;
      const by = cl.y + oy * cl.r;
      const r = cl.r * rf;
      const g = c.createRadialGradient(bx, by, 0, bx, by, r);
      g.addColorStop(0, `rgba(${pal.cloud}, ${cl.alpha * pal.cloudAlpha})`);
      g.addColorStop(1, `rgba(${pal.cloud}, 0)`);
      c.fillStyle = g;
      c.beginPath();
      c.arc(bx, by, r, 0, Math.PI * 2);
      c.fill();
    }
  }
}

function drawAircraft(c: Ctx, pal: Palette, aircraft: Aircraft | null): void {
  if (!aircraft) return;
  const { x, y, vx, kind, rotor } = aircraft;
  const dir = vx >= 0 ? 1 : -1;
  const body = pal.aircraftBody;
  const blade = pal.aircraftBlade;

  // Soft shadow on the city below.
  c.save();
  c.fillStyle = 'rgba(0,0,0,0.15)';
  const shW = kind === 'plane' ? 22 : kind === 'heli' ? 13 : 7;
  c.beginPath();
  c.ellipse(x + 24, y + 46, shW, 5, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();

  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  c.fillStyle = body;

  if (kind === 'plane') {
    rr(c, -24, -3.5, 48, 7, 3.5);
    c.fill();
    c.beginPath(); // nose cone
    c.moveTo(24, -3.5);
    c.quadraticCurveTo(33, 0, 24, 3.5);
    c.closePath();
    c.fill();
    for (const [x1, y1, x2, y2, x3, y3] of [
      [4, -2, -14, -16, -2, -2], // swept wings
      [4, 2, -14, 16, -2, 2],
      [-20, -2, -27, -10, -17, -2], // tail fins
      [-20, 2, -27, 10, -17, 2],
    ] as const) {
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.lineTo(x3, y3);
      c.closePath();
      c.fill();
    }
    c.fillStyle = pal.buildingLo < 100 ? 'rgba(30,41,59,0.75)' : 'rgba(226,232,240,0.95)';
    for (let i = -17; i < 19; i += 4.5) c.fillRect(i, -1, 2, 2);
  } else if (kind === 'heli') {
    rr(c, -9, -5, 21, 10, 4.5); // cabin
    c.fill();
    c.fillRect(-23, -1.5, 15, 3); // tail boom
    c.beginPath(); // tail fin
    c.moveTo(-23, -1.5);
    c.lineTo(-27, -8);
    c.lineTo(-19, -1);
    c.closePath();
    c.fill();
    c.fillRect(-9, 6, 22, 1.6); // skid
    c.beginPath();
    c.arc(2, -6, 1.8, 0, Math.PI * 2);
    c.fill();
    // Main rotor — drawn LAST so it sits on top of the cabin.
    c.save();
    c.translate(2, -6);
    c.rotate(rotor);
    c.strokeStyle = blade;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-24, 0);
    c.lineTo(24, 0);
    c.moveTo(0, -24);
    c.lineTo(0, 24);
    c.stroke();
    c.restore();
  } else {
    // Drone: small X-frame quadcopter with 4 spinning props.
    c.strokeStyle = body;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-7, -7);
    c.lineTo(7, 7);
    c.moveTo(-7, 7);
    c.lineTo(7, -7);
    c.stroke();
    rr(c, -3, -2.5, 6, 5, 1.5);
    c.fill();
    c.strokeStyle = blade;
    c.lineWidth = 1.2;
    for (const [px, py] of [
      [-7, -7],
      [7, -7],
      [-7, 7],
      [7, 7],
    ] as const) {
      c.save();
      c.translate(px, py);
      c.rotate(rotor * 1.7);
      c.beginPath();
      c.moveTo(-4, 0);
      c.lineTo(4, 0);
      c.stroke();
      c.restore();
    }
  }
  c.restore();
}

export interface Scene {
  agents: readonly Agent[];
  incidents: readonly Incident[];
  clouds: readonly Cloud[];
  aircraft: Aircraft | null;
  elapsed: number;
}

/** Draw one full frame (world + traffic + sky) for the given viewport. */
export function renderFrame(c: Ctx, pal: Palette, view: Viewport, scene: Scene): void {
  c.fillStyle = pal.bg;
  c.fillRect(0, 0, view.width, view.height);

  c.save();
  c.translate(-view.left, -view.top);

  const i0 = Math.floor(view.left / CELL) - 1;
  const i1 = Math.floor((view.left + view.width) / CELL) + 1;
  const j0 = Math.floor(view.top / CELL) - 1;
  const j1 = Math.floor((view.top + view.height) / CELL) + 1;

  // Roads (varying widths).
  c.fillStyle = pal.road;
  for (let i = i0; i <= i1; i += 1) {
    const w = roadWidth(roadInfo('v', i));
    c.fillRect(i * CELL - w / 2, view.top - CELL, w, view.height + CELL * 2);
  }
  for (let j = j0; j <= j1; j += 1) {
    const w = roadWidth(roadInfo('h', j));
    c.fillRect(view.left - CELL, j * CELL - w / 2, view.width + CELL * 2, w);
  }

  // Centre lines for two-way roads.
  c.strokeStyle = pal.line;
  c.lineWidth = 1;
  c.setLineDash([9, 9]);
  const axes: Array<[Axis, number, number]> = [
    ['v', i0, i1],
    ['h', j0, j1],
  ];
  for (const [axis, k0, k1] of axes) {
    for (let k = k0; k <= k1; k += 1) {
      if (roadInfo(axis, k).oneWay) continue;
      c.beginPath();
      if (axis === 'v') {
        c.moveTo(k * CELL, view.top - CELL);
        c.lineTo(k * CELL, view.top + view.height + CELL);
      } else {
        c.moveTo(view.left - CELL, k * CELL);
        c.lineTo(view.left + view.width + CELL, k * CELL);
      }
      c.stroke();
    }
  }
  c.setLineDash([]);

  for (let i = i0; i <= i1; i += 1) for (let j = j0; j <= j1; j += 1) drawBlock(c, pal, i, j);
  for (let i = i0; i <= i1; i += 1) for (let j = j0; j <= j1; j += 1) drawRoundabout(c, pal, i, j);
  for (let i = i0; i <= i1; i += 1) for (let j = j0; j <= j1; j += 1) drawParked(c, i, j);
  for (let i = i0; i <= i1; i += 1)
    for (let j = j0; j <= j1; j += 1) drawTrafficLights(c, scene.elapsed, i, j);

  for (const a of scene.agents) drawArrow(c, a);
  drawIncidents(c, scene.incidents);
  // Clouds are world-anchored: drawn inside the camera transform so they pan
  // with the city, then drift on their own.
  drawClouds(c, pal, scene.clouds);

  c.restore();

  // The aircraft flyover stays in screen space (it's passing over the view).
  drawAircraft(c, pal, scene.aircraft);
}
