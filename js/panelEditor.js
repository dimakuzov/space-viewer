import {
    Vector3,
    Group
} from 'three';

export class PanelEditor {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.selectedPanel = null;
        this.editMode = false;
        this.moveSpeed = 0.03; // 5cm per movement

        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };

        this.editButtons = null;
        this.textInput = null;
        this.originalText = '';

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        if (!this.editMode || !this.selectedPanel) return;

        switch(event.code) {
            case 'KeyW':
                this.keys.forward = true;
                event.preventDefault();
                break;
            case 'KeyS':
                this.keys.backward = true;
                event.preventDefault();
                break;
            case 'KeyA':
                this.keys.left = true;
                event.preventDefault();
                break;
            case 'KeyD':
                this.keys.right = true;
                event.preventDefault();
                break;
            case 'KeyR':
                this.keys.up = true;
                event.preventDefault();
                break;
            case 'KeyF':
                this.keys.down = true;
                event.preventDefault();
                break;
            case 'Escape':
                this.cancelEdit();
                event.preventDefault();
                break;
            case 'Enter':
                if (event.ctrlKey) {
                    this.saveEdit();
                    event.preventDefault();
                }
                break;
        }
    }

    onKeyUp(event) {
        if (!this.editMode || !this.selectedPanel) return;

        switch(event.code) {
            case 'KeyW':
                this.keys.forward = false;
                break;
            case 'KeyS':
                this.keys.backward = false;
                break;
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'KeyR':
                this.keys.up = false;
                break;
            case 'KeyF':
                this.keys.down = false;
                break;
        }
    }

    startEdit(panel) {
        if (this.editMode) {
            this.cancelEdit();
        }

        this.selectedPanel = panel;
        this.editMode = true;
        this.originalText = panel.getText();

        console.log('Started editing panel:', panel.id);

        this.createEditUI();
        this.createTextInput();
    }

    createEditUI() {
        // Create edit buttons container
        this.editButtons = document.createElement('div');
        this.editButtons.className = 'panel-edit-buttons';
        this.editButtons.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -120%);
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            padding: 10px;
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            justify-content: center;
            z-index: 1000;
        `;

        // Create buttons
        const cancelBtn = this.createButton('Cancel', '#f44336', () => this.cancelEdit());
        const saveBtn = this.createButton('Save', '#4CAF50', () => this.saveEdit());
        const deleteBtn = this.createButton('Delete', '#ff9800', () => this.deletePanel());
        const editPositionBtn = this.createButton('Edit Position', '#2196F3', () => this.togglePositionEdit());

        this.editButtons.appendChild(cancelBtn);
        this.editButtons.appendChild(saveBtn);
        this.editButtons.appendChild(deleteBtn);
        this.editButtons.appendChild(editPositionBtn);

        document.body.appendChild(this.editButtons);
    }

    createButton(text, color, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: ${color};
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: opacity 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.opacity = '0.8';
        });

        button.addEventListener('mouseleave', () => {
            button.style.opacity = '1';
        });

        button.addEventListener('click', onClick);

        return button;
    }

    createTextInput() {
        // Create text input overlay
        const overlay = document.createElement('div');
        overlay.className = 'panel-text-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999;
        `;

        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90%;
        `;

        const label = document.createElement('label');
        label.textContent = 'Panel Text (max 200 characters):';
        label.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #333;
        `;

        this.textInput = document.createElement('textarea');
        this.textInput.value = this.selectedPanel.getText();
        this.textInput.maxLength = 200;
        this.textInput.style.cssText = `
            width: 100%;
            height: 120px;
            border: 2px solid #ddd;
            border-radius: 4px;
            padding: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            resize: vertical;
            box-sizing: border-box;
        `;

        const charCounter = document.createElement('div');
        charCounter.style.cssText = `
            text-align: right;
            margin-top: 4px;
            font-size: 12px;
            color: #666;
        `;

        const updateCharCounter = () => {
            const remaining = 200 - this.textInput.value.length;
            charCounter.textContent = `${remaining} characters remaining`;
            charCounter.style.color = remaining < 20 ? '#f44336' : '#666';
        };

        this.textInput.addEventListener('input', () => {
            updateCharCounter();
            // Update panel text in real-time
            this.selectedPanel.setText(this.textInput.value);
        });

        updateCharCounter();

        const instructions = document.createElement('div');
        instructions.style.cssText = `
            margin-top: 10px;
            font-size: 12px;
            color: #666;
            line-height: 1.4;
        `;
        instructions.innerHTML = `
            <strong>Controls:</strong><br>
            • WASD - Move panel horizontally<br>
            • R/F - Move panel up/down<br>
            • Ctrl+Enter - Save changes<br>
            • Escape - Cancel editing
        `;

        inputContainer.appendChild(label);
        inputContainer.appendChild(this.textInput);
        inputContainer.appendChild(charCounter);
        inputContainer.appendChild(instructions);
        overlay.appendChild(inputContainer);

        // Close on overlay click
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                this.cancelEdit();
            }
        });

        document.body.appendChild(overlay);
        this.textOverlay = overlay;

        // Focus the text input
        setTimeout(() => this.textInput.focus(), 100);
    }

    updateMovement() {
        // Only move when in position edit mode
        if (!this.editMode || !this.selectedPanel || !this.positionEditMode) return;

        const moveVector = new Vector3();

        // Handle movement (WASD)
        if (this.keys.forward || this.keys.backward) {
            const forward = new Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0; // Keep movement horizontal
            forward.normalize();

            if (this.keys.forward) {
                moveVector.add(forward.multiplyScalar(this.moveSpeed));
            }
            if (this.keys.backward) {
                moveVector.add(forward.multiplyScalar(-this.moveSpeed));
            }
        }

        if (this.keys.left || this.keys.right) {
            const right = new Vector3();
            this.camera.getWorldDirection(right);
            right.cross(this.camera.up);
            right.y = 0; // Keep movement horizontal
            right.normalize();

            if (this.keys.right) {
                moveVector.add(right.multiplyScalar(this.moveSpeed));
            }
            if (this.keys.left) {
                moveVector.add(right.multiplyScalar(-this.moveSpeed));
            }
        }

        if (this.keys.up || this.keys.down) {
            const vertical = new Vector3(0, 1, 0); // world up

            if (this.keys.up) {
                moveVector.add(vertical.clone().multiplyScalar(this.moveSpeed));
            }
            if (this.keys.down) {
                moveVector.add(vertical.clone().multiplyScalar(-this.moveSpeed));
            }
        }

        // Apply movement
        if (moveVector.length() > 0) {
            this.selectedPanel.move(moveVector);
            const pos = this.selectedPanel.getPosition();
            console.log(`Panel moved to: ${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)}`);
        }
    }

    saveEdit() {
        if (!this.selectedPanel) return;

        console.log('Panel changes saved');
        this.endEdit();
    }

    cancelEdit() {
        if (!this.selectedPanel) return;

        // Restore original text
        this.selectedPanel.setText(this.originalText);
        console.log('Panel editing cancelled');
        this.endEdit();
    }

    deletePanel() {
        if (!this.selectedPanel) return;

        // Dispatch custom event for panel deletion
        const event = new CustomEvent('panelDelete', {
            detail: { panel: this.selectedPanel }
        });
        document.dispatchEvent(event);

        console.log('Panel deleted');
        this.endEdit();
    }

    endEdit() {
        this.editMode = false;
        this.positionEditMode = false;
        this.selectedPanel = null;
        this.originalText = '';

        // Reset all keys
        Object.keys(this.keys).forEach(key => {
            this.keys[key] = false;
        });

        // Remove UI elements
        if (this.editButtons) {
            this.editButtons.remove();
            this.editButtons = null;
        }

        if (this.textOverlay) {
            this.textOverlay.remove();
            this.textOverlay = null;
        }

        this.textInput = null;
        this.editPositionBtn = null;
        this.instructions = null;
    }

    isEditing() {
        return this.editMode;
    }

    isEditingPosition() {
        return this.positionEditMode;
    }

    getSelectedPanel() {
        return this.selectedPanel;
    }

    // Method to be called in the render loop
    update() {
        if (this.editMode && this.positionEditMode) {
            this.updateMovement();
        }
    }
}