-- Insert Test Data into CHild_safety Supabase Database
-- Run this in Supabase SQL Editor to populate the database with sample data

-- First, add location columns to alerts table (if not already added)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(10, 2);

-- Insert sample detection records
INSERT INTO detections (type, confidence, timestamp, features, device_info) VALUES
(
  'violent_movement',
  0.92,
  EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  '{"magnitude": 8.5, "duration": 2.3, "frequency": 5.2}'::jsonb,
  'Child iPhone 13 - iOS 16.2'
),
(
  'fall',
  0.87,
  (EXTRACT(EPOCH FROM NOW())::BIGINT - 300) * 1000,
  '{"magnitude": 9.2, "duration": 1.8, "impact": "high"}'::jsonb,
  'Child iPhone 13 - iOS 16.2'
),
(
  'abnormal_motion',
  0.78,
  (EXTRACT(EPOCH FROM NOW())::BIGINT - 600) * 1000,
  '{"pattern": "erratic", "intensity": 6.5}'::jsonb,
  'Child iPhone 13 - iOS 16.2'
);

-- Insert sample alert records with location data
-- Location 1: Near MACE College (Kothamangalam, Kerala)
INSERT INTO alerts (type, confidence, timestamp, alert_triggered_at, device_info, latitude, longitude, address, location_accuracy) VALUES
(
  'violent_movement',
  0.92,
  EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  NOW(),
  'Child iPhone 13 - iOS 16.2',
  10.0889,
  76.6400,
  'MACE, Kothamangalam, Kerala, India',
  15.5
);

-- Location 2: Kochi City Center
INSERT INTO alerts (type, confidence, timestamp, alert_triggered_at, device_info, latitude, longitude, address, location_accuracy) VALUES
(
  'fall',
  0.87,
  (EXTRACT(EPOCH FROM NOW())::BIGINT - 300) * 1000,
  NOW() - INTERVAL '5 minutes',
  'Child iPhone 13 - iOS 16.2',
  9.9312,
  76.2673,
  'MG Road, Kochi, Kerala, India',
  12.3
);

-- Location 3: School area
INSERT INTO alerts (type, confidence, timestamp, alert_triggered_at, device_info, latitude, longitude, address, location_accuracy) VALUES
(
  'abnormal_motion',
  0.78,
  (EXTRACT(EPOCH FROM NOW())::BIGINT - 600) * 1000,
  NOW() - INTERVAL '10 minutes',
  'Child iPhone 13 - iOS 16.2',
  10.0266,
  76.3343,
  'St. Joseph School, Muvattupuzha, Kerala',
  18.7
);

-- Verify the data was inserted
SELECT 
  '✅ ALERTS' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as latest_record
FROM alerts
UNION ALL
SELECT 
  '✅ DETECTIONS' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as latest_record
FROM detections;

-- Show the latest alert with location
SELECT 
  id,
  type,
  confidence,
  ROUND(latitude::numeric, 4) as lat,
  ROUND(longitude::numeric, 4) as lng,
  address,
  to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created
FROM alerts
ORDER BY created_at DESC
LIMIT 1;
