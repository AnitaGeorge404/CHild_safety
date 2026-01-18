-- Child/Monitored Person Profiles Schema
-- Run this in Supabase SQL Editor AFTER running supabase-schema.sql

-- Create monitored_persons table
CREATE TABLE IF NOT EXISTS monitored_persons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    relation TEXT NOT NULL, -- e.g., 'Child', 'Dependent', 'Elder'
    phone TEXT NOT NULL,
    device_id TEXT UNIQUE, -- unique identifier for their device
    device_connected BOOLEAN DEFAULT true,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create location_updates table for tracking real-time location
CREATE TABLE IF NOT EXISTS location_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    person_id UUID REFERENCES monitored_persons(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    accuracy DECIMAL(10, 2), -- in meters
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audio_recordings table
CREATE TABLE IF NOT EXISTS audio_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    person_id UUID REFERENCES monitored_persons(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add person_id to alerts table to link alerts to monitored persons
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES monitored_persons(id) ON DELETE CASCADE;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS address TEXT;

-- Add person_id to detections table
ALTER TABLE detections ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES monitored_persons(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_monitored_persons_device_id ON monitored_persons(device_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_person_id ON location_updates(person_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_created_at ON location_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_alert_id ON audio_recordings(alert_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_person_id ON audio_recordings(person_id);
CREATE INDEX IF NOT EXISTS idx_alerts_person_id ON alerts(person_id);
CREATE INDEX IF NOT EXISTS idx_detections_person_id ON detections(person_id);

-- Enable Row Level Security
ALTER TABLE monitored_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anonymous access (adjust based on your needs)
CREATE POLICY "Allow anonymous reads from monitored_persons"
    ON monitored_persons FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous inserts to monitored_persons"
    ON monitored_persons FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous updates to monitored_persons"
    ON monitored_persons FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anonymous reads from location_updates"
    ON location_updates FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous inserts to location_updates"
    ON location_updates FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous reads from audio_recordings"
    ON audio_recordings FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous inserts to audio_recordings"
    ON audio_recordings FOR INSERT TO anon WITH CHECK (true);

-- Function to automatically update last_seen timestamp
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE monitored_persons
    SET last_seen = NOW()
    WHERE id = NEW.person_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_seen when new alert is created
CREATE TRIGGER update_person_last_seen_on_alert
    AFTER INSERT ON alerts
    FOR EACH ROW
    WHEN (NEW.person_id IS NOT NULL)
    EXECUTE FUNCTION update_last_seen();

-- Trigger to update last_seen when new location update is created
CREATE TRIGGER update_person_last_seen_on_location
    AFTER INSERT ON location_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_last_seen();

-- Function to get latest location for a person
CREATE OR REPLACE FUNCTION get_latest_location(person_uuid UUID)
RETURNS TABLE (
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    timestamp BIGINT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT l.latitude, l.longitude, l.address, l.timestamp, l.created_at
    FROM location_updates l
    WHERE l.person_id = person_uuid
    ORDER BY l.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (OPTIONAL - remove in production)
-- INSERT INTO monitored_persons (name, relation, phone, device_id)
-- VALUES ('Sathyameva Jayadha', 'Child', '+91 98765 43210', 'device-001');
