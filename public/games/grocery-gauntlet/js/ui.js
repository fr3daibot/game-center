export class UI {
    constructor(game) {
        this.game = game;
        
        this.hazardBarFill = document.getElementById('hazardBarFill');
        this.hazardLabel = document.getElementById('hazardLabel');
        this.timerFill = document.getElementById('timerFill');
        this.timerText = document.getElementById('timerText');
        this.scoreValue = document.getElementById('scoreValue');
        this.tasksValue = document.getElementById('tasksValue');
        this.comboElement = document.getElementById('combo');
        this.comboValue = document.getElementById('comboValue');
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
        this.damageOverlay = document.getElementById('damageOverlay');
        
        this.maxGameTime = 120;
        this.timerCircumference = 264;
        this.updateScore(0);
        this.updateTasks(0);
        this.updateHazardBar(100);
        this.updateTimerPie(100);
        this.updateWeaponUI('MOP', '🧹', 'Spills');
    }
    
    updateTimerPie(percentage) {
        const offset = this.timerCircumference * (1 - percentage / 100);
        this.timerFill.style.strokeDashoffset = offset;
    }
    
    updateHazardBar(percentage) {
        this.hazardBarFill.style.width = percentage + '%';
        
        this.hazardBarFill.classList.remove('warning', 'danger', 'critical');
        
        if (percentage >= 90) {
            this.hazardBarFill.classList.add('critical');
            this.hazardLabel.textContent = 'DANGER!';
            this.hazardLabel.style.color = '#ff4444';
        } else if (percentage >= 66) {
            this.hazardBarFill.classList.add('danger');
            this.hazardLabel.textContent = 'DANGER!';
            this.hazardLabel.style.color = '#ff8800';
        } else if (percentage >= 33) {
            this.hazardBarFill.classList.add('warning');
            this.hazardLabel.textContent = 'HAZARD RISING';
            this.hazardLabel.style.color = '#ffd700';
        } else {
            this.hazardLabel.textContent = 'HAZARD LEVEL';
            this.hazardLabel.style.color = '#fff';
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
        this.showNotification('Customer arrives in 2:00!', 3000);
    }
    
    showSaleAlert() {
        this.showNotification('SALE! Shelves emptying fast!', 2500);
    }
    
    showLowStockWarning() {
        this.showNotification('Low stock! Restock shelves with [E]', 2000);
    }
}
