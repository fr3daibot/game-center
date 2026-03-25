export class TaskManager {
    constructor(scene, store, game) {
        this.scene = scene;
        this.store = store;
        this.game = game;
        
        this.spills = [];
        this.glassPieces = [];
        this.restockTasks = [];
        
        this.spawnTimer = 0;
        this.spawnInterval = 3;
        
        this.spillMaterial = new THREE.MeshStandardMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1
        });
        
        this.glassMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            roughness: 0,
            metalness: 0.5
        });
        
        this.effects = [];
    }
    
    update(delta) {
        this.spawnTimer += delta;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnRandomTask();
            
            this.spawnInterval = Math.max(2, this.spawnInterval - 0.02);
        }
        
        this.spills.forEach(spill => {
            if (spill.mesh.visible) {
                spill.mesh.rotation.y += delta * 0.5;
            }
        });
        
        this.glassPieces.forEach(glass => {
            if (glass.mesh.visible) {
                glass.mesh.rotation.x += delta * 2;
                glass.mesh.rotation.z += delta * 1.5;
            }
        });
        
        this.updateEffects(delta);
    }
    
    spawnRandomTask() {
        const taskType = Math.random();
        
        if (taskType < 0.33) {
            this.spawnSpill();
        } else if (taskType < 0.66) {
            this.spawnGlass();
        } else {
            this.spawnRestockTask();
        }
    }
    
    spawnSpill() {
        const position = this.store.getRandomHotZonePosition();
        
        const spillGeom = new THREE.CircleGeometry(0.8, 16);
        const spill = new THREE.Mesh(spillGeom, this.spillMaterial.clone());
        spill.rotation.x = -Math.PI / 2;
        spill.position.set(position.x, 0.02, position.z);
        spill.position.y = 0.02;
        spill.receiveShadow = true;
        
        this.scene.add(spill);
        
        this.spills.push({
            mesh: spill,
            position: position.clone(),
            points: 10,
            cleaned: false
        });
    }
    
    spawnGlass() {
        const position = this.store.getRandomHotZonePosition();
        
        for (let i = 0; i < 5; i++) {
            const glassGeom = new THREE.OctahedronGeometry(0.1 + Math.random() * 0.1);
            const glass = new THREE.Mesh(glassGeom, this.glassMaterial.clone());
            
            glass.position.set(
                position.x + (Math.random() - 0.5) * 1.5,
                0.1 + Math.random() * 0.2,
                position.z + (Math.random() - 0.5) * 1.5
            );
            glass.castShadow = true;
            
            const scale = 0.5 + Math.random() * 0.5;
            glass.scale.set(scale, scale, scale);
            
            this.scene.add(glass);
            
            this.glassPieces.push({
                mesh: glass,
                position: glass.position.clone(),
                points: 3,
                cleaned: false
            });
        }
    }
    
    spawnRestockTask() {
        const shelfIndex = Math.floor(Math.random() * this.store.shelves.length);
        const shelf = this.store.shelves[shelfIndex];
        
        if (!shelf.stocked) {
            return;
        }
        
        const reduction = 35 + Math.floor(Math.random() * 20);
        shelf.stockLevel = Math.max(0, shelf.stockLevel - reduction);
        
        this.updateShelfProductVisibility(shelf);
        
        if (shelf.stockLevel <= 10) {
            shelf.stocked = false;
            
            this.restockTasks.push({
                shelfIndex,
                position: shelf.position.clone(),
                points: 15,
                completed: false
            });
        }
    }
    
    updateShelfProductVisibility(shelf) {
        if (!shelf.productsByLevel) return;
        
        const totalProducts = shelf.productsByLevel.flat().length;
        const visibleCount = Math.floor((shelf.stockLevel / 100) * totalProducts);
        
        let productIndex = 0;
        for (let level = 0; level < shelf.productsByLevel.length; level++) {
            const levelProducts = shelf.productsByLevel[level];
            for (let i = 0; i < levelProducts.length; i++) {
                const product = levelProducts[i];
                product.visible = productIndex < visibleCount;
                productIndex++;
            }
        }
    }
    
    restoreShelfAppearance(shelf) {
        if (!shelf.productsByLevel) return;
        
        const colors = [0x3a86ff, 0x8338ec, 0xff006e, 0xfb5607, 0xffbe0b, 0x06d6a0];
        
        for (let level = 0; level < shelf.productsByLevel.length; level++) {
            const levelProducts = shelf.productsByLevel[level];
            for (let i = 0; i < levelProducts.length; i++) {
                const product = levelProducts[i];
                const color = colors[(level * levelProducts.length + i) % colors.length];
                product.material.color.setHex(color);
                product.visible = true;
            }
        }
        
        this.updateShelfProductVisibility(shelf);
    }
    
    unstockAllShelves() {
        const totalShelves = this.store.shelves.length;
        const shelvesToUnstock = Math.floor(totalShelves * 0.3);
        
        const indices = [];
        while (indices.length < shelvesToUnstock) {
            const idx = Math.floor(Math.random() * totalShelves);
            if (!indices.includes(idx)) {
                indices.push(idx);
            }
        }
        
        let count = 0;
        indices.forEach(index => {
            const shelf = this.store.shelves[index];
            shelf.stockLevel = 0;
            shelf.stocked = false;
            this.updateShelfProductVisibility(shelf);
            
            const existingTask = this.restockTasks.find(t => t.shelfIndex === index);
            if (!existingTask) {
                this.restockTasks.push({
                    shelfIndex: index,
                    position: shelf.position.clone(),
                    points: 15,
                    completed: false
                });
                count++;
            }
        });
        
        this.showNotification(`${count} shelves need restocking!`, '#ff6b6b');
    }
    
    createEffect(position, type, direction) {
        if (type === 'mop' || type === 'broom') {
            this.createRippleEffect(position, type);
        } else {
            this.createSprayEffect(position, direction);
        }
    }
    
    createRippleEffect(position, type) {
        const color = type === 'mop' ? 0x00aaff : 0xffd700;
        const duration = type === 'mop' ? 0.6 : 0.4;
        const maxRadius = type === 'mop' ? 3 : 2.5;
        
        for (let i = 0; i < 3; i++) {
            const ringGeom = new THREE.RingGeometry(0.1, 0.3, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8 - i * 0.2,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.set(position.x, 0.05, position.z);
            ring.rotation.x = -Math.PI / 2;
            this.scene.add(ring);
            
            this.effects.push({
                mesh: ring,
                type: 'ripple',
                life: duration - i * 0.1,
                maxLife: duration - i * 0.1,
                startRadius: 0.1,
                maxRadius: maxRadius,
                delay: i * 0.08
            });
        }
    }
    
    createSprayEffect(position, direction) {
        const dropletCount = 12;
        
        for (let i = 0; i < dropletCount; i++) {
            const size = 0.05 + Math.random() * 0.08;
            const dropletGeom = new THREE.SphereGeometry(size, 6, 4);
            const dropletMat = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 1
            });
            const droplet = new THREE.Mesh(dropletGeom, dropletMat);
            
            const angle = (Math.random() - 0.5) * 0.6;
            const speed = 4 + Math.random() * 3;
            
            droplet.position.set(
                position.x + direction.x * 0.5,
                0.8 + Math.random() * 0.4,
                position.z + direction.z * 0.5
            );
            
            this.scene.add(droplet);
            
            this.effects.push({
                mesh: droplet,
                type: 'spray',
                life: 0.4 + Math.random() * 0.2,
                maxLife: 0.5,
                velocity: {
                    x: direction.x * speed + Math.sin(angle) * (Math.random() - 0.5) * 3,
                    y: -2 + Math.random() * -2,
                    z: direction.z * speed + Math.cos(angle) * (Math.random() - 0.5) * 3
                },
                gravity: 8
            });
        }
    }
    
    updateEffects(delta) {
        this.effects = this.effects.filter(effect => {
            effect.life -= delta;
            
            if (effect.life <= 0) {
                this.scene.remove(effect.mesh);
                return false;
            }
            
            if (effect.type === 'ripple') {
                if (effect.delay > 0) {
                    effect.delay -= delta;
                    return true;
                }
                
                const progress = 1 - (effect.life / effect.maxLife);
                const currentRadius = effect.startRadius + (effect.maxRadius - effect.startRadius) * progress;
                effect.mesh.scale.setScalar(currentRadius / effect.startRadius);
                effect.mesh.material.opacity = (effect.life / effect.maxLife) * 0.8;
            } else if (effect.type === 'spray') {
                effect.mesh.position.x += effect.velocity.x * delta;
                effect.mesh.position.y += effect.velocity.y * delta;
                effect.mesh.position.z += effect.velocity.z * delta;
                effect.velocity.y -= effect.gravity * delta;
                
                if (effect.mesh.position.y < 0.05) {
                    effect.mesh.position.y = 0.05;
                    effect.velocity.y = 0;
                    effect.velocity.x *= 0.8;
                    effect.velocity.z *= 0.8;
                }
                
                effect.mesh.material.opacity = Math.min(1, effect.life / 0.2);
            } else {
                effect.mesh.scale.setScalar(1 + (1 - effect.life / effect.maxLife) * 2);
                effect.mesh.material.opacity = effect.life / effect.maxLife;
            }
            
            return true;
        });
    }
    
    cleanSpills(playerPos, playerDir) {
        let cleaned = false;
        
        for (let i = this.spills.length - 1; i >= 0; i--) {
            const spill = this.spills[i];
            if (spill.cleaned) continue;
            
            const dist = playerPos.distanceTo(spill.position);
            if (dist <= 5) {
                this.createEffect(spill.position, 'mop');
                spill.cleaned = true;
                spill.mesh.visible = false;
                this.scene.remove(spill.mesh);
                this.spills.splice(i, 1);
                
                this.game.addScore(10);
                this.game.audio.playSound('mop');
                
                this.showTaskIndicator('Spill cleaned! +10');
                cleaned = true;
            }
        }
        
        if (!cleaned) {
            this.createEffect(playerPos.clone().add(playerDir.clone().multiplyScalar(2)), 'mop');
        }
    }
    
    cleanGlass(playerPos, playerDir) {
        let cleaned = 0;
        
        for (let i = this.glassPieces.length - 1; i >= 0; i--) {
            const glass = this.glassPieces[i];
            if (glass.cleaned) continue;
            
            const dist = playerPos.distanceTo(glass.position);
            if (dist <= 5) {
                glass.cleaned = true;
                glass.mesh.visible = false;
                this.scene.remove(glass.mesh);
                this.glassPieces.splice(i, 1);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            this.createEffect(playerPos.clone().add(playerDir.clone().multiplyScalar(2)), 'broom');
            const points = cleaned * 3;
            this.game.addScore(points);
            this.game.audio.playSound('sweep');
            this.showTaskIndicator(`Glass swept! +${points}`);
        } else {
            this.createEffect(playerPos.clone().add(playerDir.clone().multiplyScalar(2)), 'broom');
        }
    }
    
    restockShelves(playerPos, playerDir) {
        const shelfData = this.store.getShelfStockLevel(playerPos.x, playerPos.z);
        
        if (!shelfData) {
            return;
        }
        
        const stockLevel = shelfData.shelf.stockLevel;
        const isStocked = shelfData.shelf.stocked;
        
        if (!isStocked) {
            shelfData.shelf.stockLevel = 100;
            shelfData.shelf.stocked = true;
            
            this.restoreShelfAppearance(shelfData.shelf);
            
            const taskIndex = this.restockTasks.findIndex(t => t.shelfIndex === shelfData.index);
            if (taskIndex !== -1) {
                this.restockTasks.splice(taskIndex, 1);
            }
            
            this.game.addScore(15);
            this.game.audio.playSound('restock');
            this.showNotification('Shelf restocked! +15', '#00ff88');
        } else if (stockLevel < 100) {
            this.showNotification(`Shelf at ${stockLevel}% - keep cleaning`, '#ffd700');
        } else {
            this.showNotification('Shelf fully stocked', '#888');
        }
    }
    
    showNotification(text, color = '#ffd700') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        notificationText.textContent = text;
        notification.style.borderColor = color;
        notificationText.style.color = color;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 2000);
    }
    
    showTaskIndicator(text) {
        const indicator = document.getElementById('taskIndicator');
        const textEl = document.getElementById('taskText');
        
        textEl.textContent = text;
        indicator.classList.remove('hidden');
        
        setTimeout(() => {
            indicator.classList.add('hidden');
        }, 1500);
    }
    
    getPendingCount() {
        return this.spills.length + this.glassPieces.length + this.restockTasks.length;
    }
    
    reset() {
        this.spills.forEach(spill => {
            this.scene.remove(spill.mesh);
        });
        this.spills = [];
        
        this.glassPieces.forEach(glass => {
            this.scene.remove(glass.mesh);
        });
        this.glassPieces = [];
        
        this.restockTasks = [];
        this.spawnTimer = 0;
        this.spawnInterval = 5;
    }
}
