export class UI {
    constructor(game) {
        this.game = game;
        
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
        
        this.updateTimer('10:00');
        this.updateScore(0);
        this.updateTasks(0);
        this.updateWeaponUI('MOP', '🧹', 'Spills');
    }
    
    updateTimer(time) {
        this.timerValue.textContent = time;
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
