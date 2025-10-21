// ===== CALENDAR MANAGEMENT =====

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;

// Render calendar
async function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const prevLastDay = new Date(currentYear, currentMonth, 0);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

    document.getElementById('calendar-month-year').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    // Previous month days
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.style.opacity = '0.3';
        day.innerHTML = `<div class="calendar-day-number">${prevLastDay.getDate() - i}</div>`;
        grid.appendChild(day);
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayElem = document.createElement('div');
        dayElem.className = 'calendar-day';

        // Check if today
        const today = getTodayDate();
        if (dateStr === today) {
            dayElem.classList.add('today');
        }

        // Check if selected
        if (selectedDate && dateStr === selectedDate) {
            dayElem.classList.add('selected');
        }

        // Get tasks for this day
        const assignments = await db.assignments.where('dueDate').equals(dateStr).toArray();
        const calendarTasks = await db.calendarTasks.where('date').equals(dateStr).toArray();
        const totalTasks = assignments.length + calendarTasks.length;

        dayElem.innerHTML = `
            <div class="calendar-day-number">${day}</div>
            <div class="calendar-day-tasks">
                ${Array(Math.min(totalTasks, 3)).fill('<div class="task-dot"></div>').join('')}
            </div>
        `;

        dayElem.addEventListener('click', () => selectDate(dateStr));
        grid.appendChild(dayElem);
    }
}

// Select date
async function selectDate(dateStr) {
    selectedDate = dateStr;
    await renderCalendar();
    await renderSelectedDateTasks();
}

// Render tasks for selected date
async function renderSelectedDateTasks() {
    if (!selectedDate) return;

    document.getElementById('selected-date-title').textContent = formatDate(selectedDate);

    const assignments = await db.assignments.where('dueDate').equals(selectedDate).toArray();
    const calendarTasks = await db.calendarTasks.where('date').equals(selectedDate).toArray();

    const container = document.getElementById('selected-date-tasks');

    if (assignments.length === 0 && calendarTasks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                No tasks for this date
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    // Render assignments
    for (const assignment of assignments) {
        const subject = await db.subjects.get(assignment.subjectId);
        const item = document.createElement('div');
        item.className = 'assignment-item';
        item.innerHTML = `
            <input type="checkbox" class="assignment-checkbox" ${assignment.completed ? 'checked' : ''} disabled>
            <div class="assignment-content">
                <div class="assignment-title ${assignment.completed ? 'completed' : ''}">
                    ${escapeHtml(assignment.title)}
                </div>
                <div class="assignment-notes" style="font-size: 12px; color: var(--text-secondary);">
                    ${subject ? escapeHtml(subject.name) : 'Unknown Subject'}
                </div>
            </div>
        `;
        container.appendChild(item);
    }

    // Render calendar tasks
    for (const task of calendarTasks) {
        const item = document.createElement('div');
        item.className = 'assignment-item';
        item.innerHTML = `
            <input type="checkbox" class="assignment-checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
            <div class="assignment-content">
                <div class="assignment-title ${task.completed ? 'completed' : ''}">
                    ${escapeHtml(task.title)}
                </div>
            </div>
        `;

        const checkbox = item.querySelector('.assignment-checkbox');
        checkbox.addEventListener('change', async () => {
            await db.calendarTasks.update(task.id, { completed: checkbox.checked });
            await renderSelectedDateTasks();
        });

        container.appendChild(item);
    }
}

// Add calendar task
async function addCalendarTask() {
    if (!selectedDate) {
        alert('Please select a date first');
        return;
    }

    const title = prompt('Task title:');
    if (!title || title.trim() === '') return;

    const task = {
        date: selectedDate,
        title: title.trim(),
        completed: false,
        createdAt: Date.now()
    };

    await db.calendarTasks.add(task);
    await renderCalendar();
    await renderSelectedDateTasks();
}

// Navigate months
function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// Initialize calendar
async function initCalendar() {
    document.getElementById('prev-month').addEventListener('click', prevMonth);
    document.getElementById('next-month').addEventListener('click', nextMonth);
    document.getElementById('add-calendar-task-btn').addEventListener('click', addCalendarTask);

    selectedDate = getTodayDate();
    await renderCalendar();
    await renderSelectedDateTasks();
}
