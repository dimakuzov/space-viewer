import {
    WebGLRenderer,
    PerspectiveCamera,
    Scene,
    DirectionalLight,
    AmbientLight
} from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LumaSplatsThree } from '@lumaai/luma-web';

// Import modules
import { MovementController } from './movement.js';
import { EditorController } from './editor.js';
import { UIController } from './ui.js';
import { SaveLoadController } from './saveLoad.js';
import { PanelObject } from './panel.js';
import { PanelEditor } from './panelEditor.js';

class LumaSceneApp {
    constructor() {
        this.isEditMode = false;
        this.placedObjects = [];
        this.panels = new Map(); // Store panel objects by their group
        this.collisionMesh = null;

        this.initRenderer();
        this.initScene();
        this.initCamera();
        this.initLights();
        this.initControls();
        this.initControllers();
        this.loadAssets();
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
        this.movementController = new MovementController(this.camera, this.pointerLockControls);
        this.panelEditor = new PanelEditor(this.scene, this.camera);
        this.editorController = new EditorController(this.scene, this.camera, this.placedObjects, this.panelEditor);
        this.saveLoadController = new SaveLoadController();
        this.uiController = new UIController(this);

        // Bind panel events
        this.bindPanelEvents();
    }

    bindPanelEvents() {
        // Listen for panel creation events
        document.addEventListener('panelCreate', (event) => {
            this.createPanel(event.detail.position);
        });

        // Listen for panel edit events
        document.addEventListener('panelEdit', (event) => {
            const panelGroup = event.detail.panelGroup;
            const panel = this.panels.get(panelGroup);
            if (panel) {
                this.panelEditor.startEdit(panel);
            }
        });

        // Listen for panel deletion events
        document.addEventListener('panelDelete', (event) => {
            this.deletePanel(event.detail.panel);
        });

        // Listen for object deletion events
        document.addEventListener('objectDelete', (event) => {
            this.deleteObject(event.detail.object);
        });
    }

    createPanel(position, text = 'New Panel') {
        const panel = new PanelObject(position, text);
        const group = panel.getGroup();

        this.scene.add(group);
        this.placedObjects.push(group);
        this.panels.set(group, panel);

        console.log('Panel created at:', position);
        return panel;
    }

    deletePanel(panel) {
        const group = panel.getGroup();

        // Remove from scene
        this.scene.remove(group);

        // Remove from placed objects
        const index = this.placedObjects.indexOf(group);
        if (index > -1) {
            this.placedObjects.splice(index, 1);
        }

        // Remove from panels map
        this.panels.delete(group);

        // Dispose resources
        panel.dispose();

        console.log('Panel deleted');
    }

    deleteObject(object) {
        // Check if it's a panel
        const panel = this.panels.get(object);
        if (panel) {
            this.deletePanel(panel);
            return;
        }

        // Handle other object types
        this.scene.remove(object);
        const index = this.placedObjects.indexOf(object);
        if (index > -1) {
            this.placedObjects.splice(index, 1);
        }
    }

    async loadAssets() {
        try {
            await this.loadLumaScene();
            await this.loadCollisionMesh();
        } catch (error) {
            console.error('Failed to load assets:', error);
        }
    }

    async loadLumaScene() {
        try {
            console.log('Loading Luma splat scene...');
            this.splat = new LumaSplatsThree({
                source: 'https://lumalabs.ai/capture/20961f1d-3add-4382-a0f0-c0a6a53a5b45'
            });
            this.scene.add(this.splat);
            console.log('Luma splat scene loaded successfully');
        } catch (error) {
            console.error('Failed to load Luma scene:', error);
        }
    }

    async loadCollisionMesh() {
        return new Promise((resolve, reject) => {
            console.log('Loading collision mesh...');

            const loader = new GLTFLoader();

            loader.load(
                'assets/two-rooms.glb',
                (gltf) => {
                    console.log('GLB collision mesh loaded successfully');

                    this.collisionMesh = gltf.scene;

                    this.collisionMesh.traverse((child) => {
                        if (child.isMesh) {
                            child.visible = false;
                        }
                    });

                    this.scene.add(this.collisionMesh);
                    this.editorController.setCollisionMesh(this.collisionMesh);
                    this.saveLoadController.setCollisionMesh(this.collisionMesh);

                    console.log('Collision mesh setup complete');
                    resolve();
                },
                (progress) => {
                    const percentage = (progress.loaded / progress.total * 100).toFixed(1);
                    console.log(`Loading collision mesh: ${percentage}%`);
                },
                (error) => {
                    console.error('Failed to load collision mesh:', error);
                    reject(error);
                }
            );
        });
    }
    
    bindEvents() {
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

        // Exit panel editing when switching modes
        if (!isEdit && this.panelEditor.isEditing()) {
            this.panelEditor.cancelEdit();
        }
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

    // Panel-related methods
    getPanels() {
        return Array.from(this.panels.values());
    }

    savePanelsData() {
        const panelsData = this.getPanels().map(panel => panel.toJSON());
        return panelsData;
    }

    loadPanelsData(panelsData) {
        // Clear existing panels
        this.panels.forEach(panel => this.deletePanel(panel));

        // Load panels from data
        panelsData.forEach(data => {
            const panel = PanelObject.fromJSON(data);
            const group = panel.getGroup();

            this.scene.add(group);
            this.placedObjects.push(group);
            this.panels.set(group, panel);
        });
    }

    saveColliderTransform() {
        return this.saveLoadController.saveTransform();
    }

    loadColliderTransform() {
        return this.saveLoadController.loadTransform();
    }

    resetColliderTransform() {
        return this.saveLoadController.resetTransform();
    }

    getCurrentColliderTransform() {
        return this.saveLoadController.getCurrentTransform();
    }

    startRenderLoop() {
        this.renderer.setAnimationLoop(() => {
            // Update controllers
            if (!this.isEditMode) {
                this.movementController.update();
            } else {
                this.editorController.update();
                this.panelEditor.update();
            }

            // Make all panels face the camera
            this.panels.forEach(panel => {
                panel.lookAtCamera(this.camera);
            });

            // Render scene
            this.renderer.render(this.scene, this.camera);
        });
    }
}

// Launch application
const app = new LumaSceneApp();

// Make globally available for debugging
window.lumaApp = app;