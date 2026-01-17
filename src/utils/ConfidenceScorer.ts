/**
 * ConfidenceScorer - Intelligent motion pattern detection with adaptive thresholds
 * 
 * This module implements rule-based detection algorithms for:
 * - Fall detection (free fall → impact → inactivity)
 * - Violent movement detection (rapid shaking, impacts)
 * - Abnormal motion patterns
 * 
 * Uses adaptive thresholds to minimize false positives from:
 * - Normal walking/running
 * - Phone handling
 * - Transportation (car, bus, etc.)
 */

import type { MotionFeatures, DetectionResult } from '../types/motion';

export class ConfidenceScorer {
  // Adaptive thresholds - tuned for child safety scenarios (BALANCED)
  private readonly FALL_THRESHOLDS = {
    FREE_FALL_MAX: 3.5,        // m/s² - Near zero acceleration (less than ~0.35g) - Must be very low gravity
    IMPACT_MIN: 30.0,          // m/s² - Strong impact (>3g) - Requires significant impact
    INACTIVITY_MAX: 5.0,       // m/s² - Minimal movement after fall - More lenient
    JERK_SPIKE_MIN: 120.0,     // m/s³ - Sudden change indicates impact - Balanced
  };

  private readonly VIOLENT_MOVEMENT_THRESHOLDS = {
    JERK_HIGH: 100.0,          // m/s³ - High jerk indicates violent motion - Balanced
    ACCELERATION_PEAK: 25.0,   // m/s² - Strong acceleration (>2.5g) - Balanced
    ROTATION_RAPID: 350.0,     // deg/s - Rapid rotation - Balanced
    VARIANCE_HIGH: 18.0,       // High variance = erratic motion - Balanced
  };

  private readonly NORMAL_MOTION_THRESHOLDS = {
    WALKING_MAX: 18.0,         // m/s² - Typical walking acceleration - More forgiving
    RUNNING_MAX: 25.0,         // m/s² - Typical running acceleration - More forgiving
    PHONE_HANDLING_MAX: 15.0,  // m/s² - Normal phone pickup/movement - More forgiving
  };

  // State tracking for fall detection
  private fallDetectionState: 'idle' | 'free_fall' | 'impact' | 'post_impact' = 'idle';
  private fallStateTimestamp: number = 0;
  private readonly FALL_SEQUENCE_TIMEOUT = 2000; // ms - Max time for fall sequence

  // History for trend analysis
  private recentFeatures: MotionFeatures[] = [];
  private readonly HISTORY_SIZE = 10;

  /**
   * Main detection method - analyzes motion features and returns detection result
   */
  detect(features: MotionFeatures): DetectionResult {
    // Add to history
    this.recentFeatures.push(features);
    if (this.recentFeatures.length > this.HISTORY_SIZE) {
      this.recentFeatures.shift();
    }

    const timestamp = Date.now();

    // Check for fall pattern (highest priority)
    const fallResult = this.detectFall(features, timestamp);
    if (fallResult.confidence > 0) {
      return fallResult;
    }

    // Check for violent movement
    const violentResult = this.detectViolentMovement(features, timestamp);
    if (violentResult.confidence > 0) {
      return violentResult;
    }

    // Check for abnormal motion
    const abnormalResult = this.detectAbnormalMotion(features, timestamp);
    if (abnormalResult.confidence > 0) {
      return abnormalResult;
    }

    // No detection
    return {
      type: null,
      confidence: 0,
      timestamp,
      features,
    };
  }

  /**
   * Detect fall pattern: free fall → impact → inactivity
   * This is a state machine that tracks the fall sequence
   */
  private detectFall(features: MotionFeatures, timestamp: number): DetectionResult {
    let confidence = 0;

    // Reset state machine if timeout exceeded
    if (timestamp - this.fallStateTimestamp > this.FALL_SEQUENCE_TIMEOUT) {
      this.fallDetectionState = 'idle';
    }

    switch (this.fallDetectionState) {
      case 'idle':
        // Look for free fall phase (near-zero acceleration)
        if (features.magnitude < this.FALL_THRESHOLDS.FREE_FALL_MAX) {
          this.fallDetectionState = 'free_fall';
          this.fallStateTimestamp = timestamp;
        }
        break;

      case 'free_fall':
        // Look for impact (sudden high acceleration)
        if (
          features.peakAcceleration > this.FALL_THRESHOLDS.IMPACT_MIN ||
          features.jerk > this.FALL_THRESHOLDS.JERK_SPIKE_MIN
        ) {
          this.fallDetectionState = 'impact';
          this.fallStateTimestamp = timestamp;
          confidence = 0.7; // High confidence - detected impact after free fall
        } else if (features.magnitude > this.FALL_THRESHOLDS.FREE_FALL_MAX) {
          // False alarm - movement detected during "free fall"
          this.fallDetectionState = 'idle';
        }
        break;

      case 'impact':
        // Look for inactivity after impact
        if (features.averageAcceleration < this.FALL_THRESHOLDS.INACTIVITY_MAX) {
          this.fallDetectionState = 'post_impact';
          this.fallStateTimestamp = timestamp;
          confidence = 0.85; // High confidence - full fall sequence detected
        } else {
          // Continued movement after impact - might be recovering or false positive
          this.fallDetectionState = 'idle';
          confidence = 0.3; // Low confidence - likely false positive
        }
        break;

      case 'post_impact':
        // Stay in this state briefly, then reset
        if (timestamp - this.fallStateTimestamp > 1000) {
          this.fallDetectionState = 'idle';
        }
        confidence = 0.8; // High confidence - confirmed fall
        break;
    }

    return {
      type: confidence > 0 ? 'fall' : null,
      confidence,
      timestamp,
      features,
    };
  }

  /**
   * Detect violent movement patterns (shaking, impacts, throws)
   */
  private detectViolentMovement(features: MotionFeatures, timestamp: number): DetectionResult {
    let confidence = 0;

    // Check multiple indicators
    const highJerk = features.jerk > this.VIOLENT_MOVEMENT_THRESHOLDS.JERK_HIGH;
    const highAcceleration =
      features.peakAcceleration > this.VIOLENT_MOVEMENT_THRESHOLDS.ACCELERATION_PEAK;
    const rapidRotation =
      features.rotationMagnitude > this.VIOLENT_MOVEMENT_THRESHOLDS.ROTATION_RAPID;
    const highVariance = features.variance > this.VIOLENT_MOVEMENT_THRESHOLDS.VARIANCE_HIGH;

    // Count how many indicators are triggered
    const indicators = [highJerk, highAcceleration, rapidRotation, highVariance];
    const triggeredCount = indicators.filter(Boolean).length;

    // Calculate confidence based on number of indicators
    if (triggeredCount >= 3) {
      confidence = 0.85; // Very high confidence
    } else if (triggeredCount === 2) {
      confidence = 0.65; // Medium-high confidence
    } else if (triggeredCount === 1) {
      // Single indicator - check if it's extreme
      if (highJerk && features.jerk > this.VIOLENT_MOVEMENT_THRESHOLDS.JERK_HIGH * 1.8) {
        confidence = 0.55; // Medium confidence
      } else if (
        highAcceleration &&
        features.peakAcceleration > this.VIOLENT_MOVEMENT_THRESHOLDS.ACCELERATION_PEAK * 1.8
      ) {
        confidence = 0.55;
      }
    }

    // Filter out normal activities
    if (this.isNormalActivity(features)) {
      confidence *= 0.2; // Reduce confidence significantly
    }

    return {
      type: confidence > 0 ? 'violent_movement' : null,
      confidence,
      timestamp,
      features,
    };
  }

  /**
   * Detect abnormal motion patterns that don't fit other categories
   */
  private detectAbnormalMotion(features: MotionFeatures, timestamp: number): DetectionResult {
    let confidence = 0;

    // Look for sustained high acceleration with high variance - BALANCED thresholds
    if (
      features.averageAcceleration > 16.0 &&
      features.variance > 14.0 &&
      features.peakAcceleration > 24.0
    ) {
      confidence = 0.45;

      // Check trend over recent history
      if (this.recentFeatures.length >= 5) {
        const recentHighAccel = this.recentFeatures
          .slice(-5)
          .filter((f) => f.averageAcceleration > 14.0).length;

        if (recentHighAccel >= 4) {
          confidence = 0.6; // Sustained abnormal motion
        }
      }
    }

    // Filter out normal activities
    if (this.isNormalActivity(features)) {
      confidence *= 0.15;
    }

    return {
      type: confidence > 0 ? 'abnormal_motion' : null,
      confidence,
      timestamp,
      features,
    };
  }

  /**
   * Check if motion matches normal activity patterns
   * This is critical for reducing false positives
   */
  private isNormalActivity(features: MotionFeatures): boolean {
    // Walking: periodic, moderate acceleration - BALANCED thresholds
    const isWalking =
      features.peakAcceleration < this.NORMAL_MOTION_THRESHOLDS.WALKING_MAX &&
      features.variance < 10.0 &&
      features.jerk < 70.0;

    // Running: higher periodic acceleration - BALANCED thresholds
    const isRunning =
      features.peakAcceleration < this.NORMAL_MOTION_THRESHOLDS.RUNNING_MAX &&
      features.variance < 15.0 &&
      features.jerk < 90.0;

    // Phone handling: brief, low-to-moderate acceleration - BALANCED thresholds
    const isPhoneHandling =
      features.peakAcceleration < this.NORMAL_MOTION_THRESHOLDS.PHONE_HANDLING_MAX &&
      features.rotationMagnitude < 250.0;

    return isWalking || isRunning || isPhoneHandling;
  }

  /**
   * Reset the scorer state
   */
  reset(): void {
    this.fallDetectionState = 'idle';
    this.fallStateTimestamp = 0;
    this.recentFeatures = [];
  }

  /**
   * Get current detection state (for debugging/monitoring)
   */
  getState(): {
    fallState: string;
    historySize: number;
  } {
    return {
      fallState: this.fallDetectionState,
      historySize: this.recentFeatures.length,
    };
  }
}
