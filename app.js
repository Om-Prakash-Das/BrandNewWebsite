/* ===== APP.JS - FitJourney Interactive Logic ===== */

(function () {
    'use strict';

    // ===== DATA MANAGEMENT =====
    const STORAGE_KEY = 'fitjourney_data';

    function loadData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : getDefaultData();
        } catch (e) {
            return getDefaultData();
        }
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }

    function getDefaultData() {
        return {
            workouts: [],
            weights: [],
            measurements: [],
            photos: [],
            goals: [],
            timeline: []
        };
    }

    let appData = loadData();

    // ===== TOAST NOTIFICATION =====
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast ' + type;
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ===== NAVIGATION =====
    function initNav() {
        const navbar = document.getElementById('navbar');
        const mobileBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.querySelectorAll('.nav-links a');

        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });

        mobileBtn?.addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('open');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                document.querySelector('.nav-links').classList.remove('open');
            });
        });

        // Active nav link on scroll
        const sections = document.querySelectorAll('section[id]');
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                if (window.scrollY >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        });
    }

    // ===== HERO STATS =====
    function updateHeroStats() {
        const workouts = appData.workouts;
        const uniqueDates = new Set(workouts.map(w => w.date)).size;
        const totalHours = workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / 60;
        
        document.getElementById('totalWorkouts').textContent = workouts.length;
        document.getElementById('totalDays').textContent = uniqueDates;
        document.getElementById('currentStreak').textContent = calculateStreak();
        document.getElementById('totalHours').textContent = totalHours.toFixed(1);
    }

    function calculateStreak() {
        const dates = [...new Set(appData.workouts.map(w => w.date))].sort().reverse();
        if (dates.length === 0) return 0;
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let checkDate = new Date(today);
        for (let i = 0; i < dates.length; i++) {
            const d = new Date(dates[i]);
            d.setHours(0, 0, 0, 0);
            if (d.getTime() === checkDate.getTime()) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (d.getTime() < checkDate.getTime()) {
                break;
            } else {
                break;
            }
        }
        return streak;
    }

    // ===== WORKOUT FORM =====
    function initWorkoutForm() {
        const form = document.getElementById('workoutForm');
        const dateInput = document.getElementById('workoutDate');
        dateInput.value = new Date().toISOString().split('T')[0];

        // Intensity selector
        const intensityBtns = document.querySelectorAll('.intensity-btn');
        let selectedIntensity = 'Medium';
        intensityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                intensityBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedIntensity = btn.dataset.level;
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const workout = {
                id: Date.now(),
                date: dateInput.value,
                type: document.getElementById('workoutType').value,
                duration: parseInt(document.getElementById('workoutDuration').value),
                intensity: selectedIntensity,
                exercises: document.getElementById('workoutExercises').value,
                notes: document.getElementById('workoutNotes').value,
                timestamp: new Date().toISOString()
            };

            appData.workouts.unshift(workout);
            
            // Add to timeline
            appData.timeline.unshift({
                id: workout.id,
                date: workout.date,
                type: workout.type,
                text: `Completed ${workout.type} workout for ${workout.duration} minutes`,
                icon: 'fa-dumbbell'
            });

            saveData();
            renderAll();
            form.reset();
            dateInput.value = new Date().toISOString().split('T')[0];
            showToast('Workout logged successfully! 💪', 'success');
        });
    }

    // ===== WORKOUT HISTORY =====
    function renderWorkoutHistory() {
        const container = document.getElementById('workoutHistory');
        const workouts = appData.workouts.slice(0, 20);

        if (workouts.length === 0) {
            container.innerHTML = '<p class="empty-state">No workouts logged yet.</p>';
            return;
        }

        container.innerHTML = workouts.map(w => `
            <div class="workout-item">
                <div class="workout-info">
                    <h4>${w.type}</h4>
                    <p>${w.exercises ? w.exercises.substring(0, 40) + (w.exercises.length > 40 ? '...' : '') : 'No exercises listed'}</p>
                </div>
                <div class="workout-meta">
                    <span class="intensity-badge intensity-${w.intensity}">${w.intensity}</span>
                    <div class="duration">${w.duration} min</div>
                    <div class="date">${formatDate(w.date)}</div>
                </div>
            </div>
        `).join('');
    }

    // ===== RECENT WORKOUTS (DASHBOARD) =====
    function renderRecentWorkouts() {
        const container = document.getElementById('recentWorkoutsList');
        const workouts = appData.workouts.slice(0, 5);

        if (workouts.length === 0) {
            container.innerHTML = '<p class="empty-state">No workouts logged yet. <a href="#workouts" class="link">Start your first workout!</a></p>';
            return;
        }

        container.innerHTML = workouts.map(w => `
            <div class="workout-item">
                <div class="workout-info">
                    <h4>${w.type}</h4>
                    <p>${w.exercises ? w.exercises.substring(0, 40) + (w.exercises.length > 40 ? '...' : '') : 'No exercises listed'}</p>
                </div>
                <div class="workout-meta">
                    <span class="intensity-badge intensity-${w.intensity}">${w.intensity}</span>
                    <div class="duration">${w.duration} min</div>
                    <div class="date">${formatDate(w.date)}</div>
                </div>
            </div>
        `).join('');
    }

    // ===== WEIGHT TRACKING =====
    function initWeightTracking() {
        const btn = document.getElementById('addWeightBtn');
        const dateInput = document.getElementById('weightDate');
        dateInput.value = new Date().toISOString().split('T')[0];

        btn.addEventListener('click', () => {
            const weight = parseFloat(document.getElementById('weightInput').value);
            const date = document.getElementById('weightDate').value;

            if (!weight || !date) {
                showToast('Please enter both weight and date', 'error');
                return;
            }

            appData.weights.push({ weight, date });
            appData.weights.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            saveData();
            renderWeightHistory();
            renderWeightChart();
            document.getElementById('weightInput').value = '';
            showToast('Weight recorded! 🏋️', 'success');
        });
    }

    function renderWeightHistory() {
        const container = document.getElementById('weightHistory');
        const weights = appData.weights.slice(-10);

        if (weights.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = weights.map(w => `
            <div class="weight-item">
                <span class="weight-value">${w.weight} kg</span>
                <span class="weight-date">${formatDate(w.date)}</span>
            </div>
        `).join('');
    }

    // ===== WEIGHT CHART =====
    function renderWeightChart() {
        const canvas = document.getElementById('weightChart');
        const ctx = canvas.getContext('2d');
        const weights = appData.weights;

        canvas.width = canvas.offsetWidth;
        canvas.height = 250;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (weights.length < 2) {
            ctx.fillStyle = '#8892a0';
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Add at least 2 weight entries to see the chart', canvas.width / 2, canvas.height / 2);
            return;
        }

        const padding = 50;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const minWeight = Math.min(...weights.map(w => w.weight)) - 2;
        const maxWeight = Math.max(...weights.map(w => w.weight)) + 2;
        const range = maxWeight - minWeight || 1;

        // Grid lines
        ctx.strokeStyle = '#e8ecf1';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }

        // Y-axis labels
        ctx.fillStyle = '#8892a0';
        ctx.font = '12px Inter';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const val = maxWeight - (range / 4) * i;
            const y = padding + (chartHeight / 4) * i;
            ctx.fillText(val.toFixed(1), padding - 10, y + 4);
        }

        // Line chart
        const points = weights.map((w, i) => ({
            x: padding + (chartWidth / (weights.length - 1)) * i,
            y: padding + chartHeight - ((w.weight - minWeight) / range) * chartHeight
        }));

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
        gradient.addColorStop(0, 'rgba(255, 107, 53, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 107, 53, 0.01)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, canvas.height - padding);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, canvas.height - padding);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Points
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6b35';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        });

        // X-axis labels
        ctx.fillStyle = '#8892a0';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        const step = Math.max(1, Math.floor(weights.length / 6));
        weights.forEach((w, i) => {
            if (i % step === 0 || i === weights.length - 1) {
                const x = padding + (chartWidth / (weights.length - 1)) * i;
                ctx.fillText(formatDate(w.date), x, canvas.height - padding + 20);
            }
        });
    }

    // ===== MEASUREMENTS =====
    function initMeasurements() {
        document.getElementById('addMeasureBtn').addEventListener('click', () => {
            const measurements = {
                chest: parseFloat(document.getElementById('chestMeasure').value),
                arms: parseFloat(document.getElementById('armsMeasure').value),
                waist: parseFloat(document.getElementById('waistMeasure').value),
                legs: parseFloat(document.getElementById('legsMeasure').value),
                date: new Date().toISOString().split('T')[0]
            };

            if (!measurements.chest && !measurements.arms && !measurements.waist && !measurements.legs) {
                showToast('Please enter at least one measurement', 'error');
                return;
            }

            appData.measurements.push(measurements);
            saveData();
            
            ['chestMeasure', 'armsMeasure', 'waistMeasure', 'legsMeasure'].forEach(id => {
                document.getElementById(id).value = '';
            });
            
            showToast('Measurements saved! 📏', 'success');
        });
    }

    // ===== PHOTO GALLERY =====
    function initGallery() {
        const uploadArea = document.getElementById('uploadArea');
        const photoInput = document.getElementById('photoInput');
        const browseBtn = document.getElementById('browseBtn');
        const uploadBtn = document.getElementById('uploadPhotosBtn');

        browseBtn.addEventListener('click', () => photoInput.click());
        uploadArea.addEventListener('click', () => photoInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            photoInput.files = e.dataTransfer.files;
        });

        photoInput.addEventListener('change', () => {
            if (photoInput.files.length > 0) {
                uploadArea.innerHTML = `<i class="fas fa-check-circle" style="color: var(--secondary);"></i><p>${photoInput.files.length} photo(s) selected</p>`;
            }
        });

        uploadBtn.addEventListener('click', () => {
            const files = photoInput.files;
            if (!files || files.length === 0) {
                showToast('Please select photos first', 'error');
                return;
            }

            const type = document.getElementById('photoType').value;
            const label = document.getElementById('photoLabel').value || `${type} Photo`;

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    appData.photos.push({
                        id: Date.now() + Math.random(),
                        src: e.target.result,
                        type: type,
                        label: label,
                        date: new Date().toISOString().split('T')[0]
                    });
                    saveData();
                    renderGallery();
                    showToast('Photo uploaded! 📸', 'success');
                };
                reader.readAsDataURL(file);
            });

            photoInput.value = '';
            uploadArea.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><p>Drag & drop photos here or click to browse</p><input type="file" id="photoInput" accept="image/*" multiple hidden><button class="btn btn-outline" id="browseBtn">Browse Photos</button>';
            document.getElementById('browseBtn')?.addEventListener('click', () => photoInput.click());
            document.getElementById('photoLabel').value = '';
        });

        renderGallery();
    }

    function renderGallery() {
        const container = document.getElementById('galleryGrid');
        const photos = appData.photos;

        if (photos.length === 0) {
            container.innerHTML = '<p class="empty-state">No photos uploaded yet. Share your transformation!</p>';
            return;
        }

        container.innerHTML = photos.map(p => `
            <div class="gallery-item">
                <img src="${p.src}" alt="${p.label}">
                <button class="gallery-item-remove" onclick="window.removePhoto(${p.id})" title="Remove"><i class="fas fa-times"></i></button>
                <div class="gallery-item-info">
                    <h4>${p.label}</h4>
                    <p>${p.type} · ${formatDate(p.date)}</p>
                </div>
            </div>
        `).join('');
    }

    window.removePhoto = function(id) {
        appData.photos = appData.photos.filter(p => p.id !== id);
        saveData();
        renderGallery();
        showToast('Photo removed', 'error');
    };

    // ===== GOALS =====
    function initGoals() {
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentW = parseFloat(document.getElementById('currentWeightGoal').value) || 0;
            const targetW = parseFloat(document.getElementById('targetWeight').value) || 0;
            
            const goal = {
                id: Date.now(),
                type: document.getElementById('goalType').value,
                targetWeight: targetW,
                currentWeight: currentW,
                targetDate: document.getElementById('targetDate').value,
                description: document.getElementById('goalDescription').value,
                completed: false,
                timestamp: new Date().toISOString()
            };

            appData.goals.push(goal);
            saveData();
            renderGoals();
            updateGoalProgress();
            
            document.getElementById('goalForm').reset();
            showToast('Goal set! 🎯', 'success');
        });

        renderGoals();
        updateGoalProgress();
    }

    function renderGoals() {
        const container = document.getElementById('activeGoals');
        const goals = appData.goals;

        if (goals.length === 0) {
            container.innerHTML = '<p class="empty-state">No goals set yet. Start working toward your dreams!</p>';
            return;
        }

        container.innerHTML = goals.map(g => {
            const progress = g.currentWeight && g.targetWeight ? Math.min(100, Math.round(((g.currentWeight - g.targetWeight) / g.targetWeight) * 100)) : 0;
            const clampedProgress = Math.max(0, progress);
            
            return `
                <div class="goal-item">
                    <div class="goal-icon"><i class="fas fa-${getGoalIcon(g.type)}"></i></div>
                    <div class="goal-info">
                        <h4>${g.type} Goal</h4>
                        <p>${g.description || `Target: ${g.targetWeight}kg · Due: ${formatDate(g.targetDate)}`}</p>
                        <div class="goal-progress">
                            <div class="goal-progress-bar" style="width: ${clampedProgress}%"></div>
                        </div>
                    </div>
                    <button class="goal-delete" onclick="window.deleteGoal(${g.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
        }).join('');
    }

    function getGoalIcon(type) {
        const icons = { Weight: 'weight', Muscle: 'dumbbell', Strength: 'fist-raised', Endurance: 'heart', General: 'running' };
        return icons[type] || 'flag';
    }

    window.deleteGoal = function(id) {
        appData.goals = appData.goals.filter(g => g.id !== id);
        saveData();
        renderGoals();
        updateGoalProgress();
        showToast('Goal removed', 'error');
    };

    function updateGoalProgress() {
        const goals = appData.goals;
        const ring = document.getElementById('goalRing');
        const percentEl = document.getElementById('goalPercent');
        
        if (goals.length === 0) {
            ring.style.strokeDasharray = '283';
            ring.style.strokeDashoffset = '283';
            percentEl.textContent = '0%';
            return;
        }

        const totalCompleted = goals.filter(g => g.completed).length;
        const percent = Math.round((totalCompleted / goals.length) * 100);
        
        ring.style.strokeDasharray = '283';
        ring.style.strokeDashoffset = 283 - (283 * percent / 100);
        percentEl.textContent = percent + '%';
    }

    // ===== TIMELINE =====
    function renderTimeline() {
        const container = document.getElementById('timelineContainer');
        const items = appData.timeline.slice(0, 20);

        if (items.length === 0) {
            container.innerHTML = '<p class="empty-state">Start logging workouts to build your journey timeline!</p>';
            return;
        }

        container.innerHTML = items.map((item, i) => `
            <div class="timeline-item">
                <div class="timeline-marker"><span></span></div>
                <div class="timeline-date">${formatDate(item.date)}</div>
                <div class="timeline-content">
                    <span class="tag">${item.type}</span>
                    <h3>${item.text}</h3>
                </div>
            </div>
        `).join('');
    }

    // ===== WEEKLY CHART =====
    function renderWeeklyChart() {
        const canvas = document.getElementById('weeklyChart');
        const ctx = canvas.getContext('2d');
        const workouts = appData.workouts;

        canvas.width = 300;
        canvas.height = 150;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (workouts.length === 0) {
            ctx.fillStyle = '#8892a0';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No data yet', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Group workouts by day of week
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        const last7Days = [];
        
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            last7Days.push(d);
        }

        last7Days.forEach(d => {
            const dayStr = d.toISOString().split('T')[0];
            const count = workouts.filter(w => w.date === dayStr).length;
            dayCounts[last7Days.indexOf(d)] = count;
        });

        const maxVal = Math.max(...dayCounts, 1);
        const barWidth = 30;
        const gap = 15;
        const chartHeight = 100;
        const startX = 30;
        const startY = 130;

        // Bars
        dayCounts.forEach((count, i) => {
            const x = startX + i * (barWidth + gap);
            const barH = (count / maxVal) * chartHeight;
            const y = startY - barH;

            // Bar
            const gradient = ctx.createLinearGradient(x, y, x, startY);
            gradient.addColorStop(0, '#ff6b35');
            gradient.addColorStop(1, '#ff9a76');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
            ctx.fill();

            // Label
            ctx.fillStyle = '#8892a0';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(days[i], x + barWidth / 2, startY + 18);

            // Value
            if (count > 0) {
                ctx.fillStyle = '#ff6b35';
                ctx.font = 'bold 11px Inter';
                ctx.fillText(count, x + barWidth / 2, y - 5);
            }
        });
    }

    // ===== UTILITY FUNCTIONS =====
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    }

    // ===== RENDER ALL =====
    function renderAll() {
        updateHeroStats();
        renderWorkoutHistory();
        renderRecentWorkouts();
        renderWeightHistory();
        renderWeightChart();
        renderGallery();
        renderGoals();
        renderTimeline();
        renderWeeklyChart();
        updateGoalProgress();
    }

    // ===== INITIALIZE =====
    document.addEventListener('DOMContentLoaded', () => {
        initNav();
        initWorkoutForm();
        initWeightTracking();
        initMeasurements();
        initGallery();
        initGoals();
        renderAll();
        
        // Animate on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });
    });

})();