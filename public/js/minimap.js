export class Minimap {
    constructor(canvas, store, player) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.store = store;
        this.player = player;
        
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.storeWidth = 60;
        this.storeDepth = 40;
        
        this.scale = Math.min(
            this.width / this.storeWidth,
            this.height / this.storeDepth
        ) * 0.7;
        
        this.pulseTime = 0;
    }
    
    update() {
        this.pulseTime += 0.05;
        this.render();
    }
    
    render() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        const yaw = this.player.euler.y;
        this.ctx.rotate(-yaw);
        
        this.drawStoreOutline();
        this.drawZones();
        this.drawShelves();
        this.drawAisles();
        
        this.ctx.restore();
        
        this.drawPlayer(centerX, centerY);
        this.drawLegend();
    }
    
    worldToMinimapLocal(x, z, playerX, playerZ) {
        return {
            x: (x - playerX) * this.scale,
            y: (z - playerZ) * this.scale
        };
    }
    
    drawStoreOutline() {
        const playerPos = this.player.getPosition();
        
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        
        const corners = [
            { x: -this.storeWidth/2, z: -this.storeDepth/2 },
            { x: this.storeWidth/2, z: -this.storeDepth/2 },
            { x: this.storeWidth/2, z: this.storeDepth/2 },
            { x: -this.storeWidth/2, z: this.storeDepth/2 },
            { x: -this.storeWidth/2, z: -this.storeDepth/2 }
        ].map(c => this.worldToMinimapLocal(c.x, c.z, playerPos.x, playerPos.z));
        
        this.ctx.beginPath();
        this.ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < corners.length; i++) {
            this.ctx.lineTo(corners[i].x, corners[i].y);
        }
        this.ctx.stroke();
    }
    
    drawZones() {
        const playerPos = this.player.getPosition();
        const zones = this.store.zones;
        
        zones.forEach(zone => {
            const pos = this.worldToMinimapLocal(zone.x, zone.z, playerPos.x, playerPos.z);
            const radius = zone.radius * this.scale;
            
            let alpha = 0.2;
            
            if (zone.type === 'hot') {
                alpha = Math.sin(this.pulseTime) * 0.1 + 0.2;
                this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            } else if (zone.type === 'safe') {
                this.ctx.fillStyle = 'rgba(0, 100, 255, 0.2)';
            } else {
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
            }
            
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = zone.type === 'hot' ? 
                `rgba(255, 0, 0, ${alpha + 0.3})` : 'rgba(0, 255, 0, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
    }
    
    drawShelves() {
        const playerPos = this.player.getPosition();
        
        this.store.shelves.forEach(shelf => {
            const pos = this.worldToMinimapLocal(shelf.position.x, shelf.position.z, playerPos.x, playerPos.z);
            
            const width = 3.2 * this.scale;
            const depth = 1.2 * this.scale;
            
            this.ctx.fillStyle = shelf.stocked ? '#666' : '#333';
            this.ctx.fillRect(pos.x - width/2, pos.y - depth/2, width, depth);
            
            this.ctx.strokeStyle = '#888';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(pos.x - width/2, pos.y - depth/2, width, depth);
            
            if (!shelf.stocked) {
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawAisles() {
        const playerPos = this.player.getPosition();
        
        this.ctx.fillStyle = '#2a2a4a';
        
        for (let i = 0; i < 5; i++) {
            const x = -20 + i * 10;
            const pos = this.worldToMinimapLocal(x, 0, playerPos.x, playerPos.z);
            
            this.ctx.fillRect(pos.x - this.scale, pos.y - 15 * this.scale, this.scale * 2, this.scale * 30);
        }
    }
    
    drawPlayer(centerX, centerY) {
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.lineTo(-6, 6);
        this.ctx.lineTo(6, 6);
        this.ctx.closePath();
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawLegend() {
        this.ctx.fillStyle = '#888';
        this.ctx.font = '10px Courier New';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(5, this.height - 55, 8, 8);
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('Hot Zone', 18, this.height - 47);
        
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fillRect(5, this.height - 42, 8, 8);
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('Normal Zone', 18, this.height - 34);
        
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(5, this.height - 29, 6, 6);
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('Low Stock', 18, this.height - 22);
    }
    
    getHotZoneAlert() {
        const playerPos = this.player.getPosition();
        const playerZone = this.store.getZoneAt(playerPos);
        
        if (playerZone && playerZone.type === 'hot') {
            return { x: playerZone.x, z: playerZone.z, type: 'hot' };
        }
        
        return null;
    }
}
