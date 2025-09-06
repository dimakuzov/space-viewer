import {LumaSceneApp} from './main.js';

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
                case 'KeyV':
                    this.LumaSceneApp.toggleCollisionMeshVisibility();
                    break;
                case 'KeyR':
                    this.resetCollisionMeshTransform();
                    break;
                case 'KeyO':
                    this.saveCollisionMeshTransform();
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

    async saveCollisionMeshTransform() {
        if (!this.app.collisionMesh) {
            this.showNotification('No collision mesh loaded', 'warning');
            return;
        }

        try {
            const mesh = this.app.collisionMesh;
            const transformData = {
                position: {
                    x: mesh.position.x,
                    y: mesh.position.y,
                    z: mesh.position.z
                },
                rotation: {
                    x: mesh.rotation.x,
                    y: mesh.rotation.y,
                    z: mesh.rotation.z
                },
                scale: {
                    x: mesh.scale.x,
                    y: mesh.scale.y,
                    z: mesh.scale.z
                },
                metadata: {
                    savedAt: new Date().toISOString(),
                    version: '1.0'
                }
            };

            // For now, we'll save to localStorage since we can't directly write files from browser
            // In a real application, this would be an API call to save the file
            localStorage.setItem('collisionMeshTransform', JSON.stringify(transformData));

            // Also try to save to a downloadable file
            this.downloadTransformFile(transformData);

            this.showNotification('Transform settings saved successfully!', 'success');
            console.log('Saved transform settings:', transformData);

        } catch (error) {
            this.showNotification('Failed to save transform settings', 'error');
            console.error('Save error:', error);
        }
    }

    async loadCollisionMeshTransform() {
        try {
            // First try to load from localStorage
            const savedData = localStorage.getItem('collisionMeshTransform');

            if (savedData) {
                const transformData = JSON.parse(savedData);
                this.applyTransformData(transformData);
                this.showNotification('Transform settings loaded successfully!', 'success');
                console.log('Loaded transform settings:', transformData);
            } else {
                // Try to load from the assets directory
                await this.loadTransformFromFile();
            }

        } catch (error) {
            this.showNotification('No saved transform settings found', 'warning');
            console.log('No transform settings to load');
        }
    }

    async loadTransformFromFile() {
        try {
            const response = await fetch('assets/collision-transform.json');
            if (response.ok) {
                const transformData = await response.json();
                this.applyTransformData(transformData);
                // Also save to localStorage for faster future access
                localStorage.setItem('collisionMeshTransform', JSON.stringify(transformData));
                this.showNotification('Transform settings loaded from file!', 'success');
                console.log('Loaded transform settings from file:', transformData);
            } else {
                throw new Error('Transform file not found');
            }
        } catch (error) {
            console.log('No transform file found in assets directory');
            throw error;
        }
    }

    applyTransformData(transformData) {
        if (!this.app.collisionMesh || !transformData) return;

        const { position, rotation, scale } = transformData;

        // Update input fields
        if (position) {
            this.posXInput.value = position.x.toFixed(1);
            this.posYInput.value = position.y.toFixed(1);
            this.posZInput.value = position.z.toFixed(1);
        }

        if (rotation) {
            // Convert radians to degrees for display
            this.rotXInput.value = Math.round(rotation.x * 180 / Math.PI);
            this.rotYInput.value = Math.round(rotation.y * 180 / Math.PI);
            this.rotZInput.value = Math.round(rotation.z * 180 / Math.PI);
        }

        if (scale) {
            this.scaleXInput.value = scale.x.toFixed(1);
            this.scaleYInput.value = scale.y.toFixed(1);
            this.scaleZInput.value = scale.z.toFixed(1);
        }

        // Apply the transform to the mesh
        this.applyCollisionMeshTransform();
    }

    downloadTransformFile(transformData) {
        const jsonString = JSON.stringify(transformData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'collision-transform.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('Transform settings file downloaded. Place it in assets/ directory for automatic loading.');
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 5px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1000;
            max-width: 300px;
            background: ${type === 'success' ? '#4CAF50' :
                        type === 'warning' ? '#FF9800' :
                        type === 'error' ? '#f44336' : '#2196F3'};
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 3000);
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