import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { Dog as DomainDog } from '../domain/Dog';
import type { CommunitySummary, WalkSummary } from '../domain/types';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const KEYS = {
  dogs: 'sixpaws.dogs.v1',
  legacyDog: 'sixpaws.dog.v1',
  walkSummaries: 'sp:walkSummaries:v1',
  communitySummary: 'sp:communitySummary:v1',
} as const;

export type Dog = {
  id: string;
  name: string;
  createdAt: string;
};

export type DogsStateV1 = {
  version: 1;
  dogs: Dog[];
  selectedDogId: string | null;
  updatedAt: string;
};

function getNowISO(): string {
  return new Date().toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseJson(raw: string | null): unknown | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function toSafeIsoString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return fallback;
  }

  return new Date(timestamp).toISOString();
}

function toSanitizedDog(rawDog: unknown, fallbackCreatedAt: string): Dog | null {
  if (!isRecord(rawDog) || typeof rawDog.id !== 'string') {
    return null;
  }

  const id = rawDog.id.trim();
  if (!id) {
    return null;
  }

  const name = typeof rawDog.name === 'string' && rawDog.name.trim() ? rawDog.name.trim() : 'Mi perro';
  const createdAt = toSafeIsoString(rawDog.createdAt, fallbackCreatedAt);

  return {
    id,
    name,
    createdAt,
  };
}

function createDefaultDogsState(): DogsStateV1 {
  return {
    version: 1,
    dogs: [],
    selectedDogId: null,
    updatedAt: getNowISO(),
  };
}

export function sanitizeDogsState(state: unknown): DogsStateV1 {
  const nowISO = getNowISO();

  if (!isRecord(state)) {
    return createDefaultDogsState();
  }

  const rawDogs = Array.isArray(state.dogs) ? state.dogs : [];
  const seenIds = new Set<string>();
  const dogs: Dog[] = [];

  for (const rawDog of rawDogs) {
    const sanitizedDog = toSanitizedDog(rawDog, nowISO);
    if (!sanitizedDog || seenIds.has(sanitizedDog.id)) {
      continue;
    }

    seenIds.add(sanitizedDog.id);
    dogs.push(sanitizedDog);
  }

  let selectedDogId = typeof state.selectedDogId === 'string' ? state.selectedDogId : null;
  if (!selectedDogId || !seenIds.has(selectedDogId)) {
    selectedDogId = null;
  }

  if (dogs.length === 0) {
    selectedDogId = null;
  }

  return {
    version: 1,
    dogs,
    selectedDogId,
    updatedAt: toSafeIsoString(state.updatedAt, nowISO),
  };
}

async function persistDogsState(state: DogsStateV1): Promise<DogsStateV1> {
  const stateWithUpdatedAt: DogsStateV1 = {
    ...state,
    updatedAt: getNowISO(),
  };

  const sanitized = sanitizeDogsState(stateWithUpdatedAt);
  await AsyncStorage.setItem(KEYS.dogs, JSON.stringify(sanitized));
  return sanitized;
}

function toDomainDog(dog: Dog): DomainDog {
  return {
    id: dog.id,
    userId: 'user_local_1',
    name: dog.name,
  };
}

export async function getDogsState(): Promise<DogsStateV1> {
  const parsedDogsState = parseJson(await AsyncStorage.getItem(KEYS.dogs));
  if (parsedDogsState !== null) {
    return sanitizeDogsState(parsedDogsState);
  }

  const parsedLegacyDog = parseJson(await AsyncStorage.getItem(KEYS.legacyDog));
  if (parsedLegacyDog !== null) {
    const nowISO = getNowISO();
    const migratedDog = toSanitizedDog(parsedLegacyDog, nowISO);
    if (migratedDog) {
      return persistDogsState({
        version: 1,
        dogs: [migratedDog],
        selectedDogId: migratedDog.id,
        updatedAt: nowISO,
      });
    }
  }

  return createDefaultDogsState();
}

export async function getDogs(): Promise<Dog[]> {
  const state = await getDogsState();
  return state.dogs;
}

export async function getSelectedDogId(): Promise<string | null> {
  const state = await getDogsState();
  return state.selectedDogId;
}

export async function getSelectedDog(): Promise<Dog | null> {
  const state = await getDogsState();
  if (!state.selectedDogId) {
    return null;
  }

  return state.dogs.find((dog) => dog.id === state.selectedDogId) ?? null;
}

export async function addDog(input: { name: string }): Promise<Dog> {
  const state = await getDogsState();
  const trimmedName = input.name.trim() || 'Mi perro';

  const newDog: Dog = {
    id: uuidv4(),
    name: trimmedName,
    createdAt: getNowISO(),
  };

  const nextState: DogsStateV1 = {
    ...state,
    dogs: [...state.dogs, newDog],
    selectedDogId: state.dogs.length === 0 ? newDog.id : state.selectedDogId,
  };

  const persistedState = await persistDogsState(nextState);
  return persistedState.dogs.find((dog) => dog.id === newDog.id) ?? newDog;
}

export async function updateDog(dog: Dog): Promise<void> {
  const state = await getDogsState();
  const existingIndex = state.dogs.findIndex((candidate) => candidate.id === dog.id);
  if (existingIndex < 0) {
    return;
  }

  const nextDogs = [...state.dogs];
  nextDogs[existingIndex] = dog;

  await persistDogsState({
    ...state,
    dogs: nextDogs,
  });
}

export async function deleteDog(id: string): Promise<void> {
  const state = await getDogsState();
  if (!state.dogs.some((dog) => dog.id === id)) {
    return;
  }

  const dogs = state.dogs.filter((dog) => dog.id !== id);
  const selectedDogId =
    state.selectedDogId === id
      ? (dogs[0]?.id ?? null)
      : (state.selectedDogId && dogs.some((dog) => dog.id === state.selectedDogId) ? state.selectedDogId : null);

  await persistDogsState({
    ...state,
    dogs,
    selectedDogId,
  });
}

export async function setSelectedDogId(id: string | null): Promise<void> {
  const state = await getDogsState();
  const selectedDogId = id && state.dogs.some((dog) => dog.id === id) ? id : null;

  await persistDogsState({
    ...state,
    selectedDogId,
  });
}

export async function resetAllLocalData(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.dogs,
    KEYS.legacyDog,
    KEYS.walkSummaries,
    KEYS.communitySummary,
  ]);
}

export async function getDog(): Promise<DomainDog | null> {
  const selectedDog = await getSelectedDog();
  return selectedDog ? toDomainDog(selectedDog) : null;
}

export async function setDog(dog: DomainDog): Promise<void> {
  await persistDogsState({
    version: 1,
    dogs: [
      {
        id: dog.id,
        name: dog.name,
        createdAt: getNowISO(),
      },
    ],
    selectedDogId: dog.id,
    updatedAt: getNowISO(),
  });

  await AsyncStorage.setItem(KEYS.legacyDog, JSON.stringify(dog));
}

export async function clearDog(): Promise<void> {
  await persistDogsState(createDefaultDogsState());
  await AsyncStorage.removeItem(KEYS.legacyDog);
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
