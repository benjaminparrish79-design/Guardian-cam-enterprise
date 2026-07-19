export type CameraStatus = 'online' | 'offline' | 'maintenance';
export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Camera {
  id: string;
  user_id: string;
  name: string;
  location: string;
  type: string;
  status: CameraStatus;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  camera_id: string | null;
  camera_name?: string;
  type: string;
  description?: string;
  severity: EventSeverity;
  time: string;
}

// Database response helpers
export type DbResult<T> = { data: T | null; error: any };
