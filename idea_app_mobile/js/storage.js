// ===== INDEXEDDB SETUP =====
const db = new Dexie('StudentTaskManager');

db.version(1).stores({
    subjects: '++id, name, color, createdAt',
    assignments: '++id, subjectId, title, dueDate, completed, createdAt',
    links: '++id, subjectId, url, title, createdAt',
    notes: '++id, subjectId, title, content, lastEdited, createdAt',
    files: '++id, subjectId, fileName, fileType, fileSize, uploadedAt',
    calendarTasks: '++id, date, title, completed, createdAt',
    focusSessions: '++id, subjectId, duration, startTime, endTime, completed'
});

// ===== LOCALSTORAGE HELPERS =====
const Storage = {
    // Get item from localStorage
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },

    // Set item in localStorage
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },

    // Remove item from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },

    // Clear all data
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    }
};

// ===== DATA EXPORT/IMPORT =====
async function exportAllData() {
    const data = {
        subjects: await db.subjects.toArray(),
        assignments: await db.assignments.toArray(),
        links: await db.links.toArray(),
        notes: await db.notes.toArray(),
        files: await db.files.toArray(),
        calendarTasks: await db.calendarTasks.toArray(),
        focusSessions: await db.focusSessions.toArray(),
        settings: {
            edgenuityProgress: Storage.get('edgenuityProgress'),
            lastSpunSubject: Storage.get('lastSpunSubject'),
            defaultTimerDuration: Storage.get('defaultTimerDuration', 25),
            enableNotifications: Storage.get('enableNotifications', true)
        },
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-task-manager-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function importAllData(jsonData) {
    try {
        const data = JSON.parse(jsonData);

        // Clear existing data
        await db.subjects.clear();
        await db.assignments.clear();
        await db.links.clear();
        await db.notes.clear();
        await db.files.clear();
        await db.calendarTasks.clear();
        await db.focusSessions.clear();

        // Import data
        if (data.subjects) await db.subjects.bulkAdd(data.subjects);
        if (data.assignments) await db.assignments.bulkAdd(data.assignments);
        if (data.links) await db.links.bulkAdd(data.links);
        if (data.notes) await db.notes.bulkAdd(data.notes);
        if (data.files) await db.files.bulkAdd(data.files);
        if (data.calendarTasks) await db.calendarTasks.bulkAdd(data.calendarTasks);
        if (data.focusSessions) await db.focusSessions.bulkAdd(data.focusSessions);

        // Import settings
        if (data.settings) {
            if (data.settings.edgenuityProgress) Storage.set('edgenuityProgress', data.settings.edgenuityProgress);
            if (data.settings.lastSpunSubject) Storage.set('lastSpunSubject', data.settings.lastSpunSubject);
            if (data.settings.defaultTimerDuration) Storage.set('defaultTimerDuration', data.settings.defaultTimerDuration);
            if (data.settings.enableNotifications !== undefined) Storage.set('enableNotifications', data.settings.enableNotifications);
        }

        return true;
    } catch (e) {
        console.error('Error importing data:', e);
        return false;
    }
}

async function clearAllData() {
    if (!confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
        return false;
    }

    if (!confirm('This will delete ALL subjects, assignments, notes, files, and settings. Are you ABSOLUTELY sure?')) {
        return false;
    }

    try {
        await db.subjects.clear();
        await db.assignments.clear();
        await db.links.clear();
        await db.notes.clear();
        await db.files.clear();
        await db.calendarTasks.clear();
        await db.focusSessions.clear();
        Storage.clear();
        return true;
    } catch (e) {
        console.error('Error clearing data:', e);
        return false;
    }
}
