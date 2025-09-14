export class UIController {
    constructor(app) {
        this.app = app;

        this.initElements();
        this.bindEvents();
    }

    initElements() {
        // Mode buttons
        this.viewModeBtn = document.getElementById('viewMode');
        this.editModeBtn = document.getElementById('editMode');

        // Tools panel
        this.objectTools = document.getElementById('objectTools');

        // Controls sections
        this.viewControls = document.getElementById('viewControls');
        this.editControls = document.getElementById('editControls');

        // Object buttons - update for panels
        this.addPanelBtn = document.getElementById('addPanel');

        // GLB visibility toggle
        this.toggleGLBBtn = document.getElementById('toggleGLB');

        // Edit Collider button
        this.editColliderBtn = document.getElementById('editCollider');

        // Save Transform button
        this.saveTransformBtn = document.getElementById('saveTransform');

        // Crosshair
        this.crosshair = document.getElementById('crosshair');

        this.clickInstruction = document.getElementById('clickInstruction');
    }

    bindEvents() {
        // Mode switching
        this.viewModeBtn.addEventListener('click', () => {
            this.setViewMode();
        });

        this.editModeBtn.addEventListener('click', () => {
            this.setEditMode();
        });

        // Editing tools
        this.addPanelBtn.addEventListener('click', () => {
            this.selectObjectType('panel');
        });

        // GLB visibility toggle
        this.toggleGLBBtn.addEventListener('click', () => {
            this.toggleGLBVisibility();
        });

        // Edit Collider button
        this.editColliderBtn.addEventListener('click', () => {
            this.toggleEditCollider();
        });

        // Save Transform button
        this.saveTransformBtn.addEventListener('click', () => {
            this.saveColliderTransform();
        });
    }

    setViewMode() {
        this.app.setEditMode(false);

        // Update UI
        this.viewModeBtn.classList.add('active');
        this.editModeBtn.classList.remove('active');
        this.objectTools.style.display = 'none';
        this.crosshair.style.display = 'none';

        // Show view controls, hide edit controls
        this.viewControls.style.display = 'block';
        this.editControls.style.display = 'none';

        // Show click instruction if pointer lock is not active
        if (!this.app.pointerLockControls.isLocked) {
            this.clickInstruction.style.display = 'block';
        }

        // Clear tool selection
        this.clearObjectToolSelection();

        // Disable collider edit mode
        this.app.editorController.setColliderEditMode(false);
        this.updateEditColliderButton();

        console.log('Switched to View Mode');
    }

    setEditMode() {
        this.app.setEditMode(true);

        // Update UI
        this.editModeBtn.classList.add('active');
        this.viewModeBtn.classList.remove('active');
        this.objectTools.style.display = 'block';
        this.crosshair.style.display = 'block';

        // Hide click instruction in edit mode
        this.clickInstruction.style.display = 'none';

        // Show edit controls, hide view controls
        this.viewControls.style.display = 'none';
        this.editControls.style.display = 'block';

        // Select panel by default
        this.selectObjectType('panel');

        console.log('Switched to Edit Mode');
    }

    selectObjectType(type) {
        // Disable collider edit mode when selecting object tools
        if (this.app.editorController.isColliderEditMode()) {
            this.app.editorController.setColliderEditMode(false);
            this.updateEditColliderButton();
        }

        this.app.editorController.setSelectedObjectType(type);

        switch(type) {
            case 'panel':
                this.addPanelBtn.classList.add('active');
                break;
        }
    }

    toggleGLBVisibility() {
        const isVisible = this.app.editorController.toggleGLBVisibility();

        // Update button visual state
        if (isVisible) {
            this.toggleGLBBtn.classList.add('active');
            this.toggleGLBBtn.textContent = 'Hide GLB';
        } else {
            this.toggleGLBBtn.classList.remove('active');
            this.toggleGLBBtn.textContent = 'Show GLB';
        }

        console.log(`GLB visibility toggled: ${isVisible ? 'visible' : 'hidden'}`);
    }

    toggleEditCollider() {
        const isCurrentlyEditing = this.app.editorController.isColliderEditMode();
        const newState = !isCurrentlyEditing;

        this.app.editorController.setColliderEditMode(newState);

        // Clear object tool selection when entering collider edit mode
        if (newState) {
            this.crosshair.style.display = 'none';
        } else {
            this.crosshair.style.display = 'block';
        }

        this.updateEditColliderButton();

        console.log(`Edit Collider mode: ${newState ? 'ON' : 'OFF'}`);
    }

    updateEditColliderButton() {
        const isEditing = this.app.editorController.isColliderEditMode();

        if (isEditing) {
            this.editColliderBtn.classList.add('active');
            this.editColliderBtn.textContent = 'Exit Collider Edit';
        } else {
            this.editColliderBtn.classList.remove('active');
            this.editColliderBtn.textContent = 'Edit Collider';
        }
    }

    saveColliderTransform() {
        const success = this.app.saveColliderTransform();

        if (success) {
            // Visual feedback
            const originalText = this.saveTransformBtn.textContent;
            this.saveTransformBtn.textContent = 'Saved!';
            this.saveTransformBtn.style.background = '#4CAF50';

            setTimeout(() => {
                this.saveTransformBtn.textContent = originalText;
                this.saveTransformBtn.style.background = '';
            }, 1500);

            console.log('Collider transform saved successfully');
        } else {
            // Error feedback
            const originalText = this.saveTransformBtn.textContent;
            this.saveTransformBtn.textContent = 'Error!';
            this.saveTransformBtn.style.background = '#f44336';

            setTimeout(() => {
                this.saveTransformBtn.textContent = originalText;
                this.saveTransformBtn.style.background = '';
            }, 1500);

            console.error('Failed to save collider transform');
        }
    }
}