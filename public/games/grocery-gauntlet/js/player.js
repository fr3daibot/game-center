export class Player {
    constructor(camera, scene, store) {
        this.camera = camera;
        this.scene = scene;
        this.store = store;
        
        this.position = new THREE.Vector3(0, 1.7, 15);
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        this.euler = new THREE.Euler(0, Math.PI, 0, 'YXZ');
        
        this.moveSpeed = 8;
        this.sprintSpeed = 14;
        this.jumpForce = 8;
        this.gravity = 20;
        this.friction = 10;
        
        this.isGrounded = true;
        this.canJump = true;
        
        this.currentWeapon = 0;
        this.weapons = ['MOP', 'BROOM', 'SPRAY'];
        this.interactionRange = 3;
        
        this.camera.position.copy(this.position);
        
        this.mouseSensitivity = 0.002;
        
        this.minPitch = -Math.PI / 2 + 0.1;
        this.maxPitch = Math.PI / 2 - 0.1;
        
        this.debug = false;
        
        this.isMoving = false;
        this.footstepTimer = 0;
        this.footstepInterval = 0.35;
        
        this.raycaster = new THREE.Raycaster();
        
        this.viewmodelGroup = null;
        this.weaponMeshes = {};
        this.sprayStream = null;
        this.viewmodelAnimState = 'idle';
        this.viewmodelAnimTime = 0;
        this.viewmodelBobTime = 0;
        this.viewmodelBobY = 0;
        this.viewmodelSwayZ = 0;
        
        this.createViewmodel();
    }
    
    createViewmodel() {
        this.viewmodelGroup = new THREE.Group();
        this.camera.add(this.viewmodelGroup);
        this.scene.add(this.camera);
        
        this.viewmodelGroup.position.set(0.25, -0.2, -0.35);
        this.viewmodelGroup.rotation.set(0.3, 0, -0.3);
        this.viewmodelGroup.scale.setScalar(0.06);
        
        this.createMopViewmodel();
        this.createBroomViewmodel();
        this.createSprayViewmodel();
        
        this.setWeapon(0);
    }
    
    createMopViewmodel() {
        const group = new THREE.Group();
        
        const handleGeom = new THREE.CylinderGeometry(0.04, 0.04, 3, 8);
        const handleMat = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            metalness: 0.3,
            roughness: 0.6
        });
        const handle = new THREE.Mesh(handleGeom, handleMat);
        handle.position.y = 1.5;
        group.add(handle);
        
        const connectorGeom = new THREE.CylinderGeometry(0.06, 0.04, 0.3, 8);
        const connectorMat = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            metalness: 0.8,
            roughness: 0.3
        });
        const connector = new THREE.Mesh(connectorGeom, connectorMat);
        connector.position.y = 0;
        group.add(connector);
        
        const bandGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.15, 8);
        const bandMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.5
        });
        const band = new THREE.Mesh(bandGeom, bandMat);
        band.position.y = -0.1;
        group.add(band);
        
        for (let i = 0; i < 25; i++) {
            const strandGeom = new THREE.CylinderGeometry(0.015, 0.02, 1.2, 4);
            const strandMat = new THREE.MeshStandardMaterial({ 
                color: 0xcccccc,
                roughness: 0.9
            });
            const strand = new THREE.Mesh(strandGeom, strandMat);
            const angle = (i / 25) * Math.PI * 2;
            const radius = 0.25 + Math.random() * 0.15;
            strand.position.set(
                Math.cos(angle) * radius,
                -0.7,
                Math.sin(angle) * radius
            );
            strand.rotation.x = (Math.random() - 0.5) * 0.3;
            strand.rotation.z = (Math.random() - 0.5) * 0.3;
            group.add(strand);
        }
        
        group.visible = false;
        this.viewmodelGroup.add(group);
        this.weaponMeshes.mop = group;
    }
    
    createBroomViewmodel() {
        const group = new THREE.Group();
        
        const handleGeom = new THREE.CylinderGeometry(0.04, 0.04, 3, 8);
        const handleMat = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            metalness: 0.3,
            roughness: 0.6
        });
        const handle = new THREE.Mesh(handleGeom, handleMat);
        handle.position.y = 1.5;
        group.add(handle);
        
        const headShape = new THREE.Shape();
        headShape.moveTo(-0.4, 0);
        headShape.lineTo(0.4, 0);
        headShape.lineTo(0.25, -0.3);
        headShape.lineTo(-0.25, -0.3);
        headShape.closePath();
        
        const headGeom = new THREE.ExtrudeGeometry(headShape, { depth: 0.15, bevelEnabled: false });
        const headMat = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.8
        });
        const head = new THREE.Mesh(headGeom, headMat);
        head.rotation.x = Math.PI / 2;
        head.position.y = 0;
        head.position.z = -0.075;
        group.add(head);
        
        const bandGeom = new THREE.BoxGeometry(0.5, 0.08, 0.18);
        const bandMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.5
        });
        const band = new THREE.Mesh(bandGeom, bandMat);
        band.position.y = -0.04;
        group.add(band);
        
        for (let i = 0; i < 20; i++) {
            const bristleGeom = new THREE.CylinderGeometry(0.012, 0.008, 0.8, 4);
            const bristleMat = new THREE.MeshStandardMaterial({ 
                color: new THREE.Color().setHSL(0.1, 0.6, 0.4 + Math.random() * 0.2),
                roughness: 0.9
            });
            const bristle = new THREE.Mesh(bristleGeom, bristleMat);
            const x = (Math.random() - 0.5) * 0.5;
            bristle.position.set(x, -0.45, (Math.random() - 0.5) * 0.1);
            bristle.rotation.x = (Math.random() - 0.5) * 0.2;
            bristle.rotation.z = x * 0.3;
            group.add(bristle);
        }
        
        group.visible = false;
        this.viewmodelGroup.add(group);
        this.weaponMeshes.broom = group;
    }
    
    createSprayViewmodel() {
        const group = new THREE.Group();
        
        const bodyGeom = new THREE.CylinderGeometry(0.35, 0.35, 2, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xcc0000,
            metalness: 0.4,
            roughness: 0.4
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0;
        group.add(body);
        
        const topGeom = new THREE.CylinderGeometry(0.2, 0.28, 0.4, 12);
        const topMat = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            metalness: 0.6,
            roughness: 0.3
        });
        const top = new THREE.Mesh(topGeom, topMat);
        top.position.y = 1.3;
        group.add(top);
        
        const nozzleGeom = new THREE.CylinderGeometry(0.05, 0.08, 0.2, 8);
        const nozzleMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.5
        });
        const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
        nozzle.position.set(0.3, 0.5, 0);
        nozzle.rotation.z = Math.PI / 4;
        group.add(nozzle);
        
        // Create spray cloud at nozzle tip
        const cloudGeom = new THREE.SphereGeometry(0.3, 12, 12);
        const cloudMat = new THREE.MeshBasicMaterial({ 
            color: 0xff8800,
            transparent: true,
            opacity: 0.95
        });
        const stream = new THREE.Mesh(cloudGeom, cloudMat);
        // Position at spray nozzle tip - more visible position
        stream.position.set(0.4, 0.6, 0);
        stream.name = 'sprayStream';
        stream.visible = false;
        group.add(stream);
        this.sprayStream = stream;
        
        const labelGeom = new THREE.CylinderGeometry(0.37, 0.37, 1.2, 16, 1, true, 0, Math.PI);
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(0, 0, 128, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('KILL', 64, 30);
        ctx.fillText('PESTS', 64, 50);
        const labelTexture = new THREE.CanvasTexture(canvas);
        const labelMat = new THREE.MeshBasicMaterial({ 
            map: labelTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const label = new THREE.Mesh(labelGeom, labelMat);
        label.position.y = 0;
        group.add(label);
        
        group.visible = false;
        this.viewmodelGroup.add(group);
        this.weaponMeshes.spray = group;
    }
    
    setWeapon(index) {
        const weaponNames = ['mop', 'broom', 'spray'];
        const weaponName = weaponNames[index];
        
        Object.keys(this.weaponMeshes).forEach(name => {
            this.weaponMeshes[name].visible = false;
        });
        
        if (this.weaponMeshes[weaponName]) {
            this.weaponMeshes[weaponName].visible = true;
        }
        
        this.currentWeapon = index;
        this.viewmodelAnimState = 'switch';
        this.viewmodelAnimTime = 0;
    }
    
    setSprayStreamVisible(visible) {
        if (this.sprayStream) {
            this.sprayStream.visible = visible;
        }
    }
    
    triggerSwing() {
        if (this.viewmodelAnimState === 'idle' || this.viewmodelAnimState === 'switch') {
            this.viewmodelAnimState = 'swing';
            this.viewmodelAnimTime = 0;
        }
    }
    
    triggerSpray() {
        if (this.viewmodelAnimState === 'idle' || this.viewmodelAnimState === 'switch') {
            this.viewmodelAnimState = 'spray';
            this.viewmodelAnimTime = 0;
        }
    }
    
    getSprayTarget(maxDistance = 0.3) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            return intersects[0].point.clone();
        }
        
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        return this.camera.position.clone().add(forward.multiplyScalar(maxDistance));
    }
    
    update(delta, input) {
        const wasMoving = this.isMoving;
        this.updateMovement(delta, input);
        this.isMoving = input.forward || input.backward || input.left || input.right;
        
        if (this.isMoving && this.isGrounded) {
            const speed = input.sprinting ? this.sprintSpeed : this.moveSpeed;
            this.footstepInterval = input.sprinting ? 0.25 : 0.35;
            this.footstepTimer += delta;
            
            if (this.footstepTimer >= this.footstepInterval) {
                this.footstepTimer = 0;
            }
        } else {
            this.footstepTimer = 0;
        }
        
        this.updateViewmodel(delta, this.isMoving && this.isGrounded, input.sprinting);
        this.updateCamera();
    }
    
    updateViewmodel(delta, isMoving, isSprinting) {
        this.viewmodelBobTime += delta;
        
        let bobY = 0;
        let bobX = 0;
        let swayZ = 0;
        
        if (isMoving && this.isGrounded) {
            const bobSpeed = isSprinting ? 12 : 8;
            const bobAmp = isSprinting ? 0.015 : 0.008;
            const swayAmp = isSprinting ? 0.015 : 0.008;
            
            bobY = Math.sin(this.viewmodelBobTime * bobSpeed) * bobAmp;
            bobX = Math.sin(this.viewmodelBobTime * bobSpeed * 0.5) * (bobAmp * 0.5);
            swayZ = Math.sin(this.viewmodelBobTime * bobSpeed * 0.3) * swayAmp;
        } else {
            bobY = Math.sin(this.viewmodelBobTime * 1.5) * 0.002;
            bobX = Math.sin(this.viewmodelBobTime * 0.8) * 0.001;
            swayZ *= 0.9;
        }
        
        this.viewmodelAnimTime += delta;
        
        let baseRotX = 0.3;
        let baseRotZ = -0.3;
        let baseRotY = -24.0;
        
        switch (this.viewmodelAnimState) {
            case 'switch':
                if (this.viewmodelAnimTime >= 0.2) {
                    this.viewmodelAnimState = 'idle';
                } else {
                    const t = this.viewmodelAnimTime / 0.2;
                    baseRotZ = -0.3 + Math.sin(t * Math.PI) * 0.1;
                }
                break;
                
            case 'swing':
                if (this.viewmodelAnimTime >= 0.4) {
                    this.viewmodelAnimState = 'idle';
                } else {
                    const t = this.viewmodelAnimTime / 0.4;
                    if (t < 0.375) {
                        const swingT = t / 0.375;
                        baseRotZ = -0.3 + 0.5 * this.easeOut(swingT);
                        baseRotX = 0.3 + 0.2 * this.easeOut(swingT);
                    } else {
                        const returnT = (t - 0.375) / 0.625;
                        baseRotZ = 0.2 - 0.5 * this.easeOut(returnT);
                        baseRotX = 0.5 - 0.2 * this.easeOut(returnT);
                    }
                }
                break;
                
            case 'spray':
                if (this.viewmodelAnimTime >= 0.3) {
                    this.viewmodelAnimState = 'idle';
                    this.setSprayStreamVisible(false);
                } else {
                    const decay = 1 - (this.viewmodelAnimTime / 0.3);
                    baseRotZ = -0.3 + Math.sin(this.viewmodelAnimTime * 80) * 0.1 * decay;
                    baseRotX = 0.3 + Math.sin(this.viewmodelAnimTime * 40) * 0.05 * decay;
                    this.setSprayStreamVisible(true);
                }
                break;
                
            case 'idle':
            default:
                break;
        }
        
        this.viewmodelGroup.rotation.x = baseRotX + bobX;
        this.viewmodelGroup.rotation.y = baseRotY;
        this.viewmodelGroup.rotation.z = baseRotZ + swayZ;
        this.viewmodelGroup.position.y = -0.2 + bobY;
    }
    
    easeOut(t) {
        return 1 - Math.pow(1 - t, 2);
    }
    
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    
    updateMovement(delta, input) {
        let moveX = 0;
        let moveZ = 0;
        
        if (input.forward) moveZ -= 1;
        if (input.backward) moveZ += 1;
        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;
        
        if (moveX !== 0 || moveZ !== 0) {
            const forward = new THREE.Vector3(0, 0, -1);
            const right = new THREE.Vector3(1, 0, 0);
            forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.euler.y);
            right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.euler.y);
            
            const moveDir = new THREE.Vector3();
            moveDir.addScaledVector(forward, -moveZ);
            moveDir.addScaledVector(right, moveX);
            moveDir.normalize();
            
            const speed = (input.sprinting ? this.sprintSpeed : this.moveSpeed) * delta;
            const newX = this.position.x + moveDir.x * speed;
            const newZ = this.position.z + moveDir.z * speed;
            const playerRadius = 0.5;
            
            if (this.store && !this.store.checkCollision({ x: newX, z: newZ }, playerRadius)) {
                this.position.x = newX;
                this.position.z = newZ;
            } else {
                if (this.store && !this.store.checkCollision({ x: newX, z: this.position.z }, playerRadius)) {
                    this.position.x = newX;
                } else if (this.store && !this.store.checkCollision({ x: this.position.x, z: newZ }, playerRadius)) {
                    this.position.z = newZ;
                }
            }
        }
        
        if (this.store) {
            const bounds = this.store.getStoreBounds();
            this.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.position.x));
            this.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.position.z));
        }
    }
    
    updateCamera() {
        this.camera.position.copy(this.position);
        this.camera.quaternion.setFromEuler(this.euler);
    }
    
    rotateCamera(movementX, movementY) {
        this.euler.y -= movementX * this.mouseSensitivity;
        this.euler.x -= movementY * this.mouseSensitivity;
        
        this.euler.x = Math.max(this.minPitch, Math.min(this.maxPitch, this.euler.x));
        
        this.camera.quaternion.setFromEuler(this.euler);
    }
    
    jump() {
        if (this.isGrounded && this.canJump) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this.canJump = false;
        }
    }
    
    selectWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.setWeapon(index);
        }
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    getDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        return direction;
    }
    
    getForwardDirection() {
        return new THREE.Vector3(
            -Math.sin(this.euler.y),
            0,
            -Math.cos(this.euler.y)
        ).normalize();
    }
    
    reset() {
        this.position.set(0, 1.7, 15);
        this.velocity.set(0, 0, 0);
        this.euler.set(0, Math.PI, 0);
        this.isGrounded = true;
        this.canJump = true;
        this.currentWeapon = 0;
        this.isMoving = false;
        this.footstepTimer = 0;
        this.viewmodelAnimState = 'idle';
        this.viewmodelAnimTime = 0;
        this.setWeapon(0);
        this.camera.position.copy(this.position);
        this.camera.quaternion.setFromEuler(this.euler);
    }
}
