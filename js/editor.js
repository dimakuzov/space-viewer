import {
    Raycaster,
    Vector2,
    Vector3,
    BoxGeometry,
    SphereGeometry,
    CylinderGeometry,
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
        this.glbMesh = null;

        // GLB positioning state
        this.isPositioningGLB = false;
        this.glbMoveStep = 0.1; // 10cm steps

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', this.onClick.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    onClick(event) {
        if (!this.enabled) return;

        // Вычисляем координаты мыши в нормализованном пространстве
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.selectedObjectType === 'delete') {
            this.deleteObject();
        } else if (this.selectedObjectType === 'glb-position') {
            this.toggleGLBPositioning();
        } else {
            this.placeObject();
        }
    }

    onKeyDown(event) {
        if (!this.enabled || !this.isPositioningGLB || !this.glbMesh) return;

        const step = this.glbMoveStep;
        let moved = false;

        switch(event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.glbMesh.position.z -= step;
                moved = true;
                break;
            case 's':
            case 'arrowdown':
                this.glbMesh.position.z += step;
                moved = true;
                break;
            case 'a':
            case 'arrowleft':
                this.glbMesh.position.x -= step;
                moved = true;
                break;
            case 'd':
            case 'arrowright':
                this.glbMesh.position.x += step;
                moved = true;
                break;
            case 'q':
                this.glbMesh.position.y += step;
                moved = true;
                break;
            case 'e':
                this.glbMesh.position.y -= step;
                moved = true;
                break;
            case 'r':
                this.glbMesh.rotation.y += Math.PI / 8; // 22.5 degrees
                moved = true;
                break;
            case 'f':
                this.glbMesh.rotation.y -= Math.PI / 8; // 22.5 degrees
                moved = true;
                break;
            case 'escape':
                this.isPositioningGLB = false;
                this.updateGLBVisibility();
                console.log('GLB positioning mode disabled');
                return;
            case '=':
            case '+':
                this.glbMoveStep = Math.min(this.glbMoveStep * 2, 1.0);
                console.log(`GLB move step: ${this.glbMoveStep}m`);
                return;
            case '-':
            case '_':
                this.glbMoveStep = Math.max(this.glbMoveStep / 2, 0.01);
                console.log(`GLB move step: ${this.glbMoveStep}m`);
                return;
        }

        if (moved) {
            console.log('GLB position:', {
                x: this.glbMesh.position.x.toFixed(3),
                y: this.glbMesh.position.y.toFixed(3),
                z: this.glbMesh.position.z.toFixed(3),
                rotationY: (this.glbMesh.rotation.y * 180 / Math.PI).toFixed(1) + '°'
            });
            event.preventDefault();
        }
    }

    placeObject() {
        // Ищем пересечения с существующими объектами, splat и GLB
        const intersectTargets = [...this.placedObjects];
        if (this.splat) {
            intersectTargets.push(this.splat);
        }
        if (this.glbMesh) {
            intersectTargets.push(this.glbMesh);
        }

        const intersects = this.raycaster.intersectObjects(intersectTargets, true);

        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;
            const newObject = this.createObject(this.selectedObjectType, intersectionPoint);

            if (newObject) {
                this.scene.add(newObject);
                this.placedObjects.push(newObject);
                console.log(`Added ${this.selectedObjectType} at:`, intersectionPoint);
            }
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

    toggleGLBPositioning() {
        if (!this.glbMesh) {
            console.warn('GLB mesh not loaded');
            return;
        }

        this.isPositioningGLB = !this.isPositioningGLB;
        this.updateGLBVisibility();

        if (this.isPositioningGLB) {
            console.log('GLB positioning mode enabled');
            console.log('Controls:');
            console.log('  WASD / Arrow Keys - Move X/Z');
            console.log('  Q/E - Move Up/Down');
            console.log('  R/F - Rotate');
            console.log('  +/- - Change step size');
            console.log('  ESC - Exit positioning mode');
            console.log('Current position:', {
                x: this.glbMesh.position.x.toFixed(3),
                y: this.glbMesh.position.y.toFixed(3),
                z: this.glbMesh.position.z.toFixed(3)
            });
        } else {
            console.log('GLB positioning mode disabled');
        }
    }

    updateGLBVisibility() {
        if (!this.glbMesh) return;

        // Make GLB more visible during positioning
        this.glbMesh.traverse((child) => {
            if (child.isMesh) {
                if (this.isPositioningGLB) {
                    // Highlight mode - make it more visible
                    child.material.transparent = true;
                    child.material.opacity = 0.8;
                    child.material.wireframe = false;
                    // Add slight emissive glow
                    if (child.material.emissive) {
                        child.material.emissive.setHex(0x220022);
                    }
                } else {
                    // Normal mode - restore original appearance
                    child.material.transparent = false;
                    child.material.opacity = 1.0;
                    child.material.wireframe = false;
                    if (child.material.emissive) {
                        child.material.emissive.setHex(0x000000);
                    }
                }
            }
        });
    }

    createObject(type, position) {
        let geometry, material, mesh;

        // Размер 20см = 0.2 в Three.js единицах
        const size = 0.2;

        switch(type) {
            case 'cube':
                geometry = new BoxGeometry(size, size, size);
                material = new MeshStandardMaterial({
                    color: 0xff4444,
                    metalness: 0.1,
                    roughness: 0.7
                });
                break;

            case 'sphere':
                geometry = new SphereGeometry(size/2, 16, 16);
                material = new MeshStandardMaterial({
                    color: 0x44ff44,
                    metalness: 0.1,
                    roughness: 0.7
                });
                break;

            case 'cylinder':
                geometry = new CylinderGeometry(size/2, size/2, size, 16);
                material = new MeshStandardMaterial({
                    color: 0x4444ff,
                    metalness: 0.1,
                    roughness: 0.7
                });
                break;

            default:
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

        // If we're switching away from GLB positioning, disable it
        if (type !== 'glb-position' && this.isPositioningGLB) {
            this.isPositioningGLB = false;
            this.updateGLBVisibility();
        }
    }

    setSplat(splat) {
        this.splat = splat;
    }

    setGLBMesh(glbMesh) {
        this.glbMesh = glbMesh;
        console.log('GLB mesh set for editor');
    }

    setEnabled(enabled) {
        this.enabled = enabled;

        // If disabling editor, also disable GLB positioning
        if (!enabled && this.isPositioningGLB) {
            this.isPositioningGLB = false;
            this.updateGLBVisibility();
        }
    }

    // Get current GLB transform for saving
    getGLBTransform() {
        if (!this.glbMesh) return null;

        return {
            position: {
                x: this.glbMesh.position.x,
                y: this.glbMesh.position.y,
                z: this.glbMesh.position.z
            },
            rotation: {
                x: this.glbMesh.rotation.x,
                y: this.glbMesh.rotation.y,
                z: this.glbMesh.rotation.z
            },
            scale: {
                x: this.glbMesh.scale.x,
                y: this.glbMesh.scale.y,
                z: this.glbMesh.scale.z
            }
        };
    }

    // Set GLB transform from saved data
    setGLBTransform(transform) {
        if (!this.glbMesh || !transform) return;

        if (transform.position) {
            this.glbMesh.position.set(
                transform.position.x,
                transform.position.y,
                transform.position.z
            );
        }

        if (transform.rotation) {
            this.glbMesh.rotation.set(
                transform.rotation.x,
                transform.rotation.y,
                transform.rotation.z
            );
        }

        if (transform.scale) {
            this.glbMesh.scale.set(
                transform.scale.x,
                transform.scale.y,
                transform.scale.z
            );
        }

        console.log('GLB transform applied:', transform);
    }

    // Методы для сохранения/загрузки (пока закомментированы)
    /*
    exportScene() {
        const sceneData = {
            objects: this.placedObjects.map(obj => ({
                type: obj.userData.type,
                position: obj.position.toArray(),
                rotation: obj.rotation.toArray(),
                scale: obj.scale.toArray(),
                id: obj.userData.id,
                createdAt: obj.userData.createdAt
            })),
            glbTransform: this.getGLBTransform(),
            metadata: {
                exportedAt: new Date().toISOString(),
                objectCount: this.placedObjects.length
            }
        };

        return sceneData;
    }

    importScene(sceneData) {
        // Очищаем существующие объекты
        this.clearScene();

        // Загружаем GLB transform
        if (sceneData.glbTransform) {
            this.setGLBTransform(sceneData.glbTransform);
        }

        // Загружаем объекты из данных
        sceneData.objects.forEach(objData => {
            const position = new THREE.Vector3(...objData.position);
            const newObject = this.createObject(objData.type, position);

            if (newObject) {
                // Восстанавливаем поворот и масштаб
                newObject.rotation.fromArray(objData.rotation);
                newObject.scale.fromArray(objData.scale);
                newObject.userData.id = objData.id;
                newObject.userData.createdAt = objData.createdAt;

                this.scene.add(newObject);
                this.placedObjects.push(newObject);
            }
        });

        console.log(`Imported ${sceneData.objects.length} objects`);
    }

    clearScene() {
        this.placedObjects.forEach(obj => {
            this.scene.remove(obj);
            obj.geometry.dispose();
            obj.material.dispose();
        });
        this.placedObjects.length = 0;
    }
    */
}