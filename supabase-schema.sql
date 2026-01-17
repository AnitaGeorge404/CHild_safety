-- Child Safety Detection Database Schema
-- Run this in your Supabase SQL Editor to create the tables

-- Create detections table
CREATE TABLE IF NOT EXISTS detections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('fall', 'violent_movement', 'abnormal_motion')),
    confidence DECIMAL(5, 4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    timestamp BIGINT NOT NULL,
    features JSONB NOT NULL,
    device_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    detection_id UUID REFERENCES detections(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('fall', 'violent_movement', 'abnormal_motion')),
    confidence DECIMAL(5, 4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    timestamp BIGINT NOT NULL,
    alert_triggered_at TIMESTAMPTZ NOT NULL,
    device_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_detections_created_at ON detections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detections_type ON detections(type);
CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON detections(timestamp);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_detection_id ON alerts(detection_id);

-- Enable Row Level Security (RLS)
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous inserts and reads
-- (Adjust these policies based on your security requirements)

-- Allow anyone to insert detections
CREATE POLICY "Allow anonymous inserts to detections"
    ON detections
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow anyone to read detections
CREATE POLICY "Allow anonymous reads from detections"
    ON detections
    FOR SELECT
    TO anon
    USING (true);

-- Allow anyone to insert alerts
CREATE POLICY "Allow anonymous inserts to alerts"
    ON alerts
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow anyone to read alerts
CREATE POLICY "Allow anonymous reads from alerts"
    ON alerts
    FOR SELECT
    TO anon
    USING (true);

-- Optional: Add a function to automatically delete old records
CREATE OR REPLACE FUNCTION delete_old_records()
RETURNS void AS $$
BEGIN
    DELETE FROM detections WHERE created_at < NOW() - INTERVAL '30 days';
    DELETE FROM alerts WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup weekly
-- You can set this up in Supabase Dashboard -> Database -> Extensions -> pg_cron
-- SELECT cron.schedule('cleanup-old-records', '0 0 * * 0', 'SELECT delete_old_records()');
