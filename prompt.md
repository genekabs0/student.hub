# Student Task Manager Web App - Build Instructions for Claude Code

## Project Overview
Build a clean, functional student task management web application with a focus on simplicity and usability. This is an MVP (Minimum Viable Product) focused on core features that help students organize their schoolwork effectively.

## Core Philosophy
- **Clean, modern UI** with dark mode (black background, white text, smooth transitions)
- **Student-centric design** - no clutter, intuitive navigation
- **Local storage** - all data saved on user's device
- **Responsive** - works on desktop primarily, but should be usable on tablets

---

## Technical Stack Recommendations

### Frontend
- **HTML5, CSS3, JavaScript (Vanilla or React)** - your choice based on what's best
- **Chart.js** or **Recharts** - for circular progress graphs
- **LocalStorage API** - for data persistence
- **Modern CSS** with Flexbox/Grid for layouts
- **Font**: Use a clean sans-serif like Inter, Roboto, or system fonts

### Styling
- Dark mode by default: `#000000` background, `#FFFFFF` primary text, `#808080` secondary text
- Accent colors: Choose a pleasant accent (suggest: `#4A90E2` blue or `#00D9FF` cyan)
- Smooth transitions on all interactive elements
- Border radius: 8-12px for cards/buttons for modern feel
- Box shadows for depth where needed

---

## Feature Specifications

### 1. Subject Management System

**Functionality:**
- Create subject folders/cards (e.g., "Math", "Biology", "History")
- Each subject is a clickable card on the main dashboard
- Delete subjects (with confirmation prompt)
- Edit subject names
- Color coding option for each subject (user can pick from 6-8 preset colors)

**UI Design:**
- Display subjects as cards in a grid layout (3-4 columns on desktop, responsive on smaller screens)
- Each card shows:
  - Subject name
  - Small circular progress indicator (% of assignments completed)
  - Color bar at top or left edge of card
  - Hover effect: slight elevation/glow
  - Click to enter subject detail view

**Data Structure:**
```javascript
subject = {
  id: unique_id,
  name: "Biology",
  color: "#4A90E2",
  assignments: [],
  links: [],
  createdAt: timestamp
}
```

---

### 2. Assignment Management

**Functionality:**
- Inside each subject, user can add assignments
- Each assignment has:
  - Assignment name/title
  - Due date (date picker)
  - Checkbox to mark complete/incomplete
  - Optional notes field
- List view of all assignments within a subject
- Sort by: due date (ascending), completion status
- Filter: Show all / Show incomplete / Show completed

**UI Design:**
- Assignment list with clean rows
- Checkbox on left
- Assignment name in center (strike-through when completed)
- Due date on right (color-coded: red if overdue, yellow if due within 2 days, green if >2 days away)
- Click row to expand and show notes field
- "Add Assignment" button at top (prominent, accent color)

**Circular Progress Graph:**
- Display at top of each subject view
- Shows percentage of assignments completed in that subject
- Animated circular progress bar (Chart.js doughnut chart or CSS-based)
- Center text: "X/Y Complete" or "Y% Done"
- Updates in real-time as assignments are checked/unchecked

**Data Structure:**
```javascript
assignment = {
  id: unique_id,
  subjectId: subject_id,
  title: "Chapter 5 Quiz",
  dueDate: "2025-10-20",
  completed: false,
  notes: "Focus on sections 5.2-5.4",
  createdAt: timestamp
}
```

---

### 3. Links Management

**Functionality:**
- Each subject can have multiple links (YouTube videos, websites, articles)
- User adds link with:
  - Link URL
  - Link title/label (auto-generated from URL if user doesn't provide)
  - Optional description
- Clicking a link opens it in a new browser tab (target="_blank")
- Delete links

**UI Design:**
- Section below assignments labeled "Study Resources" or "Links"
- Display as a list with icons (🔗 or similar)
- Link title as clickable text
- Hover shows full URL in tooltip
- "Add Link" button

**Data Structure:**
```javascript
link = {
  id: unique_id,
  subjectId: subject_id,
  url: "https://youtube.com/watch?v=...",
  title: "Photosynthesis Explained",
  description: "Khan Academy video",
  createdAt: timestamp
}
```

---

### 4. Embedded Google Search (Future: In-app)

**For MVP:**
- Create a "Quick Search" button in the navigation
- Clicking it opens Google in a new tab with a simple search pre-filled (e.g., google.com/search?q=)
- User can type their query before clicking

**Future Implementation Note:**
- Later can be upgraded to iframe embed or custom search integration
- For now, external tab is sufficient

---

### 5. Notes System

**Functionality:**
- Global notes section accessible from left sidebar navigation
- Rich text editor with:
  - Bold (Ctrl+B)
  - Italic (Ctrl+I)
  - Underline (Ctrl+U)
  - Highlight (background color picker with 4-5 preset colors)
  - Bullet/numbered lists
  - Headers (H1, H2, H3)
- Notes can be organized by subject (dropdown selector at top of note)
- Auto-save (save to localStorage every 3 seconds while typing)
- Search within notes (simple text search)

**UI Design:**
- Full-width editor when notes tab is active
- Toolbar at top with formatting buttons (icon-based, tooltips on hover)
- Clean white/light gray text area on dark background
- Timestamp at bottom: "Last edited: Oct 16, 2025 at 3:45 PM"
- List view of all notes (left panel) + editor (right panel) layout

**Editor Library Recommendation:**
- Use **Quill.js** or **TinyMCE** for rich text editing
- Or build custom with `contenteditable` div and `document.execCommand()` for simplicity

**Data Structure:**
```javascript
note = {
  id: unique_id,
  subjectId: subject_id (optional),
  title: "Biology Study Notes",
  content: "<p><strong>Cell Division</strong>: ...</p>",
  lastEdited: timestamp,
  createdAt: timestamp
}
```

---

### 6. Edgenuity Progress Tracker

**Functionality (No API - Manual Input):**
- Create a dedicated "Edgenuity" tab in navigation
- User manually inputs:
  - Total number of assignments in Edgenuity
  - Number of assignments completed
  - Or: Enter percentage directly
- Display a progress bar and circular graph showing overall Edgenuity completion
- Optional: Track per-subject Edgenuity progress (user creates entries like "Edgenuity Math", "Edgenuity English")

**UI Design:**
- Clean dashboard showing:
  - Large circular progress chart (overall completion)
  - Number of assignments remaining
  - Estimated completion date (if user inputs average assignments/week)
- Simple form to update numbers
- "Update Progress" button

**Data Structure:**
```javascript
edgenuityProgress = {
  totalAssignments: 120,
  completedAssignments: 45,
  subjects: [
    { name: "Math", total: 30, completed: 15 },
    { name: "English", total: 40, completed: 20 }
  ],
  lastUpdated: timestamp
}
```

---

### 7. Calendar & Task Scheduling

**Functionality:**
- Monthly calendar view
- Click a date to see assignments due that day (from all subjects)
- Click a date to add tasks/reminders (not tied to specific subjects)
- Visual indicators:
  - Dots or badges on dates with assignments/tasks
  - Color-coded by urgency (red = overdue/due today, yellow = due within 2 days)
- "Today" view: Dashboard showing all assignments/tasks due today
- Weekly view (optional): Show current week with tasks laid out

**UI Design:**
- Calendar in center of screen when "Calendar" tab is clicked
- Month navigation arrows
- Clean grid layout
- Selected date highlights
- Right sidebar shows details of selected date's tasks
- "Add Task" button for the selected date

**Library Recommendation:**
- Use **FullCalendar.js** or build custom with CSS Grid

**Reminders:**
- Browser notifications (request permission on first load)
- Show notification when:
  - Assignment is due today
  - Assignment is due tomorrow (notification at 8 AM)
- User can dismiss or snooze reminders

**Data Structure:**
```javascript
calendarTask = {
  id: unique_id,
  date: "2025-10-20",
  title: "Study for Chemistry test",
  type: "reminder", // or "assignment" if pulled from assignments
  assignmentId: id (if linked to an assignment),
  completed: false
}
```

---

### 8. File Storage System

**Functionality:**
- Users can upload files to their device storage (saved in browser LocalStorage as Base64 or using IndexedDB for larger files)
- Organize files by subject (folders)
- Supported file types (for MVP): PDF, DOCX, TXT, images (PNG, JPG)
- Download files back to device
- Delete files

**UI Design:**
- "Storage" tab in navigation
- Folder structure mimicking subject organization
- Click folder → see files
- File list with icons (based on file type), file name, file size, upload date
- "Upload File" button (drag-and-drop support is a nice bonus)
- Right-click file for options: Download, Delete

**Storage Solution:**
- Use **IndexedDB** (more space than LocalStorage)
- Library: **Dexie.js** or **localForage** for easier IndexedDB management

**Data Structure:**
```javascript
file = {
  id: unique_id,
  subjectId: subject_id,
  fileName: "Chapter5Notes.pdf",
  fileType: "application/pdf",
  fileSize: 2048000, // bytes
  fileData: base64_or_blob,
  uploadedAt: timestamp
}
```

---

### 9. Focus Mode Timer

**Functionality:**
- Simple Pomodoro-style timer
- User sets duration (default: 25 minutes)
- Start/Pause/Reset buttons
- Option to hide timer (minimize to small corner icon that shows remaining time on hover)
- Sound notification when timer ends (optional, user toggle)
- Track total focus time per day/week (display in dashboard stats)

**UI Design:**
- Timer widget accessible from navigation or floating button
- Large, clean display of time remaining (MM:SS format)
- Circular progress ring around timer (fills as time progresses)
- Minimal controls
- Can be dragged around screen (optional feature)

**Data Structure:**
```javascript
focusSession = {
  id: unique_id,
  duration: 1500, // seconds (25 min)
  startTime: timestamp,
  endTime: timestamp,
  completed: true/false,
  subjectId: subject_id (optional - user can tag session to subject)
}
```

---

### 10. Spin the Wheel (Subject Selector)

**Functionality:**
- Randomizer to pick a subject to study when user is indecisive
- Wheel displays all subjects (or filtered by category)
- Simple probability: equal chance for each subject by default
- Spin animation
- Displays result: "Study [Subject] now!"
- Optional: Simple rule to avoid picking same subject twice in a row (store last result)

**UI Design:**
- Accessible from dashboard (floating button or in navigation)
- Animated spinning wheel (use Canvas or SVG)
- Each segment labeled with subject name and color
- "Spin" button in center
- Result displays in modal or banner after spin completes

**Implementation:**
- Use Canvas API or a library like **Wheel of Fortune** (lightweight JS wheel libraries exist)
- Basic algorithm:
  ```javascript
  let subjects = getAllSubjects();
  let lastSpun = localStorage.getItem('lastSpunSubject');
  
  // Remove last spun subject from options
  subjects = subjects.filter(s => s.id !== lastSpun);
  
  // Pick random
  let randomIndex = Math.floor(Math.random() * subjects.length);
  let selectedSubject = subjects[randomIndex];
  
  // Save for next time
  localStorage.setItem('lastSpunSubject', selectedSubject.id);
  
  return selectedSubject;
  ```

**Data Structure:**
- Uses existing subject data
- Store: `lastSpunSubject: subject_id` in localStorage

---

## Navigation Structure

**Left Sidebar (Always Visible):**
- Logo/App Name at top
- Navigation links:
  - 🏠 Dashboard (shows all subjects)
  - 📝 Notes
  - 📅 Calendar
  - 💾 Storage
  - 📚 Edgenuity
  - ⏱️ Focus Timer
  - 🎯 Spin the Wheel
  - ⚙️ Settings

**Top Bar:**
- Current page title
- Quick search button (opens Google in new tab for now)
- User profile icon (future: for multi-user support)
- Dark mode toggle (even though default is dark, allow light mode option)

---

## Settings Page

**Options to Include:**
- Change app name/title (personalization)
- Default timer duration for Focus Mode
- Enable/disable notifications
- Clear all data (with strong confirmation)
- Export data as JSON (backup)
- Import data from JSON (restore)
- About section (version, credits)

---

## Data Persistence

**Use LocalStorage for:**
- User settings
- Subject list
- Small data like lastSpunSubject, theme preference

**Use IndexedDB for:**
- Assignments (can grow large)
- Notes content
- File uploads
- Focus session history

**Backup/Export Feature:**
- Button in settings to download all data as a JSON file
- User can save this file and re-import later if they switch devices or clear browser data

---

## UI/UX Guidelines

### Color Palette (Dark Mode)
- **Background**: `#000000` (pure black) or `#0D0D0D` (softer black)
- **Cards/Panels**: `#1A1A1A` or `#1E1E1E`
- **Primary Text**: `#FFFFFF`
- **Secondary Text**: `#A0A0A0` or `#B3B3B3`
- **Accent**: `#4A90E2` (blue) or choose your own
- **Success**: `#28A745` (green for completed tasks)
- **Warning**: `#FFC107` (yellow for due soon)
- **Danger**: `#DC3545` (red for overdue)

### Typography
- **Font**: Inter, Roboto, or system fonts (San Francisco on Mac, Segoe UI on Windows)
- **Sizes**:
  - Headers: 24-32px
  - Body: 14-16px
  - Small text: 12px
- **Line height**: 1.5-1.6 for readability

### Spacing
- Use consistent spacing units: 4px, 8px, 16px, 24px, 32px
- Generous padding inside cards (16-24px)
- Margins between elements (16px+)

### Animations
- Smooth transitions (0.2s - 0.3s ease-in-out)
- Hover effects on buttons/cards (slight scale: 1.02, or glow effect)
- Loading spinners for async operations
- Fade-in animations for modals/popups

### Accessibility
- High contrast between text and background
- Focus states for keyboard navigation (outline on buttons/links)
- Alt text for icons (if using icon libraries like Font Awesome or Heroicons)
- Semantic HTML (use `<button>`, `<nav>`, `<main>`, etc.)

---

## File Structure (Suggested)

```
/project-root
  /index.html          # Main entry point
  /css
    /style.css         # Main stylesheet
    /dark-mode.css     # Dark mode specific styles (or integrated in style.css)
  /js
    /app.js            # Main app logic
    /storage.js        # LocalStorage/IndexedDB functions
    /subjects.js       # Subject management functions
    /assignments.js    # Assignment management functions
    /calendar.js       # Calendar functions
    /notes.js          # Notes editor functions
    /timer.js          # Focus mode timer functions
    /wheel.js          # Spin the wheel logic
    /utils.js          # Utility functions (date formatting, etc.)
  /assets
    /icons             # Icon files or use icon library CDN
    /sounds            # Timer notification sound (optional)
  /libraries           # If using local versions of Chart.js, Quill, etc.
```

---

## Development Checklist

### Phase 1: Core Structure
- [ ] Set up HTML structure with navigation
- [ ] Implement dark mode styling
- [ ] Create subject management system (add, edit, delete subjects)
- [ ] Subject card grid on dashboard

### Phase 2: Assignment System
- [ ] Assignment CRUD (Create, Read, Update, Delete) within subjects
- [ ] Checkbox functionality for completion
- [ ] Circular progress graph per subject
- [ ] Due date tracking with color coding

### Phase 3: Links & Resources
- [ ] Add/delete links within subjects
- [ ] Open links in new tab functionality
- [ ] Display link list in subject view

### Phase 4: Notes
- [ ] Rich text editor integration
- [ ] Bold, italic, underline, highlight functionality
- [ ] Auto-save to LocalStorage
- [ ] Note organization by subject

### Phase 5: Calendar
- [ ] Monthly calendar view
- [ ] Display assignments due on each date
- [ ] Add custom tasks/reminders to dates
- [ ] Today's tasks dashboard view

### Phase 6: Edgenuity Tracker
- [ ] Manual input form for progress
- [ ] Circular progress chart for overall completion
- [ ] Per-subject tracking (optional)

### Phase 7: File Storage
- [ ] File upload functionality
- [ ] IndexedDB storage implementation
- [ ] File organization by subject
- [ ] Download and delete files

### Phase 8: Focus Timer
- [ ] Timer UI with start/pause/reset
- [ ] Countdown functionality
- [ ] Minimize/hide option
- [ ] Optional sound notification

### Phase 9: Spin the Wheel
- [ ] Wheel UI with subject segments
- [ ] Spin animation
- [ ] Random selection algorithm
- [ ] Avoid consecutive repeats

### Phase 10: Polish
- [ ] Settings page with all options
- [ ] Data export/import functionality
- [ ] Responsive design testing
- [ ] Browser notification permissions
- [ ] Loading states and error handling
- [ ] Final UI tweaks and testing

---

## Important Notes for Claude Code

1. **Prioritize functionality over perfection** - Get each feature working first, then refine UI
2. **Use comments liberally** - Explain complex logic for future maintenance
3. **Test on multiple browsers** - Chrome, Firefox, Safari at minimum
4. **LocalStorage limits** - Be aware of 5-10MB limit; use IndexedDB for larger data
5. **Error handling** - Always have fallbacks (e.g., if localStorage is full or disabled)
6. **Mobile responsiveness** - Use media queries, test on smaller screens
7. **Performance** - Debounce search inputs, lazy load large lists if needed

---

## Future Enhancements (Not in MVP, but keep in mind)

- Multi-user support with login system
- Cloud sync across devices
- Actual Edgenuity API integration
- In-app embedded Google search (iframe)
- Collaboration features (study groups, shared notes)
- Gamification (streaks, rewards, points)
- AI integration for study suggestions
- Voice notes
- Mobile app version (React Native or PWA)

---

## Final Output Expectations

When this is complete, the user should be able to:
1. Create subjects and organize their coursework
2. Add assignments with due dates and track completion with visual progress
3. Save study resource links
4. Take formatted notes
5. Track Edgenuity progress manually
6. View a calendar with all assignments/tasks
7. Upload and organize study files
8. Use a focus timer for study sessions
9. Spin a wheel to randomly pick a subject to study
10. Have all data saved locally and exportable

The UI should look clean, modern, professional, and be a joy to use. Dark mode should be elegant and easy on the eyes for long study sessions.

---

## Getting Started Commands

```bash
# Create project directory
mkdir student-task-manager
cd student-task-manager

# Create file structure
mkdir css js assets

# Initialize (if using npm for any libraries)
npm init -y

# Install any needed packages (optional, can also use CDNs)
npm install chart.js quill dexie

# Start a local server for testing
# Python 3:
python -m http.server 8000
# Or use VS Code Live Server extension
```

---

## Claude Code: Build this step-by-step, test each feature as you go, and make it look absolutely clean and professional. The user wants a functional, beautiful study tool they'll actually enjoy using. Focus on smooth UX, fast performance, and that satisfying feeling of checking off assignments and seeing progress graphs fill up. Make it happen! 🚀
