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
        <p><strong>Time Saved:</strong> <span style="color: var(--success); font-weight: 700; font-size: 1.3rem;">${timeSaved.toFixed(1)} hours (${percentSaved}%)</span></p>
    `;
    
    drawSavingsChart(count, traditionalTotal, templateTotal);
}

function drawSavingsChart(count, traditional, template) {
    const chart = document.getElementById('savingsChart');
    const maxVal = Math.max(traditional, template);
    const tradWidth = (traditional / maxVal) * 100;
    const tempWidth = (template / maxVal) * 100;
    
    chart.innerHTML = `
        <h3 style="margin-bottom: 20px; color: var(--text); font-size: 1.3rem;">Time Comparison for ${count} Simulations</h3>
        <div style="margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: 600; color: var(--text);">Traditional Approach</span>
                <span style="font-weight: 700; color: #ef4444;">${traditional.toFixed(1)}h</span>
            </div>
            <div style="width: 100%; height: 40px; background: var(--bg-light); border-radius: 8px; overflow: hidden;">
                <div style="width: ${tradWidth}%; height: 100%; background: linear-gradient(90deg, #ef4444, #dc2626); transition: width 0.6s; display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; color: white; font-weight: 600;"></div>
            </div>
        </div>
        <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: 600; color: var(--text);">Template Approach</span>
                <span style="font-weight: 700; color: var(--success);">${template.toFixed(1)}h</span>
            </div>
            <div style="width: 100%; height: 40px; background: var(--bg-light); border-radius: 8px; overflow: hidden;">
                <div style="width: ${tempWidth}%; height: 100%; background: linear-gradient(90deg, var(--success), #059669); transition: width 0.6s; display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; color: white; font-weight: 600;"></div>
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
}

function drawDemo() {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw sky with gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height - 80);
    skyGradient.addColorStop(0, '#1e3a8a');
    skyGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height - 80);
    
    // Draw stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
        const sx = Math.random() * width;
        const sy = Math.random() * (height - 80);
        ctx.fillRect(sx, sy, 2, 2);
    }
    
    // Draw ground with gradient
    const groundGrad = ctx.createLinearGradient(0, height - 80, 0, height);
    groundGrad.addColorStop(0, '#334155');
    groundGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, height - 80, width, 80);
    
    // Ground line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, height - 80);
    ctx.lineTo(width, height - 80);
    ctx.stroke();
    
    // Calculate projectile position
    const angleRad = (angle * Math.PI) / 180;
    const vx = velocity * Math.cos(angleRad);
    const vy = velocity * Math.sin(angleRad);
    
    const scale = 4; // Reduced scale for slower animation
    const x = 80 + (vx * demoTime * scale);
    const y = (height - 90) - ((vy * demoTime * scale) - (0.5 * gravity * demoTime * demoTime * scale * scale));
    
    // Add to trail
    if (demoRunning) {
        trail.push({ x, y });
        if (trail.length > 100) trail.shift();
    }
    
    // Draw trajectory prediction (dotted line)
    if (!demoRunning || trail.length === 0) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        for (let t = 0; t <= 10; t += 0.1) {
            const px = 80 + (vx * t * scale);
            const py = (height - 90) - ((vy * t * scale) - (0.5 * gravity * t * t * scale * scale));
            if (py >= height - 80) break;
            if (t === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Draw trail
    if (trail.length > 1) {
        const trailGrad = ctx.createLinearGradient(trail[0].x, trail[0].y, x, y);
        trailGrad.addColorStop(0, 'rgba(236, 72, 153, 0.2)');
        trailGrad.addColorStop(1, 'rgba(236, 72, 153, 0.8)');
        
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = 4;
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
                ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    // Draw launch platform
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(40, height - 100, 80, 20);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, height - 100, 80, 20);
    
    // Update info display
    const currentVx = vx;
    const currentVy = vy - gravity * demoTime;
    const currentSpeed = Math.sqrt(currentVx * currentVx + currentVy * currentVy);
    const currentHeight = Math.max(0, ((vy * demoTime * scale) - (0.5 * gravity * demoTime * demoTime * scale * scale)) / scale);
    
    document.getElementById('posX').textContent = Math.round(x);
    document.getElementById('posY').textContent = Math.round(height - y);
    document.getElementById('velDisplay').textContent = currentSpeed.toFixed(1);
    document.getElementById('timeDisplay').textContent = demoTime.toFixed(2);
    document.getElementById('heightDisplay').textContent = currentHeight.toFixed(1);
    
    // Draw projectile
    if (x < width && y < height - 80 && y > 0) {
        // Glow effect
        const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, 25);
        glowGrad.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
        glowGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.3)');
        glowGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Main ball with gradient
        const ballGrad = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, 16);
        ballGrad.addColorStop(0, '#fce7f3');
        ballGrad.addColorStop(0.5, '#ec4899');
        ballGrad.addColorStop(1, '#be185d');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#9d174d';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Velocity vector
        if (Math.abs(currentVx) > 0.1 || Math.abs(currentVy) > 0.1) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + currentVx * 2, y - currentVy * 2);
            ctx.stroke();
            
            // Arrow head
            const arrowX = x + currentVx * 2;
            const arrowY = y - currentVy * 2;
            const arrowAngle = Math.atan2(-currentVy, currentVx);
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 10 * Math.cos(arrowAngle - 0.3), arrowY + 10 * Math.sin(arrowAngle - 0.3));
            ctx.lineTo(arrowX - 10 * Math.cos(arrowAngle + 0.3), arrowY + 10 * Math.sin(arrowAngle + 0.3));
            ctx.closePath();
            ctx.fill();
        }
    }
}

// Fixed animation function with proper timing
function animate(currentTime) {
    if (!demoRunning) return;
    
    // Calculate delta time for smooth animation
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    
    // Update time based on simulation speed
    demoTime += deltaTime * (simSpeed / 3);
    
    // Check if projectile has landed
    const angleRad = (angle * Math.PI) / 180;
    const vy = velocity * Math.sin(angleRad);
    const flightTime = (2 * vy) / gravity;
    
    if (demoTime < flightTime) {
        drawDemo();
        lastTime = currentTime;
        animationId = requestAnimationFrame(animate);
    } else {
        demoRunning = false;
        demoTime = flightTime; // Cap at landing time
        drawDemo();
    }
}

function startDemo() {
    if (!demoRunning) {
        if (demoTime === 0) {
            trail = [];
            drawDemo();
        }
        demoRunning = true;
        lastTime = 0;
        animationId = requestAnimationFrame(animate);
    }
}

function pauseDemo() {
    demoRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function resetDemo() {
    pauseDemo();
    demoTime = 0;
    trail = [];
    drawDemo();
}

// Download Functions
