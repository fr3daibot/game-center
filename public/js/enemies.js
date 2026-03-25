export class EnemyManager {
    constructor(scene, store, game) {
        this.scene = scene;
        this.store = store;
        this.game = game;
        
        this.pests = [];
        this.spawnTimer = 0;
        this.spawnInterval = 15;
        this.maxPests = 3;
        
        this.raycaster = new THREE.Raycaster();
        this.effects = [];
    }
    
    update(delta) {
        this.spawnTimer += delta;
        
        if (this.spawnTimer >= this.spawnInterval && this.pests.length < this.maxPests) {
            this.spawnTimer = 0;
            this.spawnPest();
            this.spawnInterval = Math.max(5, this.spawnInterval - 0.1);
            
            this.spawnInterval = Math.max(4, this.spawnInterval - 0.1);
        }
        
        this.pests.forEach(pest => {
            if (!pest.dead) {
                this.updatePestAI(pest, delta);
            }
        });
        
        this.pests = this.pests.filter(pest => {
            if (pest.dead && pest.deathTimer <= 0) {
                this.scene.remove(pest.mesh);
                return false;
            }
            if (pest.dead) {
                pest.deathTimer -= delta;
            }
            return true;
        });
        
        this.effects = this.effects.filter(effect => {
            effect.life -= delta;
            if (effect.life <= 0) {
                this.scene.remove(effect.mesh);
                return false;
            }
            effect.mesh.scale.setScalar(1 + (1 - effect.life / effect.maxLife) * 3);
            effect.mesh.material.opacity = effect.life / effect.maxLife;
            return true;
        });
    }
    
    createSprayEffect(position) {
        const geometry = new THREE.SphereGeometry(0.3, 8, 6);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, 0.5, position.z);
        this.scene.add(mesh);
        
        this.effects.push({
            mesh,
            life: 0.4,
            maxLife: 0.4
        });
    }
    
    spawnPest() {
        const isRat = Math.random() > 0.5;
        const position = this.store.getRandomHotZonePosition();
        
        let mesh;
        if (isRat) {
            mesh = this.createRat(position);
        } else {
            mesh = this.createRoach(position);
        }
        
        this.scene.add(mesh);
        
        this.pests.push({
            mesh,
            position: position.clone(),
            type: isRat ? 'rat' : 'roach',
            health: 1,
            speed: isRat ? 3 : 1.5,
            targetPos: this.getNewTarget(position),
            dead: false,
            deathTimer: 0.5,
            lastDirectionChange: 0,
            erraticTimer: 0
        });
    }
    
    createRat(position) {
        const group = new THREE.Group();
        
        const bodyGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.rotation.z = Math.PI / 2;
        group.add(body);
        
        const headGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const head = new THREE.Mesh(headGeom, bodyMat);
        head.position.set(0.15, 0.05, 0);
        group.add(head);
        
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const eyeGeom = new THREE.SphereGeometry(0.02, 4, 4);
        
        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(0.2, 0.08, 0.05);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(0.2, 0.08, -0.05);
        group.add(rightEye);
        
        const tailGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 4);
        const tailMat = new THREE.MeshStandardMaterial({ color: 0x3a2820 });
        const tail = new THREE.Mesh(tailGeom, tailMat);
        tail.position.set(-0.2, 0, 0);
        tail.rotation.z = Math.PI / 2;
        group.add(tail);
        
        group.position.set(position.x, 0.15, position.z);
        group.scale.set(1.5, 1.5, 1.5);
        
        return group;
    }
    
    createRoach(position) {
        const group = new THREE.Group();
        
        const bodyGeom = new THREE.SphereGeometry(0.12, 8, 6);
        bodyGeom.scale(1, 0.5, 1.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        group.add(body);
        
        const headGeom = new THREE.SphereGeometry(0.06, 6, 6);
        const head = new THREE.Mesh(headGeom, bodyMat);
        head.position.set(0, 0, 0.2);
        group.add(head);
        
        const antennaMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00 });
        const antennaGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.15, 4);
        
        const leftAntenna = new THREE.Mesh(antennaGeom, antennaMat);
        leftAntenna.position.set(-0.03, 0.05, 0.25);
        leftAntenna.rotation.x = -0.5;
        group.add(leftAntenna);
        
        const rightAntenna = new THREE.Mesh(antennaGeom, antennaMat);
        rightAntenna.position.set(0.03, 0.05, 0.25);
        rightAntenna.rotation.x = -0.5;
        group.add(rightAntenna);
        
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00 });
        const legGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.1, 4);
        
        for (let i = 0; i < 3; i++) {
            for (let side = -1; side <= 1; side += 2) {
                const leg = new THREE.Mesh(legGeom, legMat);
                leg.position.set(side * 0.12, -0.05, 0.1 - i * 0.1);
                leg.rotation.z = side * 0.5;
                group.add(leg);
            }
        }
        
        group.position.set(position.x, 0.05, position.z);
        group.scale.set(1.2, 1.2, 1.2);
        
        return group;
    }
    
    getNewTarget(currentPos) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 2 + Math.random() * 4;
        
        let newX = currentPos.x + Math.cos(angle) * distance;
        let newZ = currentPos.z + Math.sin(angle) * distance;
        
        const bounds = this.store.getStoreBounds();
        newX = Math.max(bounds.minX + 2, Math.min(bounds.maxX - 2, newX));
        newZ = Math.max(bounds.minZ + 2, Math.min(bounds.maxZ - 2, newZ));
        
        return new THREE.Vector3(newX, 0, newZ);
    }
    
    updatePestAI(pest, delta) {
        pest.lastDirectionChange -= delta;
        pest.erraticTimer -= delta;
        
        if (pest.type === 'roach' && pest.erraticTimer <= 0) {
            pest.erraticTimer = 0.3 + Math.random() * 0.3;
            pest.targetPos = this.getNewTarget(pest.position);
        }
        
        if (pest.lastDirectionChange <= 0) {
            pest.lastDirectionChange = 2 + Math.random() * 3;
            pest.targetPos = this.getNewTarget(pest.position);
        }
        
        const direction = new THREE.Vector3()
            .subVectors(pest.targetPos, pest.position)
            .normalize();
        
        pest.position.x += direction.x * pest.speed * delta;
        pest.position.z += direction.z * pest.speed * delta;
        
        const distToTarget = pest.position.distanceTo(pest.targetPos);
        if (distToTarget < 0.5) {
            pest.targetPos = this.getNewTarget(pest.position);
        }
        
        pest.mesh.position.copy(pest.position);
        
        const angle = Math.atan2(direction.x, direction.z);
        pest.mesh.rotation.y = angle;
        
        if (pest.type === 'rat') {
            pest.mesh.position.y = 0.15 + Math.sin(Date.now() * 0.01) * 0.02;
        }
    }
    
    killPests(playerPos, playerDir) {
        let kills = 0;
        
        this.pests.forEach(pest => {
            if (pest.dead) return;
            
            const dist = playerPos.distanceTo(pest.position);
            if (dist <= 5) {
                const toPest = new THREE.Vector3().subVectors(pest.position, playerPos).normalize();
                const dot = playerDir.dot(toPest);
                
                if (dot > 0.3 || dist < 3) {
                    this.createSprayEffect(pest.position);
                    pest.dead = true;
                    pest.mesh.material = new THREE.MeshStandardMaterial({ 
                        color: 0xff0000,
                        transparent: true,
                        opacity: 0.5
                    });
                    kills++;
                }
            }
        });
        
        if (kills > 0) {
            const points = kills * 20;
            this.game.addScore(points);
            this.game.audio.playSound('kill');
            this.showKillIndicator(kills);
        } else {
            const effectPos = playerPos.clone().add(playerDir.clone().multiplyScalar(2));
            this.createSprayEffect(effectPos);
        }
    }
    
    showKillIndicator(count) {
        const indicator = document.getElementById('taskIndicator');
        const textEl = document.getElementById('taskText');
        
        textEl.textContent = `Pest${count > 1 ? 's' : ''} eliminated! +${count * 20}`;
        indicator.classList.remove('hidden');
        
        setTimeout(() => {
            indicator.classList.add('hidden');
        }, 1500);
    }
    
    getPestCount() {
        return this.pests.filter(p => !p.dead).length;
    }
    
    getHotZones() {
        return this.pests.map(p => ({
            position: p.position.clone(),
            intensity: p.dead ? 0.3 : 1
        }));
    }
    
    reset() {
        this.pests.forEach(pest => {
            this.scene.remove(pest.mesh);
        });
        this.pests = [];
        this.spawnTimer = 0;
        this.spawnInterval = 8;
    }
}
