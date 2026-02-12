import { CommunitySummary } from './types';

export type CellHourScore = { cellId: string; hour: number; score: number };

type ScoreWeights = { my?: number; community?: number };

const DEFAULT_MY_WEIGHT = 0.3;
const DEFAULT_COMMUNITY_WEIGHT = 0.7;
const DEFAULT_MY_LOW_THRESHOLD = 120;

function parseCellHourKey(key: string): { cellId: string; hour: number } | null {
  const separatorIndex = key.lastIndexOf('|');

  if (separatorIndex < 0) {
    return null;
  }

  const cellId = key.slice(0, separatorIndex);
  const hourRaw = key.slice(separatorIndex + 1);
  const hour = Number(hourRaw);

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return null;
  }

  return { cellId, hour };
}

export function computeHourScores(params: {
  hour: number;
  my: CommunitySummary;
  community: CommunitySummary;
  weights?: ScoreWeights;
}): CellHourScore[] {
  const wMy = params.weights?.my ?? DEFAULT_MY_WEIGHT;
  const wCommunity = params.weights?.community ?? DEFAULT_COMMUNITY_WEIGHT;

  const keys = new Set<string>([
    ...Object.keys(params.my.byCellHour),
    ...Object.keys(params.community.byCellHour),
  ]);

  const results: CellHourScore[] = [];

  for (const key of keys) {
    const parsed = parseCellHourKey(key);

    if (!parsed || parsed.hour !== params.hour) {
      continue;
    }

    const myVal = params.my.byCellHour[key] ?? 0;
    const communityVal = params.community.byCellHour[key] ?? 0;
    const score = wMy * myVal + wCommunity * communityVal;

    results.push({
      cellId: parsed.cellId,
      hour: parsed.hour,
      score,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

export function normalizeScores01(items: CellHourScore[]): CellHourScore[] {
  if (items.length === 0) {
    return [];
  }

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const item of items) {
    if (item.score < min) {
      min = item.score;
    }
    if (item.score > max) {
      max = item.score;
    }
  }

  if (max === min) {
    return items.map(item => ({ ...item, score: 0 }));
  }

  const range = max - min;
  return items.map(item => ({
    ...item,
    score: (item.score - min) / range,
  }));
}

export function recommendCells(params: {
  hour: number;
  my: CommunitySummary;
  community: CommunitySummary;
  topN: number;
  myLowThreshold?: number;
}): CellHourScore[] {
  const lowThreshold = params.myLowThreshold ?? DEFAULT_MY_LOW_THRESHOLD;
  const combined = computeHourScores({
    hour: params.hour,
    my: params.my,
    community: params.community,
  });
  const normalized = normalizeScores01(combined);

  return normalized
    .filter(item => {
      const key = `${item.cellId}|${item.hour}`;
      const myVal = params.my.byCellHour[key] ?? 0;
      return myVal < lowThreshold;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, params.topN);
}
