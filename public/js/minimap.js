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
        this.ctx.rotate(yaw);
        
        this.drawStoreOutline();
        this.drawZones();
        this.drawShelves();
        this.drawAisles();
        this.drawCompassDirections();
        
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
            if (zone.type !== 'hot') return;
            
            const pos = this.worldToMinimapLocal(zone.x, zone.z, playerPos.x, playerPos.z);
            const radius = zone.radius * this.scale;
            
            const alpha = Math.sin(this.pulseTime) * 0.1 + 0.2;
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${alpha + 0.3})`;
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
            
            if (!shelf.stocked) {
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(pos.x - width/2, pos.y - depth/2, width, depth);
                
                this.ctx.strokeStyle = '#ff6b6b';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(pos.x - width/2, pos.y - depth/2, width, depth);
                
                this.ctx.fillStyle = '#ff4444';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 8px Courier New';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('!', pos.x, pos.y);
            } else if (shelf.stockLevel < 100) {
                this.ctx.fillStyle = '#555';
                this.ctx.fillRect(pos.x - width/2, pos.y - depth/2, width, depth);
                
                this.ctx.strokeStyle = '#ffd700';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(pos.x - width/2, pos.y - depth/2, width, depth);
                
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = '#666';
                this.ctx.fillRect(pos.x - width/2, pos.y - depth/2, width, depth);
                
                this.ctx.strokeStyle = '#888';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(pos.x - width/2, pos.y - depth/2, width, depth);
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
    
    drawCompassDirections() {
        const dist = 90;
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 18px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('N', 0, -dist);
        
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('S', 0, dist);
        this.ctx.fillText('E', dist, 0);
        this.ctx.fillText('W', -dist, 0);
    }
    
    drawPlayer(centerX, centerY) {
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(-5, 5);
        this.ctx.lineTo(5, 5);
        this.ctx.closePath();
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawLegend() {
        this.ctx.fillStyle = '#888';
        this.ctx.font = '10px Courier New';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(9, this.height - 52, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('Pest Zone', 20, this.height - 49);
        
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(5, this.height - 42, 8, 8);
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('Stocked', 18, this.height - 35);
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(9, this.height - 29, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('Low Stock', 18, this.height - 26);
        
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(5, this.height - 19, 8, 8);
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 8px Courier New';
        this.ctx.fillText('!', 9, this.height - 15);
        this.ctx.fillStyle = '#888';
        this.ctx.font = '10px Courier New';
        this.ctx.fillText('Needs Restock', 18, this.height - 12);
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
