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
        this.addSphereBtn = document.getElementById('addSphere');
        this.addCylinderBtn = document.getElementById('addCylinder');
        this.deleteObjectBtn = document.getElementById('deleteObject');

        // GLB controls
        this.positionGLBBtn = document.getElementById('positionGLB');
        this.scaleUpGLBBtn = document.getElementById('scaleUpGLB');
        this.scaleDownGLBBtn = document.getElementById('scaleDownGLB');

        // Прицел
        this.crosshair = document.getElementById('crosshair');

        // Сохранение/загрузка (закомментировано в HTML)
        // this.saveSceneBtn = document.getElementById('saveScene');
        // this.loadSceneBtn = document.getElementById('loadScene');
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

        this.addSphereBtn.addEventListener('click', () => {
            this.selectObjectType('sphere');
        });

        this.addCylinderBtn.addEventListener('click', () => {
            this.selectObjectType('cylinder');
        });

        this.deleteObjectBtn.addEventListener('click', () => {
            this.selectObjectType('delete');
        });

        // GLB controls
        this.positionGLBBtn?.addEventListener('click', () => {
            this.selectObjectType('glb-position');
        });

        this.scaleUpGLBBtn?.addEventListener('click', () => {
            this.scaleGLB(1.1);
        });

        this.scaleDownGLBBtn?.addEventListener('click', () => {
            this.scaleGLB(0.9);
        });

        // Сохранение/загрузка (пока закомментировано)
        /*
        this.saveSceneBtn?.addEventListener('click', () => {
            this.saveScene();
        });

        this.loadSceneBtn?.addEventListener('click', () => {
            this.loadScene();
        });
        */

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
                    this.selectObjectType('sphere');
                    break;
                case 'Digit3':
                    this.selectObjectType('cylinder');
                    break;
                case 'Digit4':
                    this.selectObjectType('glb-position');
                    break;
                case 'KeyX':
                case 'Delete':
                    this.selectObjectType('delete');
                    break;
                case 'KeyG':
                    // G key for GLB positioning
                    this.selectObjectType('glb-position');
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

        // Hide GLB in view mode
        this.setGLBVisibility(false);

        // Очистка выделения инструментов
        this.clearObjectToolSelection();

        console.log('Switched to View Mode');
    }

    setEditMode() {
        this.app.setEditMode(true);

        // Обновление UI
        this.editModeBtn.classList.add('active');
        this.viewModeBtn.classList.remove('active');
        this.objectTools.style.display = 'block';
        this.crosshair.style.display = 'block';

        // Show GLB in edit mode
        this.setGLBVisibility(true);

        // Выбираем куб по умолчанию
        this.selectObjectType('cube');

        console.log('Switched to Edit Mode');
    }

    selectObjectType(type) {
        this.app.editorController.setSelectedObjectType(type);

        // Обновление визуального состояния кнопок
        this.clearObjectToolSelection();

        switch(type) {
            case 'cube':
                this.addCubeBtn.classList.add('active');
                break;
            case 'sphere':
                this.addSphereBtn.classList.add('active');
                break;
            case 'cylinder':
                this.addCylinderBtn.classList.add('active');
                break;
            case 'delete':
                this.deleteObjectBtn.classList.add('active');
                break;
            case 'glb-position':
                this.positionGLBBtn?.classList.add('active');
                this.showGLBInstructions();
                break;
        }
    }

    clearObjectToolSelection() {
        const buttons = [
            this.addCubeBtn,
            this.addSphereBtn,
            this.addCylinderBtn,
            this.deleteObjectBtn,
            this.positionGLBBtn
        ].filter(btn => btn); // Filter out null buttons

        buttons.forEach(btn => btn.classList.remove('active'));
    }

    scaleGLB(factor) {
        const glbMesh = this.app.getGLBMesh();
        if (!glbMesh) {
            console.warn('GLB mesh not available');
            return;
        }

        glbMesh.scale.multiplyScalar(factor);

        const currentScale = glbMesh.scale.x.toFixed(3);
        console.log(`GLB scaled to: ${currentScale}x`);

        // Show scale feedback
        this.showTemporaryMessage(`GLB Scale: ${currentScale}x`);
    }

    setGLBVisibility(visible) {
        const glbMesh = this.app.getGLBMesh();
        if (!glbMesh) return;

        glbMesh.visible = visible;
        console.log(`GLB visibility: ${visible ? 'shown' : 'hidden'}`);
    }

    showGLBInstructions() {
        console.log('GLB Positioning Mode Selected');
        console.log('Click anywhere to start positioning, then use:');
        console.log('  WASD / Arrow Keys - Move X/Z');
        console.log('  Q/E - Move Up/Down');
        console.log('  R/F - Rotate');
        console.log('  +/- - Change step size');
        console.log('  ESC - Exit positioning mode');

        // Show temporary on-screen instructions
        this.showTemporaryMessage('GLB Positioning: Click to start, WASD to move, QE up/down, RF rotate, ESC to exit');
    }

    showTemporaryMessage(message, duration = 3000) {
        // Remove existing message if any
        const existingMessage = document.getElementById('tempMessage');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create temporary message element
        const messageDiv = document.createElement('div');
        messageDiv.id = 'tempMessage';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1000;
            pointer-events: none;
            max-width: 90%;
            text-align: center;
        `;
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        // Remove after duration
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, duration);
    }

    // Методы для сохранения/загрузки (пока закомментированы)
    /*
    saveScene() {
        try {
            const sceneData = this.app.editorController.exportScene();

            // Сохранение в localStorage для демо
            localStorage.setItem('lumaScene', JSON.stringify(sceneData));

            // В будущем здесь будет API запрос:
            // await this.saveToServer(sceneData);

            this.showNotification('Scene saved successfully!', 'success');
            console.log('Scene saved:', sceneData);

        } catch (error) {
            this.showNotification('Failed to save scene', 'error');
            console.error('Save error:', error);
        }
    }

    loadScene() {
        try {
            // Загрузка из localStorage для демо
            const savedData = localStorage.getItem('lumaScene');

            if (savedData) {
                const sceneData = JSON.parse(savedData);
                this.app.editorController.importScene(sceneData);
                this.showNotification('Scene loaded successfully!', 'success');
            } else {
                this.showNotification('No saved scene found', 'warning');
            }

        } catch (error) {
            this.showNotification('Failed to load scene', 'error');
            console.error('Load error:', error);
        }
    }

    async saveToServer(sceneData) {
        // Пример API запроса для будущего использования
        const response = await fetch('/api/scenes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(sceneData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    showNotification(message, type = 'info') {
        // Простое уведомление через alert (можно заменить на красивые toast)
        alert(message);
    }

    getAuthToken() {
        // Заглушка для токена авторизации
        return localStorage.getItem('authToken') || '';
    }
    */
}