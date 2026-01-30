let editingTaskId = null;
let resources = [];

/* =======================
   DOM READY
======================= */
document.addEventListener('DOMContentLoaded', () => {

  const nav = document.getElementById('nav');
  const menuBtn = document.getElementById('menuBtn');

  const taskForm = document.getElementById('taskForm');
  const taskTitle = document.getElementById('taskTitle');
  const taskDesc = document.getElementById('taskDesc');
  const taskDueDate = document.getElementById('taskDueDate');
  const taskPriority = document.getElementById('taskPriority');
  const taskCategory = document.getElementById('taskCategory');
  const taskError = document.getElementById('taskError');
  const taskSubmitBtn = document.getElementById('taskSubmitBtn');

  const statusFilter = document.getElementById('statusFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortBy = document.getElementById('sortBy');

  const resourceList = document.getElementById('resourceList');
  const resourceSearch = document.getElementById('resourceSearch');
  const resourceCategory = document.getElementById('resourceCategory');
  const resourceLoading = document.getElementById('resourceLoading');
  const resourceError = document.getElementById('resourceError');

  const habitForm = document.getElementById('habitForm');
  const habitTitle = document.getElementById('habitTitle');
  const habitGoal = document.getElementById('habitGoal');
  const habitError = document.getElementById('habitError');
  const habitList = document.getElementById('habitList');

  const themeToggle = document.getElementById('themeToggle');
  const resetData = document.getElementById('resetData');

  loadState();

  if (state.settings.theme === 'dark') {
    document.body.classList.add('dark');
  }

  // Render first time
  renderTasks();
  renderDashboard();
  renderHabits();

  showView(location.hash.substring(1) || 'dashboard');

  window.addEventListener('hashchange', () => {
    showView(location.hash.substring(1));
  });

  menuBtn.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  /* =======================
     TASKS
  ======================= */
  taskForm.addEventListener('submit', e => {
    e.preventDefault();

    const title = taskTitle.value.trim();
    const desc = taskDesc.value.trim();
    const dueDate = taskDueDate.value;
    const priority = taskPriority.value;
    const category = taskCategory.value.trim();

    if (!title || !dueDate) {
      taskError.textContent = 'Title and Due Date are required';
      return;
    }

    taskError.textContent = '';

    if (editingTaskId) {
      const t = state.tasks.find(t => t.id === editingTaskId);
      Object.assign(t, { title, description: desc, dueDate, priority, category });
      editingTaskId = null;
      taskSubmitBtn.textContent = 'Add Task';
    } else {
      state.tasks.push({
        id: Date.now(),
        title,
        description: desc,
        dueDate,
        priority,
        category,
        completed: false
      });
    }

    saveState();
    renderTasks();
    renderDashboard();
    taskForm.reset();
  });

  document.getElementById('taskList').addEventListener('click', e => {
    const li = e.target.closest('.task');
    if (!li) return;

    const id = Number(li.dataset.id);
    const task = state.tasks.find(t => t.id === id);

    if (e.target.dataset.action === 'toggle') task.completed = !task.completed;

    if (e.target.dataset.action === 'edit') {
      taskTitle.value = task.title;
      taskDesc.value = task.description || '';
      taskDueDate.value = task.dueDate;
      taskPriority.value = task.priority;
      taskCategory.value = task.category;
      editingTaskId = id;
      taskSubmitBtn.textContent = 'Save';
      location.hash = '#tasks';
    }

    if (e.target.dataset.action === 'delete') {
      if (confirm('Delete this task?')) {
        state.tasks = state.tasks.filter(t => t.id !== id);
      }
    }

    saveState();
    renderTasks();
    renderDashboard();
  });

  statusFilter.addEventListener('change', renderTasks);
  categoryFilter.addEventListener('change', renderTasks);
  sortBy.addEventListener('change', renderTasks);

  /* =======================
     HABITS
  ======================= */
  habitForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = habitTitle.value.trim();
    const goal = Number(habitGoal.value);

    if (!title || !goal || goal < 1 || goal > 7) {
      habitError.textContent = 'Title + Goal (1-7) required';
      return;
    }
    habitError.textContent = '';

    state.habits.push({
      id: Date.now(),
      title,
      goal,
      progress: Array(7).fill(false),
      weekStart: getWeekStart()
    });

    saveState();
    renderHabits();
    renderDashboard();
  });

  habitList.addEventListener('click', e => {
    const habitEl = e.target.closest('.habit');
    if (!habitEl) return;
    const id = Number(habitEl.dataset.id);
    const habit = state.habits.find(h => h.id === id);

    if (e.target.dataset.action === 'toggle') {
      const dayIndex = Number(e.target.dataset.day);
      habit.progress[dayIndex] = !habit.progress[dayIndex];
      saveState();
      renderHabits();
      renderDashboard();
    }

    if (e.target.dataset.action === 'delete') {
      if (confirm('Delete this habit?')) {
        state.habits = state.habits.filter(h => h.id !== id);
        saveState();
        renderHabits();
        renderDashboard();
      }
    }
  });

  /* =======================
     RESOURCES
  ======================= */
  async function loadResources() {
    resourceLoading.style.display = 'block';
    resourceError.textContent = '';
    resourceList.innerHTML = '';

    try {
      const res = await fetch('resources.json');
      if (!res.ok) throw new Error('Fetch failed');
      resources = await res.json();
      initResourceCategories();
      renderResources(resources);
    } catch (err) {
      resourceError.textContent = 'Failed to load resources.';
    } finally {
      resourceLoading.style.display = 'none';
    }
  }

  function initResourceCategories() {
    const cats = ['all', ...new Set(resources.map(r => r.category))];
    resourceCategory.innerHTML = '';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      resourceCategory.appendChild(opt);
    });
  }

  resourceList.addEventListener('click', (e) => {
    if (!e.target.classList.contains('favorite')) return;
    const id = Number(e.target.dataset.id);

    if (state.favorites.includes(id)) {
      state.favorites = state.favorites.filter(x => x !== id);
    } else {
      state.favorites.push(id);
    }

    saveState();
    renderResources(resources);
  });

  resourceSearch.addEventListener('input', () => renderResources(resources));
  resourceCategory.addEventListener('change', () => renderResources(resources));

  loadResources();

  /* =======================
     SETTINGS
  ======================= */
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    state.settings.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    saveState();
  });

  resetData.addEventListener('click', () => {
    if (confirm('Reset all data?')) {
      resetState();
      location.reload();
    }
  });

});

/* =======================
   HELPERS
======================= */
function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

function calculateStreak() {
  const todayIdx = (new Date().getDay() + 6) % 7; // Sat=0 ... Fri=6
  let maxStreak = 0;

  state.habits.forEach(h => {
    let streak = 0;
    for (let i = 0; i <= todayIdx; i++) {
      if (h.progress[i]) streak++;
      else streak = 0;
      if (streak > maxStreak) maxStreak = streak;
    }
  });

  return maxStreak;
}
// حل مشكلة الهاش في GitHub Pages
window.addEventListener('load', () => {
  const hash = location.hash || '#dashboard';
  showView(hash.substring(1));
});

