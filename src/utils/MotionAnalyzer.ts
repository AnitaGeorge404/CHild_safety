/**
 * MotionAnalyzer - Advanced motion signal processing and feature extraction
 * 
 * This module implements sophisticated algorithms for analyzing device motion:
 * - High-pass filtering to remove gravity
 * - Sliding window feature extraction
 * - Jerk (acceleration derivative) computation
 * - Statistical variance analysis
 */

import type { MotionData, MotionFeatures } from '../types/motion';

export class MotionAnalyzer {
  private dataBuffer: MotionData[] = [];
  private readonly bufferSize: number;
  private gravityFilter: { x: number; y: number; z: number };
  private readonly alpha = 0.8; // High-pass filter coefficient

  constructor(bufferSize: number = 50, _samplingRate: number = 60) {
    this.bufferSize = bufferSize;
    this.gravityFilter = { x: 0, y: 0, z: 0 };
  }

  /**
   * Add new motion data to the buffer
   */
  addData(data: MotionData): void {
    this.dataBuffer.push(data);
    if (this.dataBuffer.length > this.bufferSize) {
      this.dataBuffer.shift();
    }
  }

  /**
   * Apply high-pass filter to remove gravity component
   * Uses exponential moving average for smooth filtering
   */
  private removeGravity(
    accel: { x: number; y: number; z: number }
  ): { x: number; y: number; z: number } {
    // Update gravity estimate using low-pass filter
    this.gravityFilter.x = this.alpha * this.gravityFilter.x + (1 - this.alpha) * accel.x;
    this.gravityFilter.y = this.alpha * this.gravityFilter.y + (1 - this.alpha) * accel.y;
    this.gravityFilter.z = this.alpha * this.gravityFilter.z + (1 - this.alpha) * accel.z;

    // Remove gravity to get linear acceleration
    return {
      x: accel.x - this.gravityFilter.x,
      y: accel.y - this.gravityFilter.y,
      z: accel.z - this.gravityFilter.z,
    };
  }

  /**
   * Compute acceleration magnitude
   */
  private computeMagnitude(accel: { x: number; y: number; z: number }): number {
    return Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);
  }

  /**
   * Compute jerk (rate of change of acceleration)
   * Jerk is critical for detecting sudden movements
   */
  private computeJerk(): number {
    if (this.dataBuffer.length < 2) return 0;

    const recent = this.dataBuffer.slice(-10); // Last 10 samples
    const jerks: number[] = [];

    for (let i = 1; i < recent.length; i++) {
      const dt = (recent[i].timestamp - recent[i - 1].timestamp) / 1000; // Convert to seconds
      if (dt === 0) continue;

      const curr = recent[i].acceleration;
      const prev = recent[i - 1].acceleration;

      const jerkX = (curr.x - prev.x) / dt;
      const jerkY = (curr.y - prev.y) / dt;
      const jerkZ = (curr.z - prev.z) / dt;

      const jerkMagnitude = Math.sqrt(jerkX ** 2 + jerkY ** 2 + jerkZ ** 2);
      jerks.push(jerkMagnitude);
    }

    // Return maximum jerk in recent window
    return jerks.length > 0 ? Math.max(...jerks) : 0;
  }

  /**
   * Compute rotation magnitude from gyroscope data
   */
  private computeRotationMagnitude(): number {
    if (this.dataBuffer.length === 0) return 0;

    const recent = this.dataBuffer.slice(-5);
    const rotationMagnitudes = recent.map((data) => {
      const { alpha, beta, gamma } = data.rotationRate;
      return Math.sqrt(alpha ** 2 + beta ** 2 + gamma ** 2);
    });

    return Math.max(...rotationMagnitudes);
  }

  /**
   * Compute statistical variance of acceleration
   * High variance indicates erratic motion
   */
  private computeVariance(): number {
    if (this.dataBuffer.length < 2) return 0;

    const magnitudes = this.dataBuffer.map((data) =>
      this.computeMagnitude(data.acceleration)
    );

    const mean = magnitudes.reduce((sum, val) => sum + val, 0) / magnitudes.length;
    const variance =
      magnitudes.reduce((sum, val) => sum + (val - mean) ** 2, 0) / magnitudes.length;

    return variance;
  }

  /**
   * Extract comprehensive motion features from buffer
   */
  extractFeatures(): MotionFeatures | null {
    if (this.dataBuffer.length < 10) {
      return null; // Need enough data for analysis
    }

    const magnitudes = this.dataBuffer.map((data) => {
      // Prefer acceleration without gravity if available
      const accel =
        data.acceleration.x !== 0 || data.acceleration.y !== 0 || data.acceleration.z !== 0
          ? data.acceleration
          : this.removeGravity(data.accelerationIncludingGravity);

      return this.computeMagnitude(accel);
    });

    const peakAcceleration = Math.max(...magnitudes);
    const averageAcceleration =
      magnitudes.reduce((sum, val) => sum + val, 0) / magnitudes.length;
    const jerk = this.computeJerk();
    const variance = this.computeVariance();
    const rotationMagnitude = this.computeRotationMagnitude();

    return {
      magnitude: magnitudes[magnitudes.length - 1],
      jerk,
      variance,
      peakAcceleration,
      averageAcceleration,
      rotationMagnitude,
    };
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.dataBuffer = [];
    this.gravityFilter = { x: 0, y: 0, z: 0 };
  }

  /**
   * Get buffer length
   */
  getBufferLength(): number {
    return this.dataBuffer.length;
  }

  /**
   * Get time span of current buffer in seconds
   */
  getTimeSpan(): number {
    if (this.dataBuffer.length < 2) return 0;
    const first = this.dataBuffer[0].timestamp;
    const last = this.dataBuffer[this.dataBuffer.length - 1].timestamp;
    return (last - first) / 1000;
  }
}
