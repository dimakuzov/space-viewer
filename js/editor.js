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
        this.glbModel = null;

        // Настройки для GLB модели
        this.glbPositionStep = 0.1;
        this.glbScaleStep = 0.1;
        this.glbRotationStep = Math.PI / 36; // 5 градусов

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', this.onClick.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    onKeyDown(event) {
        if (!this.enabled || !this.glbModel) return;

        const step = event.shiftKey ? this.glbPositionStep * 5 : this.glbPositionStep;
        const scaleStep = event.shiftKey ? this.glbScaleStep * 5 : this.glbScaleStep;
        const rotStep = event.shiftKey ? this.glbRotationStep * 5 : this.glbRotationStep;

        switch(event.code) {
            // Позиция GLB модели
            case 'KeyI': // Вперед по Z
                this.glbModel.position.z -= step;
                this.logGLBTransform();
                event.preventDefault();
                break;
            case 'KeyK': // Назад по Z
                this.glbModel.position.z += step;
                this.logGLBTransform();
                event.preventDefault();
                break;
            case 'KeyJ': // Влево по X
                this.glbModel.position.x -= step;
                this.logGLBTransform();
                event.preventDefault();
                break;
            case 'KeyL': // Вправо по X
                this.glbModel.position.x += step;
                this.logGLBTransform();
                event.preventDefault();
                break;
            case 'KeyU': // Вверх по Y
                this.glbModel.position.y += step;
                this.logGLBTransform();
                event.preventDefault();
                break;
            case 'KeyO': // Вниз по Y
                this.glbModel.position.y -= step;
                this.logGLBTransform();
                event.preventDefault();
                break;

            // Масштаб GLB модели
            case 'Equal': // Увеличить масштаб
            case 'NumpadAdd':
                this.glbModel.scale.addScalar(scaleStep);
                this.logGLBTransform();
                event.preventDefault();
                break;
            case 'Minus': // Уменьшить масштаб
            case 'NumpadSubtract':
                const newScale = Math.max(0.1, this.glbModel.scale.x - scaleStep);
                this.glbModel.scale.set(newScale, newScale, newScale);
                this.logGLBTransform();
                event.preventDefault();
                break;

            // Поворот GLB модели
            case 'KeyY': // Поворот по Y
                this.glbModel.rotation.y += rotStep;
                this.logGLBTransform();
                event.preventDefault();
                break;
            case 'KeyH': // Поворот по Y назад
                this.glbModel.rotation.y -= rotStep;
                this.logGLBTransform();
                event.preventDefault();
                break;

            // Сброс трансформации
            case 'KeyR':
                if (event.ctrlKey) {
                    this.resetGLBTransform();
                    event.preventDefault();
                }
                break;
        }
    }

    onClick(event) {
        if (!this.enabled) return;

        // Вычисляем координаты мыши в нормализованном пространстве
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.selectedObjectType === 'delete') {
            this.deleteObject();
        } else if (this.selectedObjectType === 'cube') {
            this.placeObject();
        }
    }

    placeObject() {
        // Ищем пересечения с существующими объектами, GLB моделью и splat
        const intersectTargets = [...this.placedObjects];
        if (this.splat) {
            intersectTargets.push(this.splat);
        }
        if (this.glbModel) {
            // Добавляем все меши GLB модели для raycast
            this.glbModel.traverse((child) => {
                if (child.isMesh) {
                    intersectTargets.push(child);
                }
            });
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

    setGLBModel(glbModel) {
        this.glbModel = glbModel;
        console.log('GLB model set for editor');
        this.logGLBTransform();
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled && this.glbModel) {
            console.log('GLB Editor Controls:');
            console.log('Position: I/K (Z), J/L (X), U/O (Y)');
            console.log('Scale: +/- or NumPad +/-');
            console.log('Rotation: Y/H (Y-axis)');
            console.log('Reset: Ctrl+R');
            console.log('Hold Shift for faster movement');
            this.logGLBTransform();
        }
    }

    resetGLBTransform() {
        if (!this.glbModel) return;

        this.glbModel.position.set(0, 0, 0);
        this.glbModel.scale.set(1, 1, 1);
        this.glbModel.rotation.set(0, 0, 0);

        console.log('GLB transform reset to default');
        this.logGLBTransform();
    }

    logGLBTransform() {
        if (!this.glbModel) return;

        const pos = this.glbModel.position;
        const scale = this.glbModel.scale;
        const rot = this.glbModel.rotation;

        console.log(`GLB Transform:
Position: (${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)})
Scale: (${scale.x.toFixed(3)}, ${scale.y.toFixed(3)}, ${scale.z.toFixed(3)})
Rotation: (${(rot.x * 180/Math.PI).toFixed(1)}°, ${(rot.y * 180/Math.PI).toFixed(1)}°, ${(rot.z * 180/Math.PI).toFixed(1)}°)`);
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
            glbTransform: this.glbModel ? {
                position: this.glbModel.position.toArray(),
                rotation: this.glbModel.rotation.toArray(),
                scale: this.glbModel.scale.toArray()
            } : null,
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

        // Загружаем GLB трансформацию
        if (sceneData.glbTransform && this.glbModel) {
            this.glbModel.position.fromArray(sceneData.glbTransform.position);
            this.glbModel.rotation.fromArray(sceneData.glbTransform.rotation);
            this.glbModel.scale.fromArray(sceneData.glbTransform.scale);
        }

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
        if (sceneData.glbTransform) {
            console.log('GLB transform restored');
            this.logGLBTransform();
        }
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