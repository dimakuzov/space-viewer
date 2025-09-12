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
        this.positionEditMode = false;
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
        this.urlInput = null;
        this.originalUrl = '';

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        if (!this.editMode || !this.selectedPanel) return;


        if ((this.textInput && document.activeElement === this.textInput) ||
        (this.urlInput && document.activeElement === this.urlInput)) {
            return;
        }

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

        if (this.textInput && document.activeElement === this.textInput) {
            return;
        }

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
        // Create edit buttons container - positioned higher above text input
        this.editButtons = document.createElement('div');
        this.editButtons.className = 'panel-edit-buttons';
        this.editButtons.style.cssText = `
            position: fixed;
            bottom: 300px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            padding: 12px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
            z-index: 1001;
            max-width: 90vw;
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
        this.editPositionBtn = editPositionBtn;

        document.body.appendChild(this.editButtons);
    }

    createButton(text, color, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: ${color};
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
            min-width: 80px;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.opacity = '0.8';
            button.style.transform = 'translateY(-1px)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        });

        button.addEventListener('click', onClick);

        return button;
    }

    createTextInput() {
        // Create text input overlay at bottom of screen
        const overlay = document.createElement('div');
        overlay.className = 'panel-text-overlay';
        overlay.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 1000;
            padding: 20px;
            border-top: 2px solid rgba(255, 255, 255, 0.1);
        `;

        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
            max-width: 800px;
            margin: 0 auto;
        `;

        const label = document.createElement('label');
        label.textContent = 'Panel Text (max 200 characters):';
        label.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
        `;

        this.textInput = document.createElement('textarea');
        this.textInput.value = this.selectedPanel.getText();
        this.textInput.maxLength = 200;
        this.textInput.style.cssText = `
            width: 100%;
            height: 80px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 12px;
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: 14px;
            resize: none;
            box-sizing: border-box;
            transition: border-color 0.2s;
            outline: none;
        `;

        const charCounter = document.createElement('div');
        charCounter.style.cssText = `
            text-align: right;
            margin-top: 6px;
            font-size: 12px;
            color: #666;
            font-weight: 500;
        `;

        this.urlInput = document.createElement('input');
        this.urlInput.type = 'url';
        this.urlInput.value = this.selectedPanel.getUrl();
        this.urlInput.maxLength = 500;
        this.urlInput.placeholder = 'https://example.com or example.com (optional)';
        this.urlInput.style.cssText = `
            width: 100%;
            height: 40px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 0 12px;
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s;
            outline: none;
            margin-bottom: 15px;
        `;

        const urlCharCounter = document.createElement('div');
        urlCharCounter.style.cssText = `
            text-align: right;
            margin-bottom: 15px;
            font-size: 12px;
            color: #666;
            font-weight: 500;
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

        this.textInput.addEventListener('focus', () => {
            this.textInput.style.borderColor = '#4CAF50';
        });

        this.textInput.addEventListener('blur', () => {
            this.textInput.style.borderColor = '#e0e0e0';
        });

        const updateUrlCharCounter = () => {
            const remaining = 500 - this.urlInput.value.length;
            urlCharCounter.textContent = `${remaining} characters remaining`;
            urlCharCounter.style.color = remaining < 50 ? '#f44336' : '#666';
        };

        // Real-time URL updates
        this.urlInput.addEventListener('input', () => {
            updateUrlCharCounter();
            this.selectedPanel.setUrl(this.urlInput.value);
        });

        // Focus/blur styling
        this.urlInput.addEventListener('focus', () => {
            this.urlInput.style.borderColor = '#4CAF50';
        });

        this.urlInput.addEventListener('blur', () => {
            this.urlInput.style.borderColor = '#e0e0e0';
        });

        updateUrlCharCounter();
        updateCharCounter();

        this.instructions = document.createElement('div');
        this.instructions.style.cssText = `
            margin-top: 12px;
            font-size: 12px;
            color: #666;
            line-height: 1.5;
            background: rgba(0, 0, 0, 0.05);
            padding: 10px;
            border-radius: 6px;
        `;
        this.instructions.innerHTML = `
            <strong>Controls:</strong><br>
            WASD - Move panel horizontally, R/F - Move panel up/down, Escape - Cancel editing
        `;
        this.updateInstructions(false);

        inputContainer.appendChild(label);
        inputContainer.appendChild(this.textInput);
        inputContainer.appendChild(charCounter);
        inputContainer.appendChild(this.urlInput);
        inputContainer.appendChild(urlCharCounter);
        inputContainer.appendChild(this.instructions);
        overlay.appendChild(inputContainer);

        // Close on overlay click (only on the overlay itself, not the container)
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
        this.selectedPanel.setUrl(this.originalUrl);
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

    togglePositionEdit() {
        this.positionEditMode = !this.positionEditMode;

        if (this.positionEditMode) {
            this.editPositionBtn.textContent = 'Exit Position Edit';
            this.editPositionBtn.style.background = '#FF9800';

            // Update instructions in text input
            this.updateInstructions(true);
        } else {
            this.editPositionBtn.textContent = 'Edit Position';
            this.editPositionBtn.style.background = '#2196F3';

            // Reset all movement keys
            Object.keys(this.keys).forEach(key => {
                this.keys[key] = false;
            });

            // Update instructions in text input
            this.updateInstructions(false);
        }

        console.log(`Position edit mode: ${this.positionEditMode ? 'ON' : 'OFF'}`);
    }

    updateInstructions(positionEditMode) {
        if (!this.instructions) return;

        if (positionEditMode) {
            this.instructions.innerHTML = `
                <strong style="color: #FF9800;">Position Edit Mode Active:</strong><br>
                WASD - Move panel horizontally, R/F - Move panel up/down, Escape - Cancel editing
            `;
            this.instructions.style.background = '#fff3cd';
            this.instructions.style.border = '1px solid #ffc107';

            // Disable text input during position editing
            if (this.textInput) {
                this.textInput.disabled = true;
                this.textInput.style.background = '#f5f5f5';
                this.textInput.style.color = '#666';
                this.textInput.style.cursor = 'not-allowed';
            }
        } else {
            this.instructions.innerHTML = `
                <strong style="color: #4CAF50;">Text Edit Mode:</strong><br>
                Write a description and edit the position (press Edit Postion button)
            `;
            this.instructions.style.background = 'rgba(0, 0, 0, 0.05)';
            this.instructions.style.border = 'none';

            // Enable text input
            if (this.textInput) {
                this.textInput.disabled = false;
                this.textInput.style.background = '';
                this.textInput.style.color = '';
                this.textInput.style.cursor = '';
            }
        }
    }

    endEdit() {
        this.editMode = false;
        this.positionEditMode = false;
        this.selectedPanel = null;
        this.originalText = '';
        this.originalUrl = '';
        this.urlInput = null;

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