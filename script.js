let sims = [];
let devTimes = {};

let demoRunning = false;
let demoTime = 0;
let velocity = 60;
let angle = 45;
let gravity = 10;
let simSpeed = 3;
let trail = [];
let lastTime = 0;
let animationId = null;
let currentSimType = 'projectile';
let objectMass = 1;
let friction = 0.1;
let inclineAngle = 30;

// Load data on startup
document.addEventListener('DOMContentLoaded', () => {
    // Load data from data.json
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            sims = data.simulations;
            devTimes = data.devTimes;
            
            // Initialize components
            renderTable();
            drawDemo();
            setupTabs();
            setupFilters();
            setupSearch();
            setupCalculatorInputs();
            setupDemoParams();
            setupTypeBoxes();
            setupSimTypeButtons();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            // Fallback data
            sims = [
                { type: "Motion", example: "Linear motion", vars: "position, velocity, time", pattern: "update position each frame", eq: "x = x₀ + v₀t" },
                { type: "Motion", example: "Free fall", vars: "gravity, height, time", pattern: "constant acceleration", eq: "h = h₀ - ½gt²" },
                { type: "Motion", example: "Object on incline", vars: "angle, friction, mass", pattern: "resolve forces", eq: "a = g·sinθ" },
                { type: "Force & Interaction", example: "Push / pull force", vars: "force, mass", pattern: "F = ma", eq: "F = m·a" },
                { type: "Force & Interaction", example: "Collision", vars: "velocity, mass", pattern: "momentum change", eq: "m₁v₁ + m₂v₂ = ..." },
                { type: "Force & Interaction", example: "Tension in rope", vars: "tension, mass", pattern: "net force balance", eq: "T = m(g ± a)" },
                { type: "Pressure & Fluids", example: "Pressure in liquid", vars: "depth, density", pattern: "P = ρgh", eq: "P = ρ·g·h" },
                { type: "Pressure & Fluids", example: "Force on surface", vars: "area, pressure", pattern: "F = PA", eq: "F = P·A" },
                { type: "Pressure & Fluids", example: "Hydraulic system", vars: "piston area", pattern: "pressure transmission", eq: "P₁ = P₂" },
                { type: "Energy & Dynamics", example: "Work done by force", vars: "force, distance", pattern: "W = F·d", eq: "W = F·d·cosθ" },
                { type: "Energy & Dynamics", example: "Kinetic energy", vars: "mass, velocity", pattern: "½mv²", eq: "KE = ½m·v²" },
                { type: "Energy & Dynamics", example: "Energy conversion", vars: "height, speed", pattern: "conservation", eq: "PE₁ + KE₁ = PE₂ + KE₂" }
            ];
            
            devTimes = {
                motion: { first: 4, additional: 0.5 },
                force: { first: 4, additional: 0.5 },
                pressure: { first: 3.5, additional: 0.4 },
                energy: { first: 4, additional: 0.5 },
                all: { first: 16, additional: 0.5 }
            };
            
            // Initialize components with fallback data
            renderTable();
            drawDemo();
            setupTabs();
            setupFilters();
            setupSearch();
            setupCalculatorInputs();
            setupDemoParams();
            setupTypeBoxes();
            setupSimTypeButtons();
        });
});

// Tab Navigation
function setupTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            if (targetTab === 'demo') {
                resetDemo();
            }
        });
    });
}

function setupTypeBoxes() {
    document.querySelectorAll('.type-box').forEach(box => {
        box.addEventListener('click', () => {
            const type = box.dataset.type;
            document.querySelector('[data-tab="table"]').click();
            setTimeout(() => {
                const filterBtn = document.querySelector(`[data-filter="${type.charAt(0).toUpperCase() + type.slice(1)}"]`);
                if (filterBtn) filterBtn.click();
            }, 100);
        });
    });
}

function setupSimTypeButtons() {
    document.querySelectorAll('.sim-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sim-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSimType = btn.dataset.simType;
            updateSimInfo();
            resetDemo();
        });
    });
}

function updateSimInfo() {
    const info = document.getElementById('simInfo');
    let title = '';
    let equation = '';
    let pattern = '';
    
    switch(currentSimType) {
        case 'projectile':
            title = 'Projectile Motion';
            equation = 'x = v₀t·cosθ, y = v₀t·sinθ - ½gt²';
            pattern = 'Time-based position updates with constant acceleration';
            break;
        case 'linear':
            title = 'Linear Motion';
            equation = 'x = x₀ + v·t';
            pattern = 'Constant velocity position updates';
            break;
        case 'freefall':
            title = 'Free Fall';
            equation = 'h = h₀ - ½gt², v = gt';
            pattern = 'Constant gravitational acceleration';
            break;
        case 'inclined':
            title = 'Inclined Plane';
            equation = 'a = g·sinθ - μg·cosθ, x = x₀ + ½at²';
            pattern = 'Force resolution and friction';
            break;
    }
    
    info.innerHTML = `
        <h4>Current Simulation: ${title}</h4>
        <p><strong>Equation:</strong> ${equation}</p>
        <p><strong>Template Pattern:</strong> ${pattern}</p>
    `;
}

// Filter Controls
function setupFilters() {
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTable(btn.dataset.filter);
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const activeFilter = document.querySelector('.filter-tag.active').dataset.filter;
        renderTable(activeFilter, searchTerm);
    });
}

function renderTable(filter = 'all', searchTerm = '') {
    const tbody = document.getElementById('tableBody');
    let filteredData = filter === 'all' ? sims : sims.filter(s => s.type.toLowerCase().includes(filter.toLowerCase()));
    
    if (searchTerm) {
        filteredData = filteredData.filter(s => 
            s.example.toLowerCase().includes(searchTerm) ||
            s.vars.toLowerCase().includes(searchTerm) ||
            s.pattern.toLowerCase().includes(searchTerm)
        );
    }
    
    tbody.innerHTML = filteredData.map(sim => `
        <tr>
            <td><strong>${sim.type}</strong></td>
            <td>${sim.example}</td>
            <td>${sim.vars}</td>
            <td>${sim.pattern}</td>
            <td><code>${sim.eq}</code></td>
        </tr>
    `).join('');
    
    document.getElementById('tableCount').textContent = `${filteredData.length} simulation${filteredData.length !== 1 ? 's' : ''} shown`;
}

// Calculator Functions
function setupCalculatorInputs() {
    const simCount = document.getElementById('simCount');
    const simCountRange = document.getElementById('simCountRange');
    const tradTime = document.getElementById('tradTime');
    const tradTimeRange = document.getElementById('tradTimeRange');
    
    simCountRange.addEventListener('input', (e) => simCount.value = e.target.value);
    simCount.addEventListener('input', (e) => simCountRange.value = e.target.value);
    tradTimeRange.addEventListener('input', (e) => tradTime.value = e.target.value);
    tradTime.addEventListener('input', (e) => tradTimeRange.value = e.target.value);
}

function calculateSavings() {
    const count = parseInt(document.getElementById('simCount').value) || 10;
    const tradTime = parseFloat(document.getElementById('tradTime').value) || 5;
    const templateType = document.getElementById('templateType').value;
    
    const config = devTimes[templateType];
    const traditionalTotal = count * tradTime;
    const templateTotal = config.first + (count * config.additional);
    const timeSaved = traditionalTotal - templateTotal;
    const percentSaved = ((timeSaved / traditionalTotal) * 100).toFixed(1);
    
    document.getElementById('results').innerHTML = `
        <p><strong>Traditional Approach:</strong> ${traditionalTotal.toFixed(1)} hours</p>
        <p><strong>Template Approach:</strong> ${templateTotal.toFixed(1)} hours</p>
        <p><strong>Time Saved:</strong> <span style="color: var(--success); font-weight: 700; font-size: 1.1rem;">${timeSaved.toFixed(1)} hours (${percentSaved}%)</span></p>
    `;
    
    drawSavingsChart(count, traditionalTotal, templateTotal);
}

function drawSavingsChart(count, traditional, template) {
    const chart = document.getElementById('savingsChart');
    const maxVal = Math.max(traditional, template);
    const tradWidth = (traditional / maxVal) * 100;
    const tempWidth = (template / maxVal) * 100;
    
    chart.innerHTML = `
        <h3 style="margin-bottom: 15px; color: var(--text); font-size: 1.1rem;">Time Comparison for ${count} Simulations</h3>
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: 600; color: var(--text); font-size: 0.9rem;">Traditional Approach</span>
                <span style="font-weight: 700; color: #ef4444; font-size: 0.9rem;">${traditional.toFixed(1)}h</span>
            </div>
            <div style="width: 100%; height: 35px; background: var(--bg-light); border-radius: 6px; overflow: hidden;">
                <div style="width: ${tradWidth}%; height: 100%; background: linear-gradient(90deg, #ef4444, #dc2626); transition: width 0.6s; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-weight: 600; font-size: 0.9rem;"></div>
            </div>
        </div>
        <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: 600; color: var(--text); font-size: 0.9rem;">Template Approach</span>
                <span style="font-weight: 700; color: var(--success); font-size: 0.9rem;">${template.toFixed(1)}h</span>
            </div>
            <div style="width: 100%; height: 35px; background: var(--bg-light); border-radius: 6px; overflow: hidden;">
                <div style="width: ${tempWidth}%; height: 100%; background: linear-gradient(90deg, var(--success), #059669); transition: width 0.6s; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-weight: 600; font-size: 0.9rem;"></div>
            </div>
        </div>
    `;
}

// Demo Functions
function setupDemoParams() {
    const velInput = document.getElementById('velocity');
    const angInput = document.getElementById('angle');
    const gravInput = document.getElementById('gravity');
    const speedInput = document.getElementById('simSpeed');
    
    velInput.addEventListener('input', (e) => {
        velocity = parseInt(e.target.value);
        document.getElementById('velocityVal').textContent = velocity;
        if (!demoRunning) { trail = []; drawDemo(); }
    });
    
    angInput.addEventListener('input', (e) => {
        angle = parseInt(e.target.value);
        document.getElementById('angleVal').textContent = angle;
        if (!demoRunning) { trail = []; drawDemo(); }
    });
    
    gravInput.addEventListener('input', (e) => {
        gravity = parseInt(e.target.value);
        document.getElementById('gravityVal').textContent = gravity;
        if (!demoRunning) { trail = []; drawDemo(); }
    });
    
    speedInput.addEventListener('input', (e) => {
        simSpeed = parseInt(e.target.value);
        document.getElementById('simSpeedVal').textContent = `${simSpeed}x`;
    });
    
    updateSimInfo();
}

function calculateSimulationValues() {
    let x, y, vx, vy, speed, height;
    const scale = 3;
    const canvas = document.getElementById('simCanvas');
    const width = canvas.width;
    const heightCanvas = canvas.height;
    const groundY = heightCanvas - 80;
    
    switch(currentSimType) {
        case 'projectile':
            const angleRad = (angle * Math.PI) / 180;
            vx = velocity * Math.cos(angleRad);
            vy = velocity * Math.sin(angleRad) - gravity * demoTime;
            x = 80 + (vx * demoTime * scale);
            y = groundY - ((velocity * Math.sin(angleRad) * demoTime * scale) - (0.5 * gravity * demoTime * demoTime * scale * scale));
            height = Math.max(0, ((velocity * Math.sin(angleRad) * demoTime) - (0.5 * gravity * demoTime * demoTime)));
            break;
            
        case 'linear':
            vx = velocity;
            vy = 0;
            x = 80 + (velocity * demoTime * scale);
            y = groundY - 40;
            height = 40 / scale;
            break;
            
        case 'freefall':
            vx = 0;
            vy = gravity * demoTime;
            x = width / 2;
            y = groundY - ((100 * scale) - (0.5 * gravity * demoTime * demoTime * scale * scale));
            height = Math.max(0, 100 - (0.5 * gravity * demoTime * demoTime));
            break;
            
        case 'inclined':
            const inclineRad = (inclineAngle * Math.PI) / 180;
            const acceleration = gravity * Math.sin(inclineRad) - friction * gravity * Math.cos(inclineRad);
            vx = velocity + acceleration * demoTime;
            vy = 0;
            x = 80 + (vx * demoTime * scale);
            y = groundY - 40 - (Math.tan(inclineRad) * (x - 80));
            height = 40 / scale + (x - 80) * Math.tan(inclineRad) / scale;
            break;
    }
    
    speed = Math.sqrt(vx * vx + vy * vy);
    y = Math.min(heightCanvas - 16, Math.max(16, y));
    
    return { x, y, vx, vy, speed, height };
}

function drawDemo() {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const groundY = height - 80;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background based on simulation type
    drawBackground(ctx, width, height);
    
    // Calculate current position and velocity
    const simValues = calculateSimulationValues();
    let { x, y, vx, vy, speed, height: simHeight } = simValues;
    
    // Add to trail
    if (demoRunning) {
        trail.push({ x, y });
        if (trail.length > 50) trail.shift();
    }
    
    // Draw specific elements for each simulation type
    switch(currentSimType) {
        case 'projectile':
            drawProjectileElements(ctx, width, height, groundY);
            break;
        case 'linear':
            drawLinearElements(ctx, width, height, groundY);
            break;
        case 'freefall':
            drawFreefallElements(ctx, width, height, groundY);
            break;
        case 'inclined':
            drawInclinedElements(ctx, width, height, groundY);
            break;
    }
    
    // Draw trail
    if (trail.length > 1) {
        const trailGrad = ctx.createLinearGradient(trail[0].x, trail[0].y, x, y);
        trailGrad.addColorStop(0, 'rgba(236, 72, 153, 0.2)');
        trailGrad.addColorStop(1, 'rgba(236, 72, 153, 0.8)');
        
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.stroke();
        
        // Trail particles
        trail.forEach((point, i) => {
            if (i % 3 === 0) {
                ctx.fillStyle = `rgba(236, 72, 153, ${0.3 + (i / trail.length) * 0.5})`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    // Update info display
    document.getElementById('posX').textContent = Math.round(x);
    document.getElementById('posY').textContent = Math.round(height - y);
    document.getElementById('velDisplay').textContent = speed.toFixed(1);
    document.getElementById('timeDisplay').textContent = demoTime.toFixed(2);
    document.getElementById('heightDisplay').textContent = simHeight.toFixed(1);
    
    // Draw object
    drawObject(ctx, x, y, vx, vy);
    
    // Check if simulation should end
    if (demoRunning) {
        const shouldEnd = checkSimulationEnd(x, y, width, height, groundY);
        if (shouldEnd) {
            pauseDemo();
        }
    }
}

function drawBackground(ctx, width, height) {
    const groundY = height - 80;
    
    // Draw sky with gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGradient.addColorStop(0, currentSimType === 'freefall' ? '#1e3a8a' : '#0f172a');
    skyGradient.addColorStop(1, currentSimType === 'freefall' ? '#1e40af' : '#1e293b');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, groundY);
    
    // Draw stars (only for projectile)
    if (currentSimType === 'projectile') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 30; i++) {
            const sx = Math.random() * width;
            const sy = Math.random() * groundY;
            ctx.fillRect(sx, sy, 1.5, 1.5);
        }
    }
    
    // Draw ground
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, '#334155');
    groundGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, 80);
    
    // Ground line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();
}

function drawProjectileElements(ctx, width, height, groundY) {
    const angleRad = (angle * Math.PI) / 180;
    const vx = velocity * Math.cos(angleRad);
    const scale = 3;
    
    // Draw launch platform
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(40, groundY - 20, 80, 20);
    
    // Draw trajectory prediction
    if (!demoRunning || trail.length === 0) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        for (let t = 0; t <= 10; t += 0.1) {
            const px = 80 + (vx * t * scale);
            const py = groundY - ((velocity * Math.sin(angleRad) * t * scale) - (0.5 * gravity * t * t * scale * scale));
            if (py >= groundY) break;
            if (t === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function drawLinearElements(ctx, width, height, groundY) {
    // Draw track
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, groundY - 40);
    ctx.lineTo(width - 80, groundY - 40);
    ctx.stroke();
    
    // Draw track markings
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 10]);
    ctx.beginPath();
    ctx.moveTo(80, groundY - 40);
    ctx.lineTo(width - 80, groundY - 40);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw start and end markers
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(80, groundY - 40, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(width - 80, groundY - 40, 6, 0, Math.PI * 2);
    ctx.fill();
}

function drawFreefallElements(ctx, width, height, groundY) {
    // Draw building or platform
    const platformX = width / 2;
    ctx.fillStyle = '#475569';
    ctx.fillRect(platformX - 40, groundY - 100, 80, 100);
    
    // Draw platform top
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(platformX - 50, groundY - 100, 100, 10);
    
    // Draw height indicator
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(platformX, groundY - 100);
    ctx.lineTo(platformX, groundY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw height label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Arial';
    ctx.fillText('100m', platformX + 10, groundY - 50);
}

function drawInclinedElements(ctx, width, height, groundY) {
    const inclineRad = (inclineAngle * Math.PI) / 180;
    const inclineLength = 400;
    const inclineHeight = inclineLength * Math.sin(inclineRad);
    const startX = 80;
    const startY = groundY - 40;
    
    // Draw inclined plane
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + inclineLength, startY);
    ctx.lineTo(startX + inclineLength, startY - inclineHeight);
    ctx.closePath();
    ctx.fill();
    
    // Draw plane surface
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + inclineLength, startY - inclineHeight);
    ctx.stroke();
    
    // Draw angle indicator
    const arcRadius = 30;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(startX, startY, arcRadius, 0, inclineRad);
    ctx.stroke();
    
    // Draw angle label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Arial';
    ctx.fillText(`${inclineAngle}°`, startX + 20, startY - 15);
    
    // Draw friction indicator
    if (friction > 0) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.fillRect(startX + 100, startY - 10, 200, 5);
    }
}

function drawObject(ctx, x, y, vx, vy) {
    if (x < 0 || x > ctx.canvas.width || y < 0 || y > ctx.canvas.height) return;
    
    // Glow effect
    const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, 20);
    glowGrad.addColorStop(0, 'rgba(236, 72, 153, 0.6)');
    glowGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Main ball
    const ballGrad = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, 12);
    ballGrad.addColorStop(0, '#fce7f3');
    ballGrad.addColorStop(0.5, '#ec4899');
    ballGrad.addColorStop(1, '#be185d');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Ball border
    ctx.strokeStyle = '#9d174d';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Velocity vector
    if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
        const vectorScale = 2;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + vx * vectorScale, y - vy * vectorScale);
        ctx.stroke();
        
        // Arrow head
        const arrowX = x + vx * vectorScale;
        const arrowY = y - vy * vectorScale;
        const arrowAngle = Math.atan2(-vy, vx);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 8 * Math.cos(arrowAngle - 0.3), arrowY + 8 * Math.sin(arrowAngle - 0.3));
        ctx.lineTo(arrowX - 8 * Math.cos(arrowAngle + 0.3), arrowY + 8 * Math.sin(arrowAngle + 0.3));
        ctx.closePath();
        ctx.fill();
    }
}

function checkSimulationEnd(x, y, width, height, groundY) {
    switch(currentSimType) {
        case 'projectile':
            return y >= groundY || x >= width || demoTime > 20;
        case 'linear':
            return x >= width - 80 || demoTime > 10;
        case 'freefall':
            return y >= groundY || demoTime > 5;
        case 'inclined':
            return x >= width - 80 || demoTime > 15;
    }
    return false;
}

// Replace the existing animate, startDemo, pauseDemo, and resetDemo functions with these:

function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    
    if (demoRunning) {
        const deltaTime = (currentTime - lastTime) / 1000;
        demoTime += deltaTime * (simSpeed / 3);
        drawDemo();
    }
    
    lastTime = currentTime;
    
    // Always request the next frame, even when paused
    animationId = requestAnimationFrame(animate);
}

function startDemo() {
    if (!demoRunning) {
        demoRunning = true;
        // Don't reset lastTime here - keep it for smooth delta calculation
        if (!animationId) {
            lastTime = 0;
            animationId = requestAnimationFrame(animate);
        }
    }
}

function pauseDemo() {
    demoRunning = false;
    // Don't cancel animation frame - let the loop continue but not update
}

function resetDemo() {
    // Pause first
    demoRunning = false;
    
    // Reset all simulation values
    demoTime = 0;
    trail = [];
    lastTime = 0;
    
    // Cancel any existing animation frame
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Redraw the initial state
    drawDemo();
}