import {
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh,
    CanvasTexture,
    Vector3,
    Raycaster,
    Vector2
} from 'three';

export class TextPanelController {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.panels = [];
        this.selectedPanel = null;
        this.editingPanel = null;
        this.editButtons = null;
        this.enabled = false;

        // Panel movement properties
        this.panelMoveSpeed = 0.05; // 5cm per frame
        this.panelKeys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };

        // Raycasting for panel selection
        this.raycaster = new Raycaster();
        this.mouse = new Vector2();

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', this.onPanelClick.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        if (!this.enabled || !this.editingPanel) return;

        switch(event.code) {
            case 'KeyW':
                this.panelKeys.forward = true;
                event.preventDefault();
                break;
            case 'KeyS':
                this.panelKeys.backward = true;
                event.preventDefault();
                break;
            case 'KeyA':
                this.panelKeys.left = true;
                event.preventDefault();
                break;
            case 'KeyD':
                this.panelKeys.right = true;
                event.preventDefault();
                break;
            case 'KeyR':
                this.panelKeys.up = true;
                event.preventDefault();
                break;
            case 'KeyF':
                this.panelKeys.down = true;
                event.preventDefault();
                break;
            case 'Escape':
                this.cancelPanelEdit();
                event.preventDefault();
                break;
        }
    }

    onKeyUp(event) {
        if (!this.enabled || !this.editingPanel) return;

        switch(event.code) {
            case 'KeyW':
                this.panelKeys.forward = false;
                break;
            case 'KeyS':
                this.panelKeys.backward = false;
                break;
            case 'KeyA':
                this.panelKeys.left = false;
                break;
            case 'KeyD':
                this.panelKeys.right = false;
                break;
            case 'KeyR':
                this.panelKeys.up = false;
                break;
            case 'KeyF':
                this.panelKeys.down = false;
                break;
        }
    }

    onPanelClick(event) {
        if (!this.enabled) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const panelMeshes = this.panels.map(panel => panel.mesh);
        const intersects = this.raycaster.intersectObjects(panelMeshes);

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const clickedPanel = this.panels.find(panel => panel.mesh === clickedMesh);
            
            if (clickedPanel) {
                this.selectPanel(clickedPanel);
            }
        } else {
            // Clicked on empty space, deselect panel
            this.deselectPanel();
        }
    }

    createPanel(position, text = "Sample Text") {
        const panelData = {
            id: Date.now() + Math.random(),
            text: text,
            position: position.clone(),
            mesh: null
        };

        // Create the visual mesh
        this.updatePanelMesh(panelData);

        // Add to scene and panels array
        this.scene.add(panelData.mesh);
        this.panels.push(panelData);

        console.log('Created text panel:', panelData);
        return panelData;
    }

    updatePanelMesh(panelData) {
        // Remove existing mesh if it exists
        if (panelData.mesh) {
            this.scene.remove(panelData.mesh);
            panelData.mesh.geometry.dispose();
            panelData.mesh.material.dispose();
        }

        // Create canvas for text rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 512;
        canvas.height = 256;

        // Clear canvas with transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Create blur background effect
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Add blur effect (simulate glass effect)
        context.fillStyle = 'rgba(255, 255, 255, 0.1)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Set text properties
        context.fillStyle = 'white';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Word wrap function
        const wrapText = (text, maxWidth) => {
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = context.measureText(testLine);
                
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
            return lines;
        };

        // Render text with word wrapping
        const maxWidth = canvas.width - 40;
        const lines = wrapText(panelData.text, maxWidth);
        const lineHeight = 40;
        const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, startY + index * lineHeight);
        });

        // Create texture from canvas
        const texture = new CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Create geometry and material
        const geometry = new PlaneGeometry(2, 1); // 2 units wide, 1 unit tall
        const material = new MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.01
        });

        // Create mesh
        panelData.mesh = new Mesh(geometry, material);
        panelData.mesh.position.copy(panelData.position);
        panelData.mesh.userData = { panelId: panelData.id };

        // Make panel always face camera (billboard effect)
        panelData.mesh.lookAt(this.camera.position);
    }

    selectPanel(panel) {
        // Deselect previous panel
        this.deselectPanel();

        this.selectedPanel = panel;
        this.editingPanel = panel;

        console.log('Selected panel for editing:', panel);

        // Create edit UI
        this.createEditUI(panel);
    }

    deselectPanel() {
        if (this.editingPanel) {
            this.editingPanel = null;
            this.selectedPanel = null;
            this.removeEditUI();
            
            // Reset movement keys
            Object.keys(this.panelKeys).forEach(key => {
                this.panelKeys[key] = false;
            });
        }
    }

    createEditUI(panel) {
        this.removeEditUI(); // Remove any existing UI

        // Create UI container
        const uiContainer = document.createElement('div');
        uiContainer.id = 'panelEditUI';
        uiContainer.style.cssText = `
            position: absolute;
            top: 50px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            z-index: 200;
            min-width: 300px;
        `;

        // Create text input
        const textInput = document.createElement('textarea');
        textInput.value = panel.text;
        textInput.maxLength = 200;
        textInput.style.cssText = `
            width: 100%;
            height: 80px;
            margin-bottom: 10px;
            padding: 8px;
            border: 1px solid #555;
            background: #222;
            color: white;
            border-radius: 4px;
            resize: vertical;
            font-family: Arial, sans-serif;
        `;

        // Character counter
        const charCounter = document.createElement('div');
        charCounter.style.cssText = `
            font-size: 12px;
            color: #888;
            margin-bottom: 10px;
        `;
        const updateCounter = () => {
            charCounter.textContent = `${textInput.value.length}/200 characters`;
        };
        updateCounter();
        textInput.addEventListener('input', updateCounter);

        // Movement instructions
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            font-size: 12px;
            color: #aaa;
            margin-bottom: 15px;
            line-height: 1.4;
        `;
        instructions.innerHTML = `
            <strong>Movement:</strong><br>
            WASD - Move horizontally<br>
            R/F - Move up/down<br>
            ESC - Cancel editing
        `;

        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 10px;
        `;

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            background: #666;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        cancelBtn.addEventListener('click', () => this.cancelPanelEdit());

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        saveBtn.addEventListener('click', () => this.savePanelEdit(textInput.value));

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        deleteBtn.addEventListener('click', () => this.deletePanel(panel));

        // Assemble UI
        uiContainer.appendChild(textInput);
        uiContainer.appendChild(charCounter);
        uiContainer.appendChild(instructions);
        buttonsContainer.appendChild(cancelBtn);
        buttonsContainer.appendChild(saveBtn);
        buttonsContainer.appendChild(deleteBtn);
        uiContainer.appendChild(buttonsContainer);

        document.body.appendChild(uiContainer);
        this.editButtons = uiContainer;

        // Focus on text input
        textInput.focus();
    }

    removeEditUI() {
        if (this.editButtons) {
            document.body.removeChild(this.editButtons);
            this.editButtons = null;
        }
    }

    savePanelEdit(newText) {
        if (!this.editingPanel) return;

        // Update panel text
        this.editingPanel.text = newText.trim() || "Empty Text";

        // Update visual mesh
        this.updatePanelMesh(this.editingPanel);
        this.scene.add(this.editingPanel.mesh);

        console.log('Panel text updated:', this.editingPanel.text);

        // Close edit UI
        this.deselectPanel();
    }

    cancelPanelEdit() {
        console.log('Panel edit cancelled');
        this.deselectPanel();
    }

    deletePanel(panel) {
        const index = this.panels.indexOf(panel);
        if (index > -1) {
            // Remove from scene
            this.scene.remove(panel.mesh);
            
            // Dispose of geometry and material
            panel.mesh.geometry.dispose();
            panel.mesh.material.dispose();
            
            // Remove from panels array
            this.panels.splice(index, 1);
            
            console.log('Panel deleted:', panel);
        }

        // Close edit UI
        this.deselectPanel();
    }

    updatePanelMovement() {
        if (!this.enabled || !this.editingPanel) return;

        const moveVector = new Vector3();

        // Handle movement (WASD)
        if (this.panelKeys.forward || this.panelKeys.backward) {
            const forward = new Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0; // Keep movement horizontal
            forward.normalize();

            if (this.panelKeys.forward) {
                moveVector.add(forward.multiplyScalar(this.panelMoveSpeed));
            }
            if (this.panelKeys.backward) {
                moveVector.add(forward.multiplyScalar(-this.panelMoveSpeed));
            }
        }

        if (this.panelKeys.left || this.panelKeys.right) {
            const right = new Vector3();
            this.camera.getWorldDirection(right);
            right.cross(this.camera.up);
            right.y = 0; // Keep movement horizontal
            right.normalize();

            if (this.panelKeys.right) {
                moveVector.add(right.multiplyScalar(this.panelMoveSpeed));
            }
            if (this.panelKeys.left) {
                moveVector.add(right.multiplyScalar(-this.panelMoveSpeed));
            }
        }

        if (this.panelKeys.up || this.panelKeys.down) {
            const vertical = new Vector3(0, 1, 0); // world up

            if (this.panelKeys.up) {
                moveVector.add(vertical.clone().multiplyScalar(this.panelMoveSpeed));
            }
            if (this.panelKeys.down) {
                moveVector.add(vertical.clone().multiplyScalar(-this.panelMoveSpeed));
            }
        }

        // Apply movement to panel
        if (moveVector.length() > 0) {
            this.editingPanel.position.add(moveVector);
            this.editingPanel.mesh.position.copy(this.editingPanel.position);
            console.log(`Panel moved to: ${this.editingPanel.position.x.toFixed(3)}, ${this.editingPanel.position.y.toFixed(3)}, ${this.editingPanel.position.z.toFixed(3)}`);
        }
    }

    // Update panels to always face camera (billboard effect)
    updatePanelBillboards() {
        this.panels.forEach(panel => {
            if (panel.mesh) {
                panel.mesh.lookAt(this.camera.position);
            }
        });
    }

    // Get panels data for saving
    getPanelsData() {
        return this.panels.map(panel => ({
            id: panel.id,
            text: panel.text,
            position: {
                x: panel.position.x,
                y: panel.position.y,
                z: panel.position.z
            }
        }));
    }

    // Load panels from data
    loadPanelsData(panelsData) {
        // Clear existing panels
        this.clearAllPanels();

        // Create panels from data
        if (panelsData && Array.isArray(panelsData)) {
            panelsData.forEach(data => {
                const position = new Vector3(data.position.x, data.position.y, data.position.z);
                const panel = this.createPanel(position, data.text);
                panel.id = data.id; // Preserve original ID
            });
        }

        console.log(`Loaded ${this.panels.length} text panels`);
    }

    // Clear all panels
    clearAllPanels() {
        this.panels.forEach(panel => {
            this.scene.remove(panel.mesh);
            panel.mesh.geometry.dispose();
            panel.mesh.material.dispose();
        });
        this.panels = [];
        this.deselectPanel();
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.deselectPanel();
        }
        console.log('Text panel controller enabled:', enabled);
    }

    // Method to be called in render loop
    update() {
        if (this.enabled) {
            this.updatePanelMovement();
            this.updatePanelBillboards();
        }
    }
}