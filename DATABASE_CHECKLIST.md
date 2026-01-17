# ✅ Database Not Updating? Follow This Checklist!

## Step 1: Did you run the SQL schema?

**This is THE MOST IMPORTANT step!**

1. Open: https://rlvgephkagtejlogudqo.supabase.co
2. Click **"SQL Editor"** (left sidebar)
3. Click **"+ New Query"**
4. Open file `supabase-schema.sql` in VS Code
5. Copy **EVERYTHING** (Ctrl+A, Ctrl+C)
6. Paste into Supabase (Ctrl+V)
7. Click **"Run"** button
8. Should see: "Success. No rows returned"

### Verify it worked:
1. Click **"Table Editor"** (left sidebar)
2. You should see 2 tables:
   - ✅ `detections`
   - ✅ `alerts`

**If you don't see these tables, the SQL didn't run correctly!**

---

## Step 2: Check the browser console

1. Open your app in browser
2. Press **F12** (or Cmd+Option+I on Mac)
3. Click **"Console"** tab
4. Start monitoring
5. Move your device
6. Look for messages

### What you should see:
```
📊 Attempting to save detection: {...}
🔄 Sending detection to Supabase...
✅ Detection saved successfully: {...}
✅ Detection saved to database: <uuid>
```

### If you see errors:
```
❌ Supabase error saving detection
```
Read the error message - it will tell you what's wrong!

---

## Step 3: Make sure "Save to Database" is enabled

In the app, look for:
- ☑ **Save to Database** ← Must be CHECKED

If it's unchecked, nothing will save!

---

## Step 4: Generate enough motion

The app only saves detections with **confidence > 50%**

Try:
- Shaking the phone vigorously
- Moving it in large motions
- Spinning/rotating it quickly

Small gentle movements won't trigger saves.

---

## Step 5: Restart the dev server

Sometimes environment variables don't load:

```bash
# Press Ctrl+C to stop
npm run dev  # Start again
```

---

## 🔍 Quick Test - Is it working?

### Test in Supabase directly:

1. Go to: https://rlvgephkagtejlogudqo.supabase.co
2. Click **"Table Editor"** → **`detections`**
3. Click **"Insert"** → **"Insert row"**
4. Fill in:
   - type: `fall`
   - confidence: `0.75`
   - timestamp: `1705526400000`
   - features: `{"magnitude": 10}`
   - device_info: `test`
5. Click **"Save"**

### If this works:
✅ Database is set up correctly
✅ Problem is in the app code
✅ Check browser console for errors

### If this fails with "policy" error:
❌ RLS policies weren't created
❌ Run the SQL schema again (the FULL file!)

---

## 📊 Check Your Data

If everything is working:

1. Go to Supabase
2. Click **"Table Editor"** → **`detections`**
3. Click **"Refresh"** button
4. You should see rows appearing!

Each row = one detection event

---

## 🆘 Still not working?

Open `TROUBLESHOOTING.md` for detailed debugging steps.

Check browser console (F12) and share the error messages.

Most common fixes:
1. ✅ Run the SQL schema
2. ✅ Check "Save to Database" is enabled
3. ✅ Restart dev server
4. ✅ Generate vigorous motion (confidence > 50%)
5. ✅ Check internet connection
