// =======================
// UI FUNCTIONS
// =======================

// عرض/إخفاء الأقسام بناءً على التنقل
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
  });
}

// =======================
// TASKS RENDERING
// =======================
function renderTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '';

  let tasks = [...state.tasks];

  // Apply filters
  const status = document.getElementById('statusFilter').value;
  const category = document.getElementById('categoryFilter').value;
  const sort = document.getElementById('sortBy').value;

  if (status === 'active') tasks = tasks.filter(t => !t.completed);
  if (status === 'completed') tasks = tasks.filter(t => t.completed);
  if (category !== 'all') tasks = tasks.filter(t => t.category === category);

  // Sorting
  if (sort === 'date') {
    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  } else {
    const p = { Low: 1, Medium: 2, High: 3 };
    tasks.sort((a, b) => p[b.priority] - p[a.priority]);
  }

  if (tasks.length === 0) {
    list.innerHTML = `<li class="muted">no tasks added yet</li>`;
    return;
  }

  // Render
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id;
    li.innerHTML = `
      <strong>${task.title}</strong>
      <p>${task.dueDate} | ${task.priority} | ${task.category || '-'}</p>
      <p>${task.description || ''}</p>
      <button data-action="toggle">${task.completed ? 'Uncomplete' : 'Complete'}</button>
      <button data-action="edit">Edit</button>
      <button data-action="delete">Delete</button>
    `;
    list.appendChild(li);
  });
}

// =======================
// DASHBOARD RENDERING
// =======================
function renderDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const soon = new Date();
  soon.setDate(soon.getDate() + 2);
  const soonStr = soon.toISOString().split('T')[0];

  const dueSoon = state.tasks.filter(t => t.dueDate >= today && t.dueDate <= soonStr && !t.completed);
  document.getElementById('dueSoonCount').textContent = dueSoon.length;

  const completed = state.tasks.filter(t => t.completed).length;
  document.getElementById('completedCount').textContent = completed;

  const total = state.tasks.length;
  const progress = total ? (completed / total) * 100 : 0;
  document.getElementById('progressBar').style.width = `${progress}%`;

  const todayTasks = document.getElementById('todayTasks');
  todayTasks.innerHTML = '';

  const todayList = state.tasks.filter(t => t.dueDate === today && !t.completed);

  if (todayList.length === 0) {
    todayTasks.innerHTML = `<li class="muted">no tasks today</li>`;
  } else {
    todayList.forEach(t => {
      const li = document.createElement('li');
      li.className = 'task';
      li.textContent = t.title;
      todayTasks.appendChild(li);
    });
  }

  // Habit streak
  const streak = calculateStreak();
  document.getElementById('habitStreak').textContent = streak;
}

// =======================
// HABITS RENDERING
// =======================
function renderHabits() {
  const habitList = document.getElementById('habitList');
  habitList.innerHTML = '';

  const days = ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'];

  if (state.habits.length === 0) {
    habitList.innerHTML = `<p class="muted">no habits added yet</p>`;
    return;
  }

  state.habits.forEach(habit => {
    // Reset week if changed
    if (habit.weekStart !== getWeekStart()) {
      habit.progress = Array(7).fill(false);
      habit.weekStart = getWeekStart();
    }

    const div = document.createElement('div');
    div.className = 'habit';
    div.dataset.id = habit.id;

    const doneCount = habit.progress.filter(v => v).length;
    const percent = Math.round((doneCount / habit.goal) * 100);
    const progressText = `${doneCount}/${habit.goal}`;

    div.innerHTML = `
      <div>
        <strong>${habit.title}</strong>
        <span class="muted">(${progressText})</span>
        <div class="habit-progress">
          <div class="progress-bar" style="width: ${percent}%;"></div>
        </div>
      </div>
      <div class="habit-days"></div>
      <button data-action="delete">Delete</button>
    `;

    const daysContainer = div.querySelector('.habit-days');

    days.forEach((d, idx) => {
      const btn = document.createElement('button');
      btn.textContent = d;
      btn.dataset.action = 'toggle';
      btn.dataset.day = idx;
      btn.style.marginRight = '0.3rem';
      btn.style.marginTop = '0.3rem';

      if (habit.progress[idx]) {
        btn.style.background = 'var(--primary)';
        btn.style.color = '#fff';
      }

      daysContainer.appendChild(btn);
    });

    habitList.appendChild(div);
  });
}

// =======================
// RESOURCES RENDERING
// =======================
function renderResources(resources) {
  const resourceList = document.getElementById('resourceList');
  const search = document.getElementById('resourceSearch').value.toLowerCase();
  const cat = document.getElementById('resourceCategory').value;

  resourceList.innerHTML = '';

  const filtered = resources.filter(r =>
    (cat === 'all' || r.category === cat) &&
    (r.title.toLowerCase().includes(search) || r.description.toLowerCase().includes(search))
  );

  if (filtered.length === 0) {
    resourceList.innerHTML = `<p class="muted">no resources found</p>`;
    return;
  }

  filtered.forEach(r => {
    const div = document.createElement('div');
    div.className = 'resource-card';
    const fav = state.favorites.includes(r.id);
    div.innerHTML = `
      <h4>
        ${r.title}
        <span class="favorite ${fav ? 'active' : ''}" data-id="${r.id}" title="Toggle Favorite">★</span>
      </h4>
      <p>${r.description}</p>
      <p><strong>Category:</strong> ${r.category}</p>
      <a href="${r.link}" target="_blank">Visit</a>
    `;
    resourceList.appendChild(div);
  });
}
