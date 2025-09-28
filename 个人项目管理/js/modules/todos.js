// 待办清单模块
class TodosModule {
    constructor() {
        this.currentFilter = 'all';
        this.setupEventListeners();
    }

    init() {
        this.loadTodos();
    }

    setupEventListeners() {
        // 添加任务按钮
        document.getElementById('add-todo-btn').addEventListener('click', () => {
            this.showAddTodoModal();
        });

        // 过滤按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
            });
        });
    }

    // 设置过滤器
    setFilter(filter) {
        this.currentFilter = filter;
        
        // 更新按钮状态
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.loadTodos();
    }

    // 加载待办事项
    loadTodos() {
        const todos = window.storageManager.getTodos();
        const todosContainer = document.getElementById('todos-list');
        
        // 过滤待办事项
        let filteredTodos = todos;
        switch (this.currentFilter) {
            case 'pending':
                filteredTodos = todos.filter(todo => !todo.completed);
                break;
            case 'completed':
                filteredTodos = todos.filter(todo => todo.completed);
                break;
        }

        // 按优先级和创建时间排序
        filteredTodos.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (a.priority !== b.priority) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        todosContainer.innerHTML = '';

        if (filteredTodos.length === 0) {
            const emptyMessage = this.currentFilter === 'all' ? '暂无任务' : 
                                this.currentFilter === 'pending' ? '暂无未完成任务' : '暂无已完成任务';
            todosContainer.innerHTML = `<p class="empty-state">${emptyMessage}<br>点击上方按钮添加任务</p>`;
            return;
        }

        filteredTodos.forEach(todo => {
            const todoElement = this.createTodoElement(todo);
            todosContainer.appendChild(todoElement);
        });
    }

    // 创建待办事项元素
    createTodoElement(todo) {
        const todoDiv = document.createElement('div');
        todoDiv.className = `todo-item priority-${todo.priority}`;
        todoDiv.dataset.todoId = todo.id;

        const priorityColors = {
            high: '#dc3545',
            medium: '#ffc107',
            low: '#28a745'
        };

        const priorityNames = {
            high: '高',
            medium: '中',
            low: '低'
        };

        const dueDateText = todo.dueDate ? 
            `<span class="due-date ${this.isDueSoon(todo.dueDate) ? 'due-soon' : ''}">${this.formatDueDate(todo.dueDate)}</span>` : '';

        todoDiv.innerHTML = `
            <div class="todo-content">
                <div class="todo-header">
                    <label class="todo-checkbox">
                        <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                               onchange="todosModule.toggleTodo('${todo.id}')">
                        <span class="checkmark"></span>
                    </label>
                    <h4 class="todo-title ${todo.completed ? 'completed' : ''}">${utils.escapeHtml(todo.title)}</h4>
                    <span class="priority-badge" style="background-color: ${priorityColors[todo.priority]}">
                        ${priorityNames[todo.priority]}优先级
                    </span>
                </div>
                <div class="todo-meta">
                    <small class="created-date">创建于 ${window.app.formatDate(todo.createdAt)}</small>
                    ${dueDateText}
                </div>
            </div>
            <div class="todo-actions">
                <button class="btn-icon" onclick="todosModule.editTodoModal('${todo.id}')" title="编辑">
                    ✏️
                </button>
                <button class="btn-icon" onclick="todosModule.deleteTodoConfirm('${todo.id}')" title="删除">
                    🗑️
                </button>
            </div>
        `;

        // 添加样式
        Object.assign(todoDiv.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px',
            margin: '10px 0',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            borderLeft: `4px solid ${priorityColors[todo.priority]}`,
            transition: 'all 0.3s ease'
        });

        if (todo.completed) {
            todoDiv.style.opacity = '0.7';
            todoDiv.style.backgroundColor = '#f8f9fa';
        }

        todoDiv.addEventListener('mouseenter', () => {
            todoDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        });

        todoDiv.addEventListener('mouseleave', () => {
            todoDiv.style.boxShadow = 'none';
        });

        return todoDiv;
    }

    // 切换任务完成状态
    toggleTodo(todoId) {
        const todos = window.storageManager.getTodos();
        const todo = todos.find(t => t.id === todoId);
        
        if (todo) {
            todo.completed = !todo.completed;
            window.storageManager.saveTodos(todos);
            this.loadTodos();
            
            const message = todo.completed ? '任务已完成' : '任务已标记为未完成';
            window.app.showToast(message, 'success');
        }
    }

    // 显示添加任务模态框
    showAddTodoModal() {
        const modalContent = `
            <div class="form-group">
                <label for="todo-title">任务标题</label>
                <input type="text" id="todo-title" placeholder="输入任务标题" maxlength="200">
            </div>
            <div class="form-group">
                <label for="todo-priority">优先级</label>
                <select id="todo-priority">
                    <option value="low">低优先级</option>
                    <option value="medium" selected>中优先级</option>
                    <option value="high">高优先级</option>
                </select>
            </div>
            <div class="form-group">
                <label for="todo-due-date">截止日期（可选）</label>
                <input type="date" id="todo-due-date">
            </div>
        `;

        window.app.showModal('添加任务', modalContent, () => {
            const title = document.getElementById('todo-title').value.trim();
            const priority = document.getElementById('todo-priority').value;
            const dueDate = document.getElementById('todo-due-date').value || null;

            if (!title) {
                window.app.showToast('任务标题不能为空', 'warning');
                return false;
            }

            window.storageManager.addTodo(title, priority, dueDate);
            this.loadTodos();
            window.app.showToast('任务添加成功', 'success');
        });
    }

    // 编辑任务模态框
    editTodoModal(todoId) {
        const todos = window.storageManager.getTodos();
        const todo = todos.find(t => t.id === todoId);
        
        if (!todo) return;

        const modalContent = `
            <div class="form-group">
                <label for="edit-todo-title">任务标题</label>
                <input type="text" id="edit-todo-title" value="${utils.escapeHtml(todo.title)}" maxlength="200">
            </div>
            <div class="form-group">
                <label for="edit-todo-priority">优先级</label>
                <select id="edit-todo-priority">
                    <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>低优先级</option>
                    <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>中优先级</option>
                    <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>高优先级</option>
                </select>
            </div>
            <div class="form-group">
                <label for="edit-todo-due-date">截止日期（可选）</label>
                <input type="date" id="edit-todo-due-date" value="${todo.dueDate || ''}">
            </div>
        `;

        window.app.showModal('编辑任务', modalContent, () => {
            const title = document.getElementById('edit-todo-title').value.trim();
            const priority = document.getElementById('edit-todo-priority').value;
            const dueDate = document.getElementById('edit-todo-due-date').value || null;

            if (!title) {
                window.app.showToast('任务标题不能为空', 'warning');
                return false;
            }

            window.storageManager.updateTodo(todoId, { title, priority, dueDate });
            this.loadTodos();
            window.app.showToast('任务更新成功', 'success');
        });
    }

    // 删除任务确认
    deleteTodoConfirm(todoId) {
        const todos = window.storageManager.getTodos();
        const todo = todos.find(t => t.id === todoId);
        
        if (!todo) return;

        const message = `确定要删除任务"${todo.title}"吗？\n此操作不可恢复。`;
        
        window.app.showConfirm('删除任务', message, () => {
            window.storageManager.deleteTodo(todoId);
            this.loadTodos();
            window.app.showToast('任务删除成功', 'success');
        });
    }

    // 检查是否即将到期
    isDueSoon(dueDate) {
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
    }

    // 格式化截止日期
    formatDueDate(dueDate) {
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `已逾期 ${Math.abs(diffDays)} 天`;
        } else if (diffDays === 0) {
            return '今天到期';
        } else if (diffDays === 1) {
            return '明天到期';
        } else if (diffDays <= 7) {
            return `${diffDays} 天后到期`;
        } else {
            return `截止 ${due.toLocaleDateString('zh-CN')}`;
        }
    }
}

// 创建全局实例
window.todosModule = new TodosModule();