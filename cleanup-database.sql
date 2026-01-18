-- Quick Cleanup Script for Supabase
-- Run this in Supabase SQL Editor to clean up the detections table
-- (The app now saves directly to alerts table only, so detections is no longer used)

-- 1. Check current data
SELECT 
    'Detections' as table_name,
    COUNT(*) as record_count
FROM detections
UNION ALL
SELECT 
    'Alerts' as table_name,
    COUNT(*) as record_count
FROM alerts;

-- 2. Delete ALL records from detections table (no longer used)
DELETE FROM detections;

-- 3. Keep only high-confidence alerts (>= 80%)
DELETE FROM alerts WHERE confidence < 0.80;

-- 4. Verify cleanup
SELECT 
    'Detections (should be 0)' as table_name,
    COUNT(*) as record_count
FROM detections
UNION ALL
SELECT 
    'Alerts (high confidence only)' as table_name,
    COUNT(*) as record_count
FROM alerts;

-- 5. Show remaining alerts
SELECT 
    type,
    COUNT(*) as count,
    MIN(confidence) as min_confidence,
    MAX(confidence) as max_confidence,
    AVG(confidence) as avg_confidence
FROM alerts
GROUP BY type
ORDER BY type;

-- Result: 
-- - Detections table: Empty (no longer used)
-- - Alerts table: Only records with confidence >= 80%
