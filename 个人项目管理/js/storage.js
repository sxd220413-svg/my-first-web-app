// 数据存储管理类
class StorageManager {
    constructor() {
        this.storageKey = 'personal-tools-data';
        this.initializeData();
    }

    // 初始化数据结构
    initializeData() {
        const existingData = this.getAllData();
        if (!existingData) {
            const initialData = {
                notes: {
                    folders: []
                },
                todos: [],
                aiChats: [],
                pomodoro: {
                    workTime: 25,
                    breakTime: 5,
                    todayCount: 0,
                    lastDate: new Date().toISOString().split('T')[0]
                },
                projects: []
            };
            this.saveAllData(initialData);
        }
    }

    // 获取所有数据
    getAllData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('获取数据失败:', error);
            return null;
        }
    }

    // 保存所有数据
    saveAllData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    }

    // 获取特定模块数据
    getModuleData(moduleName) {
        const allData = this.getAllData();
        return allData ? allData[moduleName] : null;
    }

    // 保存特定模块数据
    saveModuleData(moduleName, data) {
        const allData = this.getAllData();
        if (allData) {
            allData[moduleName] = data;
            return this.saveAllData(allData);
        }
        return false;
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 记事本相关方法
    getNotes() {
        return this.getModuleData('notes');
    }

    saveNotes(notesData) {
        return this.saveModuleData('notes', notesData);
    }

    addFolder(name) {
        const notesData = this.getNotes();
        const newFolder = {
            id: this.generateId(),
            name: name,
            notes: []
        };
        notesData.folders.push(newFolder);
        this.saveNotes(notesData);
        return newFolder;
    }

    deleteFolder(folderId) {
        const notesData = this.getNotes();
        notesData.folders = notesData.folders.filter(folder => folder.id !== folderId);
        this.saveNotes(notesData);
    }

    addNote(folderId, title, content = '') {
        const notesData = this.getNotes();
        const folder = notesData.folders.find(f => f.id === folderId);
        if (folder) {
            const newNote = {
                id: this.generateId(),
                title: title,
                content: content,
                createdAt: new Date().toISOString()
            };
            folder.notes.push(newNote);
            this.saveNotes(notesData);
            return newNote;
        }
        return null;
    }

    updateNote(folderId, noteId, title, content) {
        const notesData = this.getNotes();
        const folder = notesData.folders.find(f => f.id === folderId);
        if (folder) {
            const note = folder.notes.find(n => n.id === noteId);
            if (note) {
                note.title = title;
                note.content = content;
                this.saveNotes(notesData);
                return note;
            }
        }
        return null;
    }

    deleteNote(folderId, noteId) {
        const notesData = this.getNotes();
        const folder = notesData.folders.find(f => f.id === folderId);
        if (folder) {
            folder.notes = folder.notes.filter(note => note.id !== noteId);
            this.saveNotes(notesData);
        }
    }

    // 待办事项相关方法
    getTodos() {
        return this.getModuleData('todos') || [];
    }

    saveTodos(todosData) {
        return this.saveModuleData('todos', todosData);
    }

    addTodo(title, priority = 'medium', dueDate = null) {
        const todos = this.getTodos();
        const newTodo = {
            id: this.generateId(),
            title: title,
            priority: priority,
            dueDate: dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };
        todos.push(newTodo);
        this.saveTodos(todos);
        return newTodo;
    }

    updateTodo(todoId, updates) {
        const todos = this.getTodos();
        const todoIndex = todos.findIndex(todo => todo.id === todoId);
        if (todoIndex !== -1) {
            todos[todoIndex] = { ...todos[todoIndex], ...updates };
            this.saveTodos(todos);
            return todos[todoIndex];
        }
        return null;
    }

    deleteTodo(todoId) {
        const todos = this.getTodos();
        const filteredTodos = todos.filter(todo => todo.id !== todoId);
        this.saveTodos(filteredTodos);
    }

    // AI聊天相关方法
    getAIChats() {
        return this.getModuleData('aiChats') || [];
    }

    saveAIChats(chatsData) {
        return this.saveModuleData('aiChats', chatsData);
    }

    addChatSession() {
        const chats = this.getAIChats();
        const newChat = {
            id: this.generateId(),
            messages: [],
            createdAt: new Date().toISOString()
        };
        chats.push(newChat);
        this.saveAIChats(chats);
        return newChat;
    }

    addMessage(chatId, role, content) {
        const chats = this.getAIChats();
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            const newMessage = {
                role: role,
                content: content,
                timestamp: new Date().toISOString()
            };
            chat.messages.push(newMessage);
            this.saveAIChats(chats);
            return newMessage;
        }
        return null;
    }

    // 番茄钟相关方法
    getPomodoro() {
        return this.getModuleData('pomodoro');
    }

    savePomodoro(pomodoroData) {
        return this.saveModuleData('pomodoro', pomodoroData);
    }

    updatePomodoroSettings(workTime, breakTime) {
        const pomodoroData = this.getPomodoro();
        pomodoroData.workTime = workTime;
        pomodoroData.breakTime = breakTime;
        this.savePomodoro(pomodoroData);
    }

    incrementTodayCount() {
        const pomodoroData = this.getPomodoro();
        const today = new Date().toISOString().split('T')[0];
        
        // 如果是新的一天，重置计数
        if (pomodoroData.lastDate !== today) {
            pomodoroData.todayCount = 0;
            pomodoroData.lastDate = today;
        }
        
        pomodoroData.todayCount++;
        this.savePomodoro(pomodoroData);
        return pomodoroData.todayCount;
    }

    // 项目管理相关方法
    getProjects() {
        return this.getModuleData('projects') || [];
    }

    saveProjects(projectsData) {
        return this.saveModuleData('projects', projectsData);
    }

    addProject(name) {
        const projects = this.getProjects();
        const newProject = {
            id: this.generateId(),
            name: name,
            tasks: [],
            createdAt: new Date().toISOString()
        };
        projects.push(newProject);
        this.saveProjects(projects);
        return newProject;
    }

    deleteProject(projectId) {
        const projects = this.getProjects();
        const filteredProjects = projects.filter(project => project.id !== projectId);
        this.saveProjects(filteredProjects);
    }

    addTask(projectId, title) {
        const projects = this.getProjects();
        const project = projects.find(p => p.id === projectId);
        if (project) {
            const newTask = {
                id: this.generateId(),
                title: title,
                completed: false,
                createdAt: new Date().toISOString()
            };
            project.tasks.push(newTask);
            this.saveProjects(projects);
            return newTask;
        }
        return null;
    }

    updateTask(projectId, taskId, updates) {
        const projects = this.getProjects();
        const project = projects.find(p => p.id === projectId);
        if (project) {
            const task = project.tasks.find(t => t.id === taskId);
            if (task) {
                Object.assign(task, updates);
                this.saveProjects(projects);
                return task;
            }
        }
        return null;
    }

    deleteTask(projectId, taskId) {
        const projects = this.getProjects();
        const project = projects.find(p => p.id === projectId);
        if (project) {
            project.tasks = project.tasks.filter(task => task.id !== taskId);
            this.saveProjects(projects);
        }
    }

    // 数据导出
    exportData() {
        const allData = this.getAllData();
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `personal-tools-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // 数据导入
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (this.validateDataStructure(importedData)) {
                        this.saveAllData(importedData);
                        resolve(true);
                    } else {
                        reject(new Error('数据格式不正确'));
                    }
                } catch (error) {
                    reject(new Error('文件解析失败'));
                }
            };
            reader.readAsText(file);
        });
    }

    // 验证数据结构
    validateDataStructure(data) {
        const requiredKeys = ['notes', 'todos', 'aiChats', 'pomodoro', 'projects'];
        return requiredKeys.every(key => data.hasOwnProperty(key));
    }
}

// 创建全局存储管理实例
window.storageManager = new StorageManager();