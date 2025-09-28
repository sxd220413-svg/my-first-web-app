// 记事本模块
class NotesModule {
    constructor() {
        this.currentFolder = null;
        this.currentNote = null;
        this.isEditing = false;
        this.setupEventListeners();
    }

    init() {
        this.loadFolders();
        this.clearEditor();
    }

    setupEventListeners() {
        // 新建文件夹按钮
        document.getElementById('add-folder-btn').addEventListener('click', () => {
            this.showAddFolderModal();
        });

        // 新建笔记按钮
        document.getElementById('add-note-btn').addEventListener('click', () => {
            this.showAddNoteModal();
        });
    }

    // 加载文件夹列表
    loadFolders() {
        const notesData = window.storageManager.getNotes();
        const foldersContainer = document.getElementById('folders-list');
        
        foldersContainer.innerHTML = '';

        if (notesData.folders.length === 0) {
            foldersContainer.innerHTML = '<p class="empty-state">暂无文件夹<br>点击上方按钮创建</p>';
            return;
        }

        notesData.folders.forEach(folder => {
            const folderElement = this.createFolderElement(folder);
            foldersContainer.appendChild(folderElement);
        });
    }

    // 创建文件夹元素
    createFolderElement(folder) {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder-item';
        folderDiv.dataset.folderId = folder.id;
        
        folderDiv.innerHTML = `
            <div class="folder-header" onclick="notesModule.selectFolder('${folder.id}')">
                <span class="folder-icon">📁</span>
                <span class="folder-name">${utils.escapeHtml(folder.name)}</span>
                <span class="notes-count">(${folder.notes.length})</span>
            </div>
            <div class="folder-actions">
                <button class="btn-icon" onclick="notesModule.renameFolderModal('${folder.id}')" title="重命名">
                    ✏️
                </button>
                <button class="btn-icon" onclick="notesModule.deleteFolderConfirm('${folder.id}')" title="删除">
                    🗑️
                </button>
            </div>
        `;

        // 添加样式
        Object.assign(folderDiv.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px',
            margin: '5px 0',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        });

        folderDiv.addEventListener('mouseenter', () => {
            folderDiv.style.backgroundColor = '#f8f9fa';
            folderDiv.style.borderColor = '#667eea';
        });

        folderDiv.addEventListener('mouseleave', () => {
            if (!folderDiv.classList.contains('selected')) {
                folderDiv.style.backgroundColor = 'white';
                folderDiv.style.borderColor = '#dee2e6';
            }
        });

        return folderDiv;
    }

    // 选择文件夹
    selectFolder(folderId) {
        // 更新选中状态
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('selected');
            item.style.backgroundColor = 'white';
            item.style.borderColor = '#dee2e6';
        });

        const selectedFolder = document.querySelector(`[data-folder-id="${folderId}"]`);
        if (selectedFolder) {
            selectedFolder.classList.add('selected');
            selectedFolder.style.backgroundColor = '#e3f2fd';
            selectedFolder.style.borderColor = '#667eea';
        }

        this.currentFolder = folderId;
        this.loadNotes(folderId);
        
        // 启用新建笔记按钮
        document.getElementById('add-note-btn').disabled = false;
    }

    // 加载笔记列表
    loadNotes(folderId) {
        const notesData = window.storageManager.getNotes();
        const folder = notesData.folders.find(f => f.id === folderId);
        
        if (!folder) return;

        // 更新文件夹名称显示
        document.getElementById('current-folder-name').textContent = folder.name;

        const notesContainer = document.getElementById('notes-list');
        notesContainer.innerHTML = '';

        if (folder.notes.length === 0) {
            notesContainer.innerHTML = '<p class="empty-state">暂无笔记<br>点击上方按钮创建</p>';
            return;
        }

        folder.notes.forEach(note => {
            const noteElement = this.createNoteElement(note);
            notesContainer.appendChild(noteElement);
        });
    }

    // 创建笔记元素
    createNoteElement(note) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-item';
        noteDiv.dataset.noteId = note.id;
        
        const preview = note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '');
        
        noteDiv.innerHTML = `
            <div class="note-header">
                <h4 class="note-title">${utils.escapeHtml(note.title)}</h4>
                <div class="note-actions">
                    <button class="btn-icon" onclick="notesModule.deleteNoteConfirm('${note.id}')" title="删除">
                        🗑️
                    </button>
                </div>
            </div>
            <p class="note-preview">${utils.escapeHtml(preview)}</p>
            <small class="note-date">${window.app.formatDate(note.createdAt)}</small>
        `;

        // 添加样式
        Object.assign(noteDiv.style, {
            padding: '12px',
            margin: '8px 0',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        });

        noteDiv.addEventListener('click', () => {
            this.selectNote(note.id);
        });

        noteDiv.addEventListener('mouseenter', () => {
            noteDiv.style.backgroundColor = '#f8f9fa';
            noteDiv.style.borderColor = '#667eea';
        });

        noteDiv.addEventListener('mouseleave', () => {
            if (!noteDiv.classList.contains('selected')) {
                noteDiv.style.backgroundColor = 'white';
                noteDiv.style.borderColor = '#dee2e6';
            }
        });

        return noteDiv;
    }

    // 选择笔记
    selectNote(noteId) {
        // 保存当前编辑的笔记
        if (this.currentNote && this.isEditing) {
            this.saveCurrentNote();
        }

        // 更新选中状态
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('selected');
            item.style.backgroundColor = 'white';
            item.style.borderColor = '#dee2e6';
        });

        const selectedNote = document.querySelector(`[data-note-id="${noteId}"]`);
        if (selectedNote) {
            selectedNote.classList.add('selected');
            selectedNote.style.backgroundColor = '#e3f2fd';
            selectedNote.style.borderColor = '#667eea';
        }

        this.currentNote = noteId;
        this.loadNoteEditor(noteId);
    }

    // 加载笔记编辑器
    loadNoteEditor(noteId) {
        const notesData = window.storageManager.getNotes();
        const folder = notesData.folders.find(f => f.id === this.currentFolder);
        const note = folder.notes.find(n => n.id === noteId);

        if (!note) return;

        const editorContainer = document.getElementById('note-editor-content');
        editorContainer.innerHTML = `
            <div class="note-editor-header">
                <input type="text" class="note-title-input" value="${utils.escapeHtml(note.title)}" placeholder="笔记标题">
                <div class="editor-actions">
                    <button class="btn btn-secondary" onclick="notesModule.saveCurrentNote()">保存</button>
                </div>
            </div>
            <textarea class="note-content-input" placeholder="开始写笔记...">${utils.escapeHtml(note.content)}</textarea>
        `;

        // 添加样式
        const titleInput = editorContainer.querySelector('.note-title-input');
        const contentInput = editorContainer.querySelector('.note-content-input');

        Object.assign(titleInput.style, {
            width: '100%',
            padding: '10px',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '15px'
        });

        Object.assign(contentInput.style, {
            width: '100%',
            height: 'calc(100vh - 300px)',
            padding: '15px',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            fontSize: '1rem',
            lineHeight: '1.6',
            resize: 'none',
            fontFamily: 'inherit'
        });

        // 监听输入变化
        titleInput.addEventListener('input', () => {
            this.isEditing = true;
        });

        contentInput.addEventListener('input', () => {
            this.isEditing = true;
        });

        // 自动保存
        const autoSave = window.app.debounce(() => {
            this.saveCurrentNote();
        }, 2000);

        titleInput.addEventListener('input', autoSave);
        contentInput.addEventListener('input', autoSave);

        this.isEditing = false;
    }

    // 保存当前笔记
    saveCurrentNote() {
        if (!this.currentNote || !this.currentFolder) return;

        const titleInput = document.querySelector('.note-title-input');
        const contentInput = document.querySelector('.note-content-input');

        if (!titleInput || !contentInput) return;

        const title = titleInput.value.trim();
        const content = contentInput.value;

        if (!title) {
            window.app.showToast('笔记标题不能为空', 'warning');
            return;
        }

        window.storageManager.updateNote(this.currentFolder, this.currentNote, title, content);
        this.isEditing = false;
        
        // 更新笔记列表显示
        this.loadNotes(this.currentFolder);
        
        window.app.showToast('笔记已保存', 'success');
    }

    // 清空编辑器
    clearEditor() {
        const editorContainer = document.getElementById('note-editor-content');
        editorContainer.innerHTML = '<p style="text-align: center; color: #6c757d; margin-top: 50px;">请选择或创建一个笔记开始编辑</p>';
        this.currentNote = null;
        this.isEditing = false;
    }

    // 显示添加文件夹模态框
    showAddFolderModal() {
        const modalContent = `
            <div class="form-group">
                <label for="folder-name">文件夹名称</label>
                <input type="text" id="folder-name" placeholder="输入文件夹名称" maxlength="50">
            </div>
        `;

        window.app.showModal('新建文件夹', modalContent, () => {
            const folderName = document.getElementById('folder-name').value.trim();
            if (!folderName) {
                window.app.showToast('文件夹名称不能为空', 'warning');
                return false;
            }
            
            window.storageManager.addFolder(folderName);
            this.loadFolders();
            window.app.showToast('文件夹创建成功', 'success');
        });
    }

    // 显示添加笔记模态框
    showAddNoteModal() {
        if (!this.currentFolder) {
            window.app.showToast('请先选择一个文件夹', 'warning');
            return;
        }

        const modalContent = `
            <div class="form-group">
                <label for="note-title">笔记标题</label>
                <input type="text" id="note-title" placeholder="输入笔记标题" maxlength="100">
            </div>
        `;

        window.app.showModal('新建笔记', modalContent, () => {
            const noteTitle = document.getElementById('note-title').value.trim();
            if (!noteTitle) {
                window.app.showToast('笔记标题不能为空', 'warning');
                return false;
            }
            
            const newNote = window.storageManager.addNote(this.currentFolder, noteTitle);
            this.loadNotes(this.currentFolder);
            this.selectNote(newNote.id);
            window.app.showToast('笔记创建成功', 'success');
        });
    }

    // 重命名文件夹模态框
    renameFolderModal(folderId) {
        const notesData = window.storageManager.getNotes();
        const folder = notesData.folders.find(f => f.id === folderId);
        
        if (!folder) return;

        const modalContent = `
            <div class="form-group">
                <label for="new-folder-name">文件夹名称</label>
                <input type="text" id="new-folder-name" value="${utils.escapeHtml(folder.name)}" maxlength="50">
            </div>
        `;

        window.app.showModal('重命名文件夹', modalContent, () => {
            const newName = document.getElementById('new-folder-name').value.trim();
            if (!newName) {
                window.app.showToast('文件夹名称不能为空', 'warning');
                return false;
            }
            
            folder.name = newName;
            window.storageManager.saveNotes(notesData);
            this.loadFolders();
            
            if (this.currentFolder === folderId) {
                document.getElementById('current-folder-name').textContent = newName;
            }
            
            window.app.showToast('文件夹重命名成功', 'success');
        });
    }

    // 删除文件夹确认
    deleteFolderConfirm(folderId) {
        const notesData = window.storageManager.getNotes();
        const folder = notesData.folders.find(f => f.id === folderId);
        
        if (!folder) return;

        const message = `确定要删除文件夹"${folder.name}"吗？\n这将同时删除文件夹内的所有笔记，此操作不可恢复。`;
        
        window.app.showConfirm('删除文件夹', message, () => {
            window.storageManager.deleteFolder(folderId);
            
            if (this.currentFolder === folderId) {
                this.currentFolder = null;
                this.clearEditor();
                document.getElementById('current-folder-name').textContent = '选择文件夹';
                document.getElementById('add-note-btn').disabled = true;
                document.getElementById('notes-list').innerHTML = '';
            }
            
            this.loadFolders();
            window.app.showToast('文件夹删除成功', 'success');
        });
    }

    // 删除笔记确认
    deleteNoteConfirm(noteId) {
        const notesData = window.storageManager.getNotes();
        const folder = notesData.folders.find(f => f.id === this.currentFolder);
        const note = folder.notes.find(n => n.id === noteId);
        
        if (!note) return;

        const message = `确定要删除笔记"${note.title}"吗？\n此操作不可恢复。`;
        
        window.app.showConfirm('删除笔记', message, () => {
            window.storageManager.deleteNote(this.currentFolder, noteId);
            
            if (this.currentNote === noteId) {
                this.clearEditor();
            }
            
            this.loadNotes(this.currentFolder);
            window.app.showToast('笔记删除成功', 'success');
        });
    }
}

// 创建全局实例
window.notesModule = new NotesModule();