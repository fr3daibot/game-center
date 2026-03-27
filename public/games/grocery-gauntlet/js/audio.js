export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.volume = 0.3;
        
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    createSounds() {
        this.sounds = {
            mop: { frequency: 200, duration: 0.2, type: 'sine', decay: 0.1 },
            sweep: { frequency: 150, duration: 0.15, type: 'triangle', decay: 0.05 },
            spray: { frequency: 800, duration: 0.3, type: 'sawtooth', decay: 0.2 },
            kill: { frequency: 100, duration: 0.3, type: 'square', decay: 0.2 },
            score: { frequency: 600, duration: 0.1, type: 'sine', decay: 0.05 },
            equip: { frequency: 400, duration: 0.1, type: 'triangle', decay: 0.05 },
            gameover: { frequency: 150, duration: 1, type: 'sawtooth', decay: 0.5 },
            restock: { frequency: 500, duration: 0.2, type: 'sine', decay: 0.1 },
            footstep: { frequency: 80, duration: 0.1, type: 'triangle', decay: 0.05 }
        };
    }
    
    playSound(name) {
        if (!this.audioContext || !this.sounds[name]) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const sound = this.sounds[name];
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = sound.type;
        oscillator.frequency.setValueAtTime(sound.frequency, this.audioContext.currentTime);
        
        if (name === 'spray') {
            oscillator.frequency.exponentialRampToValueAtTime(
                sound.frequency * 2,
                this.audioContext.currentTime + sound.duration
            );
        }
        
        gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + sound.duration
        );
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + sound.duration);
        
        if (name === 'kill') {
            this.playExplosion();
        }
    }
    
    playExplosion() {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * 0.2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
    }
    
    playFootstep() {
        if (!this.audioContext) return;
        
        const noise = this.audioContext.createOscillator();
        const noiseGain = this.audioContext.createGain();
        
        noise.type = 'triangle';
        noise.frequency.setValueAtTime(80 + Math.random() * 20, this.audioContext.currentTime);
        
        noiseGain.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 0.1
        );
        
        noise.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        noise.start(this.audioContext.currentTime);
        noise.stop(this.audioContext.currentTime + 0.1);
    }
}
