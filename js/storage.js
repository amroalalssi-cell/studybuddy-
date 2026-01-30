const STORAGE_KEY = 'studyBuddyState';

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    const parsed=JSON.parse(data);

    state.tasks=parsed.tasks ||[];
    state.habits=parsed.habits ||[];
    state.favorites=parsed.favorites ||[];
    state.settings=parsed.settings ||{theme: "light"};
  }
}

function resetState() {
  if (confirm("هل انت متاكد من اعادة ضبط جميع البيانات")){
  localStorage.removeItem(STORAGE_KEY);
  state.tasks = [];
  state.habits = [];
  state.favorites = [];
  state.settings = { theme: 'light' };
}
}
