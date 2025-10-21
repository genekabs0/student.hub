// ===== SUBJECT MANAGEMENT =====

let currentSubject = null;
let selectedColor = '#34495E';

// Render subjects grid
async function renderSubjects() {
    const subjects = await db.subjects.toArray();
    const grid = document.getElementById('subjects-grid');

    if (subjects.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
                <p style="font-size: 18px; margin-bottom: 16px;">No subjects yet</p>
                <p>Click "Add Subject" to get started!</p>
            </div>
        `;
        document.getElementById('overall-progress-segments').innerHTML = '';
        document.getElementById('overall-progress-stats').innerHTML = '<p style="color: var(--text-secondary);">No subjects yet</p>';
        return;
    }

    grid.innerHTML = '';

    // Calculate overall progress
    let totalAssignments = 0;
    let totalCompleted = 0;
    const subjectProgress = [];

    for (const subject of subjects) {
        const assignments = await db.assignments.where('subjectId').equals(subject.id).toArray();
        const completed = assignments.filter(a => a.completed).length;
        const total = assignments.length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        totalAssignments += total;
        totalCompleted += completed;
        subjectProgress.push({ subject, completed, total, percent });

        const card = document.createElement('div');
        card.className = 'subject-card';
        card.style.setProperty('--subject-color', subject.color);
        card.innerHTML = `
            <div class="subject-color-picker">
                <button class="subject-color-btn" style="background: #4A90E2" data-color="#4A90E2" data-subject-id="${subject.id}"></button>
                <button class="subject-color-btn" style="background: #E74C3C" data-color="#E74C3C" data-subject-id="${subject.id}"></button>
                <button class="subject-color-btn" style="background: #2ECC71" data-color="#2ECC71" data-subject-id="${subject.id}"></button>
                <button class="subject-color-btn color-plus-btn" data-subject-id="${subject.id}" title="Custom Color">+</button>
                <input type="color" class="subject-color-input" data-subject-id="${subject.id}" style="display:none">
            </div>
            <div class="subject-card-header">
                <div class="subject-name">${escapeHtml(subject.name)}</div>
                <div class="subject-progress-mini">${percent}%</div>
            </div>
            <div class="subject-stats">
                <span>${total} assignment${total !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>${completed} complete</span>
            </div>
        `;

        // Color picker buttons
        const colorBtns = card.querySelectorAll('.subject-color-btn:not(.color-plus-btn)');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const newColor = btn.dataset.color;
                const subjectId = parseInt(btn.dataset.subjectId);
                await db.subjects.update(subjectId, { color: newColor });
                renderSubjects();
            });
        });

        // Custom color picker
        const plusBtn = card.querySelector('.color-plus-btn');
        const colorInput = card.querySelector('.subject-color-input');
        plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            colorInput.click();
        });
        colorInput.addEventListener('change', async (e) => {
            const newColor = e.target.value;
            const subjectId = parseInt(e.target.dataset.subjectId);
            await db.subjects.update(subjectId, { color: newColor });
            renderSubjects();
        });

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.subject-color-picker')) {
                openSubject(subject);
            }
        });
        grid.appendChild(card);
    }

    // Render overall progress
    renderOverallProgress(subjectProgress, totalCompleted, totalAssignments);
}

// Render overall progress tracker
function renderOverallProgress(subjectProgress, totalCompleted, totalAssignments) {
    const segments = document.getElementById('overall-progress-segments');
    const stats = document.getElementById('overall-progress-stats');

    segments.innerHTML = '';
    stats.innerHTML = '';

    if (totalAssignments === 0) {
        stats.innerHTML = '<p style="color: var(--text-secondary);">Add assignments to track progress</p>';
        return;
    }

    // Create colored segments
    subjectProgress.forEach(({ subject, completed, total }) => {
        if (total > 0) {
            const percentage = (completed / totalAssignments) * 100;
            const segment = document.createElement('div');
            segment.className = 'progress-segment';
            segment.style.width = `${percentage}%`;
            segment.style.background = subject.color;
            segment.title = `${subject.name}: ${completed}/${total}`;
            segments.appendChild(segment);
        }
    });

    // Create stats
    const overallPercent = Math.round((totalCompleted / totalAssignments) * 100);
    const summaryDiv = document.createElement('div');
    summaryDiv.style.width = '100%';
    summaryDiv.style.marginBottom = '12px';
    summaryDiv.innerHTML = `<strong>${totalCompleted} / ${totalAssignments}</strong> assignments complete (<strong>${overallPercent}%</strong>)`;
    stats.appendChild(summaryDiv);

    subjectProgress.forEach(({ subject, completed, total, percent }) => {
        const item = document.createElement('div');
        item.className = 'progress-stat-item';
        item.innerHTML = `
            <div class="progress-stat-color" style="background: ${subject.color}"></div>
            <span>${escapeHtml(subject.name)}: ${completed}/${total} (${percent}%)</span>
        `;
        stats.appendChild(item);
    });
}

// Open subject detail view
async function openSubject(subject) {
    currentSubject = subject;
    document.getElementById('dashboard-page').classList.remove('active');
    document.getElementById('subject-detail-page').classList.add('active');
    document.getElementById('subject-title').textContent = subject.name;
    document.querySelector('.page-title').textContent = subject.name;

    await renderAssignments();
    await renderLinks();
    await updateSubjectProgress();
}

// Back to dashboard
function backToDashboard() {
    currentSubject = null;
    document.getElementById('subject-detail-page').classList.remove('active');
    document.getElementById('dashboard-page').classList.add('active');
    document.querySelector('.page-title').textContent = 'Dashboard';
    renderSubjects();
}

// Update subject progress bar
async function updateSubjectProgress() {
    if (!currentSubject) return;

    const assignments = await db.assignments.where('subjectId').equals(currentSubject.id).toArray();
    const completed = assignments.filter(a => a.completed).length;
    const total = assignments.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('completed-count').textContent = completed;
    document.getElementById('total-count').textContent = total;
    document.getElementById('progress-percent').textContent = percent;

    // Update progress bar
    const progressBar = document.getElementById('progress-bar-fill');
    progressBar.style.width = `${percent}%`;
}

// Show add subject modal
function showAddSubjectModal() {
    const modal = document.getElementById('add-subject-modal');
    modal.classList.add('active');
    document.getElementById('subject-name-input').value = '';
    selectedColor = '#34495E';

    // Reset color selection
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.color === selectedColor) {
            btn.classList.add('selected');
        }
    });
}

// Save new subject
async function saveSubject() {
    const name = document.getElementById('subject-name-input').value.trim();

    if (!name) {
        alert('Please enter a subject name');
        return;
    }

    const subject = {
        name,
        color: selectedColor,
        createdAt: Date.now()
    };

    await db.subjects.add(subject);
    closeModal('add-subject-modal');
    renderSubjects();
}

// Edit subject
async function editSubject() {
    if (!currentSubject) return;

    const newName = prompt('Enter new subject name:', currentSubject.name);
    if (!newName || newName.trim() === '') return;

    await db.subjects.update(currentSubject.id, { name: newName.trim() });
    currentSubject.name = newName.trim();
    document.getElementById('subject-title').textContent = newName.trim();
    document.querySelector('.page-title').textContent = newName.trim();
    renderSubjects();
}

// Delete subject
async function deleteSubject() {
    if (!currentSubject) return;

    if (!confirm(`Delete "${currentSubject.name}" and all its assignments and links?`)) {
        return;
    }

    // Delete related data
    await db.assignments.where('subjectId').equals(currentSubject.id).delete();
    await db.links.where('subjectId').equals(currentSubject.id).delete();
    await db.notes.where('subjectId').equals(currentSubject.id).delete();
    await db.files.where('subjectId').equals(currentSubject.id).delete();

    // Delete subject
    await db.subjects.delete(currentSubject.id);

    backToDashboard();
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Setup color picker
function setupColorPicker() {
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedColor = btn.dataset.color;
        });
    });
}

// Initialize subject management
function initSubjects() {
    // Add subject button
    document.getElementById('add-subject-btn').addEventListener('click', showAddSubjectModal);

    // Save subject button
    document.getElementById('save-subject-btn').addEventListener('click', saveSubject);

    // Edit subject button
    document.getElementById('edit-subject-btn').addEventListener('click', editSubject);

    // Delete subject button
    document.getElementById('delete-subject-btn').addEventListener('click', deleteSubject);

    // Back button
    document.getElementById('back-to-dashboard').addEventListener('click', backToDashboard);

    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    // Setup color picker
    setupColorPicker();

    // Render subjects on init
    renderSubjects();
}
