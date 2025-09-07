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

        // Кнопка переключения видимости GLB
        this.toggleGLBBtn = document.getElementById('toggleGLB');

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

        // Переключение видимости GLB
        this.toggleGLBBtn.addEventListener('click', () => {
            this.toggleGLBVisibility();
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
                    this.toggleGLBVisibility();
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

    // Новый метод для переключения режима редактирования коллайдера
    toggleColliderEditMode() {
        const isEditMode = this.app.editorController.setColliderEditMode(!this.app.editorController.isColliderEditMode());

        // Очищаем выделение других инструментов
        this.clearObjectToolSelection();

        // Обновляем визуальное состояние кнопки
        if (isEditMode) {
            this.editColliderBtn.classList.add('active');
            this.editColliderBtn.textContent = 'Exit Collider Edit';

            // Автоматически показываем GLB если он скрыт
            if (!this.app.editorController.isGLBVisible()) {
                this.toggleGLBVisibility();
            }
        } else {
            this.editColliderBtn.classList.remove('active');
            this.editColliderBtn.textContent = 'Edit Collider';
        }

        console.log(`Collider edit mode: ${isEditMode ? 'ON' : 'OFF'}`);
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