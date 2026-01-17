/**
 * Type definitions for motion sensing and analysis
 */

export interface MotionData {
  timestamp: number;
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  accelerationIncludingGravity: {
    x: number;
    y: number;
    z: number;
  };
  rotationRate: {
    alpha: number;
    beta: number;
    gamma: number;
  };
}

export interface MotionFeatures {
  magnitude: number;
  jerk: number;
  variance: number;
  peakAcceleration: number;
  averageAcceleration: number;
  rotationMagnitude: number;
}

export interface DetectionResult {
  type: 'fall' | 'violent_movement' | 'abnormal_motion' | null;
  confidence: number;
  timestamp: number;
  features: MotionFeatures;
}

export interface AlertConfig {
  enabled: boolean;
  confidenceThreshold: number;
  cooldownPeriod: number; // milliseconds
  soundEnabled: boolean;
}

export interface SensorStatus {
  available: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'not_required';
  active: boolean;
  error: string | null;
}
