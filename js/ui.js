export class UIController {
    constructor(app) {
        this.app = app;

        this.initElements();
        this.bindEvents();
    }

    initElements() {
        // Кнопки режимов
        this.viewModeBtn = document.getElementById('viewMode');
        this.editModeBtn = document.getElementById('editMode');

        // Панель инструментов
        this.objectTools = document.getElementById('objectTools');

        // Кнопки объектов
        this.addCubeBtn = document.getElementById('addCube');
        this.addTextPanelBtn = document.getElementById('addTextPanel');
        this.deleteObjectBtn = document.getElementById('deleteObject');

        // Кнопка переключения видимости GLB
        this.toggleGLBBtn = document.getElementById('toggleGLB');

        // Edit Collider button
        this.editColliderBtn = document.getElementById('editCollider');

        // Save Transform button
        this.saveTransformBtn = document.getElementById('saveTransform');

        // Прицел
        this.crosshair = document.getElementById('crosshair');
    }

    bindEvents() {
        // Переключение режимов
        this.viewModeBtn.addEventListener('click', () => {
            this.setViewMode();
        });

        this.editModeBtn.addEventListener('click', () => {
            this.setEditMode();
        });

        // Инструменты редактирования
        this.addCubeBtn.addEventListener('click', () => {
            this.selectObjectType('cube');
        });

        this.addTextPanelBtn.addEventListener('click', () => {
            this.selectObjectType('textPanel');
        });

        this.deleteObjectBtn.addEventListener('click', () => {
            this.selectObjectType('delete');
        });

        // Переключение видимости GLB
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

        // Горячие клавиши
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    onKeyDown(event) {
        // Переключение режимов на Tab
        if (event.code === 'Tab') {
            event.preventDefault();
            this.app.isEditMode ? this.setViewMode() : this.setEditMode();
        }

        // Горячие клавиши для объектов в режиме редактирования
        if (this.app.isEditMode) {
            switch(event.code) {
                case 'Digit1':
                    this.selectObjectType('cube');
                    break;
                case 'Digit2':
                    this.selectObjectType('textPanel');
                    break;
                case 'KeyX':
                case 'Delete':
                    this.selectObjectType('delete');
                    break;
                case 'KeyV':
                    this.toggleGLBVisibility();
                    break;
                case 'KeyC':
                    this.toggleEditCollider();
                    break;
                case 'KeyS':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.saveColliderTransform();
                    }
                    break;
            }
        }
    }

    setViewMode() {
        this.app.setEditMode(false);

        // Обновление UI
        this.viewModeBtn.classList.add('active');
        this.editModeBtn.classList.remove('active');
        this.objectTools.style.display = 'none';
        this.crosshair.style.display = 'none';

        // Очистка выделения инструментов
        this.clearObjectToolSelection();

        // Disable collider edit mode when switching to view mode
        this.app.editorController.setColliderEditMode(false);
        this.updateEditColliderButton();

        console.log('Switched to View Mode');
    }

    setEditMode() {
        this.app.setEditMode(true);

        // Обновление UI
        this.editModeBtn.classList.add('active');
        this.viewModeBtn.classList.remove('active');
        this.objectTools.style.display = 'block';
        this.crosshair.style.display = 'block';

        // Выбираем куб по умолчанию
        this.selectObjectType('cube');

        console.log('Switched to Edit Mode');
    }

    selectObjectType(type) {
        // Disable collider edit mode when selecting object tools
        if (this.app.editorController.isColliderEditMode()) {
            this.app.editorController.setColliderEditMode(false);
            this.updateEditColliderButton();
        }

        if (type === 'textPanel') {
            // Create text panel at camera position
            this.app.createTextPanelAtCamera();
            // Don't set editor object type for text panels
            this.clearObjectToolSelection();
            this.addTextPanelBtn.classList.add('active');
            return;
        }

        this.app.editorController.setSelectedObjectType(type);

        // Обновление визуального состояния кнопок
        this.clearObjectToolSelection();

        switch(type) {
            case 'cube':
                this.addCubeBtn.classList.add('active');
                break;
            case 'delete':
                this.deleteObjectBtn.classList.add('active');
                break;
        }
    }

    clearObjectToolSelection() {
        [this.addCubeBtn, this.addTextPanelBtn, this.deleteObjectBtn]
            .forEach(btn => btn.classList.remove('active'));
    }

    // Новый метод для переключения видимости GLB
    toggleGLBVisibility() {
        const isVisible = this.app.editorController.toggleGLBVisibility();

        // Обновляем визуальное состояние кнопки
        if (isVisible) {
            this.toggleGLBBtn.classList.add('active');
            this.toggleGLBBtn.textContent = 'Hide GLB';
        } else {
            this.toggleGLBBtn.classList.remove('active');
            this.toggleGLBBtn.textContent = 'Show GLB';
        }

        console.log(`GLB visibility toggled: ${isVisible ? 'visible' : 'hidden'}`);
    }

    // Method for toggling edit collider mode
    toggleEditCollider() {
        const isCurrentlyEditing = this.app.editorController.isColliderEditMode();
        const newState = !isCurrentlyEditing;

        this.app.editorController.setColliderEditMode(newState);

        // Clear object tool selection when entering collider edit mode
        if (newState) {
            this.clearObjectToolSelection();
            // Hide crosshair in collider edit mode
            this.crosshair.style.display = 'none';
        } else {
            // Show crosshair when exiting collider edit mode
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

    // Method: Save collider transform and text panels
    saveColliderTransform() {
        const success = this.app.saveColliderTransform();

        if (success) {
            // Provide visual feedback
            const originalText = this.saveTransformBtn.textContent;
            this.saveTransformBtn.textContent = 'Saved!';
            this.saveTransformBtn.style.background = '#4CAF50';

            setTimeout(() => {
                this.saveTransformBtn.textContent = originalText;
                this.saveTransformBtn.style.background = '';
            }, 1500);

            console.log('Data saved successfully');
        } else {
            // Show error feedback
            const originalText = this.saveTransformBtn.textContent;
            this.saveTransformBtn.textContent = 'Error!';
            this.saveTransformBtn.style.background = '#f44336';

            setTimeout(() => {
                this.saveTransformBtn.textContent = originalText;
                this.saveTransformBtn.style.background = '';
            }, 1500);

            console.error('Failed to save data');
        }
    }
}