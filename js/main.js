import {
    WebGLRenderer,
    PerspectiveCamera,
    Scene,
    DirectionalLight,
    AmbientLight
} from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { LumaSplatsThree } from '@lumaai/luma-web';

// Импорт модулей
import { MovementController } from './movement.js';
import { EditorController } from './editor.js';
import { UIController } from './ui.js';

class LumaSceneApp {
    constructor() {
        this.isEditMode = false;
        this.placedObjects = [];

        this.initRenderer();
        this.initScene();
        this.initCamera();
        this.initLights();
        this.initControls();
        this.initControllers();
        this.loadLumaScene();
        this.bindEvents();
        this.startRenderLoop();
    }

    initRenderer() {
        this.canvas = document.querySelector('canvas');
        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight, false);
        this.renderer.shadowMap.enabled = true;
    }

    initScene() {
        this.scene = new Scene();
    }

    initCamera() {
        this.camera = new PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 2);
    }

    initLights() {
        // Освещение для 3D объектов
        const ambientLight = new AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    initControls() {
        this.pointerLockControls = new PointerLockControls(this.camera, document.body);
    }

    initControllers() {
        // Инициализация контроллеров
        this.movementController = new MovementController(this.camera, this.pointerLockControls);
        this.editorController = new EditorController(this.scene, this.camera, this.placedObjects);
        this.uiController = new UIController(this);
    }

    async loadLumaScene() {
        try {
            this.splat = new LumaSplatsThree({
                source: 'https://lumalabs.ai/capture/20961f1d-3add-4382-a0f0-c0a6a53a5b45'
            });
            this.scene.add(this.splat);

            // Передаем splat в editor для ray casting
            this.editorController.setSplat(this.splat);
        } catch (error) {
            console.error('Failed to load Luma scene:', error);
        }
    }

    bindEvents() {
        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setEditMode(isEdit) {
        this.isEditMode = isEdit;
        this.movementController.setEnabled(!isEdit);
        this.editorController.setEnabled(isEdit);
    }

    getPlacedObjects() {
        return this.placedObjects;
    }

    addPlacedObject(object) {
        this.placedObjects.push(object);
        this.scene.add(object);
    }

    removePlacedObject(object) {
        const index = this.placedObjects.indexOf(object);
        if (index > -1) {
            this.placedObjects.splice(index, 1);
            this.scene.remove(object);
        }
    }

    startRenderLoop() {
        this.renderer.setAnimationLoop(() => {
            // Обновление контроллеров
            if (!this.isEditMode) {
                this.movementController.update();
            }

            // Рендеринг сцены
            this.renderer.render(this.scene, this.camera);
        });
    }
}

// Запуск приложения
const app = new LumaSceneApp();

// Делаем доступным глобально для отладки
window.lumaApp = app;