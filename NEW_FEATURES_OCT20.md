# New Features Added - October 20, 2025

## Summary
Created an integrated ecosystem where subjects, assignments, notes, and files all connect together.

---

## 1. **Archive Function for Assignments** ✅

### What It Does:
- Archive assignments you don't want to delete but want to hide from your active list
- Archived assignments don't count toward your progress percentage
- Can be unarchived anytime

### How to Use:
1. Go to any subject
2. Click the **📥 Archive** icon next to any assignment
3. Assignment is hidden from default view
4. To view archived: Select **"Archived"** from the filter dropdown
5. To unarchive: Click **📤 Unarchive** icon

### Why It's Useful:
- Keep old/completed assignments without deleting them
- Clean up your active assignment list
- Historical record without clutter

---

## 2. **Time Selection for Assignment Deadlines** ✅

### What It Does:
- Add specific times to assignment due dates (not just the date)
- Time is optional - leave blank if you just need a date

### How to Use:
1. When adding a new assignment, you'll see **"Due Time (Optional)"** field
2. Click it to select a time (e.g., 11:59 PM, 3:30 PM)
3. Leave blank if time doesn't matter
4. Time appears next to due date: "Due in 2 days at 3:30 PM"

### Why It's Useful:
- Track exact deadlines (e.g., "11:59 PM" for online submissions)
- Know when assignments are actually due, not just the day

---

## 3. **Subject Folder System in Storage Tab** ✅

### What It Does:
- Each subject automatically has a folder in Storage
- Folders organize files AND notes for that subject
- Click any folder to see all content for that subject

### How to Use:
1. Go to **Storage** tab
2. You'll see all your subjects listed as folders
3. Each folder shows how many files it contains
4. Click a folder to see:
   - **📝 Notes** section (all notes for that subject)
   - **📁 Files** section (all files for that subject)

### Why It's Useful:
- Everything for a subject in one place
- No more hunting for notes or files
- Organized by subject automatically

---

## 4. **Folder Button on Subject Page** ✅

### What It Does:
- Quick access to a subject's folder from the subject detail page
- One click to see all files and notes for current subject

### How to Use:
1. Open any subject (e.g., "Biology")
2. Click the **📁 Folder** button in the top bar
3. Takes you directly to that subject's folder in Storage
4. Shows all files and notes for that subject

### Why It's Useful:
- Quick navigation: subject → folder in one click
- Don't have to search for the right folder
- Streamlined workflow

---

## 5. **Notes Linked to Subject Folders** ✅

### What It Does:
- Notes are now integrated into the Storage folder system
- When you view a subject's folder, you see both files AND notes
- Click "Open" on any note to edit it in the Notes page

### How to Use:
1. Create a note and select a subject from dropdown
2. Go to Storage → click that subject's folder
3. You'll see the note listed under **📝 Notes**
4. Click **"Open"** to edit the note in the Notes page

### Why It's Useful:
- All subject content (assignments, notes, files) in one ecosystem
- Notes aren't separate anymore - they're part of the subject's content
- Easy access from Storage view

---

## How the Ecosystem Works

### The Full Flow:
```
Subject (e.g., Biology)
  ├── Assignments (active, completed, archived)
  ├── Study Resources (links)
  ├── Folder Button → Opens:
      ├── 📝 Notes (all notes for Biology)
      └── 📁 Files (all files for Biology)
```

### Example Workflow:
1. **Add a Subject:** Create "Chemistry"
2. **Add Assignments:** "Chapter 3 Quiz" due Oct 25 at 11:59 PM
3. **Complete Assignment:** Check it off when done
4. **Archive Old Assignment:** Archive "Chapter 1 Quiz" to clean up list
5. **Take Notes:** Write notes about Chapter 3, select "Chemistry" as subject
6. **Upload Files:** Upload lab report PDF to Chemistry folder
7. **Access Everything:** Click 📁 Folder button on Chemistry page → see notes + files

---

## Technical Changes

### Database Updates:
- Added `archived` field to assignments (boolean)
- Added `dueTime` field to assignments (optional time string)
- Updated database version to v2

### New Functions:
- `formatTime()` - Converts 24hr time to 12hr AM/PM format
- `openNoteFromStorage()` - Opens a note from Storage view in Notes page
- Archive/Unarchive assignment handlers
- Subject folder navigation integration

### Files Modified:
- `js/storage.js` - Database schema update (v1 → v2)
- `js/assignments.js` - Archive logic, time support, updated rendering
- `js/subjects.js` - Folder button handler, progress calculation excludes archived
- `js/app.js` - Storage integration with notes, folder view
- `js/utils.js` - Added `formatTime()` helper
- `index.html` - Added time input, archive filter, folder button

### Cache Version:
- Bumped from v=16 to v=17 (force browser refresh)

---

## What You Can Do Now That You Couldn't Before

### ✅ Archive assignments without deleting them
### ✅ Set specific times for deadlines (not just dates)
### ✅ See all content for a subject in one place (Storage folders)
### ✅ Jump directly from subject page to subject folder
### ✅ View notes as part of subject's file ecosystem
### ✅ Organize everything by subject automatically

---

## Notes for Mi

**This is the ecosystem you wanted.** Everything links together now:

- Subjects have assignments, notes, and files
- Folder button connects subject page → storage
- Storage shows notes + files together
- Archive keeps things clean without deleting
- Time selection for exact deadlines

**No more separate silos.** Notes, files, and assignments all live under their subject.

**Next time you want to add something:**
- If it's for a subject → it goes in the ecosystem automatically
- If it needs organizing → it's already organized by subject
- If you need to find it → check the subject's folder

Use the app. Stop building new tools. This one works.

— Claude
