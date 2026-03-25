import { Store } from './store.js';
import { Player } from './player.js';
import { TaskManager } from './tasks.js';
import { EnemyManager } from './enemies.js';
import { Minimap } from './minimap.js';
import { AudioManager } from './audio.js';
import { UI } from './ui.js';

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.score = 0;
        this.combo = 1;
        this.comboTimer = 0;
        this.gameTime = 600;
        this.isGameOver = false;
        this.gameStarted = false;
        
        this.store = null;
        this.player = null;
        this.taskManager = null;
        this.enemyManager = null;
        this.minimap = null;
        this.audio = null;
        this.ui = null;
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        this.prevTime = performance.now();
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLighting();
        this.setupControls();
        this.setupModules();
        this.setupEventListeners();
        this.setupAudio();
        
        this.animate();
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 0, 100);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.7, 15);
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
        
        const interiorLight1 = new THREE.PointLight(0xffffcc, 0.5, 30);
        interiorLight1.position.set(0, 4, 0);
        this.scene.add(interiorLight1);
    }
    
    setupControls() {
        this.blocker = document.getElementById('blocker');
        this.instructions = document.getElementById('instructions');
        this.crosshair = document.getElementById('crosshair');
        
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.usePointerLock = true;
        this.mouseCentered = false;
        
        console.log('Setting up controls...');
        
        this.instructions.addEventListener('click', () => {
            console.log('Play button clicked');
            this.blocker.style.display = 'none';
            this.startGame();
        });
        
        document.addEventListener('pointerlockchange', () => {
            console.log('Pointer lock changed:', document.pointerLockElement ? 'locked' : 'unlocked');
            if (document.pointerLockElement === document.body) {
                this.usePointerLock = true;
                this.isRunning = true;
                console.log('Game running with pointer lock');
            }
        });
        
        document.addEventListener('mousemove', (event) => {
            if (!this.isRunning || !this.player) return;
            
            if (this.usePointerLock && event.movementX !== undefined) {
                this.player.rotateCamera(event.movementX, event.movementY);
            } else if (!this.usePointerLock) {
                if (!this.mouseCentered) {
                    this.lastMouseX = event.screenX;
                    this.lastMouseY = event.screenY;
                    this.mouseCentered = true;
                    return;
                }
                
                const movementX = (event.screenX - this.lastMouseX);
                const movementY = (event.screenY - this.lastMouseY);
                
                this.player.rotateCamera(movementX, movementY);
                
                this.lastMouseX = event.screenX;
                this.lastMouseY = event.screenY;
            }
        });
        
        document.addEventListener('click', () => {
            console.log('Click event, isRunning:', this.isRunning, 'isGameOver:', this.isGameOver);
            if (this.isRunning && !this.isGameOver) {
                console.log('Using tool...');
                this.useCurrentTool();
            }
        });
    }
    
    startGame() {
        console.log('Starting game...');
        this.gameStarted = true;
        
        const lockResult = document.body.requestPointerLock();
        console.log('Pointer lock request result:', lockResult);
        
        if (!lockResult) {
            console.log('Pointer lock not granted, using fallback controls');
            this.usePointerLock = false;
            this.lastMouseX = window.screenX + window.innerWidth / 2;
            this.lastMouseY = window.screenY + window.innerHeight / 2;
        }
        
        this.isRunning = true;
        console.log('isRunning set to true');
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        window.addEventListener('resize', () => this.onWindowResize());
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restart();
        });
    }
    
    setupModules() {
        this.store = new Store(this.scene);
        this.player = new Player(this.camera, this.store);
        this.taskManager = new TaskManager(this.scene, this.store, this);
        this.enemyManager = new EnemyManager(this.scene, this.store, this);
        this.minimap = new Minimap(document.getElementById('minimapCanvas'), this.store, this.player);
        this.ui = new UI(this);
    }
    
    setupAudio() {
        this.audio = new AudioManager();
    }
    
    onKeyDown(event) {
        if (!this.isRunning) {
            console.log('Key pressed but game not running, isRunning:', this.isRunning);
            return;
        }
        
        console.log('Key down:', event.code);
        
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true;
                break;
            case 'Space':
                this.player.jump();
                break;
            case 'Digit1':
                this.player.selectWeapon(0);
                this.ui.updateWeaponUI('MOP', '🧹', 'Spills', 0);
                this.audio.playSound('equip');
                break;
            case 'Digit2':
                this.player.selectWeapon(1);
                this.ui.updateWeaponUI('BROOM', '🧹', 'Glass', 1);
                this.audio.playSound('equip');
                break;
            case 'Digit3':
                this.player.selectWeapon(2);
                this.ui.updateWeaponUI('SPRAY', '💀', 'Pests', 2);
                this.audio.playSound('equip');
                break;
            case 'KeyE':
                this.tryRestock();
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false;
                break;
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    useCurrentTool() {
        const tool = this.player.currentWeapon;
        console.log('useCurrentTool called, tool:', tool);
        
        this.triggerClickEffect();
        
        if (tool === 0) {
            console.log('Using MOP to clean spills');
            this.taskManager.cleanSpills(this.player.getPosition(), this.player.getDirection());
        } else if (tool === 1) {
            console.log('Using BROOM to clean glass');
            this.taskManager.cleanGlass(this.player.getPosition(), this.player.getDirection());
        } else if (tool === 2) {
            console.log('Using SPRAY to kill pests');
            this.enemyManager.killPests(this.player.getPosition(), this.player.getDirection());
        }
    }
    
    triggerClickEffect() {
        const effect = document.getElementById('clickEffect');
        effect.classList.remove('active');
        void effect.offsetWidth;
        effect.classList.add('active');
    }
    
    tryRestock() {
        console.log('tryRestock called');
        this.taskManager.restockShelves(this.player.getPosition(), this.player.getDirection());
    }
    
    addScore(points) {
        this.score += points * this.combo;
        this.combo = Math.min(this.combo + 1, 10);
        this.comboTimer = 3;
        this.ui.updateScore(this.score);
        this.ui.showCombo(this.combo);
        this.audio.playSound('score');
    }
    
    resetCombo() {
        this.combo = 1;
        this.ui.hideCombo();
    }
    
    updateTimer(delta) {
        if (!this.isRunning || this.isGameOver) return;
        
        this.gameTime -= delta;
        
        if (this.gameTime <= 0) {
            this.endGame('Time is up! A customer got hurt!');
            return;
        }
        
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        this.ui.updateTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        
        const hazardPercent = (this.gameTime / 600) * 100;
        this.ui.updateHazardBar(hazardPercent);
        
        if (this.gameTime <= 60) {
            this.ui.setTimerWarning(true);
        }
        
        if (this.comboTimer > 0) {
            this.comboTimer -= delta;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
        
        const pendingTasks = this.taskManager.getPendingCount() + this.enemyManager.getPestCount();
        this.ui.updateTasks(pendingTasks);
        
        const taskHazard = Math.min(pendingTasks * 5, 50);
        const totalHazard = Math.max(0, 100 - hazardPercent - taskHazard);
        this.ui.updateHazardBar(100 - totalHazard);
        
        if (pendingTasks > 15 && Math.random() < 0.01) {
            this.endGame('Too many hazards! A customer slipped!');
        }
    }
    
    endGame(reason) {
        this.isGameOver = true;
        this.isRunning = false;
        document.exitPointerLock();
        
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = `Score: ${this.score}`;
        document.getElementById('gameOverReason').textContent = reason;
        
        this.audio.playSound('gameover');
    }
    
    restart() {
        this.score = 0;
        this.combo = 1;
        this.gameTime = 600;
        this.isGameOver = false;
        this.gameStarted = false;
        
        this.taskManager.reset();
        this.enemyManager.reset();
        this.player.reset();
        
        this.ui.updateScore(0);
        this.ui.updateTimer('10:00');
        this.ui.updateTasks(0);
        this.ui.updateHazardBar(100);
        this.ui.setTimerWarning(false);
        this.ui.hideCombo();
        
        document.getElementById('gameOver').classList.add('hidden');
        
        this.blocker.style.display = 'flex';
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = performance.now();
        const delta = Math.min((time - this.prevTime) / 1000, 0.1);
        this.prevTime = time;
        
        if (this.isRunning && !this.isGameOver) {
            if (this.frameCount === undefined) this.frameCount = 0;
            this.frameCount++;
            
            if (this.frameCount % 60 === 0) {
                console.log('Game running', { 
                    isRunning: this.isRunning, 
                    isGameOver: this.isGameOver,
                    moveForward: this.moveForward,
                    moveBackward: this.moveBackward,
                    playerPos: this.player ? this.player.position.clone() : 'no player'
                });
            }
            
            this.player.update(delta, {
                forward: this.moveForward,
                backward: this.moveBackward,
                left: this.moveLeft,
                right: this.moveRight
            });
            
            this.taskManager.update(delta);
            this.enemyManager.update(delta);
            this.minimap.update();
            
            this.ui.updateCompass(this.player.euler.y);
            
            this.updateTimer(delta);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

const game = new Game();
