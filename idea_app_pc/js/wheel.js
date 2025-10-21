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

    const subjects = await db.subjects.toArray();

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

// Spin wheel
async function spinWheel() {
    if (spinning) return;

    const subjects = await db.subjects.toArray();
    if (subjects.length === 0) {
        alert('Add some subjects first!');
        return;
    }

    // Get last spun subject (to avoid repeats)
    const lastSpun = Storage.get('lastSpunSubject');
    let availableSubjects = subjects;

    if (lastSpun && subjects.length > 1) {
        availableSubjects = subjects.filter(s => s.id !== lastSpun);
    }

    // Pick random subject
    const randomIndex = Math.floor(Math.random() * availableSubjects.length);
    const selectedSubject = availableSubjects[randomIndex];

    // Calculate spin amount
    const sliceAngle = (2 * Math.PI) / subjects.length;
    const subjectIndex = subjects.findIndex(s => s.id === selectedSubject.id);
    const targetAngle = (subjectIndex * sliceAngle) + (sliceAngle / 2);

    // Spin animation (multiple rotations + target)
    const spins = 5; // Number of full rotations
    const totalRotation = (spins * 2 * Math.PI) + (2 * Math.PI - targetAngle);
    const duration = 3000; // 3 seconds
    const startTime = Date.now();
    const startAngle = wheelAngle;

    spinning = true;
    document.getElementById('spin-wheel-btn').disabled = true;
    document.getElementById('wheel-result').textContent = '';

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
            // Spin complete
            spinning = false;
            document.getElementById('spin-wheel-btn').disabled = false;
            document.getElementById('wheel-result').innerHTML = `
                <div style="color: ${selectedSubject.color}">Study <strong>${escapeHtml(selectedSubject.name)}</strong> now!</div>
            `;

            // Save last spun
            Storage.set('lastSpunSubject', selectedSubject.id);

            showNotification('Spin the Wheel', `Study ${selectedSubject.name} now!`);
        }
    }

    animate();
}

// Initialize wheel
async function initWheel() {
    document.getElementById('spin-wheel-btn').addEventListener('click', spinWheel);
    await drawWheel();
}
