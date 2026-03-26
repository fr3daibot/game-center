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
            
            if (effect.type === 'spray') {
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
                effect.mesh.scale.setScalar(1 + (1 - effect.life / effect.maxLife) * 3);
                effect.mesh.material.opacity = effect.life / effect.maxLife;
            }
            return true;
        });
    }
    
    createSprayEffect(position, direction, targetPos) {
        const dropletCount = 15;
        
        const sprayDir = new THREE.Vector3().subVectors(targetPos, position).normalize();
        const nozzlePos = position.clone().add(direction.clone().multiplyScalar(0.5));
        nozzlePos.y = 1.0;
        
        for (let i = 0; i < dropletCount; i++) {
            const size = 0.04 + Math.random() * 0.06;
            const dropletGeom = new THREE.SphereGeometry(size, 5, 4);
            const dropletMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xff6600 : 0xff4444,
                transparent: true,
                opacity: 1
            });
            const droplet = new THREE.Mesh(dropletGeom, dropletMat);
            
            droplet.position.copy(nozzlePos);
            
            this.scene.add(droplet);
            
            const spreadAngle = (Math.random() - 0.5) * 0.5;
            const spreadDir = sprayDir.clone();
            spreadDir.x += Math.sin(spreadAngle) * 0.3;
            spreadDir.z += Math.cos(spreadAngle) * 0.3;
            spreadDir.y += (Math.random() - 0.5) * 0.2;
            spreadDir.normalize();
            
            const speed = 3 + Math.random() * 2;
            
            this.effects.push({
                mesh: droplet,
                life: 0.15 + Math.random() * 0.1,
                maxLife: 0.4,
                velocity: {
                    x: spreadDir.x * speed,
                    y: spreadDir.y * speed,
                    z: spreadDir.z * speed
                },
                targetPos: targetPos.clone(),
                gravity: 2,
                type: 'spray'
            });
        }
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
    
    killPests(playerPos, playerDir, targetPos) {
        let kills = 0;
        
        this.pests.forEach(pest => {
            if (pest.dead) return;
            
            const dist = playerPos.distanceTo(pest.position);
            if (dist <= 3) {
                const toPest = new THREE.Vector3().subVectors(pest.position, playerPos).normalize();
                const dot = playerDir.dot(toPest);
                
                if (dot > 0.5 || dist < 2) {
                    this.createSprayEffect(pest.position, playerDir, targetPos);
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
            const effectPos = playerPos.clone().add(playerDir.clone().multiplyScalar(0.3));
            this.createSprayEffect(effectPos, playerDir, targetPos);
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
