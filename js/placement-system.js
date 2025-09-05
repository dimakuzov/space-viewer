import {
    Vector3,
    Raycaster,
    Vector2,
    BufferGeometry,
    BufferAttribute,
    Points,
    PointsMaterial,
    Mesh,
    PlaneGeometry,
    MeshBasicMaterial
} from 'three';

export class SmartPlacementSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.raycaster = new Raycaster();
        this.mouse = new Vector2();

        // Настройки для определения поверхностей
        this.raycaster.params.Points.threshold = 0.05; // Чувствительность для точек
        this.raycaster.params.Line.threshold = 0.01;

        // Виртуальные плоскости для размещения
        this.placementPlanes = [];
        this.showDebugPlanes = false; // для отладки

        this.initVirtualPlanes();
    }

    // Создаем виртуальные плоскости для комнаты
    initVirtualPlanes() {
        const planeSize = 10;
        const planeGeometry = new PlaneGeometry(planeSize, planeSize);
        const planeMaterial = new MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.1,
            visible: this.showDebugPlanes
        });

        // Пол
        const floor = new Mesh(planeGeometry, planeMaterial.clone());
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1; // примерная высота пола
        floor.userData = { type: 'floor', normal: new Vector3(0, 1, 0) };

        // Стены
        const wallFront = new Mesh(planeGeometry, planeMaterial.clone());
        wallFront.position.z = -3;
        wallFront.userData = { type: 'wall', normal: new Vector3(0, 0, 1) };

        const wallBack = new Mesh(planeGeometry, planeMaterial.clone());
        wallBack.position.z = 3;
        wallBack.rotation.y = Math.PI;
        wallBack.userData = { type: 'wall', normal: new Vector3(0, 0, -1) };

        const wallLeft = new Mesh(planeGeometry, planeMaterial.clone());
        wallLeft.position.x = -3;
        wallLeft.rotation.y = Math.PI / 2;
        wallLeft.userData = { type: 'wall', normal: new Vector3(1, 0, 0) };

        const wallRight = new Mesh(planeGeometry, planeMaterial.clone());
        wallRight.position.x = 3;
        wallRight.rotation.y = -Math.PI / 2;
        wallRight.userData = { type: 'wall', normal: new Vector3(-1, 0, 0) };

        this.placementPlanes = [floor, wallFront, wallBack, wallLeft, wallRight];

        // Добавляем плоскости в сцену (невидимые по умолчанию)
        this.placementPlanes.forEach(plane => {
            this.scene.add(plane);
        });
    }

    // Основной метод для определения позиции размещения
    getPlacementPosition(mouseX, mouseY, splat = null, placedObjects = []) {
        this.mouse.x = mouseX;
        this.mouse.y = mouseY;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Метод 1: Попробуем найти пересечение со splat
        if (splat && this.trySplatIntersection(splat)) {
            return this.lastSplatIntersection;
        }

        // Метод 2: Пересечение с размещенными объектами
        if (placedObjects.length > 0) {
            const objectIntersection = this.tryObjectIntersection(placedObjects);
            if (objectIntersection) {
                return objectIntersection;
            }
        }

        // Метод 3: Виртуальные плоскости
        const planeIntersection = this.tryPlaneIntersection();
        if (planeIntersection) {
            return planeIntersection;
        }

        // Метод 4: Размещение на фиксированном расстоянии от камеры
        return this.getFixedDistancePlacement();
    }

    // Попытка пересечения со splat
    trySplatIntersection(splat) {
        try {
            // Для Gaussian Splatting нужно проверить, есть ли у объекта геометрия
            if (splat.geometry && splat.geometry.attributes && splat.geometry.attributes.position) {
                const intersects = this.raycaster.intersectObject(splat);
                if (intersects.length > 0) {
                    this.lastSplatIntersection = this.adjustPositionForSurface(intersects[0]);
                    return true;
                }
            }
        } catch (error) {
            console.log('Splat intersection failed (normal for Gaussian Splatting):', error.message);
        }
        return false;
    }

    // Пересечение с размещенными объектами
    tryObjectIntersection(placedObjects) {
        const intersects = this.raycaster.intersectObjects(placedObjects);
        if (intersects.length > 0) {
            return this.adjustPositionForSurface(intersects[0]);
        }
        return null;
    }

    // Пересечение с виртуальными плоскостями
    tryPlaneIntersection() {
        const intersects = this.raycaster.intersectObjects(this.placementPlanes);
        if (intersects.length > 0) {
            const intersection = intersects[0];
            return {
                position: intersection.point.clone(),
                normal: intersection.object.userData.normal.clone(),
                surface: intersection.object.userData.type
            };
        }
        return null;
    }

    // Размещение на фиксированном расстоянии
    getFixedDistancePlacement() {
        const distance = 2; // 2 метра от камеры
        const direction = new Vector3();

        // Получаем направление взгляда камеры
        this.camera.getWorldDirection(direction);

        const position = this.camera.position.clone();
        position.add(direction.multiplyScalar(distance));

        return {
            position: position,
            normal: direction.negate(),
            surface: 'air'
        };
    }

    // Корректировка позиции с учетом поверхности и размера объекта
    adjustPositionForSurface(intersection, objectSize = 0.1) {
        const position = intersection.point.clone();
        const normal = intersection.face ? intersection.face.normal.clone() : new Vector3(0, 1, 0);

        // Применяем трансформацию объекта к нормали
        if (intersection.object.matrixWorld) {
            normal.transformDirection(intersection.object.matrixWorld);
        }

        // Поднимаем объект над поверхностью
        position.add(normal.multiplyScalar(objectSize));

        return {
            position: position,
            normal: normal,
            surface: intersection.object.userData?.type || 'unknown'
        };
    }

    // Альтернативный метод: анализ глубины для определения поверхностей
    analyzeDepthForPlacement(mouseX, mouseY) {
        // Этот метод можно использовать для анализа Z-buffer
        // Полезен когда нужно найти ближайшую поверхность в splat

        const canvas = this.scene.renderer?.domElement;
        if (!canvas) return null;

        const x = Math.round((mouseX + 1) * canvas.width / 2);
        const y = Math.round((-mouseY + 1) * canvas.height / 2);

        // TODO: Чтение глубины из framebuffer
        // Это более продвинутый метод, требует доступа к WebGL контексту

        return null;
    }

    // Создание proxy-геометрии для splat (для лучшего ray casting)
    createSplatProxy(splat) {
        // Создаем упрощенную геометрию на основе bounding box splat
        if (!splat.geometry) return null;

        try {
            splat.geometry.computeBoundingBox();
            const bbox = splat.geometry.boundingBox;

            if (bbox) {
                const size = bbox.getSize(new Vector3());
                const center = bbox.getCenter(new Vector3());

                // Создаем простую box geometry как proxy
                const proxyGeometry = new PlaneGeometry(size.x, size.z);
                const proxyMaterial = new MeshBasicMaterial({
                    visible: false,
                    transparent: true,
                    opacity: 0
                });

                const proxy = new Mesh(proxyGeometry, proxyMaterial);
                proxy.position.copy(center);
                proxy.rotation.x = -Math.PI / 2; // горизонтально
                proxy.userData = { type: 'splat-proxy', isProxy: true };

                return proxy;
            }
        } catch (error) {
            console.log('Failed to create splat proxy:', error.message);
        }

        return null;
    }

    // Настройка отладочного режима
    setDebugMode(enabled) {
        this.showDebugPlanes = enabled;
        this.placementPlanes.forEach(plane => {
            plane.material.visible = enabled;
        });
    }

    // Обновление виртуальных плоскостей под конкретную сцену
    updateVirtualPlanesForScene(sceneData) {
        // Здесь можно адаптировать плоскости под конкретную комнату
        // Например, если известны размеры комнаты из метаданных Luma

        if (sceneData.roomDimensions) {
            const { width, height, depth } = sceneData.roomDimensions;

            // Обновляем позиции плоскостей
            const floor = this.placementPlanes.find(p => p.userData.type === 'floor');
            if (floor) {
                floor.position.y = sceneData.floorLevel || -1;
            }

            // Аналогично для стен...
        }
    }

    // Очистка ресурсов
    dispose() {
        this.placementPlanes.forEach(plane => {
            this.scene.remove(plane);
            plane.geometry.dispose();
            plane.material.dispose();
        });
        this.placementPlanes = [];
    }
}