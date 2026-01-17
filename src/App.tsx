/**
 * Child Safety Detection App
 * 
 * Main application component that integrates:
 * - Motion sensor monitoring
 * - Real-time motion analysis
 * - Detection algorithms
 * - Alert system
 * - User interface
 */

import { useState, useEffect, useRef } from 'react';
import { useMotionSensors } from './hooks/useMotionSensors';
import { MotionAnalyzer } from './utils/MotionAnalyzer';
import { ConfidenceScorer } from './utils/ConfidenceScorer';
import { AlertManager } from './utils/AlertManager';
import { DatabaseService } from './services/DatabaseService';
import type { AlertConfig, DetectionResult } from './types/motion';
import './App.css';

function App() {
  const { status, data, requestPermission, startMonitoring, stopMonitoring } = useMotionSensors();
  
  // Core system instances (using refs to persist across renders)
  const analyzerRef = useRef<MotionAnalyzer>(new MotionAnalyzer(50, 60));
  const scorerRef = useRef<ConfidenceScorer>(new ConfidenceScorer());
  const alertManagerRef = useRef<AlertManager | null>(null);

  // State
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    enabled: true,
    confidenceThreshold: 0.8, // Increased to 80% minimum
    cooldownPeriod: 5000, // 5 seconds
    soundEnabled: true,
  });
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<DetectionResult[]>([]);
  const [saveToDatabase, setSaveToDatabase] = useState(true);
  const [dbStatus, setDbStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Initialize AlertManager
  useEffect(() => {
    alertManagerRef.current = new AlertManager(alertConfig);
    
    return () => {
      alertManagerRef.current?.destroy();
    };
  }, []); // Only initialize once

  // Update alert config when changed
  useEffect(() => {
    alertManagerRef.current?.updateConfig(alertConfig);
  }, [alertConfig]);

  // Process motion data
  useEffect(() => {
    if (!data || !isMonitoring) return;

    const analyzer = analyzerRef.current;
    const scorer = scorerRef.current;
    const alertManager = alertManagerRef.current;

    // Add data to analyzer
    analyzer.addData(data);

    // Extract features
    const features = analyzer.extractFeatures();
    if (!features) return; // Need more data

    // Detect patterns
    const detection = scorer.detect(features);
    setLastDetection(detection);

    // Save ONLY high-confidence detections to database (confidence >= 0.75)
    // This reduces unnecessary database clutter
    if (saveToDatabase && detection.type && detection.confidence >= 0.75) {
      setDbStatus('saving');
      console.log('📊 Attempting to save detection:', {
        type: detection.type,
        confidence: detection.confidence,
        timestamp: detection.timestamp
      });
      
      DatabaseService.saveDetection(detection)
        .then((detectionId) => {
          if (detectionId) {
            setDbStatus('success');
            console.log('✅ Detection saved to database:', detectionId);
            
            // ALWAYS save to alerts table for high-confidence detections
            // Since we're only saving detections with confidence >= 0.75,
            // all of these should also be logged as alerts
            return DatabaseService.saveAlert(detection, detectionId);
          } else {
            console.error('❌ Failed to save detection - no ID returned');
            setDbStatus('error');
          }
          return null;
        })
        .then((alertSaved) => {
          if (alertSaved) {
            console.log('✅ Alert saved to database');
          } else {
            console.warn('⚠️ Alert save failed or skipped');
          }
          setTimeout(() => setDbStatus('idle'), 2000);
        })
        .catch((error) => {
          console.error('❌ Database error:', error);
          console.error('   Make sure you ran supabase-schema.sql in Supabase SQL Editor!');
          setDbStatus('error');
          setTimeout(() => setDbStatus('idle'), 3000);
        });
    }

    // Check for UI alerts (independent of database saving)
    if (alertManager && alertManager.shouldAlert(detection)) {
      alertManager.triggerAlert(detection);
      setRecentAlerts((prev) => [detection, ...prev.slice(0, 9)]); // Keep last 10
    }
  }, [data, isMonitoring, saveToDatabase]);

  // Handle start monitoring
  const handleStartMonitoring = async () => {
    if (status.permission === 'prompt') {
      await requestPermission();
    }
    
    startMonitoring();
    setIsMonitoring(true);
    analyzerRef.current.clear();
    scorerRef.current.reset();
  };

  // Handle stop monitoring
  const handleStopMonitoring = () => {
    stopMonitoring();
    setIsMonitoring(false);
  };

  // Test alert
  const handleTestAlert = () => {
    alertManagerRef.current?.testAlert();
  };

  // Clean up low-confidence detections
  const handleCleanupDatabase = async () => {
    if (!confirm('Delete detections with confidence < 75%? This cannot be undone.')) {
      return;
    }
    
    try {
      console.log('🧹 Cleaning up low-confidence detections...');
      const { supabase } = await import('./lib/supabase');
      
      // Delete detections with low confidence
      const { error, count } = await supabase
        .from('detections')
        .delete({ count: 'exact' })
        .lt('confidence', 0.75);
      
      if (error) {
        console.error('❌ Cleanup failed:', error);
        alert('Cleanup failed. Check console for details.');
      } else {
        console.log(`✅ Deleted ${count} low-confidence records`);
        alert(`Successfully deleted ${count} low-confidence detections!`);
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      alert('Cleanup failed. Check console for details.');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛡️ Child Safety Detection</h1>
        <p className="subtitle">Real-time motion monitoring using device sensors</p>
      </header>

      <main className="app-main">
        {/* System Status */}
        <section className="card status-card">
          <h2>System Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Sensors:</span>
              <span className={`value ${status.available ? 'success' : 'error'}`}>
                {status.available ? '✓ Available' : '✗ Not Available'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Permission:</span>
              <span className={`value ${status.permission === 'granted' || status.permission === 'not_required' ? 'success' : 'warning'}`}>
                {status.permission === 'not_required' ? 'Not Required' : status.permission}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Monitoring:</span>
              <span className={`value ${isMonitoring ? 'success' : 'inactive'}`}>
                {isMonitoring ? '● Active' : '○ Inactive'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Buffer:</span>
              <span className="value">
                {analyzerRef.current.getBufferLength()} samples
              </span>
            </div>
            <div className="status-item">
              <span className="label">Database:</span>
              <span className={`value ${dbStatus === 'success' ? 'success' : dbStatus === 'error' ? 'error' : 'inactive'}`}>
                {dbStatus === 'saving' && '⏳ Saving...'}
                {dbStatus === 'success' && '✓ Saved'}
                {dbStatus === 'error' && '✗ Error'}
                {dbStatus === 'idle' && '○ Ready'}
              </span>
            </div>
          </div>
          {status.error && (
            <div className="error-message">{status.error}</div>
          )}
          {dbStatus === 'error' && (
            <div className="error-message">
              ⚠️ Database save failed! Open browser console (F12) for details. 
              Make sure you ran supabase-schema.sql in Supabase SQL Editor.
            </div>
          )}
        </section>

        {/* Controls */}
        <section className="card controls-card">
          <h2>Controls</h2>
          <div className="button-group">
            {!isMonitoring ? (
              <button 
                onClick={handleStartMonitoring}
                disabled={!status.available}
                className="btn btn-primary"
              >
                ▶ Start Monitoring
              </button>
            ) : (
              <button 
                onClick={handleStopMonitoring}
                className="btn btn-danger"
              >
                ⏹ Stop Monitoring
              </button>
            )}
            <button 
              onClick={handleTestAlert}
              className="btn btn-secondary"
            >
              🔔 Test Alert
            </button>
            <button 
              onClick={handleCleanupDatabase}
              className="btn btn-secondary"
              title="Delete detections with confidence < 75%"
            >
              🧹 Cleanup Database
            </button>
          </div>

          <div className="config-section">
            <h3>Alert Configuration</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={alertConfig.enabled}
                onChange={(e) => setAlertConfig({ ...alertConfig, enabled: e.target.checked })}
              />
              Enable Alerts
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={alertConfig.soundEnabled}
                onChange={(e) => setAlertConfig({ ...alertConfig, soundEnabled: e.target.checked })}
              />
              Enable Sound
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={saveToDatabase}
                onChange={(e) => setSaveToDatabase(e.target.checked)}
              />
              Save to Database
            </label>
            <label className="slider-label">
              Confidence Threshold: {(alertConfig.confidenceThreshold * 100).toFixed(0)}%
              <input
                type="range"
                min="0.7"
                max="1.0"
                step="0.05"
                value={alertConfig.confidenceThreshold}
                onChange={(e) => setAlertConfig({ ...alertConfig, confidenceThreshold: parseFloat(e.target.value) })}
              />
            </label>
          </div>
        </section>

        {/* Current Detection */}
        {lastDetection && (
          <section className="card detection-card">
            <h2>Current Detection</h2>
            {lastDetection.type ? (
              <div className={`detection-alert ${lastDetection.type}`}>
                <div className="detection-header">
                  <span className="detection-type">{lastDetection.type.replace('_', ' ').toUpperCase()}</span>
                  <span className="confidence">
                    {(lastDetection.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div className="detection-features">
                  <div className="feature">
                    <span>Peak Accel:</span>
                    <span>{lastDetection.features.peakAcceleration.toFixed(2)} m/s²</span>
                  </div>
                  <div className="feature">
                    <span>Jerk:</span>
                    <span>{lastDetection.features.jerk.toFixed(2)} m/s³</span>
                  </div>
                  <div className="feature">
                    <span>Variance:</span>
                    <span>{lastDetection.features.variance.toFixed(2)}</span>
                  </div>
                  <div className="feature">
                    <span>Rotation:</span>
                    <span>{lastDetection.features.rotationMagnitude.toFixed(2)} °/s</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-detection">
                <span className="status-icon">✓</span>
                <span>Normal motion - no threats detected</span>
              </div>
            )}
          </section>
        )}

        {/* Recent Alerts */}
        {recentAlerts.length > 0 && (
          <section className="card alerts-card">
            <h2>Recent Alerts</h2>
            <div className="alerts-list">
              {recentAlerts.map((alert, index) => (
                <div key={index} className={`alert-item ${alert.type}`}>
                  <div className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="alert-type">
                    {alert.type?.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="alert-confidence">
                    {(alert.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Information */}
        <section className="card info-card">
          <h2>ℹ️ How It Works</h2>
          <div className="info-content">
            <p>This app uses your device's motion sensors to detect potential safety threats:</p>
            <ul>
              <li><strong>Fall Detection:</strong> Detects free fall followed by impact and inactivity</li>
              <li><strong>Violent Movement:</strong> Identifies sudden impacts, shaking, or throws</li>
              <li><strong>Abnormal Motion:</strong> Recognizes unusual motion patterns</li>
            </ul>
            <p className="note">
              <strong>Note:</strong> This is a web-based PWA with browser limitations:
              <br />• No true background monitoring
              <br />• iOS requires user permission
              <br />• Accuracy depends on device sensors
              <br />• Best used with app in foreground
            </p>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Built with React + Vite | PWA Enabled</p>
        <p className="tech-note">Using DeviceMotion & DeviceOrientation APIs</p>
      </footer>
    </div>
  );
}

export default App;
