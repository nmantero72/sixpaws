import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dog } from '../domain/Dog';
import type { CommunitySummary, WalkSummary } from '../domain/types';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const KEYS = {
  dog: 'sixpaws.dog.v1',
  walkSummaries: 'sp:walkSummaries:v1',
  communitySummary: 'sp:communitySummary:v1',
} as const;

export async function getDog(): Promise<Dog | null> {
  const raw = await AsyncStorage.getItem(KEYS.dog);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Dog;
  } catch {
    return null;
  }
}

export async function setDog(dog: Dog): Promise<void> {
  await AsyncStorage.setItem(KEYS.dog, JSON.stringify(dog));
}

export async function clearDog(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.dog);
}

export async function getWalkSummaries(): Promise<WalkSummary[]> {
  const raw = await AsyncStorage.getItem(KEYS.walkSummaries);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as WalkSummary[];
  } catch {
    return [];
  }
}

export async function setWalkSummaries(items: WalkSummary[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.walkSummaries, JSON.stringify(items));
}

export async function appendWalkSummary(item: WalkSummary): Promise<void> {
  const currentItems = await getWalkSummaries();
  const withItem = [...currentItems, item];
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  const filteredItems = withItem.filter((summary) => {
    const timestamp = summary.endedAt ?? summary.startedAt;
    return timestamp >= cutoff;
  });

  await setWalkSummaries(filteredItems);
}

export async function getCommunitySummary(): Promise<CommunitySummary | null> {
  const raw = await AsyncStorage.getItem(KEYS.communitySummary);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CommunitySummary;
  } catch {
    return null;
  }
}

export async function setCommunitySummary(summary: CommunitySummary): Promise<void> {
  await AsyncStorage.setItem(KEYS.communitySummary, JSON.stringify(summary));
}
