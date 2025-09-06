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
        this.deleteObjectBtn = document.getElementById('deleteObject');

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

        this.deleteObjectBtn.addEventListener('click', () => {
            this.selectObjectType('delete');
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
                case 'KeyX':
                case 'Delete':
                    this.selectObjectType('delete');
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
        [this.addCubeBtn, this.deleteObjectBtn]
            .forEach(btn => btn.classList.remove('active'));
    }

    resetCollisionMeshTransform() {
        this.posXInput.value = 0;
        this.posYInput.value = 0;
        this.posZInput.value = 0;
        this.rotXInput.value = 0;
        this.rotYInput.value = 0;
        this.rotZInput.value = 0;
        this.scaleXInput.value = 1;
        this.scaleYInput.value = 1;
        this.scaleZInput.value = 1;

        this.applyCollisionMeshTransform();
    }

    applyCollisionMeshTransform() {
        if (!this.app.collisionMesh) return;

        const position = {
            x: parseFloat(this.posXInput.value) || 0,
            y: parseFloat(this.posYInput.value) || 0,
            z: parseFloat(this.posZInput.value) || 0
        };

        const rotation = {
            x: (parseFloat(this.rotXInput.value) || 0) * Math.PI / 180, // Convert to radians
            y: (parseFloat(this.rotYInput.value) || 0) * Math.PI / 180,
            z: (parseFloat(this.rotZInput.value) || 0) * Math.PI / 180
        };

        const scale = {
            x: parseFloat(this.scaleXInput.value) || 1,
            y: parseFloat(this.scaleYInput.value) || 1,
            z: parseFloat(this.scaleZInput.value) || 1
        };

        // Apply transforms
        this.app.collisionMesh.position.set(position.x, position.y, position.z);
        this.app.collisionMesh.rotation.set(rotation.x, rotation.y, rotation.z);
        this.app.collisionMesh.scale.set(scale.x, scale.y, scale.z);

        console.log('Applied transform to collision mesh:', { position, rotation, scale });
    }

    updateTransformInputs() {
        if (!this.app.collisionMesh) return;

        const mesh = this.app.collisionMesh;

        // Update position inputs
        this.posXInput.value = mesh.position.x.toFixed(1);
        this.posYInput.value = mesh.position.y.toFixed(1);
        this.posZInput.value = mesh.position.z.toFixed(1);

        // Update rotation inputs (convert from radians to degrees)
        this.rotXInput.value = Math.round(mesh.rotation.x * 180 / Math.PI);
        this.rotYInput.value = Math.round(mesh.rotation.y * 180 / Math.PI);
        this.rotZInput.value = Math.round(mesh.rotation.z * 180 / Math.PI);

        // Update scale inputs
        this.scaleXInput.value = mesh.scale.x.toFixed(1);
        this.scaleYInput.value = mesh.scale.y.toFixed(1);
        this.scaleZInput.value = mesh.scale.z.toFixed(1);
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