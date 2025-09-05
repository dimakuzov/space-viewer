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
            case 'sphere':
                this.addSphereBtn.classList.add('active');
                break;
            case 'cylinder':
                this.addCylinderBtn.classList.add('active');
                break;
            case 'delete':
                this.deleteObjectBtn.classList.add('active');
                break;
        }
    }

    clearObjectToolSelection() {
        [this.addCubeBtn, this.addSphereBtn, this.addCylinderBtn, this.deleteObjectBtn]
            .forEach(btn => btn.classList.remove('active'));
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
            this.showNotification
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