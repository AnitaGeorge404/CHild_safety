/**
 * AlertManager - Handles emergency alerts with audio, visual, and potential external notifications
 * 
 * Features:
 * - Loud alarm using Web Audio API
 * - Cooldown period to prevent alert spam
 * - Visual alert management
 * - Extensible for SMS/API notifications
 */

import type { DetectionResult, AlertConfig } from '../types/motion';

export class AlertManager {
  private audioContext: AudioContext | null = null;
  private lastAlertTime: number = 0;
  private isAlerting: boolean = false;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private config: AlertConfig;

  constructor(config: AlertConfig) {
    this.config = config;
    this.initAudioContext();
  }

  /**
   * Initialize Web Audio API context
   */
  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Web Audio API not supported:', error);
    }
  }

  /**
   * Check if alert should be triggered based on detection result and configuration
   */
  shouldAlert(detection: DetectionResult): boolean {
    if (!this.config.enabled) return false;
    if (detection.type === null) return false;
    if (detection.confidence < this.config.confidenceThreshold) return false;

    // Check cooldown period
    const now = Date.now();
    if (now - this.lastAlertTime < this.config.cooldownPeriod) {
      return false;
    }

    return true;
  }

  /**
   * Trigger alert with sound and visual notification
   */
  async triggerAlert(detection: DetectionResult): Promise<void> {
    if (this.isAlerting) return;

    this.isAlerting = true;
    this.lastAlertTime = Date.now();

    // Play alarm sound
    if (this.config.soundEnabled) {
      await this.playAlarmSound();
    }

    // Log alert details
    console.warn('🚨 ALERT TRIGGERED:', {
      type: detection.type,
      confidence: detection.confidence,
      timestamp: new Date(detection.timestamp).toISOString(),
      features: detection.features,
    });

    // In production, this would trigger:
    // - SMS notifications
    // - Push notifications
    // - API calls to emergency contacts
    // - Location sharing
  }

  /**
   * Play loud alarm sound using Web Audio API
   * Creates a multi-frequency alarm pattern for urgency
   */
  private async playAlarmSound(): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create oscillator for alarm tone
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();

      // Connect audio graph
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Set alarm frequency (alternating for attention-grabbing effect)
      this.oscillator.type = 'square'; // Square wave for harsh, attention-grabbing sound
      this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // Hz

      // Set volume (0-1 scale)
      this.gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime);

      // Create alternating tone pattern
      const now = this.audioContext.currentTime;
      for (let i = 0; i < 6; i++) {
        const time = now + i * 0.4;
        this.oscillator.frequency.setValueAtTime(i % 2 === 0 ? 800 : 1000, time);
      }

      // Start and stop
      this.oscillator.start(now);
      this.oscillator.stop(now + 2.4); // 2.4 seconds alarm

      // Cleanup after sound ends
      this.oscillator.onended = () => {
        this.cleanup();
      };
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      this.cleanup();
    }
  }

  /**
   * Stop current alert
   */
  stopAlert(): void {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (error) {
        // Oscillator may already be stopped
      }
    }
    this.cleanup();
  }

  /**
   * Cleanup audio resources
   */
  private cleanup(): void {
    if (this.oscillator) {
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.isAlerting = false;
  }

  /**
   * Update alert configuration
   */
  updateConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get alert status
   */
  getStatus(): {
    isAlerting: boolean;
    lastAlertTime: number;
    timeSinceLastAlert: number;
  } {
    return {
      isAlerting: this.isAlerting,
      lastAlertTime: this.lastAlertTime,
      timeSinceLastAlert: Date.now() - this.lastAlertTime,
    };
  }

  /**
   * Test alert system (for user to verify sound works)
   */
  async testAlert(): Promise<void> {
    const originalEnabled = this.config.enabled;
    this.config.enabled = true;

    await this.triggerAlert({
      type: 'fall',
      confidence: 1.0,
      timestamp: Date.now(),
      features: {
        magnitude: 0,
        jerk: 0,
        variance: 0,
        peakAcceleration: 0,
        averageAcceleration: 0,
        rotationMagnitude: 0,
      },
    });

    this.config.enabled = originalEnabled;
  }

  /**
   * Destroy and cleanup all resources
   */
  destroy(): void {
    this.stopAlert();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
