import { createBrowserClient } from '@supabase/ssr';
import type { Camera, Event, DbResult } from '@/types/guardiancam';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured(): boolean {
  return (
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    !supabaseUrl.includes('your-supabase-project') &&
    supabaseAnonKey !== 'your-anon-key'
  );
}

// Lazy initialization helper to prevent eager crash if env vars are empty.
//
// Uses createBrowserClient from @supabase/ssr (not the plain
// @supabase/supabase-js client). This is what makes the session available
// to the server: it syncs the session into cookies that the server-side
// client (src/lib/supabase-server.ts) can read and verify. The plain
// supabase-js client only writes to localStorage, which the server can
// never see — that mismatch was the reason a real login could never
// establish an authenticated server session before.
let _supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseInstance() {
  if (!_supabaseInstance) {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    _supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseInstance;
}

// Export a proxy that only initializes Supabase on active property access
export const supabase = new Proxy({} as any, {
  get(target, prop, receiver) {
    const instance = getSupabaseInstance();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

// Backwards compatibility for the existing codebase
export function getSupabase() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return supabase;
}

export async function getCurrentUser() {
  try {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// Cameras
export const camerasService = {
  async getUserCameras(): Promise<DbResult<Camera[]>> {
    const { data, error } = await supabase
      .from('cameras')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createCamera(camera: Omit<Camera, 'id' | 'user_id' | 'last_seen' | 'created_at' | 'updated_at'>): Promise<DbResult<Camera>> {
    const { data, error } = await supabase
      .from('cameras')
      .insert(camera)
      .select()
      .single();
    return { data, error };
  },

  async updateCamera(id: string, updates: Partial<Camera>) {
    const { data, error } = await supabase
      .from('cameras')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};

// Events + Realtime
export const eventsService = {
  async createEvent(event: Omit<Event, 'id' | 'user_id' | 'time'>): Promise<DbResult<Event>> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();
    return { data, error };
  },

  subscribeToCameraEvents(cameraId: string, callback: (payload: any) => void) {
    const channel = supabase.channel(`camera-${cameraId}`);
    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'events', 
        filter: `camera_id=eq.${cameraId}` 
      }, callback)
      .subscribe();
    return channel;
  },
};

/**
 * Uploads video/image camera footage to the Supabase Storage bucket 'camera-footage' under a camera-specific directory.
 * @param file The file object (video/image) to upload.
 * @param cameraId The ID of the camera the footage is originating from.
 * @returns The path of the uploaded file on success, or undefined on failure.
 */
export async function uploadCameraFootage(file: File, cameraId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${cameraId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('camera-footage')
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error('Error uploading camera footage:', error);
  }
  return data?.path;
}

