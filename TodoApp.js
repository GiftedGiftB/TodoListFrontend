document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const API_BASE = 'http://localhost:8080/api';
  let currentUserId = localStorage.getItem('currentUserId');

  function showError(msg, ms = 4000) {
    let errorBox = document.getElementById('errorBox');
    if (!errorBox) {
      errorBox = document.createElement('div');
      errorBox.id = 'errorBox';
      errorBox.className = 'error-box';
      document.body.prepend(errorBox);
    }
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
    clearTimeout(errorBox.dismissTimer);
    errorBox.dismissTimer = setTimeout(() => {
      errorBox.style.display = 'none';
    }, ms);
  }

  if (path.endsWith('login.html')) {
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    const login = document.getElementById('Login');

    login.addEventListener('click', async () => {
      try {
        const res = await fetch(`${API_BASE}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passInput.value.trim()
          })
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        localStorage.setItem('currentUserId', data.id);
        window.location.href = 'Task.html';
      } catch (err) {
        showError('Login failed: ' + err.message);
      }
    });
  }

  if (path.endsWith('register.html')) {
    const usernameInput = document.getElementById('Username');
    const emailInput = document.getElementById('Email');
    const passInput = document.getElementById('Password');
    const register = document.getElementById('Register');

    register.addEventListener('click', async () => {
      try {
        const res = await fetch(`${API_BASE}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: usernameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passInput.value.trim()
          })
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        localStorage.setItem('currentUserId', data.id);
        window.location.href = 'Task.html';
      } catch (err) {
        showError('Registration failed: ' + err.message);
      }
    });
  }

  if (path.endsWith('Task.html')) {
    const addTaskBtn = document.getElementById('addTask');
    const titleInput = document.getElementById('taskTitle');  
    const descInput = document.getElementById('taskDescription');
    const taskList = document.getElementById('taskList');
    const taskTemplate = document.getElementById('taskTemplate');
    const logout = document.getElementById('logout');

    if (!currentUserId) {
      window.location.href = 'login.html';
      return;
    }

    let tasks = [];

    async function loadTasks() {
      try {
        const res = await fetch(`${API_BASE}/tasks/user/${currentUserId}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        tasks = await res.json(); 
        renderTasks();
      } catch (err) {
        showError('Could not load tasks: ' + err.message);
      }
    }

    async function createTaskOnBackend(title, description) {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, title, description })
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      return res.json();
    }

    async function deleteTaskFromBackend(taskId) {
      await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
    }

    async function markCompletedOnBackend(taskId) {
      await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'PUT' });
    }

    function renderTasks() {
      taskList.innerHTML = '';
      tasks.forEach((task, index) => {
        const node = taskTemplate.content.cloneNode(true);
        const taskDiv = node.querySelector('.task');
        taskDiv.querySelector('.text').textContent =
          `${task.title}${task.description ? ' – ' + task.description : ''}`;
        const checkbox = taskDiv.querySelector('.complete');
        checkbox.checked = task.completed;
        if (task.completed) taskDiv.classList.add('completed');

        checkbox.addEventListener('change', async () => {
          tasks[index].completed = checkbox.checked;
          renderTasks();
          await markCompletedOnBackend(task.id);
        });

        taskDiv.querySelector('.delete').addEventListener('click', async () => {
          const id = tasks[index].id;
          tasks.splice(index, 1);
          renderTasks();
          await deleteTaskFromBackend(id);
        });

        taskList.appendChild(node);
      });
    }

    async function addTaskToList() {
      const title = titleInput.value.trim();
      const description = descInput.value.trim();
      if (!title) return;

      try {
        const created = await createTaskOnBackend(title, description);
        tasks.push(created);
        renderTasks();
        titleInput.value = '';
        descInput.value = '';
      } catch (err) {
        showError('Failed to save task: ' + err.message);
      }
    }

    addTaskBtn.addEventListener('click', addTaskToList);

    logout.addEventListener('click', () => {
      localStorage.removeItem('currentUserId');
      window.location.href = 'login.html';
    });

    loadTasks();
  }
});
