import {
    PlaneGeometry,
    MeshPhysicalMaterial,
    Mesh,
    Group,
    CanvasTexture,
    Vector3
} from 'three';

export class PanelObject {
    constructor(position, text = 'Sample Text', id = null) {
        this.id = id || Date.now();
        this.text = text;
        this.maxTextLength = 200;

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
        // Create canvas for text rendering with new dimensions
        this.canvas = document.createElement('canvas');
        this.canvas.width = 192;
        this.canvas.height = 128;
        this.ctx = this.canvas.getContext('2d');

        // Create geometry with adjusted size to match canvas aspect ratio
        this.geometry = new PlaneGeometry(0.96, 0.64); // Reduced size: 0.96m x 0.64m panel

        // Create texture
        this.texture = new CanvasTexture(this.canvas);

        // Use MeshPhysicalMaterial for blur effect
        this.material = new MeshPhysicalMaterial({
            map: this.texture,
            transmission: 1,
            roughness: 0.4,
            transparent: true,
            alphaTest: 0.1
        });

        // Create mesh
        this.mesh = new Mesh(this.geometry, this.material);
        this.group.add(this.mesh);

        // Render initial text
        this.updateTexture();
    }

    updateTexture() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const borderRadius = 12;
        const borderWidth = 3;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw rounded rectangle with blur background
        this.drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, borderRadius, 'rgba(0, 0, 0, 0.7)');

        // Draw white border
        this.drawRoundedRectBorder(ctx, borderWidth/2, borderWidth/2,
            canvas.width - borderWidth, canvas.height - borderWidth,
            borderRadius - borderWidth/2, 'rgba(255, 255, 255, 0.8)', borderWidth);

        // Set text properties with Montserrat font
        ctx.fillStyle = 'white';
        ctx.font = '20px Montserrat, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Word wrap text
        const words = this.text.split(' ');
        const lines = [];
        let currentLine = '';
        const maxWidth = canvas.width - 40; // padding

        for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);

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

        // Draw text lines
        const lineHeight = 24;
        const startY = (canvas.height - (lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
        });

        // Update texture
        this.texture.needsUpdate = true;
    }

    // Helper function to draw rounded rectangle
    drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
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

        ctx.fillStyle = fillStyle;
        ctx.fill();
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
        if (this.material) this.material.dispose();
        if (this.texture) this.texture.dispose();
    }

    // Get data for saving
    toJSON() {
        return {
            id: this.id,
            text: this.text,
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
        const panel = new PanelObject(position, data.text, data.id);
        panel.group.userData.createdAt = data.createdAt;
        return panel;
    }
}