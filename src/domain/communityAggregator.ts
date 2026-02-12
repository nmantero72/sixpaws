import { CommunitySummary, WalkSummary } from './types';

const HOUR_MIN = 0;
const HOUR_MAX = 23;
const THIRTY_DAYS_MS = 30 * 24 * 3600 * 1000;

function isValidHour(hour: number): boolean {
  return Number.isInteger(hour) && hour >= HOUR_MIN && hour <= HOUR_MAX;
}

function isFiniteScore(score: number): boolean {
  return Number.isFinite(score);
}

export function mergeCommunitySparse(
  base: CommunitySummary,
  incoming: Array<{ cellId: string; hour: number; score: number }>,
  nowMs: number,
): CommunitySummary {
  const byCellHour: Record<string, number> = { ...base.byCellHour };

  for (const item of incoming) {
    if (!isValidHour(item.hour) || !isFiniteScore(item.score)) {
      continue;
    }

    const key = `${item.cellId}|${item.hour}`;
    const current = byCellHour[key] ?? 0;
    byCellHour[key] = current + item.score;
  }

  return {
    updatedAt: nowMs,
    byCellHour,
  };
}

export function buildMyHistory30d(
  walks: WalkSummary[],
  nowMs: number,
): CommunitySummary {
  const windowStart = nowMs - THIRTY_DAYS_MS;
  const byCellHour: Record<string, number> = {};

  for (const walk of walks) {
    if (walk.startedAt < windowStart) {
      continue;
    }

    const hourLocal = new Date(walk.startedAt).getHours();

    if (!isValidHour(hourLocal)) {
      continue;
    }

    for (const cell of walk.cells) {
      const key = `${cell.cellId}|${hourLocal}`;
      const current = byCellHour[key] ?? 0;
      byCellHour[key] = current + cell.seconds;
    }
  }

  return {
    updatedAt: nowMs,
    byCellHour,
  };
}
