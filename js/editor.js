import {
    Vector3,
    BoxGeometry,
    SphereGeometry,
    CylinderGeometry,
    MeshStandardMaterial,
    Mesh
} from 'three';
import { SmartPlacementSystem } from './placement-system.js';

export class EditorController {
    constructor(scene, camera, placedObjects) {
        this.scene = scene;
        this.camera = camera;
        this.placedObjects = placedObjects;
        this.enabled = false;

        this.selectedObjectType = 'cube';
        this.splat = null;
        this.splatProxy = null; // Proxy геометрия для лучшего ray casting

        // Инициализируем систему умного размещения
        this.placementSystem = new SmartPlacementSystem(scene, camera);

        this.bindEvents();

        console.log('EditorController initialized with smart placement');
    }

    bindEvents() {
        document.addEventListener('click', this.onClick.bind(this));

        // Дополнительные события для отладки
        document.addEventListener('keydown', (event) => {
            // P - переключить отладочные плоскости
            if (event.code === 'KeyP' && this.enabled) {
                event.preventDefault();
                this.placementSystem.setDebugMode(!this.placementSystem.showDebugPlanes);
                console.log('Debug planes:', this.placementSystem.showDebugPlanes ? 'ON' : 'OFF');
            }
        });
    }

    onClick(event) {
        if (!this.enabled) return;

        // Игнорируем клики по UI элементам
        if (event.target.closest('.ui-panel')) return;

        // Вычисляем координаты мыши в нормализованном пространстве
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

        if (this.selectedObjectType === 'delete') {
            this.deleteObject(mouseX, mouseY);
        } else {
            this.placeObject(mouseX, mouseY);
        }
    }

    placeObject(mouseX, mouseY) {
        // Используем систему умного размещения
        const placement = this.placementSystem.getPlacementPosition(
            mouseX,
            mouseY,
            this.splat,
            this.placedObjects
        );

        if (placement && placement.position) {
            const newObject = this.createObject(
                this.selectedObjectType,
                placement.position,
                placement.normal,
                placement.surface
            );

            if (newObject) {
                this.scene.add(newObject);
                this.placedObjects.push(newObject);

                console.log(`Added ${this.selectedObjectType} on ${placement.surface}:`, {
                    position: placement.position,
                    normal: placement.normal
                });
            }
        } else {
            console.warn('Could not find placement position');

            // Fallback: размещение перед камерой
            this.placeObjectInFrontOfCamera();
        }
    }

    // Fallback метод размещения
    placeObjectInFrontOfCamera() {
        const direction = new Vector3();
        this.camera.getWorldDirection(direction);

        const position = this.camera.position.clone();
        position.add(direction.multiplyScalar(2));

        const newObject = this.createObject(
            this.selectedObjectType,
            position,
            direction.negate(),
            'air'
        );

        if (newObject) {
            this.scene.add(newObject);
            this.placedObjects.push(newObject);
            console.log(`Added ${this.selectedObjectType} in front of camera (fallback)`);
        }
    }

    deleteObject(mouseX, mouseY) {
        // Для удаления используем более простой ray casting только с объектами
        const placement = this.placementSystem.getPlacementPosition(
            mouseX,
            mouseY,
            null, // не используем splat для удаления
            this.placedObjects
        );

        // Альтернативный подход: прямой ray casting с объектами
        this.placementSystem.mouse.x = mouseX;
        this.placementSystem.mouse.y = mouseY;
        this.placementSystem.raycaster.setFromCamera(this.placementSystem.mouse, this.camera);

        const intersects = this.placementSystem.raycaster.intersectObjects(this.placedObjects);

        if (intersects.length > 0) {
            const objectToRemove = intersects[0].object;
            this.scene.remove(objectToRemove);

            const index = this.placedObjects.indexOf(objectToRemove);
            if (index > -1) {
                this.placedObjects.splice(index, 1);
            }

            // Очистка памяти
            objectToRemove.geometry.dispose();
            objectToRemove.material.dispose();

            console.log('Removed object:', objectToRemove.userData);
        }
    }

    createObject(type, position, normal = new Vector3(0, 1, 0), surface = 'unknown') {
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

        // Ориентируем объект по нормали поверхности
        if (type === 'cylinder') {
            // Цилиндр ориентируем вертикально относительно поверхности
            mesh.lookAt(position.clone().add(normal));
        }

        mesh.userData = {
            type: type,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            surface: surface,
            normal: normal.toArray()
        };

        return mesh;
    }

    setSelectedObjectType(type) {
        this.selectedObjectType = type;
        console.log(`Selected object type: ${type}`);
    }

    setSplat(splat) {
        this.splat = splat;

        // Создаем proxy для лучшего взаимодействия
        if (splat) {
            this.createSplatProxy();
        }
    }

    createSplatProxy() {
        if (this.splatProxy) {
            this.scene.remove(this.splatProxy);
        }

        this.splatProxy = this.placementSystem.createSplatProxy(this.splat);

        if (this.splatProxy) {
            this.scene.add(this.splatProxy);
            console.log('Created splat proxy for better object placement');
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`Editor ${enabled ? 'enabled' : 'disabled'}`);
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
                createdAt: obj.userData.createdAt,
                surface: obj.userData.surface,
                normal: obj.userData.normal
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
            const normal = objData.normal ? new Vector3(...objData.normal) : new Vector3(0, 1, 0);

            const newObject = this.createObject(
                objData.type,
                position,
                normal,
                objData.surface || 'unknown'
            );

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

    // Очистка ресурсов
    dispose() {
        if (this.splatProxy) {
            this.scene.remove(this.splatProxy);
        }

        this.placementSystem.dispose();
    }
}