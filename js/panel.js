import {
    PlaneGeometry,
    MeshPhysicalMaterial,
    MeshBasicMaterial,
    Mesh,
    Group,
    CanvasTexture,
    Vector3
} from 'three';

export class PanelObject {
    constructor(position, text = 'Sample Text', url = '', id = null) {
        this.id = id || Date.now();
        this.text = text;
        this.url = url;
        this.maxTextLength = 200;
        this.maxUrlLength = 500;

        this.group = new Group();
        this.group.userData = {
            type: 'panel',
            id: this.id,
            createdAt: new Date().toISOString()
        };

        this.createPanel();
        this.group.position.copy(position);
    }

    createPanel() {
        const PANEL_WIDTH = 480; // 320
        const PANEL_HEIGHT = 320; // 160
        const RESOLUTION_SCALE = 2;

        const canvasWidth = PANEL_WIDTH * RESOLUTION_SCALE;
        const canvasHeight = PANEL_HEIGHT * RESOLUTION_SCALE;

        // Create canvas for background only (transparent)
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCanvas.width = canvasWidth - (10 * RESOLUTION_SCALE * 2);
        this.backgroundCanvas.height = canvasHeight - (10 * RESOLUTION_SCALE * 2);
        this.backgroundCtx = this.backgroundCanvas.getContext('2d');

        // Create canvas for border (opaque)
        this.borderCanvas = document.createElement('canvas');
        this.borderCanvas.width = canvasWidth;
        this.borderCanvas.height = canvasHeight;
        this.borderCtx = this.borderCanvas.getContext('2d');

        // Create canvas for text (opaque)
        this.textCanvas = document.createElement('canvas');
        this.textCanvas.width = canvasWidth - (10 * RESOLUTION_SCALE * 2);
        this.textCanvas.height = canvasHeight - (10 * RESOLUTION_SCALE * 2);
        this.textCtx = this.textCanvas.getContext('2d');

        // Create geometry
        this.geometry = new PlaneGeometry(PANEL_WIDTH / 1000, PANEL_HEIGHT / 1000);
        this.backgroundGeometry = new PlaneGeometry((PANEL_WIDTH - 6 * RESOLUTION_SCALE) / 1000, (PANEL_HEIGHT - 6 * RESOLUTION_SCALE) / 1000);

        this.panelWidth = PANEL_WIDTH;
        this.panelHeight = PANEL_HEIGHT;
        this.resolutionScale = RESOLUTION_SCALE;

        // Background material (transparent with blur)
        this.backgroundTexture = new CanvasTexture(this.backgroundCanvas);
        this.backgroundMaterial = new MeshPhysicalMaterial({
            map: this.backgroundTexture,
            color: 0x00001E,
            transmission: 0.95,
            roughness: 0.85,
//            thickness: 0.005,
            transparent: true,
            opacity: 0.15,
            alphaTest: 0.0001,
            side: 2, // DoubleSide
            ior: 1.5,
            reflectivity: 0.05
        });

        // Border material (opaque)
        this.borderTexture = new CanvasTexture(this.borderCanvas);
        this.borderMaterial = new MeshBasicMaterial({
            map: this.borderTexture,
            transparent: true,
            side: 2
        });

        // Text material (opaque)
        this.textTexture = new CanvasTexture(this.textCanvas);
        this.textMaterial = new MeshBasicMaterial({
            map: this.textTexture,
            transparent: true,
            side: 2
        });

        // Create meshes
        this.backgroundMesh = new Mesh(this.backgroundGeometry, this.backgroundMaterial);
        this.borderMesh = new Mesh(this.geometry, this.borderMaterial);
        this.textMesh = new Mesh(this.backgroundGeometry, this.textMaterial);

        // Position them slightly apart to avoid z-fighting
        this.backgroundMesh.position.z = 0;
        this.borderMesh.position.z = 0.001;
        this.textMesh.position.z = 0.002;

        // Add all meshes to group
        this.group.add(this.backgroundMesh);
        this.group.add(this.borderMesh);
        this.group.add(this.textMesh);

        this.updateTexture();
    }

    updateTexture() {
        // Use stored values
        const w = this.panelWidth * this.resolutionScale;
        const h = this.panelHeight * this.resolutionScale;
        const scale = this.resolutionScale;

        const borderRadius = 22 * scale;
        const borderWidth = 10 * scale;

        // Clear all canvases
        this.backgroundCtx.clearRect(0, 0, w, h);
        this.borderCtx.clearRect(0, 0, w, h);
        this.textCtx.clearRect(0, 0, w, h);

        // Draw background as simple rectangle (smaller by borderWidth)
        this.backgroundCtx.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);

        // Choose border color based on whether panel has URL
        const borderColor = this.url ? 'rgba(90, 100, 239, 1.0)' : 'rgba(255, 255, 255, 1.0)';

        // Draw border (keep rounded)
        this.drawRoundedRectBorder(this.borderCtx, borderWidth/2, borderWidth/2,
            w - borderWidth, h - borderWidth,
            borderRadius - borderWidth/2, borderColor, borderWidth);

        // Rest of the text drawing code stays the same...
        this.textCtx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        this.textCtx.font = `bold ${56 * scale}px Montserrat, Arial, sans-serif`;
        this.textCtx.textAlign = 'center';
        this.textCtx.textBaseline = 'middle';

        // Word wrap and draw text
        const words = this.text.split(' ');
        const lines = [];
        let currentLine = '';
        const maxWidth = w - (80 * scale);

        for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.textCtx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }

        const lineHeight = 80 * scale;
        let startY = (h - (lines.length - 1) * lineHeight) / 2;

        // If there's a URL, adjust text position to make room for URL indicator
        if (this.url) {
            startY -= 20 * scale; // Move text up slightly
        }

        lines.forEach((line, index) => {
            this.textCtx.fillText(line, w / 2, startY + index * lineHeight);
        });

        // Add URL indicator if URL exists
        if (this.url) {
            this.textCtx.font = `bold ${22 * scale}px Montserrat, Arial, sans-serif`;
            this.textCtx.fillStyle = 'rgba(0, 255, 0, 1.0)';
            this.textCtx.fillText('🔗 Click to open link', w / 2, h - (40 * scale));
        }

        // Update all textures
        this.backgroundTexture.needsUpdate = true;
        this.borderTexture.needsUpdate = true;
        this.textTexture.needsUpdate = true;
    }

    // Helper function to draw rounded rectangle border
    drawRoundedRectBorder(ctx, x, y, width, height, radius, strokeStyle, lineWidth) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    setText(newText) {
        // Limit text length
        this.text = newText.substring(0, this.maxTextLength);
        this.updateTexture();
    }

    getText() {
        return this.text;
    }

    setUrl(newUrl) {
        // Limit URL length and trim whitespace
        this.url = newUrl.trim().substring(0, this.maxUrlLength);
        this.updateTexture();
    }

    getUrl() {
        return this.url;
    }

    hasUrl() {
        return this.url && this.url.length > 0;
    }

    openUrl() {
        if (this.hasUrl()) {
            // Ensure URL has protocol
            let url = this.url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            try {
                window.open(url, '_blank', 'noopener,noreferrer');
                console.log(`Opened URL: ${url}`);
                return true;
            } catch (error) {
                console.error('Failed to open URL:', error);
                return false;
            }
        }
        return false;
    }

    getGroup() {
        return this.group;
    }

    getMesh() {
        return this.mesh;
    }

    // Make panel face the camera
    lookAtCamera(camera) {
        this.group.lookAt(camera.position);
    }

    // Get position
    getPosition() {
        return this.group.position.clone();
    }

    // Set position
    setPosition(position) {
        this.group.position.copy(position);
    }

    // Move by offset
    move(offset) {
        this.group.position.add(offset);
    }

    // Dispose resources
    dispose() {
        if (this.geometry) this.geometry.dispose();
        if (this.backgroundMaterial) this.backgroundMaterial.dispose();
        if (this.borderMaterial) this.borderMaterial.dispose();
        if (this.textMaterial) this.textMaterial.dispose();
        if (this.backgroundTexture) this.backgroundTexture.dispose();
        if (this.borderTexture) this.borderTexture.dispose();
        if (this.textTexture) this.textTexture.dispose();
    }

    // Get data for saving
    toJSON() {
        return {
            id: this.id,
            text: this.text,
            url: this.url,
            position: {
                x: this.group.position.x,
                y: this.group.position.y,
                z: this.group.position.z
            },
            createdAt: this.group.userData.createdAt
        };
    }

    // Create from saved data
    static fromJSON(data) {
        const position = new Vector3(data.position.x, data.position.y, data.position.z);
        const panel = new PanelObject(position, data.text, data.url || '', data.id);
        panel.group.userData.createdAt = data.createdAt;
        return panel;
    }
}