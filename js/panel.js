import {
    PlaneGeometry,
    MeshBasicMaterial,
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
        // Create canvas for text rendering
        this.canvas = document.createElement('canvas');
        this.canvas.width = 192;
        this.canvas.height = 128;
        this.ctx = this.canvas.getContext('2d');

        // Create geometry and material
        this.geometry = new PlaneGeometry(1, 0.5); // 1m x 0.5m panel
        this.texture = new CanvasTexture(this.canvas);
        this.material = new MeshBasicMaterial({
            map: this.texture,
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

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw blur background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

        // Set text properties
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial, sans-serif';
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
        const lineHeight = 30;
        const startY = (canvas.height - (lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
        });

        // Update texture
        this.texture.needsUpdate = true;
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