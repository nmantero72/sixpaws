// domain/types.ts
// Sixpaws MVD — data model (closed)
// Source of truth: MVD_RULES.md

export type UUID = string;

/**
 * NOTE: No backend in MVD. IDs are local. If later you add backend,
 * you can map local UUIDs to server IDs.
 */

export type DogSex = "M" | "F" | "U";

export type Dog = {
  id: UUID;
  name: string;

  // Optional in MVD (do not block onboarding)
  birthYear?: number;
  sex?: DogSex;
  neutered?: boolean;

  // Placeholder for avatar system (MVD just needs a stable seed)
  avatarSeed?: string;

  // Optional beacon binding for pilot (if user uses a beacon)
  beaconId?: string;
};

export type LatLon = {
  lat: number;
  lon: number;
};

export type GpsPoint = LatLon & {
  t: number;      // epoch ms
  accM?: number;  // accuracy meters (optional)
};

export type PeerType = "APP" | "BEACON";

/**
 * peerId rules:
 * - APP: an ephemeral app id (rotating), but we also compute a stable-ish "peerKey"
 *   in the BLE layer if needed to recognize repeats during a walk.
 * - BEACON: beacon_id string (printed/assigned).
 */
export type EncounterKind = "NONE" | "GREETING" | "PLAY";

export type Encounter = {
  id: UUID;
  walkId: UUID;

  peerType: PeerType;
  peerId: string;

  firstSeenAt: number; // epoch ms
  lastSeenAt: number;  // epoch ms

  // optional signal quality metrics
  maxRssi?: number;
  minRssi?: number;
  avgRssi?: number;

  // computed at end of walk
  durationSec?: number;
  kind?: EncounterKind;
};

export type KnownDog = {
  /**
   * In MVD we define "known" by repeated encounters with the same peerId.
   * If APP peerIds rotate, the BLE layer should emit a consistent peerKey
   * for KnownDog (e.g., derived from exchanged profile/seed once available).
   */
  peerKey: string; // stable key used in "known dogs" list

  firstMetAt: number; // epoch ms
  lastMetAt: number;  // epoch ms
  timesMet: number;
};

/**
 * Grid cell id at 50m resolution.
 * Deterministic string, e.g.: "g50:<gx>:<gy>" (see grid50m implementation later).
 */
export type CellId = string; // "g50:..:.."

export type WalkSummary = {
  walkId: UUID;
  dogId: UUID;

  startedAt: number;   // epoch ms
  endedAt: number;     // epoch ms

  durationSec: number;
  distanceM: number;

  encounters: number;
  greetings: number; // encounters with duration >= 3s and < 60s
  plays: number;     // encounters with duration >= 60s

  /**
   * Aggregation for maps:
   * - total seconds spent in each 50m cell
   */
  cells: Array<{
    cellId: CellId;
    seconds: number;
  }>;

  /**
   * OPTIONAL: simplified trajectory as a sequence of visited cells.
   * Constraints (enforced in builder):
   * - length <= 200
   * - no consecutive duplicates
   */
  pathCells?: CellId[];
};

export type Walk = {
  id: UUID;
  dogId: UUID;

  startedAt: number; // epoch ms
  endedAt?: number;  // epoch ms

  /**
   * Raw GPS points are stored locally only.
   * They are NOT exchanged over BLE and NOT uploaded in MVD.
   */
  points: GpsPoint[];

  /**
   * Encounters tracked during the walk (local)
   * classification happens at walk end.
   */
  encounters: Encounter[];

  /**
   * Computed at walk end.
   */
  summary?: WalkSummary;
};

/**
 * CommunitySummary: aggregated "busy-ness" scores by (cellId, hour) over last 30 days.
 * Stored locally and updated by BLE exchange only in MVD.
 *
 * Key format: `${cellId}|${hour}` where hour is 0..23
 */
export type CommunitySummary = {
  updatedAt: number; // epoch ms
  byCellHour: Record<string, number>;
};

/**
 * BLE exchange payload (MVD).
 * Exchanged only when both devices are in "Salir".
 */
export type BleExchangePacketV1 = {
  ver: 1;
  sentAt: number; // epoch ms
  from: {
    type: PeerType;
    id: string; // app eph id or beacon id
  };

  // last 10 walk summaries (most recent first)
  lastWalks: WalkSummary[];

  /**
   * Sparse community summary:
   * transmit as array to reduce payload size, then merge into byCellHour.
   */
  community: Array<{
    cellId: CellId;
    hour: number;   // 0..23
    score: number;  // float
  }>;
};
