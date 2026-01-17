/**
 * Supabase Client Configuration
 * 
 * Initializes the Supabase client for database operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface DetectionRecord {
  id?: string;
  type: 'fall' | 'violent_movement' | 'abnormal_motion';
  confidence: number;
  timestamp: number;
  features: {
    magnitude: number;
    peakAcceleration: number;
    averageAcceleration: number;
    jerk: number;
    rotationMagnitude: number;
    variance: number;
  };
  device_info?: string;
  created_at?: string;
}

export interface AlertRecord {
  id?: string;
  detection_id?: string;
  type: 'fall' | 'violent_movement' | 'abnormal_motion';
  confidence: number;
  timestamp: number;
  alert_triggered_at: string;
  device_info?: string;
  created_at?: string;
}
