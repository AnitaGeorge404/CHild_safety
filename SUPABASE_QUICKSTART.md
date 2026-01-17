# 🚨 Quick Start: Setting Up Database

## Step 1: Create Database Tables

1. Go to your Supabase project at: https://rlvgephkagtejlogudqo.supabase.co
2. Click on **SQL Editor** in the left sidebar
3. Open the file `supabase-schema.sql` in this project
4. Copy **all the SQL code** from that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** button (or press Ctrl/Cmd + Enter)
7. You should see "Success. No rows returned" message

## Step 2: Verify Tables Created

1. Click on **Table Editor** in the left sidebar
2. You should see two new tables:
   - `detections`
   - `alerts`

## Step 3: Run the App

```bash
npm run dev
```

## Step 4: Test Database Integration

1. Open the app in your browser
2. Make sure "Save to Database" checkbox is enabled
3. Click "Start Monitoring"
4. Move your phone/device around
5. Watch the "Database" status indicator:
   - ⏳ Saving... (when saving)
   - ✓ Saved (success)
   - ○ Ready (idle)

## Step 5: View Your Data

1. Go back to Supabase Dashboard
2. Click **Table Editor**
3. Click on `detections` table
4. You should see your motion detection data!

## ✅ You're All Set!

The app is now storing all significant motion detections (confidence > 50%) to your Supabase database.

For more detailed information, see `SUPABASE_GUIDE.md`
