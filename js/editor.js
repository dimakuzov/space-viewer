import {
    Raycaster,
    Vector2,
    Vector3
} from 'three';

import { PanelObject } from './panel.js';

export class EditorController {
    constructor(scene, camera, placedObjects, panelEditor) {
        this.scene = scene;
        this.camera = camera;
        this.placedObjects = placedObjects;
        this.panelEditor = panelEditor;
        this.enabled = false;

        this.raycaster = new Raycaster();
        this.mouse = new Vector2();

        this.selectedObjectType = 'panel';
        this.splat = null;
        this.collisionMesh = null;
        this.glbVisible = false;

        // Collider editing properties
        this.colliderEditMode = false;
        this.colliderMoveSpeed = 0.03;
        this.colliderScaleSpeed = 0.01;
        this.colliderRotationSpeed = 0.01;
        this.colliderKeys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            scaleUp: false,
            scaleDown: false,
            rotateLeft: false,
            rotateRight: false
        };

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', this.onClick.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        if (!this.enabled || !this.colliderEditMode) return;

        switch(event.code) {
            case 'KeyW':
                this.colliderKeys.forward = true;
                event.preventDefault();
                break;
            case 'KeyS':
                this.colliderKeys.backward = true;
                event.preventDefault();
                break;
            case 'KeyA':
                this.colliderKeys.left = true;
                event.preventDefault();
                break;
            case 'KeyD':
                this.colliderKeys.right = true;
                event.preventDefault();
                break;
            case 'KeyQ':
                this.colliderKeys.up = true;
                event.preventDefault();
                break;
            case 'KeyE':
                this.colliderKeys.down = true;
                event.preventDefault();
                break;
            case 'KeyF':
                this.colliderKeys.scaleDown = true;
                event.preventDefault();
                break;
            case 'KeyR':
                this.colliderKeys.scaleUp = true;
                event.preventDefault();
                break;
            case 'KeyT':
                this.colliderKeys.rotateLeft = true;
                event.preventDefault();
                break;
            case 'KeyY':
                this.colliderKeys.rotateRight = true;
                event.preventDefault();
                break;
        }
    }

    onKeyUp(event) {
        if (!this.enabled || !this.colliderEditMode) return;

        switch(event.code) {
            case 'KeyW':
                this.colliderKeys.forward = false;
                break;
            case 'KeyS':
                this.colliderKeys.backward = false;
                break;
            case 'KeyA':
                this.colliderKeys.left = false;
                break;
            case 'KeyD':
                this.colliderKeys.right = false;
                break;
            case 'KeyQ':
                this.colliderKeys.up = false;
                break;
            case 'KeyE':
                this.colliderKeys.down = false;
                break;
            case 'KeyF':
                this.colliderKeys.scaleDown = false;
                break;
            case 'KeyR':
                this.colliderKeys.scaleUp = false;
                break;
            case 'KeyT':
                this.colliderKeys.rotateLeft = false;
                break;
            case 'KeyY':
                this.colliderKeys.rotateRight = false;
                break;
        }
    }

    updateColliderMovement() {
        if (!this.colliderEditMode || !this.collisionMesh) return;

        const moveVector = new Vector3();
        let scaleChanged = false;
        let rotationChanged = false;

        // Handle movement (WASD)
        if (this.colliderKeys.forward || this.colliderKeys.backward) {
            const forward = new Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            if (this.colliderKeys.forward) {
                moveVector.add(forward.multiplyScalar(this.colliderMoveSpeed));
            }
            if (this.colliderKeys.backward) {
                moveVector.add(forward.multiplyScalar(-this.colliderMoveSpeed));
            }
        }

        if (this.colliderKeys.left || this.colliderKeys.right) {
            const right = new Vector3();
            this.camera.getWorldDirection(right);
            right.cross(this.camera.up);
            right.y = 0;
            right.normalize();

            if (this.colliderKeys.right) {
                moveVector.add(right.multiplyScalar(this.colliderMoveSpeed));
            }
            if (this.colliderKeys.left) {
                moveVector.add(right.multiplyScalar(-this.colliderMoveSpeed));
            }
        }

        if (this.colliderKeys.up || this.colliderKeys.down) {
            const vertical = new Vector3(0, 1, 0);

            if (this.colliderKeys.up) {
                moveVector.add(vertical.clone().multiplyScalar(this.colliderMoveSpeed));
            }
            if (this.colliderKeys.down) {
                moveVector.add(vertical.clone().multiplyScalar(-this.colliderMoveSpeed));
            }
        }

        // Handle scaling
        if (this.colliderKeys.scaleUp || this.colliderKeys.scaleDown) {
            const currentScale = this.collisionMesh.scale.x;
            let newScale = currentScale;

            if (this.colliderKeys.scaleUp) {
                newScale = currentScale * (1 + this.colliderScaleSpeed);
                console.log(`Scaling UP: ${currentScale.toFixed(4)} -> ${newScale.toFixed(4)}`);
            }
            if (this.colliderKeys.scaleDown) {
                newScale = currentScale * (1 - this.colliderScaleSpeed);
                console.log(`Scaling Down: ${currentScale.toFixed(4)} -> ${newScale.toFixed(4)}`);
            }

            if (newScale > 0.01) {
                this.collisionMesh.scale.setScalar(newScale);
                scaleChanged = true;
            }
        }

        // Handle rotation
        if (this.colliderKeys.rotateLeft || this.colliderKeys.rotateRight) {
            if (this.colliderKeys.rotateLeft) {
                this.collisionMesh.rotation.y += this.colliderRotationSpeed;
            }
            if (this.colliderKeys.rotateRight) {
                this.collisionMesh.rotation.y -= this.colliderRotationSpeed;
            }
            rotationChanged = true;
        }

        // Apply movement
        if (moveVector.length() > 0) {
            this.collisionMesh.position.add(moveVector);
            console.log(`Collider moved to: ${this.collisionMesh.position.x.toFixed(3)}, ${this.collisionMesh.position.y.toFixed(3)}, ${this.collisionMesh.position.z.toFixed(3)}`);
        }

        if (scaleChanged) {
            console.log(`Collider scale: ${this.collisionMesh.scale.x.toFixed(4)}`);
        }

        if (rotationChanged) {
            const rotationRadians = this.collisionMesh.rotation.y;
            const rotationDegrees = (rotationRadians * 180 / Math.PI);
            const normalizedDegrees = ((rotationDegrees % 360) + 360) % 360;
            console.log(`Collider rotation: ${normalizedDegrees.toFixed(2)}° (${rotationRadians.toFixed(4)} rad)`);
        }
    }

    onClick(event) {
        if (!this.enabled || this.colliderEditMode) return;

        // Check if click was on UI element
        if (this.isClickOnUI(event)) {
            console.log('Click on UI element - ignoring interaction');
            return;
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.selectedObjectType === 'panel') {
            // Check if we clicked on an existing panel first
            const panelClicked = this.checkPanelClick();
            if (!panelClicked) {
                this.placePanel();
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

    checkPanelClick() {
        // Get all panel meshes
        const panelMeshes = [];
        this.placedObjects.forEach(obj => {
            if (obj.userData && obj.userData.type === 'panel') {
                // Find the mesh within the panel group
                obj.traverse((child) => {
                    if (child.isMesh) {
                        panelMeshes.push(child);
                    }
                });
            }
        });

        const intersects = this.raycaster.intersectObjects(panelMeshes);

        if (intersects.length > 0) {
            // Find the panel object that contains this mesh
            const clickedMesh = intersects[0].object;
            let panelGroup = clickedMesh.parent;

            // Find the panel object in our placed objects
            const panel = this.placedObjects.find(obj => obj === panelGroup);

            if (panel && panel.userData.type === 'panel') {
                // Start editing this panel
                this.editPanel(panel);
                return true;
            }
        }

        return false;
    }

    editPanel(panelGroup) {
        // Find the PanelObject that corresponds to this group
        // We need to dispatch an event to the main app to handle this
        const event = new CustomEvent('panelEdit', {
            detail: { panelGroup: panelGroup }
        });
        document.dispatchEvent(event);
    }

    placePanel() {
        const intersectTargets = [...this.placedObjects];

        if (this.collisionMesh) {
            const meshes = [];
            this.collisionMesh.traverse((child) => {
                if (child.isMesh) {
                    meshes.push(child);
                }
            });
            intersectTargets.push(...meshes);
        }

        if (!this.collisionMesh && this.splat) {
            intersectTargets.push(this.splat);
        }

        const intersects = this.raycaster.intersectObjects(intersectTargets);

        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;

            // Dispatch event to create panel
            const event = new CustomEvent('panelCreate', {
                detail: { position: intersectionPoint }
            });
            document.dispatchEvent(event);

            console.log(`Added panel at:`, intersectionPoint);
            console.log('Intersected with:', intersects[0].object.type || 'unknown object');
        } else {
            console.log('No intersection found');
        }
    }

    setSelectedObjectType(type) {
        this.selectedObjectType = type;
        console.log(`Selected object type: ${type}`);
    }

    setSplat(splat) {
        this.splat = splat;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        console.log('Editor enabled:', enabled);
    }

    setCollisionMesh(collisionMesh) {
        this.collisionMesh = collisionMesh;
        console.log('Collision mesh set for editor');
    }

    toggleGLBVisibility() {
        if (!this.collisionMesh) {
            console.warn('No collision mesh loaded');
            return false;
        }

        this.glbVisible = !this.glbVisible;

        this.collisionMesh.traverse((child) => {
            if (child.isMesh) {
                child.visible = this.glbVisible;
            }
        });

        console.log(`GLB visibility: ${this.glbVisible ? 'ON' : 'OFF'}`);
        return this.glbVisible;
    }

    isGLBVisible() {
        return this.glbVisible;
    }

    setColliderEditMode(enabled) {
        this.colliderEditMode = enabled;

        if (!enabled) {
            Object.keys(this.colliderKeys).forEach(key => {
                this.colliderKeys[key] = false;
            });
        }

        console.log(`Collider edit mode: ${enabled ? 'ON' : 'OFF'}`);

        if (enabled && this.collisionMesh && !this.glbVisible) {
            this.toggleGLBVisibility();
        }
    }

    isColliderEditMode() {
        return this.colliderEditMode;
    }

    update() {
        if (this.enabled && this.colliderEditMode) {
            this.updateColliderMovement();
        }
    }
}