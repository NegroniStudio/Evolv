// EBOLVP Engine - Shared Logic
const state = {
    theme: localStorage.getItem('theme') || 'light',
    categories: JSON.parse(localStorage.getItem('categories')) || ['Salud', 'Mente', 'Productividad', 'Social'],
    habits: JSON.parse(localStorage.getItem('habits')) || [],
    completedDays: JSON.parse(localStorage.getItem('completedDays')) || {},
    notes: JSON.parse(localStorage.getItem('notes')) || [],
    settings: JSON.parse(localStorage.getItem('settings')) || {
        weeklyGoal: 50,
        pendingGoal: null
    },
    selectedDate: localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0]
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    updateActiveNavItem();

    // Page-specific init
    const bodyId = document.body.id;
    if (bodyId === 'page-inicio') initDashboard();
    if (bodyId === 'page-habitos') renderHabitsList();
    if (bodyId === 'page-calendario') renderCalendar();
    if (bodyId === 'page-consejos') renderTips();
    if (bodyId === 'page-notas') renderNotes();
    if (bodyId === 'page-ajustes') renderSettings();
});

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
}

function saveState() {
    localStorage.setItem('categories', JSON.stringify(state.categories));
    localStorage.setItem('habits', JSON.stringify(state.habits));
    localStorage.setItem('completedDays', JSON.stringify(state.completedDays));
    localStorage.setItem('settings', JSON.stringify(state.settings));
    localStorage.setItem('notes', JSON.stringify(state.notes));
    localStorage.setItem('theme', state.theme);
    localStorage.setItem('selectedDate', state.selectedDate);
}

function updateActiveNavItem() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href === page || (page === '' && href === 'index.html')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function navigate(page) {
    window.location.href = page;
}

// Modal System (Premium Rounded)
function showModal(title, content, onConfirm) {
    let overlay = document.getElementById('modal-container');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modal-container';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="modal-content glass fade-in">
            <h2 style="margin-bottom: 2rem;">${title}</h2>
            <div id="modal-form-body">${content}</div>
            <div style="display: flex; gap: 1rem; margin-top: 2.5rem;">
                <button class="btn accent" id="modal-confirm-btn" style="flex: 2;">Confirmar</button>
                <button class="btn secondary" onclick="closeModal()" style="flex: 1;">✕</button>
            </div>
        </div>
    `;

    document.getElementById('modal-confirm-btn').onclick = () => {
        if (onConfirm()) {
            closeModal();
            refreshCurrentPage();
        }
    };

    overlay.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('modal-container');
    if (modal) modal.style.display = 'none';
}

function refreshCurrentPage() {
    const bodyId = document.body.id;
    if (bodyId === 'page-inicio') initDashboard();
    if (bodyId === 'page-habitos') renderHabitsList();
    if (bodyId === 'page-calendario') renderCalendar();
    if (bodyId === 'page-notas') renderNotes();
}

// Global Habit State Helper
function getHabitStatus(habit, onDate) {
    if (habit.eliminationDate && onDate >= habit.eliminationDate) return { label: 'Eliminado', className: 'status-danger' };
    if (habit.eliminationDate && onDate < habit.eliminationDate) return { label: 'Pre-eliminación', className: 'status-warning' };

    if (habit.startType === 'specific' && onDate < habit.startDate) return { label: 'Preactivo', className: 'status-info' };
    if (habit.startType === 'range' && onDate < habit.startDate) return { label: 'Preactivo', className: 'status-info' };
    if (habit.startType === 'range' && onDate > habit.endDate) return { label: 'Finalizado', className: 'status-muted' };

    if (habit.paused) {
        const p = habit.paused;
        if (p.type === 'today' && onDate === new Date().toISOString().split('T')[0]) return { label: 'Pausado (Hoy)', className: 'status-muted' };
        if (p.type === 'indefinite') return { label: 'Pausado', className: 'status-muted' };
        if (p.type === 'range' && onDate >= p.start && onDate <= p.end) return { label: 'Pausado', className: 'status-muted' };
    }

    return { label: 'Activo', className: 'status-success' };
}

// --- Dashboard Logic ---
let radarChart;
function initDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const viewDate = state.selectedDate;
    const { streak, total } = calculateStats();

    // Date Display
    const dateEl = document.getElementById('dashboard-date');
    if (dateEl) {
        const todayFormatted = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const viewFormatted = new Date(viewDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        dateEl.innerHTML = `
            <div>Hoy: <span style="color: var(--accent)">${todayFormatted}</span></div>
            ${today !== viewDate ? `<div style="font-size: 0.8rem; margin-top: 5px;">Viendo: <span style="color: var(--success)">${viewFormatted}</span></div>` : ''}
        `;
    }

    document.getElementById('current-streak').textContent = streak;
    // ...
    const totalEl = document.getElementById('total-achieved');
    if (totalEl) totalEl.textContent = total;

    // Radar
    const ctx = document.getElementById('radarChart')?.getContext('2d');
    if (ctx) {
        if (radarChart) radarChart.destroy();
        radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: state.categories.map(cat => {
                    const viewDate = state.selectedDate;
                    const activeOnDate = state.habits.filter(h => getHabitStatus(h, viewDate).label === 'Activo');
                    const catHabits = activeOnDate.filter(h => h.category === cat);
                    if (catHabits.length === 0) return cat;
                    const doneCount = catHabits.filter(h => state.completedDays[viewDate]?.[h.id]).length;
                    const pct = Math.round((doneCount / catHabits.length) * 100);
                    return `${cat} (${pct}%)`;
                }),
                datasets: [{
                    label: 'Progreso %',
                    data: state.categories.map(cat => {
                        const activeOnDate = state.habits.filter(h => getHabitStatus(h, viewDate).label === 'Activo');
                        const catHabits = activeOnDate.filter(h => h.category === cat);
                        if (catHabits.length === 0) return 0;
                        const doneCount = catHabits.filter(h => state.completedDays[viewDate]?.[h.id]).length;
                        return Math.round((doneCount / catHabits.length) * 100);
                    }),
                    backgroundColor: 'rgba(14, 165, 233, 0.4)',
                    borderColor: '#0ea5e9',
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#0ea5e9',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#0ea5e9'
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { display: false },
                        grid: { color: 'rgba(100,100,100,0.1)' },
                        angleLines: { color: 'rgba(100,100,100,0.1)' },
                        pointLabels: {
                            font: { size: 12, family: "'Outfit', sans-serif", weight: '600' },
                            color: 'rgba(150,150,150,0.8)'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Daily List
    const container = document.getElementById('daily-habits-list');
    const habitsTitle = document.querySelector('#page-inicio h3:last-of-type');
    if (habitsTitle) habitsTitle.textContent = viewDate === today ? 'Hábitos de Hoy' : `Hábitos del ${new Date(viewDate + 'T00:00:00').toLocaleDateString('es-ES')}`;

    if (container) {
        const dayHabits = state.habits.filter(h => {
            const s = getHabitStatus(h, viewDate);
            return s.label === 'Activo';
        });

        container.innerHTML = dayHabits.length === 0 ? '<p style="opacity:0.5; text-align:center;">Sin hábitos para este día.</p>' : dayHabits.map(h => {
            const isDone = state.completedDays[viewDate]?.[h.id];
            return `
                <div class="card glass" style="margin-bottom:0.8rem; padding: 1.2rem; border-radius: 25px; display:flex; justify-content: space-between; align-items:center; border-left: 5px solid ${isDone ? 'var(--success)' : 'transparent'}">
                    <span style="font-weight:600">${h.name}</span>
                    <button class="btn ${isDone === true ? 'success-btn' : 'secondary'}" onclick="toggleHabitToday('${h.id}', ${!isDone})" style="padding: 0.8rem 1.2rem; border-radius:20px; font-size:1.2rem; background: ${isDone ? 'var(--success)' : ''}; color: ${isDone ? 'white' : ''}">
                        ${isDone ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-regular fa-circle"></i>'}
                    </button>
                </div>
            `;
        }).join('');
    }
}

function calculateStats() {
    const activeDates = Object.keys(state.completedDays).filter(date => {
        return Object.values(state.completedDays[date]).some(v => v === true);
    }).sort().reverse();

    if (activeDates.length === 0) return { streak: 0, total: 0 };

    let currentStreak = 0;
    let pivot = new Date();
    pivot.setHours(0, 0, 0, 0);

    const today = new Date().toISOString().split('T')[0];
    const hasToday = state.completedDays[today] && Object.values(state.completedDays[today]).some(v => v === true);

    if (!hasToday) {
        pivot.setDate(pivot.getDate() - 1); // Start checking from yesterday
    }

    while (true) {
        const dStr = pivot.toISOString().split('T')[0];
        const dayData = state.completedDays[dStr];
        const hasActivity = dayData && Object.values(dayData).some(v => v === true);

        if (hasActivity) {
            currentStreak++;
            pivot.setDate(pivot.getDate() - 1);
        } else {
            break;
        }
    }

    return { streak: currentStreak, total: activeDates.length };
}

function calculateStreak() {
    return calculateStats().streak;
}

function toggleHabitToday(id, status) {
    const viewDate = state.selectedDate;
    const today = new Date().toISOString().split('T')[0];
    if (viewDate > today) return; // Prevent future edits

    if (!state.completedDays[viewDate]) state.completedDays[viewDate] = {};
    state.completedDays[viewDate][id] = status;
    saveState();
    initDashboard();
}

// --- Habit Management Logic ---
function renderHabitsList() {
    const list = document.getElementById('habits-list');
    if (!list) return;
    const today = new Date().toISOString().split('T')[0];

    list.innerHTML = state.habits.map(h => {
        const status = getHabitStatus(h, today);
        return `
            <div class="habit-item glass fade-in">
                <div class="habit-header">
                    <div>
                        <h3 style="margin-bottom:0.2rem">${h.name}</h3>
                        <span class="stat-badge" style="background: var(--accent-glow); color: var(--accent)">${h.category}</span>
                        <span class="stat-badge ${status.className}" style="margin-left:5px">${status.label}</span>
                    </div>
                    <button class="btn secondary" style="padding: 0.5rem;" onclick="editHabit('${h.id}')"><i class="fa-solid fa-pen"></i></button>
                </div>
                <div class="habit-actions">
                    <button class="btn secondary" onclick="handlePause('${h.id}')" style="font-size: 0.8rem">Pausar</button>
                    <button class="btn secondary" onclick="handleDelete('${h.id}')" style="font-size: 0.8rem; color: var(--danger)">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

function openHabitModal() {
    const content = `
        <input type="text" id="h-name" placeholder="Nombre del hábito">
        <select id="h-category">
            ${state.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        </select>
        <select id="h-start-type" onchange="toggleDateInputs()">
            <option value="always">Siempre</option>
            <option value="today">Solo hoy</option>
            <option value="specific">Día específico</option>
            <option value="range">Rango</option>
        </select>
        <div id="h-date-inputs"></div>
    `;
    showModal("Nuevo Hábito", content, () => {
        const name = document.getElementById('h-name').value;
        if (!name) return false;
        state.habits.push({
            id: Date.now().toString(),
            name,
            category: document.getElementById('h-category').value,
            startType: document.getElementById('h-start-type').value,
            startDate: document.getElementById('h-date-start')?.value,
            endDate: document.getElementById('h-date-end')?.value,
            created: new Date().toISOString()
        });
        saveState();
        return true;
    });
}

function editHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    const content = `
        <input type="text" id="h-name" placeholder="Nombre del hábito" value="${habit.name}">
        <select id="h-category">
            ${state.categories.map(cat => `<option value="${cat}" ${cat === habit.category ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
        <select id="h-start-type" onchange="toggleDateInputs()">
            <option value="always" ${habit.startType === 'always' ? 'selected' : ''}>Siempre</option>
            <option value="today" ${habit.startType === 'today' ? 'selected' : ''}>Solo hoy</option>
            <option value="specific" ${habit.startType === 'specific' ? 'selected' : ''}>Día específico</option>
            <option value="range" ${habit.startType === 'range' ? 'selected' : ''}>Rango</option>
        </select>
        <div id="h-date-inputs">
            ${habit.startType === 'range' ? `<input type="date" id="h-date-start" value="${habit.startDate || ''}"><input type="date" id="h-date-end" value="${habit.endDate || ''}">` : ''}
            ${habit.startType === 'specific' ? `<input type="date" id="h-date-start" value="${habit.startDate || ''}">` : ''}
        </div>
    `;

    showModal("Editar Hábito", content, () => {
        const name = document.getElementById('h-name').value;
        if (!name) return false;

        habit.name = name;
        habit.category = document.getElementById('h-category').value;
        habit.startType = document.getElementById('h-start-type').value;
        habit.startDate = document.getElementById('h-date-start')?.value;
        habit.endDate = document.getElementById('h-date-end')?.value;

        saveState();
        return true;
    });
}

function handlePause(id) {
    const content = `
        <select id="p-type" onchange="document.getElementById('p-range').style.display = (this.value==='range'?'block':'none')">
            <option value="today">Solo por hoy</option>
            <option value="indefinite">Indefinidamente</option>
            <option value="range">Rango de fechas</option>
        </select>
        <div id="p-range" style="display:none">
            <input type="date" id="p-start">
            <input type="date" id="p-end">
        </div>
    `;
    showModal("Pausar Hábito", content, () => {
        const habit = state.habits.find(h => h.id === id);
        const type = document.getElementById('p-type').value;
        habit.paused = { type, start: document.getElementById('p-start')?.value, end: document.getElementById('p-end')?.value };
        saveState();
        return true;
    });
}

function handleDelete(id) {
    const habit = state.habits.find(h => h.id === id);
    if (habit.eliminationDate) {
        showModal("Pre-eliminación", "<p>Ya está marcado para eliminar. ¿Qué quieres hacer?</p>", () => {
            state.habits = state.habits.filter(h => h.id !== id);
            saveState();
            return true;
        });
    } else {
        const content = `
            <select id="d-type" onchange="document.getElementById('d-date-group').style.display = (this.value==='future'?'block':'none')">
                <option value="now">Eliminar ahora</option>
                <option value="future">En una fecha</option>
                <option value="all">Borrar rastro</option>
            </select>
            <div id="d-date-group" style="display:none"><input type="date" id="d-date"></div>
        `;
        showModal("Eliminar Hábito", content, () => {
            const type = document.getElementById('d-type').value;
            if (type === 'now' || type === 'all') {
                state.habits = state.habits.filter(h => h.id !== id);
            } else {
                habit.eliminationDate = document.getElementById('d-date').value;
            }
            saveState();
            return true;
        });
    }
}

// --- Calendar Logic ---
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();

    grid.innerHTML = '';
    ['D', 'L', 'M', 'X', 'J', 'V', 'S'].forEach(d => grid.innerHTML += `<div style="text-align:center; opacity:0.5; font-weight:800">${d}</div>`);
    for (let i = 0; i < firstDay; i++) grid.innerHTML += '<div></div>';

    for (let d = 1; d <= days; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isSelected = dateStr === state.selectedDate;
        // Solo marcar como completado si hay al menos un hábito marcado como 'true' (hecho)
        const isDone = state.completedDays[dateStr] && Object.values(state.completedDays[dateStr]).some(v => v === true);
        grid.innerHTML += `<div class="calendar-day ${isSelected ? 'active' : ''} ${isDone ? 'completed' : ''}" onclick="selectDate('${dateStr}')">${d}</div>`;
    }
    renderDailyHabits(state.selectedDate);
}

function selectDate(date) {
    state.selectedDate = date;
    saveState();
    renderCalendar();
}

function renderDailyHabits(date) {
    const list = document.getElementById('calendar-habits');
    if (!list) return;
    const today = new Date().toISOString().split('T')[0];
    const isFuture = date > today;
    const habits = state.habits.filter(h => getHabitStatus(h, date).label === 'Activo');

    // Calcular porcentaje diario
    const doneCount = habits.filter(h => state.completedDays[date]?.[h.id]).length;
    const percentage = habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0;

    let html = `
        <div class="card glass" style="margin-bottom: 1.5rem; text-align:center;">
            <p style="opacity:0.6; font-size: 0.8rem; text-transform:uppercase; font-weight:800; margin-bottom: 0.5rem;">Progreso del día</p>
            <div style="font-size: 2.5rem; font-weight: 900; color: var(--accent);">${percentage}%</div>
            <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.05); border-radius: 10px; margin-top: 10px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 100%; background: var(--accent); transition: width 0.5s ease;"></div>
            </div>
        </div>
    `;

    html += habits.map(h => {
        const done = state.completedDays[date]?.[h.id];
        return `<div class="card glass" style="display:flex; justify-content:space-between; align-items:center; border-left: 5px solid ${done ? 'var(--success)' : 'transparent'}; opacity: ${isFuture ? '0.6' : '1'}">
            <span style="font-weight:600">${h.name}</span>
            ${isFuture
                ? `<span style="font-size: 0.8rem; opacity: 0.5;">No disponible</span>`
                : `<button class="btn ${done ? 'success-btn' : 'secondary'}" onclick="toggleHabitDate('${h.id}', '${date}')" style="padding: 0.8rem 1.2rem; border-radius:20px; font-size:1.2rem; background: ${done ? 'var(--success)' : ''}; color: ${done ? 'white' : ''}">
                    ${done ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-regular fa-circle"></i>'}
                </button>`
            }
        </div>`;
    }).join('');

    list.innerHTML = habits.length === 0 ? '<p style="opacity:0.5; text-align:center;">Sin hábitos para este día.</p>' : html;
}

function toggleHabitDate(id, date) {
    const today = new Date().toISOString().split('T')[0];
    if (date > today) return; // Prevent future dates

    if (!state.completedDays[date]) state.completedDays[date] = {};
    state.completedDays[date][id] = !state.completedDays[date][id];
    saveState();
    renderCalendar();
}

// --- Tips ---
function renderTips() {
    const container = document.getElementById('tips-container');
    if (!container) return;
    const habitTips = [
        "Empieza con hábitos tan pequeños que sea imposible fallar.", "Usa el encadenamiento de hábitos.",
        "Prepara tu entorno para el éxito.", "Nunca falles dos días seguidos.", "Enfócate en la identidad.",
        "Mide tu progreso de forma visual.", "La consistencia supera a la intensidad.", "Busca un socio de hábitos.",
        "Elimina las tentaciones.", "Hazlo atractivo.", "Usa la regla de los 2 minutos.", "Revisa semanalmente.",
        "Crea un ritual de inicio.", "Prefiere la repetición a la perfección.", "Visualiza el resultado.",
        "Reduce la fricción.", "Aumenta la fricción para lo malo.", "Usa recordatorios físicos.",
        "Duerme 8 horas para tener disciplina.", "Medita diariamente.", "Bebe 2L de agua.", "Lee 10 páginas.",
        "Planifica tu mañana hoy.", "Pomodoro para empezar.", "Identifica disparadores.", "Sustituye, no elimines.",
        "EBOLVP: Evoluciona Paso a Paso.", "Celebra victorias pequeñas.", "Acepta los días malos.", "Sé paciente.",
        "Respira antes de empezar.", "Limpia tu espacio.", "Bloquea notificaciones.", "Escribe tus porqués.",
        "Desconecta una hora antes de dormir.", "Camina 20 minutos.", "Come comida real.", "Sonríe al espejo.",
        "Agradece 3 cosas cada día.", "Haz lo más difícil primero."
    ];
    container.innerHTML = habitTips.map(tip => `<div class="card glass tip-card"><p>${tip}</p></div>`).join('');
}

// --- Notas ---
function renderNotes() {
    const list = document.getElementById('notes-list');
    if (!list) return;
    list.innerHTML = state.notes.map((n, i) => `
        <div class="card glass fade-in">
            <p>${n.text}</p>
            <div style="display:flex; justify-content:space-between; margin-top:1rem; opacity:0.5; font-size:0.8rem">
                <span>${new Date(n.date).toLocaleDateString()}</span>
                <span onclick="deleteNote(${i})" style="color:var(--danger)">Eliminar</span>
            </div>
        </div>
    `).join('');
}

function openNoteModal() {
    showModal("Nueva Nota", `<textarea id="n-text" rows="5" placeholder="Escribe aquí..."></textarea>`, () => {
        const text = document.getElementById('n-text').value;
        if (!text) return false;
        state.notes.push({ text, date: new Date().toISOString() });
        saveState();
        return true;
    });
}

function deleteNote(i) {
    state.notes.splice(i, 1);
    saveState();
    renderNotes();
}

// --- Ajustes ---
function renderSettings() {
    const container = document.getElementById('settings-container');
    if (!container) return;

    container.innerHTML = `
        <div class="card glass">
            <h3>Visualización</h3>
            <button class="btn secondary" onclick="toggleTheme()" style="width:100%; margin-top:1rem; border-radius:25px;">
                ${state.theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
            </button>
        </div>

        <div class="card glass">
            <h3>Gestión de Categorías</h3>
            <div id="settings-cat-list" style="margin: 1rem 0; display:flex; flex-wrap:wrap; gap:0.5rem;">
                ${state.categories.map((cat, i) => `
                    <div style="background:var(--accent-glow); color:var(--accent); padding:0.5rem 1rem; border-radius:20px; font-weight:600; font-size:0.9rem; display:flex; align-items:center; gap:0.5rem;">
                        ${cat}
                        <span onclick="deleteCategory(${i})" style="cursor:pointer; opacity:0.6">✕</span>
                    </div>
                `).join('')}
            </div>
            <div style="display:flex; gap:10px;">
                <input type="text" id="new-cat-input" placeholder="Nueva categoría..." style="margin:0; border-radius:25px;">
                <button class="btn accent" onclick="addCategorySettings()" style="width:auto; padding:0 1.5rem; border-radius:25px;">+</button>
            </div>
        </div>

        <div class="card glass">
            <h3>Objetivo Semanal (% de hábitos)</h3>
            <div style="display:flex; gap:10px; margin:1rem 0;">
                <input type="number" id="s-goal" value="${state.settings.weeklyGoal}" style="margin:0; border-radius:25px;">
                <button class="btn accent" onclick="updateGoal()" style="border-radius:25px;">Guardar</button>
            </div>
            <p style="font-size:0.8rem; opacity:0.6">Se aplicará a partir del próximo lunes.</p>
        </div>

        <div class="card glass" style="border: 1px solid var(--danger);">
            <h3 style="color:var(--danger)">Zona de Peligro</h3>
            <button class="btn secondary" onclick="resetProgress()" style="color:var(--danger); width:100%; margin-top:1rem; border-radius:25px;">Reiniciar Todo</button>
        </div>
    `;
}

function addCategorySettings() {
    const input = document.getElementById('new-cat-input');
    const val = input.value.trim();
    if (val) {
        state.categories.push(val);
        saveState();
        renderSettings();
    }
}

function deleteCategory(i) {
    if (confirm("¿Eliminar categoría?")) {
        state.categories.splice(i, 1);
        saveState();
        renderSettings();
    }
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveState();
    renderSettings();
}

function updateGoal() {
    state.settings.pendingGoal = document.getElementById('s-goal').value;
    saveState();
    showModal("Éxito", "<p>Objetivo guardado.</p>", () => true);
}

function resetProgress() {
    showModal("¿Borrar todo?", "<p>No podrás recuperar tus datos.</p>", () => {
        localStorage.clear();
        location.href = 'index.html';
    });
}

// Helpers
function toggleDateInputs() {
    const type = document.getElementById('h-start-type').value;
    const container = document.getElementById('h-date-inputs');
    if (type === 'range') container.innerHTML = `<input type="date" id="h-date-start"><input type="date" id="h-date-end">`;
    else if (type === 'specific') container.innerHTML = `<input type="date" id="h-date-start">`;
    else container.innerHTML = '';
}
