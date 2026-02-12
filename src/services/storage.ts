import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dog } from '../domain/Dog';

const KEYS = {
  dog: 'sixpaws.dog.v1',
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WalkSummary, CommunitySummary } from "../domain/types";

const WALK_SUMMARIES_KEY = "sp:walkSummaries:v1";
const COMMUNITY_SUMMARY_KEY = "sp:communitySummary:v1";

export async function getWalkSummaries(): Promise<WalkSummary[]> {
  const raw = await AsyncStorage.getItem(WALK_SUMMARIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WalkSummary[];
  } catch {
    return [];
  }
}

export async function getCommunitySummary(): Promise<CommunitySummary | null> {
  const raw = await AsyncStorage.getItem(COMMUNITY_SUMMARY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CommunitySummary;
  } catch {
    return null;
  }
}

