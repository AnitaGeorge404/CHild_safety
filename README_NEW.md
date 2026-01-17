# 🛡️ Child Safety Detection PWA

A **Progressive Web App** that uses device motion sensors to detect potential safety threats in real-time, including falls, violent movements, and abnormal motion patterns.

## 🎯 Features

- **Real-time Motion Monitoring** using DeviceMotion and DeviceOrientation APIs
- **Advanced Fall Detection** - Three-phase algorithm (free fall → impact → inactivity)
- **Violent Movement Detection** - Identifies shaking, impacts, and throws
- **Abnormal Motion Recognition** - Detects unusual patterns
- **Smart False-Positive Filtering** - Distinguishes from walking, running, and normal phone handling
- **Adaptive Thresholds** - Confidence-based scoring system
- **Audio Alerts** - Loud alarm using Web Audio API
- **Visual Notifications** - Clear on-screen alerts with detailed metrics

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🧠 How It Works

### Motion Analysis Pipeline
1. **Data Collection** - Samples device motion at ~60Hz
2. **Signal Processing** - High-pass filter removes gravity
3. **Feature Extraction** - Computes magnitude, jerk, variance, rotation
4. **Pattern Detection** - State machine for fall detection, multi-indicator scoring
5. **Alert System** - Confidence-based triggering with cooldown

### Detection Algorithms

**Fall Detection**: FREE_FALL → IMPACT → INACTIVITY
**Violent Movement**: High jerk + acceleration + rotation + variance
**False Positive Filtering**: Identifies normal walking, running, phone handling

## 📱 Usage

1. Grant sensor permissions (iOS requires user interaction)
2. Tap "Start Monitoring"
3. Configure alert thresholds
4. Use "Test Alert" to verify sound
5. Monitor real-time detection results

## ⚠️ Limitations

- ❌ No true background monitoring (browser limitation)
- ❌ iOS requires user permission
- ⚠️ Battery intensive during active monitoring
- ✅ Works great in foreground mode
- ✅ Cross-platform (iOS & Android)

## 🏗️ Architecture

```
src/
├── types/motion.ts           # Type definitions
├── hooks/useMotionSensors.ts # Sensor access hook
├── utils/
│   ├── MotionAnalyzer.ts     # Signal processing
│   ├── ConfidenceScorer.ts   # Detection algorithms
│   └── AlertManager.ts       # Alert system
└── App.tsx                   # Main component
```

## 📊 Technical Details

- **Framework**: React + Vite + TypeScript
- **PWA**: Vite Plugin PWA with Workbox
- **APIs**: DeviceMotion, DeviceOrientation, Web Audio
- **Bundle Size**: ~150KB gzipped
- **Performance**: 30-60Hz sampling, ~50MB memory

## 🎓 For Hackathons

**Key Points**:
- Zero native code required
- Sophisticated signal processing
- Production-ready architecture
- Privacy-focused (on-device processing)
- Demonstrates web platform capabilities

Built with React + Vite | MIT License
