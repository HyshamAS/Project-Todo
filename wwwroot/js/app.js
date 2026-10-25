/**
 * TaskFlow Frontend Application
 * Connects with ASP.NET Core Minimal APIs + SQLite backend
 */

// Application State
const state = {
    todos: [],
    stats: { total: 0, completed: 0, pending: 0, overdue: 0, highPriority: 0 },
    categories: [],
    filters: {
        search: '',
        status: 'all', // 'all', 'active', 'completed'
        category: 'All',
        priority: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    }
};

// DOM Elements
const elements = {
    // Stats
    statTotal: document.getElementById('statTotal'),
    statPending: document.getElementById('statPending'),
    statCompleted: document.getElementById('statCompleted'),
    statPercent: document.getElementById('statPercent'),
    statOverdue: document.getElementById('statOverdue'),
    progressBar: document.getElementById('progressBar'),
    currentDate: document.getElementById('currentDate'),
    
    // Forms
    createForm: document.getElementById('createTodoForm'),
    newTitle: document.getElementById('newTitle'),
    newDescription: document.getElementById('newDescription'),
    newCategory: document.getElementById('newCategory'),
    newPriority: document.getElementById('newPriority'),
    newDueDate: document.getElementById('newDueDate'),
    toggleDetailsBtn: document.getElementById('toggleDetailsBtn'),
    createDetailsPanel: document.getElementById('createDetailsPanel'),

    // Controls
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    statusTabs: document.querySelectorAll('.tab-btn'),
    categoryChips: document.getElementById('categoryChips'),
    priorityFilter: document.getElementById('priorityFilter'),
    sortBySelect: document.getElementById('sortBySelect'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),
    tasksCountDisplay: document.getElementById('tasksCountDisplay'),

    // List & Modals
    todosContainer: document.getElementById('todosContainer'),
    editModal: document.getElementById('editModalOverlay'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    editForm: document.getElementById('editTodoForm'),
    editTodoId: document.getElementById('editTodoId'),
    editTitle: document.getElementById('editTitle'),
    editDescription: document.getElementById('editDescription'),
    editCategory: document.getElementById('editCategory'),
    editPriority: document.getElementById('editPriority'),
    editDueDate: document.getElementById('editDueDate'),
    editIsCompleted: document.getElementById('editIsCompleted'),

    // Theme & Toasts
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    toastContainer: document.getElementById('toastContainer')
};

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateDateDisplay();
    bindEvents();
    loadAll();
});

function initTheme() {
    const savedTheme = localStorage.getItem('taskflow_theme') || 
        (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('taskflow_theme', newTheme);
}

function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    elements.currentDate.textContent = now.toLocaleDateString(undefined, options);
}

// ==========================================
// Event Listeners
// ==========================================
function bindEvents() {
    // Theme
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Toggle creation details
    elements.toggleDetailsBtn.addEventListener('click', () => {
        elements.createDetailsPanel.classList.toggle('open');
    });

    // Create Todo Form
    elements.createForm.addEventListener('submit', handleCreateTodo);

    // Search Input with Debounce
    let debounceTimer;
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const val = e.target.value.trim();
        elements.clearSearchBtn.style.display = val ? 'block' : 'none';
        debounceTimer = setTimeout(() => {
            state.filters.search = val;
            loadTodos();
        }, 300);
    });

    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        elements.clearSearchBtn.style.display = 'none';
        state.filters.search = '';
        loadTodos();
    });

    // Status Tabs
    elements.statusTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.statusTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.filters.status = tab.dataset.status;
            loadTodos();
        });
    });

    // Priority & Sort Dropdowns
    elements.priorityFilter.addEventListener('change', (e) => {
        state.filters.priority = e.target.value;
        loadTodos();
    });

    elements.sortBySelect.addEventListener('change', (e) => {
        state.filters.sortBy = e.target.value;
        state.filters.sortOrder = (e.target.value === 'title') ? 'asc' : 'desc';
        loadTodos();
    });

    // Clear completed
    elements.clearCompletedBtn.addEventListener('click', handleClearCompleted);

    // Edit Modal events
    elements.closeModalBtn.addEventListener('click', closeEditModal);
    elements.cancelModalBtn.addEventListener('click', closeEditModal);
    elements.editModal.addEventListener('click', (e) => {
        if (e.target === elements.editModal) closeEditModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.editModal.classList.contains('open')) {
            closeEditModal();
        }
    });
    elements.editForm.addEventListener('submit', handleUpdateTodo);
}

// ==========================================
// API Operations
// ==========================================

async function loadAll() {
    await Promise.all([loadStats(), loadCategories(), loadTodos()]);
}

async function loadStats() {
    try {
        const res = await fetch('/api/todos/stats');
        if (!res.ok) throw new Error('Failed to load stats');
        state.stats = await res.json();
        renderStats();
    } catch (err) {
        console.error('Error fetching stats:', err);
    }
}

async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to load categories');
        state.categories = await res.json();
        renderCategoryChips();
    } catch (err) {
        console.error('Error fetching categories:', err);
    }
}

async function loadTodos() {
    try {
        const params = new URLSearchParams();
        if (state.filters.search) params.append('search', state.filters.search);
        if (state.filters.status === 'active') params.append('isCompleted', 'false');
        if (state.filters.status === 'completed') params.append('isCompleted', 'true');
        if (state.filters.priority !== 'all') params.append('priority', state.filters.priority);
        if (state.filters.category && state.filters.category !== 'All') {
            params.append('category', state.filters.category);
        }
        params.append('sortBy', state.filters.sortBy);
        params.append('sortOrder', state.filters.sortOrder);

        const res = await fetch(`/api/todos?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load tasks');
        state.todos = await res.json();
        renderTodos();
    } catch (err) {
        console.error('Error loading tasks:', err);
        showToast('Error loading tasks from server.', 'error');
    }
}

async function handleCreateTodo(e) {
    e.preventDefault();
    const title = elements.newTitle.value.trim();
    if (!title) return;

    const payload = {
        title: title,
        description: elements.newDescription.value.trim() || null,
        category: elements.newCategory.value.trim() || 'General',
        priority: parseInt(elements.newPriority.value, 10),
        dueDate: elements.newDueDate.value ? new Date(elements.newDueDate.value).toISOString() : null
    };

    try {
        const res = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Failed to create task');
        }

        elements.createForm.reset();
        elements.createDetailsPanel.classList.remove('open');
        showToast('Task added successfully! 🎉', 'success');

        await Promise.all([loadTodos(), loadStats(), loadCategories()]);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleToggleTodo(id) {
    const item = state.todos.find(t => t.id === id);
    if (!item) return;

    // Optimistic UI update
    item.isCompleted = !item.isCompleted;
    renderTodos();

    try {
        const res = await fetch(`/api/todos/${id}/toggle`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Failed to toggle task');
        
        const updated = await res.json();
        const msg = updated.isCompleted ? 'Task completed! ✨' : 'Task marked active.';
        showToast(msg, 'info');

        await Promise.all([loadStats(), loadCategories()]);
    } catch (err) {
        // Revert optimistic update
        item.isCompleted = !item.isCompleted;
        renderTodos();
        showToast('Failed to update task status.', 'error');
    }
}

async function handleDeleteTodo(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
        const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete task');

        showToast('Task deleted.', 'info');
        await Promise.all([loadTodos(), loadStats(), loadCategories()]);
    } catch (err) {
        showToast('Failed to delete task.', 'error');
    }
}

async function handleClearCompleted() {
    if (state.stats.completed === 0) {
        showToast('No completed tasks to clear.', 'info');
        return;
    }

    if (!confirm(`Clear all ${state.stats.completed} completed task(s)?`)) return;

    try {
        const res = await fetch('/api/todos/completed', { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to clear completed');

        const result = await res.json();
        showToast(`Cleared ${result.deletedCount} completed tasks.`, 'success');

        await Promise.all([loadTodos(), loadStats(), loadCategories()]);
    } catch (err) {
        showToast('Failed to clear completed tasks.', 'error');
    }
}

function openEditModal(id) {
    const todo = state.todos.find(t => t.id === id);
    if (!todo) return;

    elements.editTodoId.value = todo.id;
    elements.editTitle.value = todo.title;
    elements.editDescription.value = todo.description || '';
    elements.editCategory.value = todo.category || 'General';
    elements.editPriority.value = todo.priority.toString();
    elements.editIsCompleted.checked = todo.isCompleted;

    if (todo.dueDate) {
        const d = new Date(todo.dueDate);
        // Format to YYYY-MM-DDThh:mm for datetime-local input
        const pad = num => String(num).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        elements.editDueDate.value = formatted;
    } else {
        elements.editDueDate.value = '';
    }

    elements.editModal.classList.add('open');
    elements.editTitle.focus();
}

function closeEditModal() {
    elements.editModal.classList.remove('open');
    elements.editForm.reset();
}

async function handleUpdateTodo(e) {
    e.preventDefault();
    const id = parseInt(elements.editTodoId.value, 10);
    const title = elements.editTitle.value.trim();
    if (!title) return;

    const payload = {
        title: title,
        description: elements.editDescription.value.trim() || null,
        category: elements.editCategory.value.trim() || 'General',
        priority: parseInt(elements.editPriority.value, 10),
        isCompleted: elements.editIsCompleted.checked,
        dueDate: elements.editDueDate.value ? new Date(elements.editDueDate.value).toISOString() : null
    };

    try {
        const res = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to update task');

        closeEditModal();
        showToast('Task updated successfully.', 'success');
        await Promise.all([loadTodos(), loadStats(), loadCategories()]);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==========================================
// Rendering Functions
// ==========================================

function renderStats() {
    elements.statTotal.textContent = state.stats.total;
    elements.statPending.textContent = state.stats.pending;
    elements.statCompleted.textContent = state.stats.completed;
    elements.statOverdue.textContent = state.stats.overdue;

    const pct = state.stats.total > 0 
        ? Math.round((state.stats.completed / state.stats.total) * 100) 
        : 0;
    
    elements.statPercent.textContent = `${pct}%`;
    elements.progressBar.style.width = `${pct}%`;

    // Overdue highlight
    const overdueCard = document.getElementById('overdueCard');
    if (state.stats.overdue > 0) {
        overdueCard.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    } else {
        overdueCard.style.borderColor = '';
    }
}

function renderCategoryChips() {
    const container = elements.categoryChips;
    container.innerHTML = '';

    // Total count for "All"
    const totalCount = state.categories.reduce((acc, c) => acc + c.count, 0);

    const allBtn = document.createElement('button');
    allBtn.className = `chip ${state.filters.category === 'All' ? 'active' : ''}`;
    allBtn.innerHTML = `All <span class="chip-count">${totalCount}</span>`;
    allBtn.addEventListener('click', () => {
        state.filters.category = 'All';
        renderCategoryChips();
        loadTodos();
    });
    container.appendChild(allBtn);

    state.categories.forEach(cat => {
        const btn = document.createElement('button');
        const isActive = state.filters.category.toLowerCase() === cat.name.toLowerCase();
        btn.className = `chip ${isActive ? 'active' : ''}`;
        btn.innerHTML = `${escapeHtml(cat.name)} <span class="chip-count">${cat.count}</span>`;
        btn.addEventListener('click', () => {
            state.filters.category = cat.name;
            renderCategoryChips();
            loadTodos();
        });
        container.appendChild(btn);
    });
}

function renderTodos() {
    const container = elements.todosContainer;
    container.innerHTML = '';

    elements.tasksCountDisplay.textContent = `Showing ${state.todos.length} task${state.todos.length === 1 ? '' : 's'}`;

    if (state.todos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                </div>
                <h3>No tasks found</h3>
                <p>${state.filters.search ? 'No tasks match your search criteria.' : 'Create a new task above to get started!'}</p>
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    state.todos.forEach(todo => {
        const item = document.createElement('div');
        item.className = `todo-item ${todo.isCompleted ? 'completed' : ''}`;
        item.dataset.id = todo.id;

        // Due date status badge
        const dueInfo = formatDueDate(todo.dueDate, todo.isCompleted);

        // Priority Badge
        const priorityBadge = getPriorityBadge(todo.priority);

        item.innerHTML = `
            <button class="checkbox-btn" title="${todo.isCompleted ? 'Mark incomplete' : 'Mark completed'}" data-action="toggle">
                <div class="checkbox-icon">
                    ${todo.isCompleted ? `
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ` : ''}
                </div>
            </button>

            <div class="todo-body">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                ${todo.description ? `<div class="todo-desc">${escapeHtml(todo.description)}</div>` : ''}
                <div class="todo-tags">
                    <span class="badge-tag badge-category">📁 ${escapeHtml(todo.category || 'General')}</span>
                    ${priorityBadge}
                    ${dueInfo ? dueInfo : ''}
                </div>
            </div>

            <div class="todo-actions">
                <button class="btn btn-icon btn-sm" title="Edit task" data-action="edit">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button class="btn btn-icon btn-sm text-danger" title="Delete task" data-action="delete">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;

        // Event delegation on item actions
        item.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;

            if (action === 'toggle') {
                handleToggleTodo(todo.id);
            } else if (action === 'edit') {
                openEditModal(todo.id);
            } else if (action === 'delete') {
                handleDeleteTodo(todo.id, todo.title);
            }
        });

        fragment.appendChild(item);
    });

    container.appendChild(fragment);
}

// Helpers
function getPriorityBadge(priority) {
    switch (priority) {
        case 2:
            return '<span class="badge-tag priority-high">🔴 High</span>';
        case 1:
            return '<span class="badge-tag priority-med">🟡 Medium</span>';
        case 0:
            return '<span class="badge-tag priority-low">🟢 Low</span>';
        default:
            return '';
    }
}

function formatDueDate(isoString, isCompleted) {
    if (!isoString) return null;
    const due = new Date(isoString);
    const now = new Date();
    
    // Reset time for calendar day comparisons
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((dueDay - today) / (1000 * 60 * 60 * 24));

    const timeStr = due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!isCompleted && due < now) {
        const absDiff = Math.abs(diffDays);
        const overdueLabel = absDiff === 0 ? 'Overdue today' : `Overdue by ${absDiff}d`;
        return `<span class="badge-tag due-badge overdue">⚠️ ${overdueLabel}</span>`;
    }

    if (diffDays === 0) {
        return `<span class="badge-tag due-badge today">⏰ Today ${timeStr}</span>`;
    } else if (diffDays === 1) {
        return `<span class="badge-tag due-badge">Tomorrow ${timeStr}</span>`;
    } else {
        const dateStr = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return `<span class="badge-tag due-badge">📅 ${dateStr}</span>`;
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
