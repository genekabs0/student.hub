// ===== FOCUS TIMER =====

let timerInterval = null;
let timeRemaining = 0;
let timerDuration = 25 * 60; // 25 minutes in seconds
let timerRunning = false;

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Update timer display
function updateTimerDisplay() {
    document.getElementById('timer-display').textContent = formatTime(timeRemaining);

    // Update progress ring
    const progress = ((timerDuration - timeRemaining) / timerDuration) * 817; // 817 is circumference
    document.getElementById('timer-progress-ring').style.strokeDashoffset = 817 - progress;
}

// Start timer
function startTimer() {
    if (timerRunning) return;

    if (timeRemaining === 0) {
        const durationInput = document.getElementById('timer-duration').value;
        timerDuration = parseInt(durationInput) * 60;
        timeRemaining = timerDuration;
    }

    timerRunning = true;
    document.getElementById('timer-start').disabled = true;
    document.getElementById('timer-pause').disabled = false;

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            timerComplete();
        }
    }, 1000);
}

// Pause timer
function pauseTimer() {
    if (!timerRunning) return;

    timerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('timer-start').disabled = false;
    document.getElementById('timer-pause').disabled = true;
}

// Reset timer
function resetTimer() {
    pauseTimer();
    timeRemaining = 0;
    timerDuration = parseInt(document.getElementById('timer-duration').value) * 60;
    updateTimerDisplay();
}

// Timer complete
function timerComplete() {
    pauseTimer();
    timeRemaining = 0;
    updateTimerDisplay();

    showNotification('Focus Timer', 'Great job! Time is up!');

    // Play sound (optional - would need audio file)
    // const audio = new Audio('/assets/sounds/timer-complete.mp3');
    // audio.play();

    alert('Focus session complete! Great work!');
}

// Initialize timer
function initTimer() {
    document.getElementById('timer-start').addEventListener('click', startTimer);
    document.getElementById('timer-pause').addEventListener('click', pauseTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);

    // Update duration when input changes
    document.getElementById('timer-duration').addEventListener('change', (e) => {
        if (!timerRunning) {
            timerDuration = parseInt(e.target.value) * 60;
            timeRemaining = timerDuration;
            updateTimerDisplay();
        }
    });

    // Initial display
    timeRemaining = timerDuration;
    updateTimerDisplay();
}
