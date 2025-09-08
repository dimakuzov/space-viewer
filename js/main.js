import {
    WebGLRenderer,
    PerspectiveCamera,
    Scene,
    DirectionalLight,
    AmbientLight,
    Vector3
} from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LumaSplatsThree } from '@lumaai/luma-web';

// Import modules
import { MovementController } from './movement.js';
import { EditorController } from './editor.js';
import { UIController } from './ui.js';
import { SaveLoadController } from './saveLoad.js';
import { TextPanelController } from './textPanel.js';

class LumaSceneApp {
    constructor() {
        this.isEditMode = false;
        this.placedObjects = [];
        this.collisionMesh = null; // Invisible mesh for collisions

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
        // Lighting for 3D objects
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
        // Initialize controllers
        this.movementController = new MovementController(this.camera, this.pointerLockControls);
        this.editorController = new EditorController(this.scene, this.camera, this.placedObjects);
        this.textPanelController = new TextPanelController(this.scene, this.camera, this.renderer);
        this.saveLoadController = new SaveLoadController();

        // Connect text panel controller to save/load system
        this.saveLoadController.setTextPanelController(this.textPanelController);

        this.uiController = new UIController(this);
    }

    async loadAssets() {
        try {
            // Load Luma splat for visualization
            await this.loadLumaScene();

            // Load GLB for collisions
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

                    // Get mesh from GLB file
                    this.collisionMesh = gltf.scene;

                    // Make mesh invisible but keep for ray casting
                    this.collisionMesh.traverse((child) => {
                        if (child.isMesh) {
                            // Make material invisible
                            child.visible = false;
                            // Can also set transparent material:
                            // child.material.transparent = true;
                            // child.material.opacity = 0;
                        }
                    });

                    // Add to scene for ray casting
                    this.scene.add(this.collisionMesh);

                    // Pass collision mesh to editor for ray casting
                    this.editorController.setCollisionMesh(this.collisionMesh);

                    // Pass collision mesh to save/load controller
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
        // Handle window resize
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
        this.textPanelController.setEnabled(isEdit);
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

    // New method: Create text panel
    createTextPanel(position, text = "Sample Text") {
        return this.textPanelController.createPanel(position, text);
    }

    // New method: Create text panel at camera position (for UI button)
    createTextPanelAtCamera() {
        // Calculate position in front of camera
        const direction = new Vector3();
        this.camera.getWorldDirection(direction);
        const position = this.camera.position.clone().add(direction.multiplyScalar(2));

        return this.createTextPanel(position, "New Text Panel");
    }

    // New method: Save collider transform
    saveColliderTransform() {
        return this.saveLoadController.saveTransform();
    }

    // New method: Load collider transform
    loadColliderTransform() {
        return this.saveLoadController.loadTransform();
    }

    // New method: Reset collider transform
    resetColliderTransform() {
        return this.saveLoadController.resetTransform();
    }

    // New method: Get current collider transform (for debugging)
    getCurrentColliderTransform() {
        return this.saveLoadController.getCurrentTransform();
    }

    startRenderLoop() {
        this.renderer.setAnimationLoop(() => {
            // Update controllers
            if (!this.isEditMode) {
                this.movementController.update();
            } else {
                // Update editor controller for collider movement
                this.editorController.update();
                // Update text panel controller for panel movement and billboard effect
                this.textPanelController.update();
            }

            // Always update text panel billboards (even in view mode)
            this.textPanelController.updatePanelBillboards();

            // Render scene
            this.renderer.render(this.scene, this.camera);
        });
    }
}

// Launch application
const app = new LumaSceneApp();

// Make globally available for debugging
window.lumaApp = app;