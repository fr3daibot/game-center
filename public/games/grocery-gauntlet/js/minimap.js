export class Minimap {
    constructor(canvas, store, player) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.store = store;
        this.player = player;
        
        this.width = canvas.width;
        this.height = canvas.height;
        this.radius = Math.min(this.width, this.height) / 2 - 5;
        
        this.storeWidth = 60;
        this.storeDepth = 40;
        
        this.scale = (this.radius * 2.0) / Math.max(this.storeWidth, this.storeDepth);
        
        this.pulseTime = 0;
    }
    
    update() {
        this.pulseTime += 0.05;
        this.render();
    }
    
    render() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
        this.ctx.clip();
        
        this.ctx.fillStyle = 'rgba(10, 10, 30, 0.75)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.restore();
        this.ctx.save();
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
        this.ctx.clip();
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        const yaw = this.player.euler.y;
        this.ctx.rotate(yaw);
        
        this.drawStoreOutline();
        this.drawShelves();
        this.drawAisles();
        this.drawCompassDirections();
        
        this.ctx.restore();
        
        this.drawPlayer(centerX, centerY);
        
        this.ctx.restore();
        
        this.drawBorder(centerX, centerY);
        this.drawLegend();
    }
    
    drawBorder(centerX, centerY) {
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }
    
    worldToMinimapLocal(x, z, playerX, playerZ) {
        return {
            x: (x - playerX) * this.scale,
            y: (z - playerZ) * this.scale
        };
    }
    
    drawStoreOutline() {
        const playerPos = this.player.getPosition();
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        
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
            
            const alpha = Math.sin(this.pulseTime) * 0.2 + 0.6;
            this.ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
            
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = `rgba(255, 50, 50, ${alpha})`;
            this.ctx.lineWidth = 2;
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
                this.ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
                this.ctx.fillRect(pos.x - width/2, pos.y - depth/2, width, depth);
                
                this.ctx.strokeStyle = '#ff4444';
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
                this.ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
                this.ctx.fillRect(pos.x - width/2, pos.y - depth/2, width, depth);
                
                this.ctx.strokeStyle = '#ffd700';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(pos.x - width/2, pos.y - depth/2, width, depth);
                
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
                this.ctx.fillRect(pos.x - width/2, pos.y - depth/2, width, depth);
                
                this.ctx.strokeStyle = '#aaa';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(pos.x - width/2, pos.y - depth/2, width, depth);
            }
        });
    }
    
    drawAisles() {
        const playerPos = this.player.getPosition();
        
        this.ctx.fillStyle = 'rgba(60, 60, 80, 0.5)';
        
        for (let i = 0; i < 5; i++) {
            const x = -20 + i * 10;
            const pos = this.worldToMinimapLocal(x, 0, playerPos.x, playerPos.z);
            
            this.ctx.fillRect(pos.x - this.scale, pos.y - 15 * this.scale, this.scale * 2, this.scale * 30);
        }
    }
    
    drawCompassDirections() {
        const dist = this.radius * 0.85;
        this.ctx.fillStyle = '#4488ff';
        this.ctx.font = `bold ${Math.max(12, this.radius * 0.15)}px Courier New`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('N', 0, -dist);
        
        this.ctx.fillStyle = '#ccc';
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
        const legendX = this.width / 2 + this.radius + 15;
        const legendY = this.height - 60;
        const lineHeight = 18;
        
        this.ctx.fillStyle = '#888';
        this.ctx.font = '10px Courier New';
        this.ctx.textAlign = 'left';
        
        let y = legendY;
        
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(legendX, y, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('Pest Zone', legendX + 12, y + 4);
        
        y += lineHeight;
        
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(legendX - 4, y - 4, 8, 8);
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('Stocked', legendX + 12, y + 4);
        
        y += lineHeight;
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(legendX, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('Low Stock', legendX + 12, y + 4);
        
        y += lineHeight;
        
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(legendX - 4, y - 4, 8, 8);
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 8px Courier New';
        this.ctx.fillText('!', legendX, y + 4);
        this.ctx.fillStyle = '#888';
        this.ctx.font = '10px Courier New';
        this.ctx.fillText('Needs Restock', legendX + 12, y + 4);
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
