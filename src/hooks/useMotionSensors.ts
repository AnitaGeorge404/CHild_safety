/**
 * useMotionSensors - React hook for accessing device motion sensors
 * 
 * Handles:
 * - Permission requests (especially iOS)
 * - DeviceMotionEvent and DeviceOrientationEvent
 * - Browser compatibility
 * - Error handling
 * - Cleanup
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MotionData, SensorStatus } from '../types/motion';

interface UseMotionSensorsResult {
  status: SensorStatus;
  data: MotionData | null;
  requestPermission: () => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export function useMotionSensors(): UseMotionSensorsResult {
  const [status, setStatus] = useState<SensorStatus>({
    available: false,
    permission: 'prompt',
    active: false,
    error: null,
  });

  const [data, setData] = useState<MotionData | null>(null);
  const dataRef = useRef<MotionData | null>(null);

  /**
   * Check if DeviceMotionEvent is supported
   */
  const checkAvailability = useCallback(() => {
    const available = 'DeviceMotionEvent' in window && 'DeviceOrientationEvent' in window;
    
    setStatus((prev) => ({
      ...prev,
      available,
      error: available ? null : 'Device motion sensors not supported in this browser',
    }));

    return available;
  }, []);

  /**
   * Request permission for iOS devices (iOS 13+)
   */
  const requestPermission = useCallback(async () => {
    if (!checkAvailability()) {
      return;
    }

    try {
      // Check if permission request is needed (iOS 13+)
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof (DeviceMotionEvent as any).requestPermission === 'function'
      ) {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        
        setStatus((prev) => ({
          ...prev,
          permission: permission === 'granted' ? 'granted' : 'denied',
          error: permission === 'granted' ? null : 'Permission denied for motion sensors',
        }));
      } else {
        // Permission not required (Android, older iOS)
        setStatus((prev) => ({
          ...prev,
          permission: 'not_required',
        }));
      }
    } catch (error) {
      console.error('Error requesting motion permission:', error);
      setStatus((prev) => ({
        ...prev,
        permission: 'denied',
        error: `Permission request failed: ${error}`,
      }));
    }
  }, [checkAvailability]);

  /**
   * Handle DeviceMotionEvent
   */
  const handleMotionEvent = useCallback((event: DeviceMotionEvent) => {
    const newData: MotionData = {
      timestamp: Date.now(),
      acceleration: {
        x: event.acceleration?.x ?? 0,
        y: event.acceleration?.y ?? 0,
        z: event.acceleration?.z ?? 0,
      },
      accelerationIncludingGravity: {
        x: event.accelerationIncludingGravity?.x ?? 0,
        y: event.accelerationIncludingGravity?.y ?? 0,
        z: event.accelerationIncludingGravity?.z ?? 0,
      },
      rotationRate: {
        alpha: event.rotationRate?.alpha ?? 0,
        beta: event.rotationRate?.beta ?? 0,
        gamma: event.rotationRate?.gamma ?? 0,
      },
    };

    dataRef.current = newData;
    setData(newData);
  }, []);

  /**
   * Start monitoring device motion
   */
  const startMonitoring = useCallback(() => {
    if (!status.available) {
      console.error('Motion sensors not available');
      return;
    }

    if (status.permission === 'denied') {
      console.error('Permission denied for motion sensors');
      return;
    }

    try {
      window.addEventListener('devicemotion', handleMotionEvent);
      
      setStatus((prev) => ({
        ...prev,
        active: true,
        error: null,
      }));

      console.log('✅ Motion monitoring started');
    } catch (error) {
      console.error('Error starting motion monitoring:', error);
      setStatus((prev) => ({
        ...prev,
        error: `Failed to start monitoring: ${error}`,
      }));
    }
  }, [status.available, status.permission, handleMotionEvent]);

  /**
   * Stop monitoring device motion
   */
  const stopMonitoring = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotionEvent);
    
    setStatus((prev) => ({
      ...prev,
      active: false,
    }));

    console.log('⏸️ Motion monitoring stopped');
  }, [handleMotionEvent]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    checkAvailability();

    // Cleanup on unmount
    return () => {
      stopMonitoring();
    };
  }, [checkAvailability, stopMonitoring]);

  return {
    status,
    data,
    requestPermission,
    startMonitoring,
    stopMonitoring,
  };
}
