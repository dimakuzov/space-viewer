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

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', this.onClick.bind(this));
    }

    onClick(event) {
        if (!this.enabled) return;

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
        console.log('Splat set for editor');
    }

    setCollisionMesh(collisionMesh) {
        this.collisionMesh = collisionMesh;
        console.log('Collision mesh set for editor');
    }

    setEnabled(enabled) {
        this.enabled = enabled;
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

        // Загружаем объекты из данных
        sceneData.objects.forEach(objData => {
            const position = new Vector3(...objData.position);
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