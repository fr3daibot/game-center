export class UI {
    constructor(game) {
        this.game = game;
        
        this.hazardBarFill = document.getElementById('hazardBarFill');
        this.timerElement = document.getElementById('timer');
        this.timerValue = document.getElementById('timerValue');
        this.scoreValue = document.getElementById('scoreValue');
        this.tasksValue = document.getElementById('tasksValue');
        this.comboElement = document.getElementById('combo');
        this.comboValue = document.getElementById('comboValue');
        this.weaponIcon = document.getElementById('weaponIcon');
        this.weaponName = document.getElementById('weaponName');
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
        this.damageOverlay = document.getElementById('damageOverlay');
        
        this.compassN = document.getElementById('compassN');
        this.compassS = document.getElementById('compassS');
        this.compassE = document.getElementById('compassE');
        this.compassW = document.getElementById('compassW');
        
        this.maxGameTime = 600;
        this.updateTimer('10:00');
        this.updateScore(0);
        this.updateTasks(0);
        this.updateHazardBar(100);
        this.updateWeaponUI('MOP', '🧹', 'Spills');
    }
    
    updateTimer(time) {
        this.timerValue.textContent = time;
    }
    
    updateHazardBar(percentage) {
        this.hazardBarFill.style.width = percentage + '%';
        
        if (percentage > 66) {
            this.hazardBarFill.style.background = 'linear-gradient(90deg, #00ff88, #66ff66)';
        } else if (percentage > 33) {
            this.hazardBarFill.style.background = 'linear-gradient(90deg, #ffd700, #ffaa00)';
        } else {
            this.hazardBarFill.style.background = 'linear-gradient(90deg, #ff6b6b, #ff4444)';
        }
    }
    
    updateCompass(yaw) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        
        const normalizedYaw = ((yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const degrees = normalizedYaw * 180 / Math.PI;
        
        const index = Math.round(degrees / 45) % 8;
        
        const compassInner = document.getElementById('compassInner');
        
        let displayStr = '';
        for (let i = -1; i <= 1; i++) {
            let idx = (index + i + 8) % 8;
            let dir = directions[idx];
            if (i === 0) {
                displayStr += `<span style="color: #ff4444; text-shadow: 0 0 8px #ff4444;">${dir}</span>`;
            } else {
                displayStr += `<span style="color: #666;">${dir}</span>`;
            }
            if (i < 1) displayStr += '<span style="color: #333; margin: 0 3px;">|</span>';
        }
        
        compassInner.innerHTML = displayStr;
        
        const scrollPercent = (normalizedYaw / (Math.PI * 2)) * 100;
        const centerOffset = 50;
        compassInner.style.transform = `translateX(${centerOffset - scrollPercent}%)`;
    }
    
    setTimerWarning(warning) {
        if (warning) {
            this.timerElement.classList.add('warning');
        } else {
            this.timerElement.classList.remove('warning');
        }
    }
    
    updateScore(score) {
        this.scoreValue.textContent = score;
    }
    
    updateTasks(count) {
        this.tasksValue.textContent = count;
        
        if (count > 5) {
            this.tasksValue.style.color = '#ff6b6b';
        } else if (count > 2) {
            this.tasksValue.style.color = '#ffd700';
        } else {
            this.tasksValue.style.color = '#00ff88';
        }
    }
    
    showCombo(multiplier) {
        this.comboElement.classList.remove('hidden');
        this.comboValue.textContent = `x${multiplier}`;
    }
    
    hideCombo() {
        this.comboElement.classList.add('hidden');
    }
    
    updateWeaponUI(name, icon, target, weaponIndex) {
        this.weaponIcon.textContent = icon;
        this.weaponName.textContent = name;
        this.weaponName.title = `Target: ${target}`;
        
        document.querySelectorAll('.weapon-slot').forEach((slot, i) => {
            slot.classList.toggle('active', i === weaponIndex);
        });
    }
    
    showNotification(text, duration = 2000) {
        this.notificationText.textContent = text;
        this.notification.classList.remove('hidden');
        
        setTimeout(() => {
            this.notification.classList.add('hidden');
        }, duration);
    }
    
    showDamage() {
        this.damageOverlay.style.opacity = '1';
        setTimeout(() => {
            this.damageOverlay.style.opacity = '0';
        }, 100);
    }
    
    showMissionStart() {
        this.showNotification('Customer arrives in 10:00!', 3000);
    }
    
    showSaleAlert() {
        this.showNotification('SALE! Shelves emptying fast!', 2500);
    }
    
    showLowStockWarning() {
        this.showNotification('Low stock! Restock shelves with [E]', 2000);
    }
}
