import {
    WebGLRenderer,
    PerspectiveCamera,
    Scene,
    DirectionalLight,
    AmbientLight,
    Raycaster,
    Vector2
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
        this.raycaster = new Raycaster();
        this.mouse = new Vector2();

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

        this.saveLoadController.setApp(this);

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

        // NEW: Listen for panel save and download events
        document.addEventListener('panelSaveAndDownload', (event) => {
            console.log('Panel saved, triggering data.json download...');
            this.saveColliderTransform();

            // Provide user feedback
            this.showSaveNotification('Panel saved! Data.json downloaded. Place it in the assets/ folder.');
        });
    }

    createPanel(position, text = 'New Panel', url = '') {
        const panel = new PanelObject(position, text, url);
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
        window.addEventListener('click', (event) => {
            this.onViewModeClick(event);
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
        console.log(`Saving ${panelsData.length} panels:`, panelsData.map(p => ({id: p.id, text: p.text.substring(0, 20) + '...'})));
        return panelsData;
    }

    loadPanelsData(panelsData) {
        // Clear existing panels properly
        const existingPanels = Array.from(this.panels.values()); // Create array copy first
        existingPanels.forEach(panel => this.deletePanel(panel));

        // Load panels from data
        panelsData.forEach(data => {
            // Use PanelObject.fromJSON instead of createPanel for loading
            const panel = PanelObject.fromJSON(data);
            const group = panel.getGroup();

            this.scene.add(group);
            this.placedObjects.push(group);
            this.panels.set(group, panel);
        });

        console.log(`Loaded ${panelsData.length} panels from data`);
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


    onViewModeClick(event) {
        // Don't handle clicks if in edit mode or if panel editor is active
        if (this.isEditMode || (this.panelEditor && this.panelEditor.isEditing())) {
            return;
        }

        // Check if click was on UI element
        if (this.isClickOnUI(event)) {
            return;
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get all panel meshes
        const panelMeshes = [];
        this.panels.forEach((panel, group) => {
            group.traverse((child) => {
                if (child.isMesh) {
                    panelMeshes.push(child);
                }
            });
        });

        const intersects = this.raycaster.intersectObjects(panelMeshes);

        if (intersects.length > 0) {
            // Find the panel object that contains this mesh
            const clickedMesh = intersects[0].object;
            let panelGroup = clickedMesh.parent;

            // Find the panel object in our panels map
            const panel = this.panels.get(panelGroup);

            if (panel && panel.hasUrl()) {
                // Try to open the URL
                const success = panel.openUrl();
                if (success) {
                    console.log(`Opened panel URL: ${panel.getUrl()}`);
                } else {
                    console.warn(`Failed to open panel URL: ${panel.getUrl()}`);
                }
            } else if (panel) {
                console.log('Panel clicked but has no URL');
            }
        }
    }

    isClickOnUI(event) {
        // Check if the click target or any of its parents is a UI element
        let element = event.target;
        while (element) {
            // Check for common UI classes and elements
            if (element.classList && (
                element.classList.contains('ui-panel') ||
                element.classList.contains('object-tools') ||
                element.classList.contains('mode-toggle') ||
                element.classList.contains('controls-info') ||
                element.classList.contains('panel-edit-buttons') ||
                element.classList.contains('panel-text-overlay') ||
                element.tagName === 'BUTTON' ||
                element.tagName === 'INPUT' ||
                element.tagName === 'TEXTAREA'
            )) {
                return true;
            }
            element = element.parentElement;
        }
        return false;
    }

    // NEW: Show save notification to user
    showSaveNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.95);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 350px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        notification.textContent = message;

        // Add to DOM
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Add click to dismiss
        notification.addEventListener('click', () => {
            notification.remove();
        });

        notification.style.cursor = 'pointer';
    }

    debugPanelCount() {
        console.log(`Panels in memory: ${this.panels.size}`);
        console.log(`Placed objects: ${this.placedObjects.length}`);
        console.log('Panel IDs:', Array.from(this.panels.values()).map(p => p.id));
        return {
            panelsCount: this.panels.size,
            placedObjectsCount: this.placedObjects.length,
            panelIds: Array.from(this.panels.values()).map(p => p.id)
        };
    }
}

// Launch application
const app = new LumaSceneApp();

// Make globally available for debugging
window.lumaApp = app;