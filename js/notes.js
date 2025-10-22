// ===== NOTES MANAGEMENT =====

let currentNote = null;
let autoSaveTimeout = null;

// Render notes list
async function renderNotesList() {
    const allNotes = await db.notes.orderBy('lastEdited').reverse().toArray();
    // Filter out deleted notes
    const notes = allNotes.filter(n => !n.deleted);
    const list = document.getElementById('notes-list');

    if (notes.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary); font-size: 14px;">
                No notes yet
            </div>
        `;
        return;
    }

    list.innerHTML = '';

    for (const note of notes) {
        const item = document.createElement('div');
        item.className = `note-item ${currentNote && currentNote.id === note.id ? 'active' : ''}`;
        item.innerHTML = `
            <div class="note-item-title">${escapeHtml(note.title || 'Untitled Note')}</div>
            <div class="note-item-date">${formatDateTime(note.lastEdited)}</div>
        `;

        item.addEventListener('click', () => loadNote(note));
        list.appendChild(item);
    }
}

// Load note into editor
async function loadNote(note) {
    currentNote = note;

    document.getElementById('note-title').value = note.title || '';
    document.getElementById('note-subject').value = note.subjectId || '';
    document.getElementById('editor-content').innerHTML = note.content || '<p>Start typing your notes here...</p>';
    document.getElementById('last-edited').textContent = `Last edited: ${formatDateTime(note.lastEdited)}`;

    renderNotesList(); // Re-render to update active state
}

// Create new note
async function createNewNote() {
    const note = {
        title: 'Untitled Note',
        subjectId: null,
        content: '<p>Start typing your notes here...</p>',
        lastEdited: Date.now(),
        createdAt: Date.now()
    };

    const id = await db.notes.add(note);
    note.id = id;
    await loadNote(note);
    await renderNotesList();
}

// Auto-save note
const autoSaveNote = debounce(async () => {
    if (!currentNote) return;

    const title = document.getElementById('note-title').value.trim() || 'Untitled Note';
    const subjectId = document.getElementById('note-subject').value || null;
    const content = document.getElementById('editor-content').innerHTML;

    await db.notes.update(currentNote.id, {
        title,
        subjectId,
        content,
        lastEdited: Date.now()
    });

    currentNote.title = title;
    currentNote.lastEdited = Date.now();

    document.getElementById('last-edited').textContent = `Last edited: ${formatDateTime(currentNote.lastEdited)}`;
    renderNotesList();
}, 3000);

// Manual save note (triggered by Save button)
async function manualSaveNote() {
    if (!currentNote) {
        alert('No note selected');
        return;
    }

    const title = document.getElementById('note-title').value.trim() || 'Untitled Note';
    const subjectId = document.getElementById('note-subject').value || null;
    const content = document.getElementById('editor-content').innerHTML;

    await db.notes.update(currentNote.id, {
        title,
        subjectId,
        content,
        lastEdited: Date.now()
    });

    currentNote.title = title;
    currentNote.lastEdited = Date.now();

    document.getElementById('last-edited').textContent = `Last edited: ${formatDateTime(currentNote.lastEdited)}`;
    await renderNotesList();
    
    // Show confirmation
    alert('✅ Note saved!');
}

// Delete current note
async function deleteCurrentNote() {
    if (!currentNote) {
        alert('No note selected');
        return;
    }

    if (!confirm(`Delete "${currentNote.title || 'Untitled Note'}"?`)) {
        return;
    }

    // Soft delete
    await db.notes.update(currentNote.id, {
        deleted: true,
        lastModified: Date.now()
    });

    // Clear editor
    currentNote = null;
    document.getElementById('note-title').value = '';
    document.getElementById('note-subject').value = '';
    document.getElementById('editor-content').innerHTML = '<p>Start typing your notes here...</p>';
    document.getElementById('last-edited').textContent = 'Not saved';

    // Refresh list
    await renderNotesList();

    // Load first available note if exists
    const notes = await db.notes.where('deleted').notEqual(true).orderBy('lastEdited').reverse().toArray();
    if (notes.length > 0) {
        await loadNote(notes[0]);
    }
}

// Setup editor toolbar
function setupEditorToolbar() {
    // Format buttons
    document.querySelectorAll('[data-command]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const command = e.target.closest('[data-command]').dataset.command;

            if (command === 'formatBlock') {
                const value = e.target.value;
                document.execCommand(command, false, value);
            } else {
                document.execCommand(command, false, null);
            }

            document.getElementById('editor-content').focus();
        });
    });

    // Highlight colors
    document.querySelectorAll('.btn-color').forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.dataset.color;
            document.execCommand('backColor', false, color);
            document.getElementById('editor-content').focus();
        });
    });

    // Auto-save on content change
    const editor = document.getElementById('editor-content');
    editor.addEventListener('input', autoSaveNote);

    // Auto-save on title/subject change
    document.getElementById('note-title').addEventListener('input', autoSaveNote);
    document.getElementById('note-subject').addEventListener('change', autoSaveNote);
}

// Populate subject dropdown in notes
async function populateNoteSubjects() {
    const allSubjects = await db.subjects.toArray();
    // Filter out deleted subjects
    const subjects = allSubjects.filter(s => !s.deleted);
    const select = document.getElementById('note-subject');

    // Clear existing options except first
    while (select.options.length > 1) {
        select.remove(1);
    }

    for (const subject of subjects) {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        select.appendChild(option);
    }
}

// Initialize notes
async function initNotes() {
    document.getElementById('new-note-btn').addEventListener('click', createNewNote);
    document.getElementById('save-note-btn').addEventListener('click', manualSaveNote);
    document.getElementById('delete-note-btn').addEventListener('click', deleteCurrentNote);
    setupEditorToolbar();
    await populateNoteSubjects();
    await renderNotesList();

    // Load first note if exists
    const notes = await db.notes.orderBy('lastEdited').reverse().toArray();
    if (notes.length > 0) {
        await loadNote(notes[0]);
    }
}
