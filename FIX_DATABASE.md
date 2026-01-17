
# 🚨 DATABASE NOT UPDATING? READ THIS!

## 📌 **Most Likely Issue: You Haven't Run the SQL Schema**

### The #1 reason data doesn't save: **Tables don't exist yet!**

## 🔧 **Quick Fix (5 minutes)**

### Step 1: Run the SQL Schema

1. **Go to:** https://rlvgephkagtejlogudqo.supabase.co
2. **Click:** "SQL Editor" (left sidebar, icon looks like `</>`)
3. **Click:** "+ New Query" button (top right)
4. **In VS Code:** Open `supabase-schema.sql`
5. **Select all:** Ctrl+A (Windows) or Cmd+A (Mac)
6. **Copy:** Ctrl+C or Cmd+C
7. **Back to Supabase:** Paste the code (Ctrl+V or Cmd+V)
8. **Run:** Click the "Run" button or press Ctrl+Enter
9. **Success:** You should see "Success. No rows returned"

### Step 2: Verify Tables Created

1. **Click:** "Table Editor" (left sidebar, grid icon)
2. **Check:** You should see TWO tables:
   - ✅ `detections`
   - ✅ `alerts`
3. **If you see them:** You're done! Tables are ready.
4. **If you don't see them:** The SQL didn't run - try again

### Step 3: Test It

1. **Restart your app:**
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

2. **Open in browser** (usually http://localhost:5173)

3. **Enable monitoring:**
   - Check ☑ "Save to Database"
   - Click "▶ Start Monitoring"

4. **Move your device** vigorously

5. **Check console** (Press F12):
   - Should see: `✅ Detection saved to database`
   - Watch for: "Database: ✓ Saved" in the UI

6. **Verify in Supabase:**
   - Go to Table Editor → `detections`
   - Click Refresh
   - You should see data!

---

## 🔍 **How to Check What's Wrong**

### Open Browser Console (This is IMPORTANT!)

1. **Open app in browser**
2. **Press F12** (or right-click → Inspect)
3. **Click "Console" tab**
4. **Start monitoring and move device**
5. **Read the error messages**

### What the errors mean:

| Error Message | What It Means | How to Fix |
|---------------|---------------|------------|
| `relation 'detections' does not exist` | **Tables not created** | Run SQL schema! |
| `row-level security policy` | **RLS blocking** | Run FULL SQL schema with policies |
| `Missing Supabase environment variables` | **.env not loaded** | Restart server |
| `Failed to fetch` | **Network issue** | Check internet/Supabase status |
| Nothing at all | **Confidence too low** | Move device more vigorously |

---

## 📝 **Checklist - Have You Done All These?**

- [ ] Created Supabase account
- [ ] Created a Supabase project  
- [ ] Copied URL and key to `.env` file
- [ ] **RAN THE ENTIRE `supabase-schema.sql` IN SUPABASE SQL EDITOR** ⭐⭐⭐
- [ ] Verified `detections` and `alerts` tables exist in Table Editor
- [ ] Restarted the dev server (`npm run dev`)
- [ ] Opened app in browser
- [ ] Checked ☑ "Save to Database" checkbox
- [ ] Pressed F12 to open console
- [ ] Started monitoring
- [ ] Moved device vigorously
- [ ] Checked console for messages

---

## 💡 **Still Having Issues?**

### Check these files for more help:

1. **`DATABASE_CHECKLIST.md`** - Simple step-by-step checklist
2. **`TROUBLESHOOTING.md`** - Detailed debugging guide
3. **`VISUAL_SETUP_GUIDE.md`** - Screenshots and visual guide
4. **`SUPABASE_GUIDE.md`** - Complete documentation

### Get detailed error info:

1. Open browser console (F12)
2. Copy any error messages
3. The error will usually tell you exactly what's wrong!

---

## 🎯 **99% of the time, the fix is:**

# ⚡ RUN THE SQL SCHEMA ⚡

```sql
-- Go to: https://rlvgephkagtejlogudqo.supabase.co
-- Click: SQL Editor
-- Copy: supabase-schema.sql
-- Paste: Into the editor
-- Click: Run
```

That's it! Your data should start saving immediately after this.

---

## ✅ **How to Know It's Working**

### In the App UI:
- "Database: ○ Ready" → "Database: ⏳ Saving..." → "Database: ✓ Saved"

### In Browser Console:
```
✅ Detection saved to database: abc123...
```

### In Supabase:
- Table Editor → `detections` → Refresh → See rows!

---

**Need more help?** Check the console (F12) - it has detailed error messages with solutions! 🚀
