# Supabase Integration Guide

## 🎯 Overview

The Child Safety Detection app is now integrated with Supabase to store detection events and alerts in a cloud database.

## 📋 Setup Instructions

### 1. Database Setup

1. Go to your Supabase project: https://rlvgephkagtejlogudqo.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Copy and paste the contents of `supabase-schema.sql` into the editor
4. Click **Run** to create the tables and policies

This will create:
- `detections` table - Stores all motion detection events
- `alerts` table - Stores triggered alerts
- Indexes for query performance
- Row Level Security (RLS) policies for access control

### 2. Environment Variables

The `.env` file has been created with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://rlvgephkagtejlogudqo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Running the Application

```bash
npm run dev
```

The app will automatically connect to Supabase when the "Save to Database" option is enabled.

## 🗄️ Database Schema

### Detections Table
```sql
detections (
    id UUID PRIMARY KEY,
    type TEXT,
    confidence DECIMAL,
    timestamp BIGINT,
    features JSONB,
    device_info TEXT,
    created_at TIMESTAMPTZ
)
```

### Alerts Table
```sql
alerts (
    id UUID PRIMARY KEY,
    detection_id UUID,
    type TEXT,
    confidence DECIMAL,
    timestamp BIGINT,
    alert_triggered_at TIMESTAMPTZ,
    device_info TEXT,
    created_at TIMESTAMPTZ
)
```

## 🔧 Features

### Automatic Data Storage
- Detections with confidence > 50% are automatically saved
- Alerts are saved with reference to their detection event
- Device information is captured for analytics

### Database Service API

```typescript
// Save a detection
const detectionId = await DatabaseService.saveDetection(detection);

// Save an alert
await DatabaseService.saveAlert(detection, detectionId);

// Get recent detections
const detections = await DatabaseService.getRecentDetections(50);

// Get recent alerts
const alerts = await DatabaseService.getRecentAlerts(50);

// Get statistics
const stats = await DatabaseService.getStatistics();

// Cleanup old records
await DatabaseService.deleteOldRecords(30); // Delete records older than 30 days
```

### UI Features
- **Database Status Indicator**: Shows saving status in real-time
- **Toggle Database Saving**: Enable/disable database storage
- All detections and alerts are stored automatically when enabled

## 📊 Viewing Data in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. Select `detections` or `alerts` table
4. View, filter, and analyze your data

You can also use the SQL Editor to run custom queries:

```sql
-- Get all fall detections
SELECT * FROM detections WHERE type = 'fall' ORDER BY created_at DESC;

-- Get high-confidence alerts
SELECT * FROM alerts WHERE confidence > 0.8 ORDER BY created_at DESC;

-- Get detection statistics by type
SELECT type, COUNT(*) as count, AVG(confidence) as avg_confidence
FROM detections
GROUP BY type;
```

## 🔐 Security Notes

- **Row Level Security (RLS)** is enabled on all tables
- Anonymous users can insert and read data (adjust policies as needed)
- For production, consider adding authentication
- API keys are exposed in frontend - use appropriate RLS policies

## 🧹 Data Retention

The schema includes an optional cleanup function that deletes records older than 30 days. You can schedule this using pg_cron:

```sql
SELECT cron.schedule('cleanup-old-records', '0 0 * * 0', 'SELECT delete_old_records()');
```

## 📈 Potential Enhancements

1. **User Authentication**: Add Supabase Auth to track users
2. **Real-time Subscriptions**: Listen to database changes in real-time
3. **Dashboard**: Create analytics dashboard using the stored data
4. **Notifications**: Set up database triggers for email/SMS alerts
5. **Export Data**: Add functionality to export data as CSV/JSON
6. **Charts**: Visualize detection patterns over time

## 🐛 Troubleshooting

### Database Connection Issues
- Check that environment variables are correctly set
- Verify Supabase project is active
- Check browser console for error messages

### Data Not Saving
- Ensure "Save to Database" is enabled in the UI
- Check that tables were created correctly
- Verify RLS policies allow inserts
- Check browser console for errors

### Permission Errors
- Make sure RLS policies are set up correctly
- Verify anon key has proper permissions
- Check Supabase logs for detailed error messages

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
