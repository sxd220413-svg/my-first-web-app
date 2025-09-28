// 项目管理模块
class ProjectsModule {
    constructor() {
        this.setupEventListeners();
    }

    init() {
        this.loadProjects();
    }

    setupEventListeners() {
        // 新建项目按钮
        document.getElementById('add-project-btn').addEventListener('click', () => {
            this.showAddProjectModal();
        });
    }

    // 加载项目列表
    loadProjects() {
        const projects = window.storageManager.getProjects();
        const projectsContainer = document.getElementById('projects-list');
        
        projectsContainer.innerHTML = '';

        if (projects.length === 0) {
            projectsContainer.innerHTML = '<p class="empty-state">暂无项目<br>点击上方按钮创建项目</p>';
            return;
        }

        projects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            projectsContainer.appendChild(projectElement);
        });
    }

    // 创建项目元素
    createProjectElement(project) {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item';
        projectDiv.dataset.projectId = project.id;

        const completedTasks = project.tasks.filter(task => task.completed).length;
        const totalTasks = project.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        projectDiv.innerHTML = `
            <div class="project-header">
                <div class="project-info">
                    <h3 class="project-name">${utils.escapeHtml(project.name)}</h3>
                    <div class="project-stats">
                        <span class="task-count">${completedTasks}/${totalTasks} 任务完成</span>
                        <span class="project-date">创建于 ${window.app.formatDate(project.createdAt)}</span>
                    </div>
                </div>
                <div class="project-actions">
                    <button class="btn btn-secondary" onclick="projectsModule.addTaskModal('${project.id}')">
                        添加任务
                    </button>
                    <button class="btn-icon" onclick="projectsModule.deleteProjectConfirm('${project.id}')" title="删除项目">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
                <span class="progress-text">${Math.round(progress)}%</span>
            </div>
            <div class="tasks-container">
                <div class="tasks-list" id="tasks-${project.id}">
                    ${this.renderTasks(project.tasks, project.id)}
                </div>
            </div>
        `;

        // 添加样式
        Object.assign(projectDiv.style, {
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            margin: '20px 0',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
        });

        projectDiv.addEventListener('mouseenter', () => {
            projectDiv.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        });

        projectDiv.addEventListener('mouseleave', () => {
            projectDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        });

        return projectDiv;
    }

    // 渲染任务列表
    renderTasks(tasks, projectId) {
        if (tasks.length === 0) {
            return '<p class="no-tasks">暂无任务，点击上方按钮添加任务</p>';
        }

        return tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <label class="task-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="projectsModule.toggleTask('${projectId}', '${task.id}')">
                    <span class="checkmark"></span>
                </label>
                <span class="task-title">${utils.escapeHtml(task.title)}</span>
                <div class="task-actions">
                    <button class="btn-icon" onclick="projectsModule.editTaskModal('${projectId}', '${task.id}')" title="编辑">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="projectsModule.deleteTaskConfirm('${projectId}', '${task.id}')" title="删除">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 切换任务完成状态
    toggleTask(projectId, taskId) {
        const projects = window.storageManager.getProjects();
        const project = projects.find(p => p.id === projectId);
        const task = project.tasks.find(t => t.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            window.storageManager.saveProjects(projects);
            this.loadProjects();
            
            const message = task.completed ? '任务已完成' : '任务已标记为未完成';
            window.app.showToast(message, 'success');
        }
    }

    // 显示添加项目模态框
    showAddProjectModal() {
        const modalContent = `
            <div class="form-group">
                <label for="project-name">项目名称</label>
                <input type="text" id="project-name" placeholder="输入项目名称" maxlength="100">
            </div>
        `;

        window.app.showModal('新建项目', modalContent, () => {
            const projectName = document.getElementById('project-name').value.trim();
            if (!projectName) {
                window.app.showToast('项目名称不能为空', 'warning');
                return false;
            }
            
            window.storageManager.addProject(projectName);
            this.loadProjects();
            window.app.showToast('项目创建成功', 'success');
        });
    }

    // 显示添加任务模态框
    addTaskModal(projectId) {
        const modalContent = `
            <div class="form-group">
                <label for="task-title">任务标题</label>
                <input type="text" id="task-title" placeholder="输入任务标题" maxlength="200">
            </div>
        `;

        window.app.showModal('添加任务', modalContent, () => {
            const taskTitle = document.getElementById('task-title').value.trim();
            if (!taskTitle) {
                window.app.showToast('任务标题不能为空', 'warning');
                return false;
            }
            
            window.storageManager.addTask(projectId, taskTitle);
            this.loadProjects();
            window.app.showToast('任务添加成功', 'success');
        });
    }

    // 编辑任务模态框
    editTaskModal(projectId, taskId) {
        const projects = window.storageManager.getProjects();
        const project = projects.find(p => p.id === projectId);
        const task = project.tasks.find(t => t.id === taskId);
        
        if (!task) return;

        const modalContent = `
            <div class="form-group">
                <label for="edit-task-title">任务标题</label>
                <input type="text" id="edit-task-title" value="${utils.escapeHtml(task.title)}" maxlength="200">
            </div>
        `;

        window.app.showModal('编辑任务', modalContent, () => {
            const newTitle = document.getElementById('edit-task-title').value.trim();
            if (!newTitle) {
                window.app.showToast('任务标题不能为空', 'warning');
                return false;
            }
            
            window.storageManager.updateTask(projectId, taskId, { title: newTitle });
            this.loadProjects();
            window.app.showToast('任务更新成功', 'success');
        });
    }

    // 删除项目确认
    deleteProjectConfirm(projectId) {
        const projects = window.storageManager.getProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (!project) return;

        const message = `确定要删除项目"${project.name}"吗？\n这将同时删除项目内的所有任务，此操作不可恢复。`;
        
        window.app.showConfirm('删除项目', message, () => {
            window.storageManager.deleteProject(projectId);
            this.loadProjects();
            window.app.showToast('项目删除成功', 'success');
        });
    }

    // 删除任务确认
    deleteTaskConfirm(projectId, taskId) {
        const projects = window.storageManager.getProjects();
        const project = projects.find(p => p.id === projectId);
        const task = project.tasks.find(t => t.id === taskId);
        
        if (!task) return;

        const message = `确定要删除任务"${task.title}"吗？\n此操作不可恢复。`;
        
        window.app.showConfirm('删除任务', message, () => {
            window.storageManager.deleteTask(projectId, taskId);
            this.loadProjects();
            window.app.showToast('任务删除成功', 'success');
        });
    }

    // 获取项目统计
    getProjectStats() {
        const projects = window.storageManager.getProjects();
        const totalProjects = projects.length;
        const totalTasks = projects.reduce((sum, project) => sum + project.tasks.length, 0);
        const completedTasks = projects.reduce((sum, project) => 
            sum + project.tasks.filter(task => task.completed).length, 0);
        
        return {
            totalProjects,
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
        };
    }
}

// 添加CSS样式
const projectsStyles = `
<style>
.project-item {
    margin-bottom: 30px;
}

.project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
}

.project-info h3 {
    margin: 0 0 8px 0;
    color: #2c3e50;
    font-size: 1.3rem;
}

.project-stats {
    display: flex;
    gap: 15px;
    font-size: 0.9rem;
    color: #6c757d;
}

.project-actions {
    display: flex;
    gap: 10px;
    align-items: center;
}

.progress-bar {
    position: relative;
    height: 8px;
    background-color: #e9ecef;
    border-radius: 4px;
    margin-bottom: 20px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.progress-text {
    position: absolute;
    top: -25px;
    right: 0;
    font-size: 0.8rem;
    color: #6c757d;
    font-weight: 600;
}

.tasks-container {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
}

.task-item {
    display: flex;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #e9ecef;
    transition: all 0.3s ease;
}

.task-item:last-child {
    border-bottom: none;
}

.task-item.completed {
    opacity: 0.6;
}

.task-item.completed .task-title {
    text-decoration: line-through;
    color: #6c757d;
}

.task-checkbox {
    display: flex;
    align-items: center;
    margin-right: 12px;
    cursor: pointer;
}

.task-checkbox input {
    display: none;
}

.task-checkbox .checkmark {
    width: 20px;
    height: 20px;
    border: 2px solid #dee2e6;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.task-checkbox input:checked + .checkmark {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
    color: white;
}

.task-checkbox input:checked + .checkmark::after {
    content: '✓';
    font-size: 12px;
    font-weight: bold;
}

.task-title {
    flex: 1;
    font-size: 1rem;
    color: #495057;
}

.task-actions {
    display: flex;
    gap: 5px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.task-item:hover .task-actions {
    opacity: 1;
}

.btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: background-color 0.3s ease;
    font-size: 0.9rem;
}

.btn-icon:hover {
    background-color: #e9ecef;
}

.no-tasks {
    text-align: center;
    color: #6c757d;
    font-style: italic;
    padding: 20px;
}

.empty-state {
    text-align: center;
    color: #6c757d;
    font-size: 1.1rem;
    padding: 60px 20px;
    background-color: #f8f9fa;
    border-radius: 12px;
    border: 2px dashed #dee2e6;
}

@media (max-width: 768px) {
    .project-header {
        flex-direction: column;
        gap: 15px;
    }
    
    .project-actions {
        align-self: stretch;
        justify-content: space-between;
    }
    
    .project-stats {
        flex-direction: column;
        gap: 5px;
    }
    
    .task-actions {
        opacity: 1;
    }
}
</style>
`;

// 添加样式到页面
document.head.insertAdjacentHTML('beforeend', projectsStyles);

// 创建全局实例
window.projectsModule = new ProjectsModule();