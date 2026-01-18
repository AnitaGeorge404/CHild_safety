-- ADD LOCATION FIELDS TO ALERTS TABLE
-- Run this in Supabase SQL Editor to add location support

-- Add location columns to alerts table
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(10, 2);

-- Add location columns to detections table (optional)
ALTER TABLE detections
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_alerts_location ON alerts(latitude, longitude);

-- View to check alerts with location
CREATE OR REPLACE VIEW alerts_with_location AS
SELECT 
    id,
    type,
    confidence,
    timestamp,
    latitude,
    longitude,
    address,
    device_info,
    alert_triggered_at,
    created_at
FROM alerts
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
ORDER BY created_at DESC;

-- Test query to see latest alert with location
-- SELECT * FROM alerts_with_location LIMIT 1;
