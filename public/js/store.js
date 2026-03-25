export class Store {
    constructor(scene) {
        this.scene = scene;
        this.width = 60;
        this.depth = 40;
        this.wallHeight = 5;
        this.walls = [];
        this.shelves = [];
        this.floorTiles = [];
        this.zones = [];
        
        this.createStore();
    }
    
    createStore() {
        this.createFloor();
        this.createWalls();
        this.createAisles();
        this.createShelves();
        this.createCheckout();
        this.createEntrance();
        this.createZones();
    }
    
    createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(this.width, this.depth);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        for (let x = -this.width/2 + 5; x < this.width/2; x += 5) {
            for (let z = -this.depth/2 + 5; z < this.depth/2; z += 5) {
                const tileGeom = new THREE.PlaneGeometry(4.8, 4.8);
                const tileMat = new THREE.MeshStandardMaterial({
                    color: (Math.random() > 0.5) ? 0x707070 : 0x606060,
                    roughness: 0.9
                });
                const tile = new THREE.Mesh(tileGeom, tileMat);
                tile.rotation.x = -Math.PI / 2;
                tile.position.set(x, 0.01, z);
                tile.receiveShadow = true;
                this.scene.add(tile);
            }
        }
    }
    
    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.5
        });
        
        const wallThickness = 0.3;
        
        const wallPositions = [
            { pos: [0, this.wallHeight/2, -this.depth/2 + wallThickness/2], rot: [0, 0, 0], size: [this.width, this.wallHeight, wallThickness] },
            { pos: [0, this.wallHeight/2, this.depth/2 - wallThickness/2], rot: [0, 0, 0], size: [this.width, this.wallHeight, wallThickness] },
            { pos: [-this.width/2 + wallThickness/2, this.wallHeight/2, 0], rot: [0, Math.PI/2, 0], size: [this.depth, this.wallHeight, wallThickness] },
            { pos: [this.width/2 - wallThickness/2, this.wallHeight/2, 0], rot: [0, Math.PI/2, 0], size: [this.depth, this.wallHeight, wallThickness] }
        ];
        
        wallPositions.forEach(wall => {
            const geometry = new THREE.BoxGeometry(...wall.size);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(...wall.pos);
            mesh.rotation.set(...wall.rot);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            
            this.walls.push({
                mesh,
                min: new THREE.Vector3(
                    wall.pos[0] - wall.size[0]/2,
                    0,
                    wall.pos[2] - wall.size[2]/2
                ),
                max: new THREE.Vector3(
                    wall.pos[0] + wall.size[0]/2,
                    wall.size[1],
                    wall.pos[2] + wall.size[2]/2
                )
            });
        });
    }
    
    createAisles() {
        const aisleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.7
        });
        
        for (let i = 0; i < 5; i++) {
            const x = -20 + i * 10;
            
            const aisleGeom = new THREE.PlaneGeometry(2, this.depth - 10);
            const aisle = new THREE.Mesh(aisleGeom, aisleMaterial);
            aisle.rotation.x = -Math.PI / 2;
            aisle.position.set(x, 0.02, 0);
            aisle.receiveShadow = true;
            this.scene.add(aisle);
        }
    }
    
    createShelves() {
        const shelfColors = [0x3a86ff, 0x8338ec, 0xff006e, 0xfb5607, 0xffbe0b, 0x06d6a0];
        
        for (let i = 0; i < 5; i++) {
            for (let side = -1; side <= 1; side += 2) {
                for (let row = 0; row < 3; row++) {
                    const x = -20 + i * 10 + side * 1.5;
                    const z = -12 + row * 12;
                    
                    this.createShelfUnit(x, z, shelfColors[(i + row) % shelfColors.length]);
                }
            }
        }
    }
    
    createShelfUnit(x, z, color) {
        const shelfGroup = new THREE.Group();
        
        const frameMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.3
        });
        
        const shelfMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.4
        });
        
        const backMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.8
        });
        
        const width = 3;
        const height = 2.5;
        const depth = 1;
        
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, 0.1),
            backMaterial
        );
        back.position.set(0, height/2, -depth/2 + 0.05);
        back.castShadow = true;
        shelfGroup.add(back);
        
        const legs = [
            [-width/2 + 0.1, 0, -depth/2 + 0.1],
            [width/2 - 0.1, 0, -depth/2 + 0.1],
            [-width/2 + 0.1, 0, depth/2 - 0.1],
            [width/2 - 0.1, 0, depth/2 - 0.1]
        ];
        
        legs.forEach(pos => {
            const leg = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, height, 0.1),
                frameMaterial
            );
            leg.position.set(...pos);
            leg.castShadow = true;
            shelfGroup.add(leg);
        });
        
        const productsByLevel = [];
        
        for (let level = 0; level < 4; level++) {
            const shelfY = 0.5 + level * 0.6;
            
            const shelf = new THREE.Mesh(
                new THREE.BoxGeometry(width - 0.2, 0.05, depth - 0.2),
                shelfMaterial
            );
            shelf.position.set(0, shelfY, 0);
            shelf.castShadow = true;
            shelf.receiveShadow = true;
            shelfGroup.add(shelf);
            
            const levelProducts = [];
            for (let p = 0; p < 5; p++) {
                const productGeom = new THREE.BoxGeometry(0.4, 0.4, 0.3);
                const productMat = new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5)
                });
                const product = new THREE.Mesh(productGeom, productMat);
                product.position.set(
                    -width/2 + 0.4 + p * 0.55,
                    shelfY + 0.25,
                    0.15
                );
                product.castShadow = true;
                shelfGroup.add(product);
                levelProducts.push(product);
            }
            productsByLevel.push(levelProducts);
        }
        
        shelfGroup.position.set(x, 0, z);
        this.scene.add(shelfGroup);
        
        const collisionBox = {
            min: new THREE.Vector3(x - 1.6, 0, z - 0.6),
            max: new THREE.Vector3(x + 1.6, height, z + 0.6)
        };
        
        const initialStock = 50 + Math.floor(Math.random() * 51);
        const isStocked = initialStock > 10;
        
        this.shelves.push({
            group: shelfGroup,
            collision: collisionBox,
            position: new THREE.Vector3(x, 0, z),
            stocked: isStocked,
            stockLevel: initialStock,
            productsByLevel: productsByLevel
        });
        
        this.updateShelfVisibility(this.shelves[this.shelves.length - 1]);
    }
    
    updateShelfVisibility(shelf) {
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
    
    createCheckout() {
        const checkoutMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2d2d2d,
            roughness: 0.3
        });
        
        const counterGeom = new THREE.BoxGeometry(8, 1, 2);
        const counter = new THREE.Mesh(counterGeom, checkoutMaterial);
        counter.position.set(0, 0.5, this.depth/2 - 4);
        counter.castShadow = true;
        counter.receiveShadow = true;
        this.scene.add(counter);
        
        const registerGeom = new THREE.BoxGeometry(1.5, 0.8, 1);
        const registerMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.5
        });
        
        for (let i = -2; i <= 2; i += 2) {
            const register = new THREE.Mesh(registerGeom, registerMat);
            register.position.set(i, 1.3, this.depth/2 - 4);
            register.castShadow = true;
            this.scene.add(register);
        }
        
        this.walls.push({
            mesh: counter,
            min: new THREE.Vector3(-4, 0, this.depth/2 - 5),
            max: new THREE.Vector3(4, 1.5, this.depth/2 - 3)
        });
    }
    
    createEntrance() {
        const entranceLight = new THREE.PointLight(0xffffff, 0.5, 15);
        entranceLight.position.set(0, 3, this.depth/2 - 1);
        this.scene.add(entranceLight);
        
        const doorFrame = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        doorFrame.position.set(0, 1.5, this.depth/2 + 0.1);
        this.scene.add(doorFrame);
    }
    
    createZones() {
        this.zones = [
            { name: 'produce', x: -25, z: 0, radius: 8, type: 'hot', color: 0x00ff00 },
            { name: 'dairy', x: -15, z: 0, radius: 8, type: 'normal', color: 0x00ff00 },
            { name: 'meat', x: -5, z: 0, radius: 8, type: 'hot', color: 0xff0000 },
            { name: 'frozen', x: 5, z: 0, radius: 8, type: 'normal', color: 0x00ff00 },
            { name: 'snacks', x: 15, z: 0, radius: 8, type: 'normal', color: 0x00ff00 },
            { name: 'drinks', x: 25, z: 0, radius: 8, type: 'hot', color: 0xff0000 },
            { name: 'checkout', x: 0, z: this.depth/2 - 5, radius: 6, type: 'safe', color: 0x0000ff }
        ];
    }
    
    checkCollision(position, radius = 0.5) {
        const px = position.x || position.x === 0 ? position.x : 0;
        const pz = position.z || position.z === 0 ? position.z : 0;
        
        const halfWidth = this.width / 2;
        const halfDepth = this.depth / 2;
        
        if (px - radius < -halfWidth || px + radius > halfWidth) return true;
        if (pz - radius < -halfDepth || pz + radius > halfDepth) return true;
        
        for (const shelf of this.shelves) {
            const sx = shelf.position.x;
            const sz = shelf.position.z;
            const shelfHalfX = 1.5;
            const shelfHalfZ = 0.5;
            
            if (Math.abs(px - sx) < shelfHalfX + radius && Math.abs(pz - sz) < shelfHalfZ + radius) {
                return true;
            }
        }
        
        return false;
    }
    
    boxIntersect(a, b) {
        return (
            a.min.x <= b.max.x && a.max.x >= b.min.x &&
            a.min.y <= b.max.y && a.max.y >= b.min.y &&
            a.min.z <= b.max.z && a.max.z >= b.min.z
        );
    }
    
    getRandomPosition() {
        let x, z;
        let attempts = 0;
        
        do {
            x = (Math.random() - 0.5) * (this.width - 10);
            z = (Math.random() - 0.5) * (this.depth - 10);
            attempts++;
        } while (this.checkCollision({ x, z }) && attempts < 50);
        
        return new THREE.Vector3(x, 0, z);
    }
    
    getRandomHotZonePosition() {
        const hotZones = this.zones.filter(z => z.type === 'hot');
        if (hotZones.length === 0) return this.getRandomPosition();
        
        const zone = hotZones[Math.floor(Math.random() * hotZones.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * zone.radius;
        
        return new THREE.Vector3(
            zone.x + Math.cos(angle) * distance,
            0,
            zone.z + Math.sin(angle) * distance
        );
    }
    
    getZoneAt(position) {
        for (const zone of this.zones) {
            const dx = position.x - zone.x;
            const dz = position.z - zone.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist <= zone.radius) {
                return zone;
            }
        }
        return null;
    }
    
    getStoreBounds() {
        return {
            minX: -this.width/2 + 1,
            maxX: this.width/2 - 1,
            minZ: -this.depth/2 + 1,
            maxZ: this.depth/2 - 1
        };
    }
    
    reduceStock(zone) {
        const affectedShelves = this.shelves.filter(shelf => {
            const dx = shelf.position.x - zone.x;
            const dz = shelf.position.z - zone.z;
            return Math.sqrt(dx * dx + dz * dz) < zone.radius;
        });
        
        affectedShelves.forEach(shelf => {
            shelf.stockLevel = Math.max(0, shelf.stockLevel - 20);
            if (shelf.stockLevel <= 0) {
                shelf.stocked = false;
            }
        });
    }
    
    restockShelf(shelfIndex) {
        if (shelfIndex >= 0 && shelfIndex < this.shelves.length) {
            this.shelves[shelfIndex].stockLevel = 100;
            this.shelves[shelfIndex].stocked = true;
        }
    }
    
    getShelfStockLevel(x, z) {
        let nearestShelf = null;
        let nearestDist = Infinity;
        
        this.shelves.forEach((shelf, index) => {
            const dx = shelf.position.x - x;
            const dz = shelf.position.z - z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < nearestDist && dist < 5) {
                nearestDist = dist;
                nearestShelf = { shelf, index };
            }
        });
        
        return nearestShelf;
    }
}
