// 番茄钟模块
class PomodoroModule {
    constructor() {
        this.timer = null;
        this.timeLeft = 0;
        this.isRunning = false;
        this.isWorkTime = true;
        this.workTime = 25; // 分钟
        this.breakTime = 5; // 分钟
        this.setupEventListeners();
    }

    init() {
        this.loadSettings();
        this.updateDisplay();
        this.updateTodayCount();
    }

    setupEventListeners() {
        // 开始按钮
        document.getElementById('start-timer-btn').addEventListener('click', () => {
            this.startTimer();
        });

        // 暂停按钮
        document.getElementById('pause-timer-btn').addEventListener('click', () => {
            this.pauseTimer();
        });

        // 重置按钮
        document.getElementById('reset-timer-btn').addEventListener('click', () => {
            this.resetTimer();
        });

        // 设置变化监听
        document.getElementById('work-time').addEventListener('change', (e) => {
            this.workTime = parseInt(e.target.value);
            this.saveSettings();
            if (!this.isRunning) {
                this.resetTimer();
            }
        });

        document.getElementById('break-time').addEventListener('change', (e) => {
            this.breakTime = parseInt(e.target.value);
            this.saveSettings();
            if (!this.isRunning && !this.isWorkTime) {
                this.resetTimer();
            }
        });
    }

    // 加载设置
    loadSettings() {
        const pomodoroData = window.storageManager.getPomodoro();
        this.workTime = pomodoroData.workTime;
        this.breakTime = pomodoroData.breakTime;
        
        // 更新输入框
        document.getElementById('work-time').value = this.workTime;
        document.getElementById('break-time').value = this.breakTime;
        
        // 初始化时间
        this.timeLeft = this.workTime * 60;
    }

    // 保存设置
    saveSettings() {
        window.storageManager.updatePomodoroSettings(this.workTime, this.breakTime);
    }

    // 开始计时器
    startTimer() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.updateButtons();

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    // 暂停计时器
    pauseTimer() {
        if (!this.isRunning) return;

        this.isRunning = false;
        clearInterval(this.timer);
        this.updateButtons();
    }

    // 重置计时器
    resetTimer() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        this.timeLeft = this.isWorkTime ? this.workTime * 60 : this.breakTime * 60;
        this.updateDisplay();
        this.updateButtons();
    }

    // 计时器完成
    timerComplete() {
        this.isRunning = false;
        clearInterval(this.timer);

        if (this.isWorkTime) {
            // 工作时间结束，增加完成数量
            const count = window.storageManager.incrementTodayCount();
            this.updateTodayCount();
            
            // 切换到休息时间
            this.isWorkTime = false;
            this.timeLeft = this.breakTime * 60;
            
            this.showNotification('工作时间结束！', '休息一下吧，您已经完成了一个番茄钟！');
            window.app.showToast(`恭喜！完成第${count}个番茄钟`, 'success');
        } else {
            // 休息时间结束，切换到工作时间
            this.isWorkTime = true;
            this.timeLeft = this.workTime * 60;
            
            this.showNotification('休息时间结束！', '准备开始下一个工作周期吧！');
            window.app.showToast('休息结束，开始工作吧！', 'info');
        }

        this.updateDisplay();
        this.updateButtons();
        this.playNotificationSound();
    }

    // 更新显示
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-display').textContent = timeString;
        document.getElementById('timer-mode').textContent = this.isWorkTime ? '工作时间' : '休息时间';
        
        // 更新页面标题
        document.title = `${timeString} - ${this.isWorkTime ? '工作中' : '休息中'} - 个人效率工具集`;
        
        // 更新进度环（可选的视觉效果）
        this.updateProgressRing();
    }

    // 更新进度环
    updateProgressRing() {
        const totalTime = this.isWorkTime ? this.workTime * 60 : this.breakTime * 60;
        const progress = (totalTime - this.timeLeft) / totalTime;
        
        // 这里可以添加SVG进度环的更新逻辑
        // 目前使用简单的背景色变化来表示进度
        const timerCircle = document.querySelector('.timer-circle');
        if (timerCircle) {
            const hue = this.isWorkTime ? 240 : 120; // 蓝色为工作，绿色为休息
            const saturation = 70 + (progress * 30); // 随进度增加饱和度
            timerCircle.style.background = `linear-gradient(135deg, hsl(${hue}, ${saturation}%, 60%) 0%, hsl(${hue}, ${saturation}%, 40%) 100%)`;
        }
    }

    // 更新按钮状态
    updateButtons() {
        const startBtn = document.getElementById('start-timer-btn');
        const pauseBtn = document.getElementById('pause-timer-btn');
        const resetBtn = document.getElementById('reset-timer-btn');

        if (this.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            startBtn.textContent = '运行中';
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            startBtn.textContent = '开始';
        }
    }

    // 更新今日完成数量
    updateTodayCount() {
        const pomodoroData = window.storageManager.getPomodoro();
        const today = new Date().toISOString().split('T')[0];
        
        // 检查是否是新的一天
        if (pomodoroData.lastDate !== today) {
            pomodoroData.todayCount = 0;
            pomodoroData.lastDate = today;
            window.storageManager.savePomodoro(pomodoroData);
        }
        
        document.getElementById('today-count').textContent = pomodoroData.todayCount;
    }

    // 显示通知
    showNotification(title, body) {
        // 检查浏览器是否支持通知
        if ('Notification' in window) {
            // 请求通知权限
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body: body,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, {
                            body: body,
                            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>'
                        });
                    }
                });
            }
        }
    }

    // 播放通知音效
    playNotificationSound() {
        // 创建简单的提示音
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('无法播放音效:', error);
        }
    }

    // 获取统计信息
    getStats() {
        const pomodoroData = window.storageManager.getPomodoro();
        return {
            todayCount: pomodoroData.todayCount,
            workTime: this.workTime,
            breakTime: this.breakTime,
            isRunning: this.isRunning,
            isWorkTime: this.isWorkTime,
            timeLeft: this.timeLeft
        };
    }
}

// 添加CSS样式
const pomodoroStyles = `
<style>
.timer-circle {
    position: relative;
    overflow: hidden;
}

.timer-circle::before {
    content: '';
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    bottom: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
}

.timer-time, .timer-mode {
    position: relative;
    z-index: 1;
}

.timer-settings {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.timer-settings label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: #6c757d;
    font-weight: 500;
}

.timer-settings input {
    padding: 8px 12px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    width: 80px;
    text-align: center;
    font-size: 1rem;
}

.timer-settings input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.stat-item {
    background: white;
    border-radius: 8px;
    padding: 15px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 20px;
}

.stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #667eea;
    display: block;
    margin-top: 5px;
}

@media (max-width: 768px) {
    .timer-settings {
        flex-direction: column;
        gap: 15px;
    }
    
    .timer-settings label {
        width: 100%;
    }
    
    .timer-settings input {
        width: 100%;
        max-width: 120px;
    }
}
</style>
`;

// 添加样式到页面
document.head.insertAdjacentHTML('beforeend', pomodoroStyles);

// 创建全局实例
window.pomodoroModule = new PomodoroModule();