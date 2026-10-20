/** The backend's response envelope: `{ success, data }`, plus a message or count on some endpoints */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}
