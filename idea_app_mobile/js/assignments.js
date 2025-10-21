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
        assignments = allAssignments.filter(a => a.completed);
    } else if (currentFilter === 'incomplete') {
        assignments = allAssignments.filter(a => !a.completed);
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

        item.innerHTML = `
            <input type="checkbox" class="assignment-checkbox" ${assignment.completed ? 'checked' : ''} data-id="${assignment.id}">
            <div class="assignment-content">
                <div class="assignment-title ${assignment.completed ? 'completed' : ''}">
                    ${escapeHtml(assignment.title)}
                </div>
                ${assignment.notes ? `<div class="assignment-notes">${escapeHtml(assignment.notes)}</div>` : ''}
            </div>
            <div class="assignment-due ${dueClass}">
                ${dueText}
            </div>
            <button class="btn-icon assignment-delete" data-id="${assignment.id}" title="Delete">🗑️</button>
        `;

        // Toggle completion
        const checkbox = item.querySelector('.assignment-checkbox');
        checkbox.addEventListener('change', async () => {
            await toggleAssignmentCompletion(assignment.id, checkbox.checked);
        });

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
        notes,
        completed: false,
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
