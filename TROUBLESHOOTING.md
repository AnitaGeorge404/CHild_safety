# 🔧 Supabase Not Updating - Troubleshooting Guide

## ❓ Common Issues & Solutions

### Issue #1: Tables Don't Exist (Most Common!)

**Symptom:** 
- Database shows "✗ Error" 
- Browser console shows: "relation 'detections' does not exist"

**Solution:**
You haven't run the SQL schema yet! Follow these steps:

1. **Go to Supabase:**
   - Open: https://rlvgephkagtejlogudqo.supabase.co
   - Log in to your account

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar (icon: `</>`)

3. **Create New Query:**
   - Click "+ New Query" button

4. **Copy the Schema:**
   - Open `supabase-schema.sql` file
   - Press Ctrl+A (or Cmd+A on Mac) to select all
   - Press Ctrl+C (or Cmd+C) to copy

5. **Paste and Run:**
   - Paste into Supabase SQL Editor
   - Click "Run" button (or Ctrl+Enter)
   - You should see: "Success. No rows returned"

6. **Verify Tables Created:**
   - Click "Table Editor" in left sidebar
   - You should see 2 tables: `detections` and `alerts`

---

### Issue #2: Row Level Security (RLS) Blocking Inserts

**Symptom:**
- Browser console shows: "new row violates row-level security policy"
- Error code: 42501

**Solution:**
Make sure you ran the COMPLETE SQL schema including the policies section:

```sql
-- These policies MUST be included:
CREATE POLICY "Allow anonymous inserts to detections"
    ON detections
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous reads from detections"
    ON detections
    FOR SELECT
    TO anon
    USING (true);
```

**How to fix:**
1. Go to Supabase → Table Editor → `detections` table
2. Click "RLS" tab (Row Level Security)
3. You should see 2 green policies:
   - "Allow anonymous inserts to detections" ✅
   - "Allow anonymous reads from detections" ✅
4. If missing, run the SQL schema again!

---

### Issue #3: Environment Variables Not Loaded

**Symptom:**
- Console shows: "Missing Supabase environment variables"
- Variables are undefined

**Solution:**
1. Check `.env` file exists in project root
2. Restart the dev server:
   ```bash
   # Press Ctrl+C to stop
   npm run dev  # Start again
   ```
3. Environment variables only load when server starts!

---

### Issue #4: "Save to Database" is Disabled

**Symptom:**
- No errors, but nothing saves
- Database status stays "○ Ready"

**Solution:**
In the app UI, make sure the checkbox is enabled:
- ☑ **Save to Database** ← Must be CHECKED!

---

### Issue #5: Confidence Too Low

**Symptom:**
- Detections show in UI
- But nothing saves to database

**Solution:**
The app only saves detections with **confidence > 50%**

Check the "Current Detection" section:
- If confidence is below 50%, it won't save
- Try more vigorous movements to trigger higher confidence

---

### Issue #6: CORS or Network Issues

**Symptom:**
- Console shows CORS errors
- Network requests fail

**Solution:**
1. Check internet connection
2. Check Supabase project is active (not paused)
3. Try accessing: https://rlvgephkagtejlogudqo.supabase.co directly
4. If 404 or error, project may be suspended

---

## 🧪 Quick Test

### Test 1: Check Browser Console

1. Open app in browser
2. Press F12 (or Cmd+Option+I on Mac)
3. Click "Console" tab
4. Start monitoring
5. Move device
6. Look for errors in console

**What to look for:**
- ✅ "Detection saved to database: [uuid]" - Working!
- ❌ "relation 'detections' does not exist" - Run SQL schema
- ❌ "row-level security policy" - Fix RLS policies
- ❌ "Missing Supabase environment variables" - Restart server

### Test 2: Check Network Tab

1. Open browser Dev Tools (F12)
2. Click "Network" tab
3. Filter by "Fetch/XHR"
4. Start monitoring
5. Move device
6. Look for requests to `supabase.co`

**What to look for:**
- ✅ Status 200 or 201 - Success!
- ❌ Status 404 - Tables don't exist
- ❌ Status 403 - RLS policy blocking
- ❌ Status 500 - Server error

### Test 3: Manual Database Check

Try inserting manually in Supabase:

1. Go to Supabase → Table Editor → `detections`
2. Click "Insert" → "Insert row"
3. Fill in:
   - type: fall
   - confidence: 0.75
   - timestamp: 1705526400000
   - features: `{"magnitude": 10}`
4. Click "Save"

If this fails, RLS policies are the issue!

---

## 🔍 Step-by-Step Debugging

### Step 1: Verify Tables Exist

Run this in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('detections', 'alerts');
```

**Expected result:** 2 rows (detections, alerts)
**If 0 rows:** Run the SQL schema!

### Step 2: Check RLS Policies

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('detections', 'alerts');
```

**Expected result:** 4 policies (2 for each table)
**If less:** Run the SQL schema again!

### Step 3: Test Insert Manually

```sql
INSERT INTO detections (type, confidence, timestamp, features)
VALUES ('fall', 0.75, 1705526400000, '{"magnitude": 10}');
```

**If this works:** Problem is in the app code
**If this fails:** Problem is with RLS or schema

### Step 4: Check App Logs

In browser console, type:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

**Expected:** Both should print values
**If undefined:** Restart dev server!

---

## ✅ Checklist - Have you done all of these?

- [ ] Created Supabase account
- [ ] Created a project
- [ ] Copied project URL and anon key to `.env`
- [ ] Ran the COMPLETE `supabase-schema.sql` in SQL Editor
- [ ] Verified tables exist in Table Editor
- [ ] Verified RLS policies are enabled (green checkmarks)
- [ ] Restarted the dev server (`npm run dev`)
- [ ] Enabled "Save to Database" checkbox in app
- [ ] Started monitoring
- [ ] Generated motion with confidence > 50%
- [ ] Checked browser console for errors

---

## 📞 Still Not Working?

### Get Detailed Error Information

1. Open browser console (F12)
2. Click "Console" tab
3. Start monitoring and move device
4. Copy ANY error messages
5. Check what the error says:

**Common error messages and their fixes:**

| Error Message | What It Means | Solution |
|---------------|---------------|----------|
| "relation 'detections' does not exist" | Tables not created | Run SQL schema |
| "row-level security policy" | RLS blocking | Fix policies |
| "Missing Supabase environment variables" | .env not loaded | Restart server |
| "Failed to fetch" | Network issue | Check internet/Supabase status |
| "Invalid API key" | Wrong credentials | Check .env file |

---

## 🎯 Most Likely Cause

**90% of the time, the issue is:** 

# ❗ YOU HAVEN'T RUN THE SQL SCHEMA YET ❗

Go to: https://rlvgephkagtejlogudqo.supabase.co
→ SQL Editor
→ Copy `supabase-schema.sql`
→ Paste
→ Click RUN

That's it! 🚀
