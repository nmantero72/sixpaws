import type { Encounter, EncounterKind, GpsPoint, Walk, WalkSummary } from "./types";
import { cellId50m } from "./grid50m";

const MAX_ACCURACY_M = 50;
const MAX_JUMP_M = 200;
const MAX_JUMP_DT_SEC = 5;
const MAX_CELL_DT_SEC = 60;
const MAX_PATH_CELLS = 200;
const EARTH_RADIUS_M = 6371000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineMeters(a: GpsPoint, b: GpsPoint): number {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const dLat = lat2 - lat1;
  const dLon = toRadians(b.lon - a.lon);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function pointIsValid(point: GpsPoint): boolean {
  if (point.accM === undefined) {
    return true;
  }

  return point.accM <= MAX_ACCURACY_M;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function classifyEncounter(durationSec: number): EncounterKind {
  if (durationSec >= 60) {
    return "PLAY";
  }

  if (durationSec >= 3) {
    return "GREETING";
  }

  return "NONE";
}

function encounterDurationSec(encounter: Encounter): number {
  if (encounter.durationSec !== undefined) {
    return encounter.durationSec;
  }

  return (encounter.lastSeenAt - encounter.firstSeenAt) / 1000;
}

export function buildWalkSummary(walk: Walk): WalkSummary {
  if (walk.endedAt === undefined) {
    throw new Error("Walk endedAt is required");
  }

  const validPoints = walk.points.filter(pointIsValid);
  let distanceM = 0;

  const secondsByCell = new Map<string, number>();
  const pathCells: string[] = [];

  for (let i = 1; i < validPoints.length; i += 1) {
    const p1 = validPoints[i - 1];
    const p2 = validPoints[i];

    const dtSec = (p2.t - p1.t) / 1000;
    const segmentDistance = haversineMeters(p1, p2);

    const isJump = segmentDistance > MAX_JUMP_M && dtSec < MAX_JUMP_DT_SEC;
    if (isJump) {
      continue;
    }

    distanceM += segmentDistance;

    const clampedDt = clamp(dtSec, 0, MAX_CELL_DT_SEC);
    const cell1 = cellId50m(p1.lat, p1.lon);
    const previousSec = secondsByCell.get(cell1) ?? 0;
    secondsByCell.set(cell1, previousSec + clampedDt);

    if (pathCells.length < MAX_PATH_CELLS) {
      if (pathCells[pathCells.length - 1] !== cell1) {
        pathCells.push(cell1);
      }
    }

    const cell2 = cellId50m(p2.lat, p2.lon);
    if (pathCells.length < MAX_PATH_CELLS) {
      if (pathCells[pathCells.length - 1] !== cell2) {
        pathCells.push(cell2);
      }
    }
  }

  let greetings = 0;
  let plays = 0;

  for (const encounter of walk.encounters) {
    const durationSec = encounterDurationSec(encounter);
    const kind = classifyEncounter(durationSec);

    if (kind === "GREETING") {
      greetings += 1;
    } else if (kind === "PLAY") {
      plays += 1;
    }
  }

  return {
    walkId: walk.id,
    dogId: walk.dogId,
    startedAt: walk.startedAt,
    endedAt: walk.endedAt,
    durationSec: Math.round((walk.endedAt - walk.startedAt) / 1000),
    distanceM,
    encounters: walk.encounters.length,
    greetings,
    plays,
    cells: Array.from(secondsByCell.entries()).map(([cellId, seconds]) => ({
      cellId,
      seconds,
    })),
    pathCells,
  };
}
