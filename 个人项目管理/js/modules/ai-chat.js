// AI对话模块
class AIChatModule {
    constructor() {
        this.currentChatId = null;
        this.isLoading = false;
        this.setupEventListeners();
    }

    init() {
        this.loadOrCreateChat();
    }

    setupEventListeners() {
        // 新对话按钮
        document.getElementById('new-chat-btn').addEventListener('click', () => {
            this.createNewChat();
        });

        // 发送消息按钮
        document.getElementById('send-message-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        // 输入框回车发送
        document.getElementById('chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    // 加载或创建聊天
    loadOrCreateChat() {
        const chats = window.storageManager.getAIChats();
        
        if (chats.length === 0) {
            this.createNewChat();
        } else {
            // 加载最新的聊天
            this.currentChatId = chats[chats.length - 1].id;
            this.loadChatMessages();
        }
    }

    // 创建新对话
    createNewChat() {
        const newChat = window.storageManager.addChatSession();
        this.currentChatId = newChat.id;
        this.loadChatMessages();
        window.app.showToast('新对话已创建', 'success');
    }

    // 加载聊天消息
    loadChatMessages() {
        const chats = window.storageManager.getAIChats();
        const currentChat = chats.find(chat => chat.id === this.currentChatId);
        
        if (!currentChat) return;

        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';

        if (currentChat.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <h3>👋 欢迎使用AI助手</h3>
                    <p>我是您的智能助手，可以帮助您：</p>
                    <ul>
                        <li>📝 回答各种问题</li>
                        <li>💡 提供创意建议</li>
                        <li>📚 解释复杂概念</li>
                        <li>🔧 协助解决问题</li>
                    </ul>
                    <p>请在下方输入您的问题开始对话！</p>
                </div>
            `;
            return;
        }

        currentChat.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });

        // 滚动到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 创建消息元素
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;

        const avatar = message.role === 'user' ? '👤' : '🤖';
        const name = message.role === 'user' ? '您' : 'AI助手';

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-name">${name}</span>
                    <span class="message-time">${window.app.formatDate(message.timestamp)}</span>
                </div>
                <div class="message-text">${this.formatMessageContent(message.content)}</div>
            </div>
        `;

        // 添加样式
        Object.assign(messageDiv.style, {
            display: 'flex',
            marginBottom: '20px',
            alignItems: 'flex-start'
        });

        if (message.role === 'user') {
            messageDiv.style.flexDirection = 'row-reverse';
            messageDiv.style.textAlign = 'right';
        }

        return messageDiv;
    }

    // 格式化消息内容
    formatMessageContent(content) {
        // 简单的文本格式化
        return utils.escapeHtml(content)
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    // 发送消息
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message || this.isLoading) return;

        // 清空输入框
        input.value = '';

        // 添加用户消息
        window.storageManager.addMessage(this.currentChatId, 'user', message);
        this.loadChatMessages();

        // 显示加载状态
        this.showLoadingMessage();
        this.isLoading = true;

        try {
            // 调用AI API
            const response = await this.callAIAPI(message);
            
            // 移除加载消息
            this.removeLoadingMessage();
            
            // 添加AI回复
            window.storageManager.addMessage(this.currentChatId, 'assistant', response);
            this.loadChatMessages();
            
        } catch (error) {
            console.error('AI API调用失败:', error);
            this.removeLoadingMessage();
            
            // 添加错误消息
            const errorMessage = '抱歉，AI服务暂时不可用。这是一个演示版本，实际使用时需要配置AI API。';
            window.storageManager.addMessage(this.currentChatId, 'assistant', errorMessage);
            this.loadChatMessages();
            
            window.app.showToast('AI服务连接失败', 'error');
        }

        this.isLoading = false;
    }

    // 显示加载消息
    showLoadingMessage() {
        const messagesContainer = document.getElementById('chat-messages');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant loading-message';
        loadingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-name">AI助手</span>
                </div>
                <div class="message-text">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;

        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 移除加载消息
    removeLoadingMessage() {
        const loadingMessage = document.querySelector('.loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    // 调用AI API（演示版本）
    async callAIAPI(message) {
        // 这里是演示版本，实际使用时需要替换为真实的AI API
        // 例如：Hugging Face Inference API, OpenAI API等
        
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // 简单的模拟回复
        const responses = [
            '这是一个很好的问题！作为AI助手，我建议您可以从以下几个方面来考虑这个问题...',
            '根据您的描述，我理解您想要了解的是...让我为您详细解释一下。',
            '感谢您的提问！这个话题确实很有趣。从我的知识库来看...',
            '我很乐意帮助您解决这个问题。基于您提供的信息，我的建议是...',
            '这是一个常见但重要的问题。让我为您分析一下可能的解决方案...'
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        // 根据用户输入生成更相关的回复
        if (message.includes('你好') || message.includes('您好')) {
            return '您好！很高兴为您服务。请问有什么我可以帮助您的吗？';
        } else if (message.includes('谢谢') || message.includes('感谢')) {
            return '不客气！如果您还有其他问题，随时可以问我。';
        } else if (message.includes('再见') || message.includes('拜拜')) {
            return '再见！祝您生活愉快，有需要随时回来找我聊天！';
        }

        return randomResponse;

        // 实际使用时的API调用示例（需要配置API密钥）：
        /*
        const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer YOUR_API_KEY',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: message,
                parameters: {
                    max_length: 1000,
                    temperature: 0.7
                }
            })
        });

        const data = await response.json();
        return data.generated_text || '抱歉，我现在无法回答这个问题。';
        */
    }
}

// 添加CSS样式
const chatStyles = `
<style>
.welcome-message {
    text-align: center;
    padding: 40px 20px;
    color: #6c757d;
}

.welcome-message h3 {
    color: #495057;
    margin-bottom: 20px;
}

.welcome-message ul {
    text-align: left;
    max-width: 300px;
    margin: 20px auto;
}

.welcome-message li {
    margin: 8px 0;
}

.message {
    display: flex;
    margin-bottom: 20px;
    align-items: flex-start;
}

.message.user {
    flex-direction: row-reverse;
}

.message-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    margin: 0 10px;
    flex-shrink: 0;
}

.message.user .message-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message.assistant .message-avatar {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.message-content {
    max-width: 70%;
    background: white;
    border-radius: 12px;
    padding: 12px 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.message.user .message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    font-size: 0.8rem;
    opacity: 0.8;
}

.message-name {
    font-weight: 600;
}

.message-text {
    line-height: 1.5;
}

.typing-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
}

.typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #667eea;
    animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typing {
    0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
    }
    40% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
`;

// 添加样式到页面
document.head.insertAdjacentHTML('beforeend', chatStyles);

// 创建全局实例
window.aiChatModule = new AIChatModule();