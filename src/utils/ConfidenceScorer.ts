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
  // Adaptive thresholds - VERY LOW SENSITIVITY (only extreme events)
  private readonly FALL_THRESHOLDS = {
    FREE_FALL_MAX: 1.5,        // m/s² - Must be true free fall (almost zero g)
    IMPACT_MIN: 40.0,          // m/s² - Very strong impact only (>4g)
    INACTIVITY_MAX: 8.0,       // m/s² - Very minimal movement required
    JERK_SPIKE_MIN: 200.0,     // m/s³ - Very sudden spike required
    MIN_FREE_FALL_DURATION: 300, // ms - Minimum duration for free fall
  };

  private readonly VIOLENT_MOVEMENT_THRESHOLDS = {
    JERK_HIGH: 150.0,          // m/s³ - Very high jerk only
    ACCELERATION_PEAK: 35.0,   // m/s² - Very strong acceleration (>3.5g)
    ROTATION_RAPID: 500.0,     // deg/s - Very rapid rotation only
    VARIANCE_HIGH: 25.0,       // Very high variance required
  };

  private readonly NORMAL_MOTION_THRESHOLDS = {
    WALKING_MAX: 25.0,         // m/s² - Very forgiving for walking
    RUNNING_MAX: 35.0,         // m/s² - Very forgiving for running
    PHONE_HANDLING_MAX: 22.0,  // m/s² - Very forgiving for phone handling
  };

  // Minimum confidence to return any detection
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.75; // 75% minimum

  // State tracking for fall detection
  private fallDetectionState: 'idle' | 'free_fall' | 'impact' | 'post_impact' = 'idle';
  private fallStateTimestamp: number = 0;
  private readonly FALL_SEQUENCE_TIMEOUT = 2000; // ms - Max time for fall sequence
  private freeFallStartTime: number = 0; // Track free fall duration

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
    if (fallResult.confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
      return fallResult;
    }

    // Check for violent movement
    const violentResult = this.detectViolentMovement(features, timestamp);
    if (violentResult.confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
      return violentResult;
    }

    // Check for abnormal motion
    const abnormalResult = this.detectAbnormalMotion(features, timestamp);
    if (abnormalResult.confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
      return abnormalResult;
    }

    // No detection that meets threshold
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
          this.freeFallStartTime = timestamp;
        }
        break;

      case 'free_fall':
        // Check if free fall lasted long enough
        const freeFallDuration = timestamp - this.freeFallStartTime;
        
        // Look for impact (sudden high acceleration) - REQUIRE BOTH AND minimum duration
        if (
          features.peakAcceleration > this.FALL_THRESHOLDS.IMPACT_MIN &&
          features.jerk > this.FALL_THRESHOLDS.JERK_SPIKE_MIN &&
          freeFallDuration >= this.FALL_THRESHOLDS.MIN_FREE_FALL_DURATION
        ) {
          this.fallDetectionState = 'impact';
          this.fallStateTimestamp = timestamp;
          confidence = 0.75; // Minimum confidence threshold
        } else if (features.magnitude > this.FALL_THRESHOLDS.FREE_FALL_MAX) {
          // False alarm - movement detected during "free fall"
          this.fallDetectionState = 'idle';
          this.freeFallStartTime = 0;
        }
        break;

      case 'impact':
        // Look for inactivity after impact
        if (features.averageAcceleration < this.FALL_THRESHOLDS.INACTIVITY_MAX) {
          this.fallDetectionState = 'post_impact';
          this.fallStateTimestamp = timestamp;
          confidence = 0.85; // High confidence - full fall sequence detected
        } else {
          // Continued movement after impact - likely false positive
          this.fallDetectionState = 'idle';
          this.freeFallStartTime = 0;
          confidence = 0; // Don't report - false positive
        }
        break;

      case 'post_impact':
        // Stay in this state briefly, then reset
        if (timestamp - this.fallStateTimestamp > 1000) {
          this.fallDetectionState = 'idle';
          this.freeFallStartTime = 0;
        }
        confidence = 0.9; // Very high confidence - confirmed fall
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
    
    // Calculate confidence based on number of indicators - REQUIRE MULTIPLE
    if (triggeredCount >= 4) {
      confidence = 0.95; // All indicators must trigger
    } else if (triggeredCount === 3) {
      confidence = 0.8; // At least 3 indicators
    } else if (triggeredCount === 2) {
      confidence = 0.6; // 2 indicators - below minimum threshold
    } else {
      // Single indicator - don't report
      confidence = 0;
    }

    // Filter out normal activities - VERY aggressive filtering
    if (this.isNormalActivity(features)) {
      confidence = 0; // Completely eliminate if normal activity detected
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

    // Look for sustained VERY high acceleration - MUCH HIGHER thresholds
    if (
      features.averageAcceleration > 25.0 &&
      features.variance > 22.0 &&
      features.peakAcceleration > 35.0
    ) {
      confidence = 0.5; // Below minimum threshold

      // Check trend over recent history - require sustained extreme motion
      if (this.recentFeatures.length >= 7) {
        const recentHighAccel = this.recentFeatures
          .slice(-7)
          .filter((f) => f.averageAcceleration > 23.0).length;

        if (recentHighAccel >= 6) {
          confidence = 0.75; // Sustained abnormal motion - minimum threshold
        }
      }
    }

    // Filter out normal activities - VERY aggressive
    if (this.isNormalActivity(features)) {
      confidence = 0; // Completely eliminate if normal activity detected
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
    // Walking: periodic, moderate acceleration - VERY forgiving
    const isWalking =
      features.peakAcceleration < this.NORMAL_MOTION_THRESHOLDS.WALKING_MAX &&
      features.variance < 18.0 &&
      features.jerk < 120.0;

    // Running: higher periodic acceleration - VERY forgiving
    const isRunning =
      features.peakAcceleration < this.NORMAL_MOTION_THRESHOLDS.RUNNING_MAX &&
      features.variance < 25.0 &&
      features.jerk < 140.0;

    // Phone handling: brief, low-to-moderate acceleration - VERY forgiving
    const isPhoneHandling =
      features.peakAcceleration < this.NORMAL_MOTION_THRESHOLDS.PHONE_HANDLING_MAX &&
      features.rotationMagnitude < 400.0;

    return isWalking || isRunning || isPhoneHandling;
  }

  /**
   * Reset the scorer state
   */
  reset(): void {
    this.fallDetectionState = 'idle';
    this.fallStateTimestamp = 0;
    this.freeFallStartTime = 0;
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
