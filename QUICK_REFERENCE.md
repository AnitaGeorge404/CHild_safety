# 🚀 QUICK START - New Simplified Database

## ⚡ What You Need to Know:

### 1. **Detections table = IGNORED** ❌
   - Not used anymore
   - Will stay empty
   - Can be deleted if you want

### 2. **Alerts table = ONLY table used** ✅
   - Saves directly here
   - Only confidence >= 80%
   - Clean, meaningful data

### 3. **Clean up old data:**
   ```sql
   -- Run this in Supabase SQL Editor:
   DELETE FROM detections;
   DELETE FROM alerts WHERE confidence < 0.80;
   ```

### 4. **Test it:**
   - Start monitoring
   - Move device vigorously
   - Check `alerts` table in Supabase
   - Should see only high-confidence (80%+) records

---

## 📊 New Flow:

```
Motion >= 80% → Save to alerts table → Done! ✅
Motion < 80%  → Nothing saved        → Clean! ✅
```

---

## ✅ Checklist:

- [ ] Run cleanup SQL (above) in Supabase
- [ ] Refresh app (should auto-reload)
- [ ] Start monitoring
- [ ] Generate vigorous motion
- [ ] Check `alerts` table → Should have new records
- [ ] Check `detections` table → Should be empty

---

**That's it! Much simpler now.** 🎉

For details, see: `DIRECT_TO_ALERTS.md`
