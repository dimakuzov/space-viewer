import {
    Raycaster,
    Vector2,
    Vector3,
    BoxGeometry,
    MeshStandardMaterial,
    Mesh
} from 'three';

export class EditorController {
    constructor(scene, camera, placedObjects) {
        this.scene = scene;
        this.camera = camera;
        this.placedObjects = placedObjects;
        this.enabled = false;

        this.raycaster = new Raycaster();
        this.mouse = new Vector2();

        this.selectedObjectType = 'cube';
        this.splat = null;
        this.collisionMesh = null; // GLB mesh для коллизий
        this.glbVisible = false; // Состояние видимости GLB

        // New properties for collider editing
        this.colliderEditMode = false;
        this.colliderMoveSpeed = 0.05; // 5 cm per frame
        this.colliderKeys = {
            forward: false,
            backward: false,
            left: false,
            right: false
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
        }
    }

    updateColliderMovement() {
        if (!this.colliderEditMode || !this.collisionMesh) return;

        const moveVector = new Vector3();

        // Calculate movement based on camera direction
        if (this.colliderKeys.forward || this.colliderKeys.backward) {
            const forward = new Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0; // Keep movement horizontal
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
            right.y = 0; // Keep movement horizontal
            right.normalize();

            if (this.colliderKeys.right) {
                moveVector.add(right.multiplyScalar(this.colliderMoveSpeed));
            }
            if (this.colliderKeys.left) {
                moveVector.add(right.multiplyScalar(-this.colliderMoveSpeed));
            }
        }

        // Apply movement to collision mesh
        if (moveVector.length() > 0) {
            this.collisionMesh.position.add(moveVector);
            console.log(`Collider moved to: ${this.collisionMesh.position.x.toFixed(3)}, ${this.collisionMesh.position.y.toFixed(3)}, ${this.collisionMesh.position.z.toFixed(3)}`);
        }
    }

    onClick(event) {
        if (!this.enabled || this.colliderEditMode) return;

        // Вычисляем координаты мыши в нормализованном пространстве
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.selectedObjectType === 'delete') {
            this.deleteObject();
        } else {
            this.placeObject();
        }
    }

    placeObject() {
        // Создаем список объектов для ray casting
        const intersectTargets = [...this.placedObjects];
        // Добавляем collision mesh если он загружен
        if (this.collisionMesh) {
            // Получаем все mesh объекты из collision mesh (включая дочерние)
            const meshes = [];
            this.collisionMesh.traverse((child) => {
                if (child.isMesh) {
                    meshes.push(child);
                }
            });
            intersectTargets.push(...meshes);
        }

        // Если collision mesh не загружен, используем splat как fallback
        if (!this.collisionMesh && this.splat) {
            intersectTargets.push(this.splat);
        }

        const intersects = this.raycaster.intersectObjects(intersectTargets);

        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;
            const newObject = this.createObject(this.selectedObjectType, intersectionPoint);

            this.scene.add(newObject);
            this.placedObjects.push(newObject);

            console.log(`Added ${this.selectedObjectType} at:`, intersectionPoint);
            console.log('Intersected with:', intersects[0].object.type || 'unknown object');
        } else {
            console.log('No intersection found');
        }
    }

    deleteObject() {
        const intersects = this.raycaster.intersectObjects(this.placedObjects);

        if (intersects.length > 0) {
            const objectToRemove = intersects[0].object;
            this.scene.remove(objectToRemove);

            const index = this.placedObjects.indexOf(objectToRemove);
            if (index > -1) {
                this.placedObjects.splice(index, 1);
            }

            console.log('Removed object:', objectToRemove.userData);
        }
    }

    createObject(type, position) {
        let geometry, material, mesh;

        // Размер 20см = 0.2 в Three.js единицах
        const size = 0.2;

        if (type === 'cube') {
            geometry = new BoxGeometry(size, size, size);
            material = new MeshStandardMaterial({
                color: 0xff4444,
                metalness: 0.1,
                roughness: 0.7
            });
        } else {
            console.warn(`Unknown object type: ${type}`);
            return null;
        }

        mesh = new Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = {
            type: type,
            id: Date.now(),
            createdAt: new Date().toISOString()
        };

        return mesh;
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

    // Новый метод для переключения видимости GLB
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

    // Метод для получения текущего состояния видимости GLB
    isGLBVisible() {
        return this.glbVisible;
    }

    // New methods for collider editing
    setColliderEditMode(enabled) {
        this.colliderEditMode = enabled;

        // Reset all keys when disabling
        if (!enabled) {
            Object.keys(this.colliderKeys).forEach(key => {
                this.colliderKeys[key] = false;
            });
        }

        console.log(`Collider edit mode: ${enabled ? 'ON' : 'OFF'}`);

        // Make GLB visible when in collider edit mode
        if (enabled && this.collisionMesh && !this.glbVisible) {
            this.toggleGLBVisibility();
        }
    }

    isColliderEditMode() {
        return this.colliderEditMode;
    }

    // Method to be called in the render loop
    update() {
        if (this.enabled && this.colliderEditMode) {
            this.updateColliderMovement();
        }
    }
}