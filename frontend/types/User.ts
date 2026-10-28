export interface User {
  _id: string;
  name: string;
  email: string;
  dateOfBirth?: string;
  sex?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
  /** Weekly walking goal in km (the backend uses 10 until one is set) */
  weeklyGoalKm?: number;
}
