export interface Walk {
  id: string;
  dogId: string;
  startTime: number;
  endTime?: number;
  distanceMeters?: number;
}
