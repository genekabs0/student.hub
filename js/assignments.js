// ===== ASSIGNMENT MANAGEMENT =====

let currentFilter = 'all';

// Render assignments for current subject
async function renderAssignments() {
    if (!currentSubject) return;

    const allAssignments = await db.assignments
        .where('subjectId')
        .equals(currentSubject.id)
        .toArray();

    // Filter assignments
    let assignments = allAssignments;
    if (currentFilter === 'completed') {
        assignments = allAssignments.filter(a => a.completed && !a.archived);
    } else if (currentFilter === 'incomplete') {
        assignments = allAssignments.filter(a => !a.completed && !a.archived);
    } else if (currentFilter === 'archived') {
        assignments = allAssignments.filter(a => a.archived);
    } else if (currentFilter === 'all') {
        assignments = allAssignments.filter(a => !a.archived);
    }

    // Sort by due date
    assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const list = document.getElementById('assignments-list');

    if (assignments.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p>No assignments ${currentFilter !== 'all' ? currentFilter : ''}</p>
            </div>
        `;
        return;
    }

    list.innerHTML = '';

    for (const assignment of assignments) {
        const item = document.createElement('div');
        item.className = 'assignment-item';

        const dueClass = getDueClass(assignment.dueDate);
        const dueText = getDueText(assignment.dueDate);
        const timeText = assignment.dueTime ? ` at ${formatTime(assignment.dueTime)}` : '';

        item.innerHTML = `
            <input type="checkbox" class="assignment-checkbox" ${assignment.completed ? 'checked' : ''} data-id="${assignment.id}">
            <div class="assignment-content">
                <div class="assignment-title ${assignment.completed ? 'completed' : ''}">
                    ${escapeHtml(assignment.title)}
                </div>
                ${assignment.notes ? `<div class="assignment-notes">${escapeHtml(assignment.notes)}</div>` : ''}
            </div>
            <div class="assignment-due ${dueClass}">
                ${dueText}${timeText}
            </div>
            ${assignment.archived ?
                `<button class="btn-icon assignment-unarchive" data-id="${assignment.id}" title="Unarchive">📤</button>` :
                `<button class="btn-icon assignment-archive" data-id="${assignment.id}" title="Archive">📥</button>`
            }
            <button class="btn-icon assignment-delete" data-id="${assignment.id}" title="Delete">🗑️</button>
        `;

        // Toggle completion
        const checkbox = item.querySelector('.assignment-checkbox');
        checkbox.addEventListener('change', async () => {
            await toggleAssignmentCompletion(assignment.id, checkbox.checked);
        });

        // Archive assignment
        const archiveBtn = item.querySelector('.assignment-archive');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await db.assignments.update(assignment.id, { archived: true });
                await renderAssignments();
                await updateSubjectProgress();
            });
        }

        // Unarchive assignment
        const unarchiveBtn = item.querySelector('.assignment-unarchive');
        if (unarchiveBtn) {
            unarchiveBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await db.assignments.update(assignment.id, { archived: false });
                await renderAssignments();
                await updateSubjectProgress();
            });
        }

        // Delete assignment
        const deleteBtn = item.querySelector('.assignment-delete');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Delete this assignment?')) {
                await db.assignments.delete(assignment.id);
                await renderAssignments();
                await updateSubjectProgress();
            }
        });

        list.appendChild(item);
    }
}

// Toggle assignment completion
async function toggleAssignmentCompletion(id, completed) {
    await db.assignments.update(id, { completed });
    await renderAssignments();
    await updateSubjectProgress();
}

// Show add assignment modal
function showAddAssignmentModal() {
    const modal = document.getElementById('add-assignment-modal');
    modal.classList.add('active');
    document.getElementById('assignment-title-input').value = '';
    document.getElementById('assignment-date-input').value = getTodayDate();
    document.getElementById('assignment-notes-input').value = '';
}

// Save new assignment
async function saveAssignment() {
    if (!currentSubject) return;

    const title = document.getElementById('assignment-title-input').value.trim();
    const dueDate = document.getElementById('assignment-date-input').value;
    const dueTime = document.getElementById('assignment-time-input').value || null;
    const notes = document.getElementById('assignment-notes-input').value.trim();

    if (!title) {
        alert('Please enter an assignment title');
        return;
    }

    if (!dueDate) {
        alert('Please select a due date');
        return;
    }

    const assignment = {
        subjectId: currentSubject.id,
        title,
        dueDate,
        dueTime,
        notes,
        completed: false,
        archived: false,
        createdAt: Date.now()
    };

    await db.assignments.add(assignment);
    closeModal('add-assignment-modal');
    await renderAssignments();
    await updateSubjectProgress();
}

// Initialize assignments
function initAssignments() {
    // Add assignment button
    document.getElementById('add-assignment-btn').addEventListener('click', showAddAssignmentModal);

    // Save assignment button
    document.getElementById('save-assignment-btn').addEventListener('click', saveAssignment);

    // Filter change
    document.getElementById('assignment-filter').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderAssignments();
    });
}
