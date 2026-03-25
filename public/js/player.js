export class Player {
    constructor(camera, store) {
        this.camera = camera;
        this.store = store;
        
        this.position = new THREE.Vector3(0, 1.7, 15);
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        this.euler = new THREE.Euler(0, Math.PI, 0, 'YXZ');
        
        this.moveSpeed = 8;
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
    }
    
    update(delta, input) {
        this.updateMovement(delta, input);
        this.updateCamera();
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
            
            const speed = this.moveSpeed * delta;
            const newX = this.position.x + moveDir.x * speed;
            const newZ = this.position.z + moveDir.z * speed;
            
            if (!this.store.checkCollision({ x: newX, z: newZ }, 0.3)) {
                this.position.x = newX;
                this.position.z = newZ;
            } else {
                if (!this.store.checkCollision({ x: newX, z: this.position.z }, 0.3)) {
                    this.position.x = newX;
                } else if (!this.store.checkCollision({ x: this.position.x, z: newZ }, 0.3)) {
                    this.position.z = newZ;
                }
            }
        }
        
        const bounds = this.store.getStoreBounds();
        this.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.position.x));
        this.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.position.z));
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
            this.currentWeapon = index;
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
        this.camera.position.copy(this.position);
        this.camera.quaternion.setFromEuler(this.euler);
    }
}
