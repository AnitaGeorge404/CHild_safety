-- Quick Cleanup Script for Supabase
-- Run this in Supabase SQL Editor to remove low-confidence detections

-- 1. Check how many records will be deleted
SELECT 
    COUNT(*) as total_to_delete,
    MIN(confidence) as lowest_confidence,
    MAX(confidence) as highest_confidence
FROM detections 
WHERE confidence < 0.75;

-- 2. (Optional) Preview the records that will be deleted
-- SELECT * FROM detections WHERE confidence < 0.75 ORDER BY created_at DESC LIMIT 10;

-- 3. Delete low-confidence detections
DELETE FROM detections WHERE confidence < 0.75;

-- 4. Verify cleanup
SELECT 
    COUNT(*) as remaining_records,
    MIN(confidence) as min_confidence,
    MAX(confidence) as max_confidence,
    AVG(confidence) as avg_confidence
FROM detections;

-- 5. Check alerts table (should be empty or have few records)
SELECT COUNT(*) as alert_count FROM alerts;

-- Result: You should now have only high-confidence (>=75%) detections
-- and the alerts table should start populating with new detections going forward
