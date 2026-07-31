/**
 * The traffic micro-simulation: cars keep to lanes, follow the car ahead,
 * stop at red lights, yield into roundabouts, plan lane-aware turns, and —
 * rarely — break down and block a lane. All randomness flows through an
 * injected RNG, so the whole simulation is deterministic under test.
 */
import {
  type Axis,
  CELL,
  hash,
  hasRoundabout,
  LANE_W,
  laneOffset,
  lightGreen,
  ROUNDABOUT_R,
  roadInfo,
  roadLimit,
  roadWidth,
} from './world';

export const TURN_PROB = 0.3;
export const RING_EXIT_PROB = 0.45;
export const MIN_GAP = 13;
export const LANE_CHANGE_RATE = 0.5;
export const ACCEL = 55;
export const DECEL = 150;
export const BRAKE_DIST = 72;
export const RING_YIELD = 0.7;
export const LANE_CHANGE_MIN_SPEED = 20;
export const PLAN_AHEAD = 46;
export const INCIDENT_RATE = 0.012;
export const INCIDENT_DURATION = 7;

export const ARROW_COLORS = ['#34d399', '#38bdf8', '#fbbf24', '#a78bfa', '#fb7185', '#f472b6'];

export interface Agent {
  x: number;
  y: number;
  axis: Axis;
  dir: 1 | -1;
  lane: number;
  /** Eased perpendicular offset from the road centreline. */
  perp: number;
  /** Current speed (px/s). */
  speed: number;
  /** Personal multiplier on the road's limit. */
  speedFactor: number;
  color: string;
  mode: 'road' | 'ring' | 'turn';
  cx: number;
  cy: number;
  entryAngle: number;
  angDir: 1 | -1;
  s: number;
  lastK: number;
  theta: number;
  // Turn state (smooth lane-aware arc at a corner).
  arcLen: number;
  arcR: number;
  turnAxis: Axis;
  turnDir: 1 | -1;
  turnFixed: number;
  turnLane: number;
  turnPerp: number;
  pendingTurn: boolean;
  psx: number;
  psy: number;
  stalled: boolean;
}

export interface Incident {
  agent: Agent;
  t: number;
}

export interface Viewport {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface TrafficSimOptions {
  /** Injectable RNG; default `Math.random`. */
  rng?: () => number;
  /** Disable rare incidents (the minimal backdrop variant). */
  incidents?: boolean;
}

export class TrafficSim {
  readonly agents: Agent[] = [];
  incidents: Incident[] = [];
  elapsed = 0;

  private readonly rng: () => number;
  private readonly incidentsEnabled: boolean;
  private incidentTimer = 0;

  constructor(options: TrafficSimOptions = {}) {
    this.rng = options.rng ?? Math.random;
    this.incidentsEnabled = options.incidents ?? true;
  }

  /** Perpendicular offset for an agent's current lane. */
  targetPerp(a: Agent): number {
    const line = a.axis === 'h' ? Math.round(a.y / CELL) : Math.round(a.x / CELL);
    const info = roadInfo(a.axis, line);
    if (info.oneWay) return 0;
    const sign = a.axis === 'h' ? (a.dir > 0 ? 1 : -1) : a.dir > 0 ? -1 : 1;
    return sign * (a.lane + 0.5) * LANE_W;
  }

  /** Spawn a car on a random road inside (or crossing) the viewport. */
  makeAgent(view: Viewport): Agent {
    const rng = this.rng;
    const axis: Axis = rng() < 0.5 ? 'h' : 'v';
    const line =
      axis === 'h'
        ? Math.round((view.top + rng() * view.height) / CELL)
        : Math.round((view.left + rng() * view.width) / CELL);
    const info = roadInfo(axis, line);
    const dir: 1 | -1 = info.oneWay ? info.fixedDir : rng() < 0.5 ? 1 : -1;
    const lane = Math.floor(rng() * info.lanes);
    const speedFactor = 0.85 + rng() * 0.3;
    const a: Agent = {
      axis,
      dir,
      lane,
      perp: 0,
      speed: roadLimit(info) * speedFactor,
      speedFactor,
      color: ARROW_COLORS[Math.floor(rng() * ARROW_COLORS.length) % ARROW_COLORS.length] ?? '#fff',
      mode: 'road',
      cx: 0,
      cy: 0,
      entryAngle: 0,
      angDir: 1,
      s: 0,
      lastK: 0,
      theta: 0,
      arcLen: 0,
      arcR: 20,
      turnAxis: 'h',
      turnDir: 1,
      turnFixed: 0,
      turnLane: 0,
      turnPerp: 0,
      pendingTurn: false,
      psx: 0,
      psy: 0,
      stalled: false,
      x: axis === 'h' ? view.left + rng() * view.width : line * CELL,
      y: axis === 'h' ? line * CELL : view.top + rng() * view.height,
    };
    a.perp = this.targetPerp(a);
    return a;
  }

  /** One simulation step: agents, car-following, incidents. */
  step(dt: number, view: Viewport): void {
    this.elapsed += dt;
    for (const a of this.agents) this.updateAgent(a, dt);
    this.resolveCollisions();
    this.updateEvents(dt, view);
  }

  /** Recycle agents that left the viewport (returns the recycled count). */
  recycleOffscreen(view: Viewport, margin = CELL): number {
    let recycled = 0;
    for (const a of this.agents) {
      if (
        a.x < view.left - margin ||
        a.x > view.left + view.width + margin ||
        a.y < view.top - margin ||
        a.y > view.top + view.height + margin
      ) {
        if (a.stalled) {
          this.incidents = this.incidents.filter((inc) => inc.agent !== a);
        }
        Object.assign(a, this.makeAgent(view));
        recycled += 1;
      }
    }
    return recycled;
  }

  /** Shed a quarter of the cars (runtime perf guard), keeping ≥ `minAgents`. */
  shed(minAgents: number): void {
    if (this.agents.length <= minAgents) return;
    const removed = this.agents.splice(Math.max(minAgents, Math.floor(this.agents.length * 0.75)));
    this.incidents = this.incidents.filter((inc) => !removed.includes(inc.agent));
  }

  // ── Internals (ported verbatim from the production backdrop) ─────────────

  private updateAgent(a: Agent, dt: number): void {
    if (a.mode === 'ring') this.updateRing(a, dt);
    else if (a.mode === 'turn') this.updateTurn(a, dt);
    else this.updateRoad(a, dt);
  }

  private enterRing(a: Agent, ci: number, cj: number, entryAngle: number): void {
    a.mode = 'ring';
    a.cx = ci * CELL;
    a.cy = cj * CELL;
    a.entryAngle = entryAngle;
    a.angDir = hash(ci, cj, 32) < 0.5 ? 1 : -1;
    a.s = 0;
    a.lastK = 0;
    a.theta = entryAngle;
    a.x = a.cx + ROUNDABOUT_R * Math.cos(entryAngle);
    a.y = a.cy + ROUNDABOUT_R * Math.sin(entryAngle);
  }

  private exitRing(a: Agent, k: number): void {
    const ang = a.entryAngle + a.angDir * k * (Math.PI / 2);
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);
    a.mode = 'road';
    if (Math.abs(cosA) > Math.abs(sinA)) {
      a.axis = 'h';
      a.dir = cosA > 0 ? 1 : -1;
      a.y = a.cy;
      a.x = a.cx + a.dir * ROUNDABOUT_R;
    } else {
      a.axis = 'v';
      a.dir = sinA > 0 ? 1 : -1;
      a.x = a.cx;
      a.y = a.cy + a.dir * ROUNDABOUT_R;
    }
    const line = a.axis === 'h' ? Math.round(a.y / CELL) : Math.round(a.x / CELL);
    a.lane = 0;
    if (roadInfo(a.axis, line).oneWay) a.dir = roadInfo(a.axis, line).fixedDir;
    a.perp = this.targetPerp(a);
  }

  private updateRing(a: Agent, dt: number): void {
    a.s += (a.speed / ROUNDABOUT_R) * dt;
    const k = Math.floor(a.s / (Math.PI / 2));
    if (k > a.lastK) {
      a.lastK = k;
      if (k >= 3 || this.rng() < RING_EXIT_PROB) {
        this.exitRing(a, k);
        return;
      }
    }
    a.theta = a.entryAngle + a.angDir * a.s;
    a.x = a.cx + ROUNDABOUT_R * Math.cos(a.theta);
    a.y = a.cy + ROUNDABOUT_R * Math.sin(a.theta);
  }

  /** Is the adjacent lane clear enough to merge into? */
  laneClear(a: Agent, line: number, nl: number): boolean {
    const horiz = a.axis === 'h';
    const u = horiz ? a.x : a.y;
    for (const o of this.agents) {
      if (o === a || o.mode !== 'road' || o.axis !== a.axis || o.dir !== a.dir || o.lane !== nl) {
        continue;
      }
      const ol = horiz ? Math.round(o.y / CELL) : Math.round(o.x / CELL);
      if (ol !== line) continue;
      if (Math.abs((horiz ? o.x : o.y) - u) < MIN_GAP * 1.3) return false;
    }
    return true;
  }

  /**
   * Plan a lane-aware arc turn connecting the incoming lane to the chosen
   * outgoing lane (tangent to both), so the car never swings onto the
   * oncoming side. Tight radius for right turns, cross-road-sized for left.
   */
  planTurn(a: Agent, nx: number, ny: number, newAxis: Axis): void {
    const newLineIdx = (newAxis === 'h' ? ny : nx) / CELL;
    const info = roadInfo(newAxis, newLineIdx);
    const newDir: 1 | -1 = info.oneWay ? info.fixedDir : this.rng() < 0.5 ? 1 : -1;
    const newLane = Math.floor(this.rng() * info.lanes);
    const perpOut = laneOffset(newAxis, newDir, newLane, info);
    const hin = a.axis === 'h' ? [a.dir, 0] : [0, a.dir];
    const hout = newAxis === 'h' ? [newDir, 0] : [0, newDir];

    // Intersection of the incoming and outgoing lane centrelines.
    const px = a.axis === 'h' ? nx + perpOut : nx + a.perp;
    const py = a.axis === 'h' ? ny + a.perp : ny + perpOut;

    const cross = (hin[0] ?? 0) * (hout[1] ?? 0) - (hin[1] ?? 0) * (hout[0] ?? 0);
    const crossInfo = roadInfo(a.axis === 'h' ? 'v' : 'h', a.axis === 'h' ? nx / CELL : ny / CELL);
    const R =
      cross > 0
        ? Math.max(8, LANE_W * 1.3)
        : Math.min(40, roadWidth(crossInfo) / 2 + LANE_W * (newLane + 1.5));

    const sx = px - (hin[0] ?? 0) * R;
    const sy = py - (hin[1] ?? 0) * R;
    const ex = px + (hout[0] ?? 0) * R;
    const ey = py + (hout[1] ?? 0) * R;
    const cx = px - (hin[0] ?? 0) * R + (hout[0] ?? 0) * R;
    const cy = py - (hin[1] ?? 0) * R + (hout[1] ?? 0) * R;
    const sTheta = Math.atan2(sy - cy, sx - cx);
    const eTheta = Math.atan2(ey - cy, ex - cx);
    const d = Math.atan2(Math.sin(eTheta - sTheta), Math.cos(eTheta - sTheta));

    a.pendingTurn = true;
    a.psx = sx;
    a.psy = sy;
    a.cx = cx;
    a.cy = cy;
    a.arcR = R;
    a.entryAngle = sTheta;
    a.angDir = d >= 0 ? 1 : -1;
    a.arcLen = Math.abs(d);
    a.turnAxis = newAxis;
    a.turnDir = newDir;
    a.turnLane = newLane;
    a.turnPerp = perpOut;
    a.turnFixed = newAxis === 'h' ? ny : nx;
  }

  private updateTurn(a: Agent, dt: number): void {
    a.s += (a.speed / a.arcR) * dt;
    if (a.s >= a.arcLen) {
      a.mode = 'road';
      a.axis = a.turnAxis;
      a.dir = a.turnDir;
      a.lane = a.turnLane;
      a.perp = a.turnPerp;
      const endTheta = a.entryAngle + a.angDir * a.arcLen;
      if (a.axis === 'h') {
        a.y = a.turnFixed;
        a.x = a.cx + a.arcR * Math.cos(endTheta);
      } else {
        a.x = a.turnFixed;
        a.y = a.cy + a.arcR * Math.sin(endTheta);
      }
      return;
    }
    a.theta = a.entryAngle + a.angDir * a.s;
    a.x = a.cx + a.arcR * Math.cos(a.theta);
    a.y = a.cy + a.arcR * Math.sin(a.theta);
  }

  /** Any car circulating the ring near where this entrant would join? */
  ringBusyNear(ci: number, cj: number, entry: number): boolean {
    const cx = ci * CELL;
    const cy = cj * CELL;
    for (const o of this.agents) {
      if (o.mode !== 'ring' || o.cx !== cx || o.cy !== cy) continue;
      const d = Math.atan2(Math.sin(o.theta - entry), Math.cos(o.theta - entry));
      if (Math.abs(d) < RING_YIELD) return true;
    }
    return false;
  }

  private updateRoad(a: Agent, dt: number): void {
    const horiz = a.axis === 'h';
    const before = horiz ? a.x : a.y;
    const line = horiz ? Math.round(a.y / CELL) : Math.round(a.x / CELL);
    const node = (a.dir > 0 ? Math.floor(before / CELL) + 1 : Math.ceil(before / CELL) - 1) * CELL;
    const ci = horiz ? node / CELL : line;
    const cj = horiz ? line : node / CELL;
    const info = roadInfo(a.axis, line);
    const limit = roadLimit(info) * a.speedFactor;
    const roundabout = hasRoundabout(ci, cj);

    const crossInfo = roadInfo(horiz ? 'v' : 'h', horiz ? ci : cj);
    const stopHalf = roadWidth(crossInfo) / 2 + 4;
    const stop = node - a.dir * stopHalf;
    const canGo = lightGreen(this.elapsed, ci, cj, a.axis);

    // Speed: limit, smooth braking for a red/blocked junction, ring yield.
    let target = a.stalled ? 0 : limit;
    if (!roundabout && !canGo) {
      const d = (stop - before) * a.dir;
      if (d >= 0 && d < BRAKE_DIST) target = Math.min(target, (d / BRAKE_DIST) * limit);
    }
    const entry = horiz ? (a.dir > 0 ? Math.PI : 0) : a.dir > 0 ? (3 * Math.PI) / 2 : Math.PI / 2;
    if (roundabout && this.ringBusyNear(ci, cj, entry)) {
      const d = (node - a.dir * ROUNDABOUT_R - before) * a.dir;
      if (d >= 0 && d < BRAKE_DIST) target = Math.min(target, (d / BRAKE_DIST) * limit);
    }
    const ds = target - a.speed;
    a.speed += Math.max(-DECEL * dt, Math.min(ACCEL * dt, ds));
    if (a.speed < 0) a.speed = 0;

    const move = a.speed * dt;
    if (horiz) a.x += a.dir * move;
    else a.y += a.dir * move;
    const after = horiz ? a.x : a.y;

    // Committed to a turn: coast straight until the arc start, then begin it.
    if (a.pendingTurn) {
      if (!canGo) {
        a.pendingTurn = false; // light changed — abort, brake instead
      } else {
        const smov = horiz ? a.psx : a.psy;
        if ((a.dir > 0 && after >= smov) || (a.dir < 0 && after <= smov)) {
          a.mode = 'turn';
          a.x = a.psx;
          a.y = a.psy;
          a.s = 0;
          a.theta = a.entryAngle;
          a.pendingTurn = false;
        }
        return;
      }
    }

    // Lane change — only while moving (no hopping lanes at a red light).
    if (
      !info.oneWay &&
      info.lanes > 1 &&
      a.speed > LANE_CHANGE_MIN_SPEED &&
      this.rng() < LANE_CHANGE_RATE * dt
    ) {
      const nl = a.lane + (this.rng() < 0.5 ? 1 : -1);
      if (nl >= 0 && nl < info.lanes && this.laneClear(a, line, nl)) a.lane = nl;
    }
    a.perp += (this.targetPerp(a) - a.perp) * Math.min(1, dt * 6);

    // Roundabout: enter at the boundary, yielding to circulating traffic.
    if (roundabout) {
      const b = node - a.dir * ROUNDABOUT_R;
      if ((a.dir > 0 && before < b && after >= b) || (a.dir < 0 && before > b && after <= b)) {
        if (this.ringBusyNear(ci, cj, entry)) {
          if (horiz) a.x = b;
          else a.y = b;
          a.speed = 0;
        } else {
          this.enterRing(a, ci, cj, entry);
        }
      }
      return;
    }

    // Hard stop at the line (backstop) when blocked.
    if (!canGo) {
      if (
        (a.dir > 0 && before <= stop && after > stop) ||
        (a.dir < 0 && before >= stop && after < stop)
      ) {
        if (horiz) a.x = stop;
        else a.y = stop;
        a.speed = 0;
        return;
      }
    }

    // Commit to a turn ahead of the junction (only when clear to go).
    if (canGo) {
      const ts = node - a.dir * PLAN_AHEAD;
      if ((a.dir > 0 && before < ts && after >= ts) || (a.dir < 0 && before > ts && after <= ts)) {
        if (this.rng() < TURN_PROB) {
          const nx = horiz ? node : line * CELL;
          const ny = horiz ? line * CELL : node;
          this.planTurn(a, nx, ny, horiz ? 'v' : 'h');
        }
      }
    }
  }

  /** Same-lane car following — cars never overlap, queues move together. */
  resolveCollisions(): void {
    const lanes = new Map<string, Agent[]>();
    for (const a of this.agents) {
      if (a.mode !== 'road') continue;
      const fixed = a.axis === 'h' ? Math.round(a.y) : Math.round(a.x);
      const key = `${a.axis}:${fixed}:${a.dir}:${a.lane}`;
      const list = lanes.get(key);
      if (list) list.push(a);
      else lanes.set(key, [a]);
    }
    for (const group of lanes.values()) {
      const first = group[0];
      if (group.length < 2 || !first) continue;
      const horiz = first.axis === 'h';
      const dir = first.dir;
      const u = (a: Agent): number => (horiz ? a.x : a.y);
      group.sort((p, q) => (dir > 0 ? u(q) - u(p) : u(p) - u(q)));
      for (let n = 1; n < group.length; n += 1) {
        const lead = group[n - 1];
        const f = group[n];
        if (!lead || !f) continue;
        const fu0 = u(f);
        let fu = fu0;
        if (dir > 0) fu = Math.min(fu, u(lead) - MIN_GAP);
        else fu = Math.max(fu, u(lead) + MIN_GAP);
        if (fu !== fu0) {
          // Clamped behind the leader → match its pace (queue moves together).
          f.speed = Math.min(f.speed, lead.speed);
          if (horiz) f.x = fu;
          else f.y = fu;
        }
      }
    }
  }

  /** Rare incidents: a car stalls in-lane for a few seconds, others queue. */
  private updateEvents(dt: number, view: Viewport): void {
    if (!this.incidentsEnabled) return;
    this.incidents = this.incidents.filter((inc) => {
      inc.t += dt;
      if (inc.t >= INCIDENT_DURATION) {
        inc.agent.stalled = false;
        return false;
      }
      return true;
    });

    this.incidentTimer -= dt;
    if (this.incidentTimer <= 0) {
      this.incidentTimer = 1;
      if (this.rng() < INCIDENT_RATE && this.incidents.length < 2) {
        const inView = this.agents.filter(
          (a) =>
            a.mode === 'road' &&
            !a.stalled &&
            a.x > view.left + 60 &&
            a.x < view.left + view.width - 60 &&
            a.y > view.top + 60 &&
            a.y < view.top + view.height - 60,
        );
        const a = inView[Math.floor(this.rng() * inView.length)];
        if (a) {
          a.stalled = true;
          a.speed = 0;
          this.incidents.push({ agent: a, t: 0 });
        }
      }
    }
  }
}
