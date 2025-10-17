// ===== MAIN APPLICATION =====

// Current page
let currentPage = 'dashboard';

// Page navigation
function navigateTo(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(`${pageName}-page`).classList.add('active');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        notes: 'Notes',
        calendar: 'Calendar',
        storage: 'File Storage',
        timer: 'Focus Timer',
        wheel: 'Spin the Wheel',
        settings: 'Settings'
    };

    document.querySelector('.page-title').textContent = titles[pageName] || pageName;
    currentPage = pageName;

    // Page-specific init
    if (pageName === 'calendar') {
        renderCalendar();
    } else if (pageName === 'wheel') {
        drawWheel();
    } else if (pageName === 'storage') {
        renderStorage();
    }
}

// Setup navigation
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
        });
    });
}

// Quick search
function setupQuickSearch() {
    document.querySelector('.quick-search').addEventListener('click', () => {
        const query = prompt('What do you want to search for?');
        if (query && query.trim()) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        }
    });
}

// Theme toggle
function setupThemeToggle() {
    document.querySelector('.theme-toggle').addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const icon = document.querySelector('.theme-toggle span');
        icon.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';

        // Save preference
        Storage.set('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    });

    // Load saved theme
    const theme = Storage.get('theme', 'dark');
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        document.querySelector('.theme-toggle span').textContent = '☀️';
    }
}

// Links Management (Adding this here since it's missing)
async function renderLinks() {
    if (!currentSubject) return;

    const links = await db.links.where('subjectId').equals(currentSubject.id).toArray();
    const list = document.getElementById('links-list');

    if (links.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>No study resources yet</p>
            </div>
        `;
        return;
    }

    list.innerHTML = '';

    for (const link of links) {
        const item = document.createElement('div');
        item.className = 'link-item';
        item.innerHTML = `
            <span class="link-icon">🔗</span>
            <div class="link-content">
                <a href="${escapeHtml(link.url)}" target="_blank" class="link-title">
                    ${escapeHtml(link.title)}
                </a>
                ${link.description ? `<div class="link-desc">${escapeHtml(link.description)}</div>` : ''}
            </div>
            <span class="link-delete" data-id="${link.id}">🗑️</span>
        `;

        // Delete link
        item.querySelector('.link-delete').addEventListener('click', async (e) => {
            if (confirm('Delete this link?')) {
                await db.links.delete(link.id);
                renderLinks();
            }
        });

        list.appendChild(item);
    }
}

function showAddLinkModal() {
    const modal = document.getElementById('add-link-modal');
    modal.classList.add('active');
    document.getElementById('link-url-input').value = '';
    document.getElementById('link-title-input').value = '';
    document.getElementById('link-desc-input').value = '';
}

async function saveLink() {
    if (!currentSubject) return;

    const url = document.getElementById('link-url-input').value.trim();
    const title = document.getElementById('link-title-input').value.trim();
    const description = document.getElementById('link-desc-input').value.trim();

    if (!url) {
        alert('Please enter a URL');
        return;
    }

    const link = {
        subjectId: currentSubject.id,
        url,
        title: title || url,
        description,
        createdAt: Date.now()
    };

    await db.links.add(link);
    closeModal('add-link-modal');
    renderLinks();
}

// File Storage
async function renderStorage() {
    const subjects = await db.subjects.toArray();
    const foldersList = document.getElementById('folders-list');

    foldersList.innerHTML = '<h4 style="margin-bottom: 16px;">Subjects</h4>';

    for (const subject of subjects) {
        const files = await db.files.where('subjectId').equals(subject.id).toArray();
        const folder = document.createElement('div');
        folder.className = 'folder-item';
        folder.innerHTML = `
            <div>📁 ${escapeHtml(subject.name)}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${files.length} file${files.length !== 1 ? 's' : ''}</div>
        `;

        folder.addEventListener('click', () => showFolderFiles(subject.id));
        foldersList.appendChild(folder);
    }
}

async function showFolderFiles(subjectId) {
    const files = await db.files.where('subjectId').equals(subjectId).toArray();
    const filesList = document.getElementById('files-list');

    if (files.length === 0) {
        filesList.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">No files in this folder</div>';
        return;
    }

    filesList.innerHTML = '';

    for (const file of files) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <div class="file-icon">${getFileIcon(file.fileType)}</div>
            <div class="file-info">
                <div class="file-name">${escapeHtml(file.fileName)}</div>
                <div class="file-meta">${formatFileSize(file.fileSize)} • ${formatDate(file.uploadedAt)}</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="downloadFile(${file.id})">Download</button>
            <button class="btn btn-danger btn-sm" onclick="deleteFile(${file.id})">Delete</button>
        `;
        filesList.appendChild(item);
    }
}

async function uploadFiles() {
    const input = document.getElementById('file-input');
    input.click();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('file-input').addEventListener('change', async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;

        const subjectName = prompt('Which subject are these files for?');
        if (!subjectName) return;

        // Find or create subject
        let subject = (await db.subjects.toArray()).find(s => s.name.toLowerCase() === subjectName.toLowerCase());
        if (!subject) {
            const id = await db.subjects.add({ name: subjectName, color: '#4A90E2', createdAt: Date.now() });
            subject = { id, name: subjectName };
        }

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                await db.files.add({
                    subjectId: subject.id,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    fileData: event.target.result,
                    uploadedAt: Date.now()
                });
            };
            reader.readAsDataURL(file);
        }

        alert('Files uploaded successfully!');
        renderStorage();
    });
});

async function downloadFile(fileId) {
    const file = await db.files.get(fileId);
    if (!file) return;

    const a = document.createElement('a');
    a.href = file.fileData;
    a.download = file.fileName;
    a.click();
}

async function deleteFile(fileId) {
    if (!confirm('Delete this file?')) return;
    await db.files.delete(fileId);
    renderStorage();
}

// Apply color customization
function applyColorCustomization() {
    const accentColor = Storage.get('accentColor', '#4A90E2');
    const textColor = Storage.get('textColor', '#FFFFFF');
    const fontFamily = Storage.get('fontFamily', "'Inter', sans-serif");
    const fontSize = Storage.get('fontSize', '14px');

    document.documentElement.style.setProperty('--accent', accentColor);
    document.documentElement.style.setProperty('--text-primary', textColor);
    document.body.style.fontFamily = fontFamily;
    document.body.style.fontSize = fontSize;

    // Calculate hover variant
    const hoverColor = adjustBrightness(accentColor, -20);
    document.documentElement.style.setProperty('--accent-hover', hoverColor);
}

// Adjust brightness helper
function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

// Settings
function setupSettings() {
    // Default timer duration
    const defaultDuration = Storage.get('defaultTimerDuration', 25);
    document.getElementById('default-timer-duration').value = defaultDuration;

    document.getElementById('default-timer-duration').addEventListener('change', (e) => {
        Storage.set('defaultTimerDuration', parseInt(e.target.value));
    });

    // Notifications
    const enableNotifications = Storage.get('enableNotifications', true);
    document.getElementById('enable-notifications').checked = enableNotifications;

    document.getElementById('enable-notifications').addEventListener('change', (e) => {
        Storage.set('enableNotifications', e.target.checked);
    });

    // Accent color
    const accentColor = Storage.get('accentColor', '#4A90E2');
    document.querySelectorAll('[data-accent]').forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.dataset.accent;
            Storage.set('accentColor', color);
            applyColorCustomization();
        });
        if (btn.dataset.accent === accentColor) {
            btn.classList.add('selected');
        }
    });

    // Text color
    const textColor = Storage.get('textColor', '#FFFFFF');
    document.querySelectorAll('[data-text]').forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.dataset.text;
            Storage.set('textColor', color);
            applyColorCustomization();
        });
        if (btn.dataset.text === textColor) {
            btn.classList.add('selected');
        }
    });

    // Custom accent color picker
    document.getElementById('accent-color-plus').addEventListener('click', () => {
        document.getElementById('accent-color-picker').click();
    });
    document.getElementById('accent-color-picker').addEventListener('change', (e) => {
        Storage.set('accentColor', e.target.value);
        applyColorCustomization();
    });

    // Custom text color picker
    document.getElementById('text-color-plus').addEventListener('click', () => {
        document.getElementById('text-color-picker').click();
    });
    document.getElementById('text-color-picker').addEventListener('change', (e) => {
        Storage.set('textColor', e.target.value);
        applyColorCustomization();
    });

    // Font family
    const fontFamily = Storage.get('fontFamily', "'Inter', sans-serif");
    document.getElementById('font-family-select').value = fontFamily;
    document.getElementById('font-family-select').addEventListener('change', (e) => {
        Storage.set('fontFamily', e.target.value);
        applyColorCustomization();
    });

    // Font size
    const fontSize = Storage.get('fontSize', '14px');
    document.getElementById('font-size-select').value = fontSize;
    document.getElementById('font-size-select').addEventListener('change', (e) => {
        Storage.set('fontSize', e.target.value);
        applyColorCustomization();
    });

    // Export data
    document.getElementById('export-data-btn').addEventListener('click', exportAllData);

    // Import data
    document.getElementById('import-data-btn').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const success = await importAllData(event.target.result);
            if (success) {
                alert('Data imported successfully!');
                location.reload();
            } else {
                alert('Error importing data. Please check the file.');
            }
        };
        reader.readAsText(file);
    });

    // Clear data
    document.getElementById('clear-data-btn').addEventListener('click', async () => {
        const success = await clearAllData();
        if (success) {
            alert('All data cleared!');
            location.reload();
        }
    });
}

// Initialize app
async function init() {
    console.log('🚀 Student Task Manager initializing...');

    // Apply saved color customization
    applyColorCustomization();

    // Setup navigation
    setupNavigation();
    setupQuickSearch();
    setupThemeToggle();

    // Request notification permission
    requestNotificationPermission();

    // Initialize modules
    initSubjects();
    initAssignments();
    await initNotes();
    await initCalendar();
    initTimer();
    await initWheel();

    // Setup links
    document.getElementById('add-link-btn').addEventListener('click', showAddLinkModal);
    document.getElementById('save-link-btn').addEventListener('click', saveLink);

    // Setup storage
    document.getElementById('upload-file-btn').addEventListener('click', uploadFiles);

    // Setup settings
    setupSettings();

    console.log('✅ Student Task Manager ready!');
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
