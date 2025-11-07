// ===== SPIN THE WHEEL =====

let spinning = false;
let wheelAngle = 0;

// Draw wheel
async function drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 180;

    const allSubjects = await db.subjects.toArray();
const subjects = allSubjects.filter(s => !s.deleted);
    if (subjects.length === 0) {
        // No subjects - show empty state
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#A0A0A0';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Add subjects to use the wheel!', centerX, centerY);
        return;
    }

    const sliceAngle = (2 * Math.PI) / subjects.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw wheel slices
    for (let i = 0; i < subjects.length; i++) {
        const startAngle = wheelAngle + i * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = subjects[i].color;
        ctx.fill();

        // Draw border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Inter';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(subjects[i].name, radius - 20, 5);
        ctx.restore();
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#1E1E1E';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw pointer at top
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX - 15, 50);
    ctx.lineTo(centerX + 15, 50);
    ctx.closePath();
    ctx.fillStyle = '#DC3545';
    ctx.fill();
}

// Get which subject is currently at the top (under the pointer)
async function getSubjectAtPointer() {
    const subjects = await db.subjects.toArray();
    if (subjects.length === 0) return null;

    const sliceAngle = (2 * Math.PI) / subjects.length;

    // Normalize angle to 0 to 2π
    let angle = wheelAngle % (2 * Math.PI);
    if (angle < 0) angle += 2 * Math.PI;

    // The pointer points DOWN from the TOP of the canvas
    // Top of circle in standard position is -π/2 (or 3π/2)
    // We need to find which slice contains the angle that points upward

    // Since slices are drawn starting from wheelAngle,
    // the first slice starts at wheelAngle
    // We want to find which slice contains the top position (3π/2 or -π/2)

    // Calculate the angle difference from the top
    const topAngle = -Math.PI / 2; // Top of the circle
    let diff = topAngle - angle;

    // Normalize to 0 to 2π
    while (diff < 0) diff += 2 * Math.PI;
    while (diff >= 2 * Math.PI) diff -= 2 * Math.PI;

    // Find which slice this falls into
    const index = Math.floor(diff / sliceAngle) % subjects.length;

    return subjects[index];
}

// Spin wheel
async function spinWheel() {
    if (spinning) return;

    const subjects = await db.subjects.toArray();
    if (subjects.length === 0) {
        alert('Add some subjects first!');
        return;
    }

    // Random spin amount
    const minSpins = 5;
    const maxSpins = 8;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    const totalRotation = spins * 2 * Math.PI + Math.random() * 2 * Math.PI;

    const duration = 3000; // 3 seconds
    const startTime = Date.now();
    const startAngle = wheelAngle;

    spinning = true;
    document.getElementById('spin-wheel-btn').disabled = true;
    document.getElementById('wheel-result').innerHTML = '';

    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);

        wheelAngle = startAngle + (totalRotation * eased);
        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Spin complete - get the subject at pointer
            finishSpin();
        }
    }

    animate();
}

async function finishSpin() {
    const selectedSubject = await getSubjectAtPointer();

    if (!selectedSubject) {
        spinning = false;
        document.getElementById('spin-wheel-btn').disabled = false;
        return;
    }

    spinning = false;
    document.getElementById('spin-wheel-btn').disabled = false;
    document.getElementById('wheel-result').innerHTML = `
        <div style="color: ${selectedSubject.color}">Study <strong>${escapeHtml(selectedSubject.name)}</strong> now!</div>
    `;

    // Save last spun
    Storage.set('lastSpunSubject', selectedSubject.id);

    showNotification('Spin the Wheel', `Study ${selectedSubject.name} now!`);
}

// Initialize wheel
async function initWheel() {
    document.getElementById('spin-wheel-btn').addEventListener('click', spinWheel);
    // Clear any old result text on load
    document.getElementById('wheel-result').innerHTML = '';
    await drawWheel();
}
