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

        // Set text panel controller reference for save/load
        this.saveLoadController.setTextPanelController(this);

        // Bind panel events
        this.bindPanelEvents();
    }

    bindPanelEvents() {
        // Listen for panel creation events
        document.addEventListener('panelCreate', (event) => {
            console.log('Panel create event received');
            this.createPanel(event.detail.position);
        });

        // Listen for panel edit events
        document.addEventListener('panelEdit', (event) => {
            console.log('Panel edit event received');
            const panelGroup = event.detail.panelGroup;
            const panel = this.panels.get(panelGroup);
            if (panel) {
                console.log('Starting panel edit for panel:', panel.id);
                console.log('Panel current text:', panel.getText());
                console.log('Panel current URL:', panel.getUrl());
                this.panelEditor.startEdit(panel);
            } else {
                console.error('Panel not found in panels map');
            }
        });

        // Listen for panel URL click events (view mode)
        document.addEventListener('panelUrlClick', (event) => {
            console.log('Panel URL click event received');
            const panelGroup = event.detail.panelGroup;
            const panel = this.panels.get(panelGroup);
            if (panel) {
                this.handlePanelUrlClick(panel);
            } else {
                console.error('Panel not found for URL click');
            }
        });

        // Listen for panel deletion events
        document.addEventListener('panelDelete', (event) => {
            console.log('Panel delete event received');
            this.deletePanel(event.detail.panel);
        });

        // Listen for object deletion events
        document.addEventListener('objectDelete', (event) => {
            console.log('Object delete event received');
            this.deleteObject(event.detail.object);
        });
    }

    handlePanelUrlClick(panel) {
        if (panel.hasUrl()) {
            const success = panel.openUrl();
            if (success) {
                console.log(`Opened URL for panel ${panel.id}: ${panel.getUrl()}`);

                // Visual feedback - briefly highlight the panel border
                this.showPanelClickFeedback(panel);
            } else {
                console.warn(`Failed to open URL for panel ${panel.id}: ${panel.getUrl()}`);
                // You could show an error message to the user here
            }
        } else {
            console.log(`Panel ${panel.id} clicked but has no URL`);
            // You could show a message that there's no link here
        }
    }

    showPanelClickFeedback(panel) {
        // This is a simple visual feedback - you could enhance this
        // For now, we'll just log it, but you could add visual effects
        console.log(`Panel ${panel.id} clicked - URL opening...`);

        // You could add temporary visual effects here, such as:
        // - Briefly changing the panel's opacity
        // - Adding a temporary glow effect
        // - Showing a brief "opening link" message
    }

    createPanel(position, text = 'New Panel', url = '') {
        console.log('Creating panel at position:', position);
        const panel = new PanelObject(position, text, url);
        const group = panel.getGroup();

        this.scene.add(group);
        this.placedObjects.push(group);
        this.panels.set(group, panel);

        console.log('Panel created successfully:');
        console.log('- ID:', panel.id);
        console.log('- Text:', panel.getText());
        console.log('- URL:', panel.getUrl());
        console.log('- Position:', position);
        console.log('- Total panels:', this.panels.size);

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

        console.log('Panel deleted:', panel.id);
        console.log('Remaining panels:', this.panels.size);
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

        // Add debugging for mode changes
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Tab') {
                console.log('Tab pressed - current mode:', this.isEditMode ? 'Edit' : 'View');
            }
        });
    }

    setEditMode(isEdit) {
        console.log('Setting edit mode:', isEdit);
        this.isEditMode = isEdit;
        this.movementController.setEnabled(!isEdit);
        this.editorController.setEnabled(isEdit);

        // Exit panel editing when switching modes
        if (!isEdit && this.panelEditor.isEditing()) {
            console.log('Exiting panel editing due to mode switch');
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

    // Method for SaveLoadController to get panels data
    getPanelsData() {
        const panelsData = this.getPanels().map(panel => panel.toJSON());
        console.log('Getting panels data:', panelsData.length, 'panels');
        return panelsData;
    }

    // Method for SaveLoadController to load panels data
    loadPanelsData(panelsData) {
        console.log('Loading panels data:', panelsData.length, 'panels');

        // Clear existing panels
        this.panels.forEach(panel => this.deletePanel(panel));

        // Load panels from data
        panelsData.forEach(data => {
            console.log('Loading panel:', data);
            const panel = PanelObject.fromJSON(data);
            const group = panel.getGroup();

            this.scene.add(group);
            this.placedObjects.push(group);
            this.panels.set(group, panel);
        });

        console.log(`Loaded ${panelsData.length} panels from saved data`);
    }

    // Method for SaveLoadController to clear all panels
    clearAllPanels() {
        console.log('Clearing all panels');
        this.panels.forEach(panel => this.deletePanel(panel));
        console.log('All panels cleared');
    }

    savePanelsData() {
        const panelsData = this.getPanels().map(panel => panel.toJSON());
        console.log('Saving panels data:', panelsData);
        return panelsData;
    }

    saveColliderTransform() {
        console.log('Saving collider transform and panels data');
        return this.saveLoadController.saveTransform();
    }

    loadColliderTransform() {
        console.log('Loading collider transform and panels data');
        return this.saveLoadController.loadTransform();
    }

    resetColliderTransform() {
        console.log('Resetting collider transform and panels data');
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