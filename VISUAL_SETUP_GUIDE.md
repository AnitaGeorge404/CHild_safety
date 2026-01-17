# 📸 Visual Setup Guide

## Step-by-Step Screenshots Guide

### 🔧 Setting Up Your Supabase Database

#### Step 1: Open Supabase SQL Editor

1. Go to: **https://rlvgephkagtejlogudqo.supabase.co**
2. Log in to your Supabase account
3. On the left sidebar, click **"SQL Editor"** (icon looks like `</>`)

#### Step 2: Prepare the SQL Script

1. In VS Code, open the file: `supabase-schema.sql`
2. Press `Ctrl+A` (Windows/Linux) or `Cmd+A` (Mac) to select all
3. Press `Ctrl+C` (Windows/Linux) or `Cmd+C` (Mac) to copy

#### Step 3: Run the SQL Script

1. Back in Supabase SQL Editor
2. Click on **"+ New Query"** button (top right)
3. Paste your copied SQL (Ctrl+V or Cmd+V)
4. Click the **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
5. You should see: **"Success. No rows returned"** (this is good!)

#### Step 4: Verify Tables Were Created

1. On the left sidebar, click **"Table Editor"** (icon looks like a table grid)
2. You should now see TWO new tables:
   - **`detections`** ← stores all motion detections
   - **`alerts`** ← stores triggered alerts

3. Click on **`detections`** table
   - You should see columns: id, type, confidence, timestamp, features, device_info, created_at
   - It will be empty at first (no data yet)

4. Click on **`alerts`** table
   - Similar columns with detection_id reference
   - Also empty initially

#### Step 5: Check RLS Policies (Optional)

1. While viewing a table, click on the **"RLS"** tab
2. You should see two policies:
   - ✅ "Allow anonymous inserts to [table]"
   - ✅ "Allow anonymous reads from [table]"
3. Both should be **enabled** (green checkmarks)

### 🚀 Testing the Integration

#### Step 1: Start Your App

```bash
cd /home/user/CHild_safety
npm run dev
```

Open in browser (usually http://localhost:5173)

#### Step 2: Look at the UI

You should see:
- **System Status** section with 5 status indicators:
  - Sensors: ✓ Available
  - Permission: granted / Not Required
  - Monitoring: ○ Inactive
  - Buffer: 0 samples
  - **Database: ○ Ready** ← NEW!

#### Step 3: Enable Database Saving

In the **Controls** section, you'll see:
- ☑ Enable Alerts
- ☑ Enable Sound
- ☑ **Save to Database** ← Make sure this is CHECKED!

#### Step 4: Start Monitoring

1. Click **"▶ Start Monitoring"** button
2. If on iOS, you may need to allow motion permissions
3. Status should change to: **Monitoring: ● Active**

#### Step 5: Generate Some Motion

1. Pick up your phone/device
2. Move it around gently
3. Try different movements:
   - Wave it side to side
   - Move it up and down
   - Rotate it

#### Step 6: Watch the Database Indicator

As you move the device, watch the **Database** status:
- **○ Ready** - Idle, waiting
- **⏳ Saving...** - Currently saving to database
- **✓ Saved** - Successfully saved!
- **✗ Error** - Something went wrong

#### Step 7: Check Your Data in Supabase

1. Go back to Supabase Dashboard
2. Click **"Table Editor"** → **`detections`**
3. You should see rows appearing! Each row shows:
   - Type: fall / violent_movement / abnormal_motion
   - Confidence: 0.50 - 1.00
   - Timestamp: when it was detected
   - Features: JSON data with motion details
   - Device info: your browser/device info

4. Click on **`alerts`** table
   - If any high-confidence detections triggered alerts, you'll see them here

### 🔍 Understanding the Data

#### In the `detections` table:

**Confidence Level:**
- 0.50 - 0.74: Detected motion, but below alert threshold
- 0.75 - 0.89: High confidence, likely triggers alert
- 0.90 - 1.00: Very high confidence, definite alert

**Type:**
- `fall`: Free fall → impact → inactivity sequence
- `violent_movement`: Sudden shaking, impacts, throws
- `abnormal_motion`: Unusual sustained motion patterns

**Features (JSON):**
```json
{
  "magnitude": 12.5,
  "peakAcceleration": 18.3,
  "averageAcceleration": 8.2,
  "jerk": 95.4,
  "rotationMagnitude": 250.0,
  "variance": 10.5
}
```

### 📊 Query Your Data

In Supabase SQL Editor, try these queries:

**Get today's detections:**
```sql
SELECT * FROM detections 
WHERE created_at >= CURRENT_DATE 
ORDER BY created_at DESC;
```

**Count detections by type:**
```sql
SELECT type, COUNT(*) as count 
FROM detections 
GROUP BY type;
```

**Get high-confidence events:**
```sql
SELECT * FROM detections 
WHERE confidence > 0.8 
ORDER BY confidence DESC;
```

**Get alerts with their detections:**
```sql
SELECT 
  a.alert_triggered_at,
  a.type,
  a.confidence,
  d.features
FROM alerts a
LEFT JOIN detections d ON a.detection_id = d.id
ORDER BY a.created_at DESC;
```

### ✅ Success Indicators

You'll know everything is working when:

1. ✅ Tables visible in Supabase Table Editor
2. ✅ App shows "Database: ○ Ready" status
3. ✅ Motion generates "Database: ⏳ Saving..." → "✓ Saved"
4. ✅ Data appears in Supabase `detections` table
5. ✅ High-confidence events appear in `alerts` table
6. ✅ No errors in browser console (F12)

### ❌ Troubleshooting Checklist

**If Database shows "✗ Error":**
- [ ] SQL schema was run successfully?
- [ ] Tables exist in Supabase?
- [ ] RLS policies are enabled?
- [ ] `.env` file exists with correct credentials?
- [ ] "Save to Database" is checked?
- [ ] Internet connection is working?
- [ ] Check browser console (F12) for errors

**If no data appears in Supabase:**
- [ ] Is monitoring active? (● Active)
- [ ] Are you generating enough motion?
- [ ] Is confidence > 0.5? (check browser console logs)
- [ ] Did you refresh the Supabase table view?
- [ ] Check browser Network tab for failed requests

### 🎉 You're Done!

Once you see data in your Supabase tables, you've successfully integrated the database!

**What you can do now:**
- Monitor real-time motion detections
- Analyze patterns in your data
- Build custom queries and reports
- Set up notifications (future enhancement)
- Export data for analysis

---

**Need help?** Check these files:
- `SUPABASE_QUICKSTART.md` - Quick reference
- `SUPABASE_GUIDE.md` - Full documentation
- `INTEGRATION_COMPLETE.md` - Overview of changes

Happy monitoring! 🛡️
