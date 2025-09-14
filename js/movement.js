import { Vector3 } from 'three';

export class MovementController {
    constructor(camera, pointerLockControls) {
        this.camera = camera;
        this.controls = pointerLockControls;
        this.enabled = true;

        // Настройки движения
        this.moveSpeed = 0.1;
        this.runMultiplier = 2;

        // Состояние клавиш
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            run: false
        };

        // Векторы для расчетов
        this.velocity = new Vector3();
        this.direction = new Vector3();

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        // Клик для захвата курсора в режиме просмотра
        document.addEventListener('click', (event) => {
            if (this.enabled && event.target.tagName === 'CANVAS') {
                this.controls.lock();

                // Hide the click instruction when pointer lock activates
                const clickInstruction = document.getElementById('clickInstruction');
                if (clickInstruction) {
                    clickInstruction.style.display = 'none';
                }
            }
        });
    }

    onKeyDown(event) {
        if (!this.enabled) return;

        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'KeyQ':
                this.keys.up = true;
                break;
            case 'KeyE':
                this.keys.down = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.run = true;
                break;
        }
    }

    onKeyUp(event) {
        if (!this.enabled) return;

        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'KeyQ':
                this.keys.up = false;
                break;
            case 'KeyE':
                this.keys.down = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.run = false;
                break;
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            // Сбросить все нажатые клавиши
            Object.keys(this.keys).forEach(key => {
                this.keys[key] = false;
            });
            this.controls.unlock();
        }
    }

    update() {
        if (!this.enabled || !this.controls.isLocked) return;

        // Определяем скорость движения
        const currentSpeed = this.keys.run
            ? this.moveSpeed * this.runMultiplier
            : this.moveSpeed;

        // Сброс velocity
        this.velocity.set(0, 0, 0);

        // Вычисление направления
        this.direction.z = Number(this.keys.forward) - Number(this.keys.backward);
        this.direction.x = Number(this.keys.right) - Number(this.keys.left);
        this.direction.y = Number(this.keys.up) - Number(this.keys.down);
        this.direction.normalize();

        // Применение движения
        if (this.keys.forward || this.keys.backward) {
            this.velocity.z -= this.direction.z * currentSpeed;
        }
        if (this.keys.left || this.keys.right) {
            this.velocity.x -= this.direction.x * currentSpeed;
        }
        if (this.keys.up || this.keys.down) {
            this.velocity.y += this.direction.y * currentSpeed;
        }

        // Применяем движение через контроллер
        this.controls.moveRight(-this.velocity.x);
        this.controls.moveForward(-this.velocity.z);

        // Вертикальное движение
        this.camera.position.y += this.velocity.y;
    }
}