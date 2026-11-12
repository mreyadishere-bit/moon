import * as THREE from 'three';
import { soundFX } from '../audio/AudioManager';
import { CollisionSystem } from './CollisionSystem';
import { RoomId } from './MissionState';

// Pre-allocated vectors to avoid per-frame GC
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _moveVec = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position = new THREE.Vector3(0, 1.7, 3.8);
  public velocity = new THREE.Vector3();
  public yaw = 0; // Radians (0 = looking North along -Z)
  public pitch = -0.05; // Radians
  public isGrounded = true;
  public isPointerLocked = false;
  public sensitivity = 1.0;
  public enableHeadBob = true;
  private bobTimer = 0;

  private keys: Record<string, boolean> = {};
  private joystickMove = { x: 0, y: 0 };
  private isDraggingLook = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private collision: CollisionSystem;
  private domElement: HTMLElement;
  private enabled = true;

  private readonly EYE_HEIGHT = 1.7;
  private readonly WALK_SPEED = 5.4;
  private readonly SPRINT_SPEED = 8.4;
  private readonly JUMP_VELOCITY = 3.6;
  private readonly LUNAR_GRAVITY = 6.2; // Scaled lunar interior feel

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    collision: CollisionSystem
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.collision = collision;
    this.syncCamera();
    this.bindEvents();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.keys = {};
      this.joystickMove = { x: 0, y: 0 };
      this.isDraggingLook = false;
      if (document.pointerLockElement === this.domElement) {
        document.exitPointerLock?.();
      }
    }
  }

  public setJoystickInput(x: number, y: number): void {
    this.joystickMove.x = x;
    this.joystickMove.y = y;
  }

  public applyLookDelta(dx: number, dy: number): void {
    if (!this.enabled) return;
    const scale = 0.0022 * this.sensitivity;
    this.yaw -= dx * scale;
    this.pitch = THREE.MathUtils.clamp(
      this.pitch - dy * scale,
      -Math.PI / 2.2,
      Math.PI / 2.2
    );
    this.syncCamera();
  }

  public teleportToRoom(room: RoomId): void {
    switch (room) {
      case 'hub':
        this.position.set(0, this.EYE_HEIGHT, 3.6);
        this.yaw = 0;
        this.pitch = -0.06;
        break;
      case 'power':
        this.position.set(0, this.EYE_HEIGHT, -15.5);
        this.yaw = 0;
        this.pitch = -0.05;
        break;
      case 'lifesupport':
        this.position.set(15.5, this.EYE_HEIGHT, 0);
        this.yaw = -Math.PI / 2;
        this.pitch = -0.05;
        break;
      case 'radiation':
        this.position.set(0, this.EYE_HEIGHT, 15.5);
        this.yaw = Math.PI;
        this.pitch = -0.05;
        break;
      case 'planetarium':
        this.position.set(17.5, this.EYE_HEIGHT, 13.9);
        this.yaw = Math.PI;
        this.pitch = -0.05;
        break;
      case 'greenhouse':
        this.position.set(-15.5, this.EYE_HEIGHT, 0);
        this.yaw = Math.PI / 2;
        this.pitch = -0.05;
        break;
    }
    this.velocity.set(0, 0, 0);
    this.syncCamera();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) return;
    this.keys[e.code] = true;
    if (e.code === 'Space' && this.isGrounded) {
      this.velocity.y = this.JUMP_VELOCITY;
      this.isGrounded = false;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.code] = false;
  };

  private onPointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (!this.enabled || e.button !== 0) return;
    soundFX.initOnGesture();
    this.isDraggingLook = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    // Attempt Pointer Lock for authentic first-person mouse look; drag-to-look also works seamlessly if iframe blocks pointer lock
    try {
      if (document.pointerLockElement !== this.domElement) {
        this.domElement.requestPointerLock?.();
      }
    } catch {
      // Fallback to drag-to-look
    }
  };

  private onMouseUp = (): void => {
    this.isDraggingLook = false;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.enabled) return;
    if (this.isPointerLocked) {
      this.applyLookDelta(e.movementX, e.movementY);
    } else if (this.isDraggingLook) {
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.applyLookDelta(dx * 1.35, dy * 1.35);
    }
  };

  public update(deltaSeconds: number): RoomId {
    const dt = Math.min(deltaSeconds, 0.1);

    if (this.enabled) {
      // Q / Left & Right arrow keys can also smoothly turn camera for accessibility
      const turnInput =
        (this.keys['ArrowLeft'] ? 1 : 0) - (this.keys['ArrowRight'] ? 1 : 0);
      if (turnInput !== 0) {
        this.yaw += turnInput * 1.9 * dt;
      }

      const forwardInput =
        (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
        (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0) +
        this.joystickMove.y;

      const strafeInput =
        (this.keys['KeyD'] ? 1 : 0) -
        (this.keys['KeyA'] ? 1 : 0) +
        this.joystickMove.x;

      const isSprinting = Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
      const targetSpeed = isSprinting ? this.SPRINT_SPEED : this.WALK_SPEED;

      _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
      _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

      _moveVec.set(0, 0, 0);
      _moveVec.addScaledVector(_forward, forwardInput);
      _moveVec.addScaledVector(_right, strafeInput);

      if (_moveVec.lengthSq() > 1) {
        _moveVec.normalize();
      }

      // Smooth velocity damping
      const targetVx = _moveVec.x * targetSpeed;
      const targetVz = _moveVec.z * targetSpeed;
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVx, 12, dt);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVz, 12, dt);

      // Two collision substeps prevent tunneling during fast sprint or frame dips
      const substeps = 2;
      const subDt = dt / substeps;
      for (let s = 0; s < substeps; s++) {
        const nextX = this.position.x + this.velocity.x * subDt;
        const nextZ = this.position.z + this.velocity.z * subDt;
        const resolved = this.collision.resolveMovement(
          this.position.x,
          this.position.z,
          nextX,
          nextZ
        );
        this.position.x = resolved.x;
        this.position.z = resolved.z;
      }

      if (_moveVec.lengthSq() > 0.05 && this.isGrounded) {
        soundFX.playFootstep(dt, isSprinting);
        if (this.enableHeadBob) {
          this.bobTimer += dt * (isSprinting ? 11.5 : 8.0);
        }
      } else {
        this.bobTimer = THREE.MathUtils.damp(this.bobTimer, 0, 6, dt);
      }
    }

    // Vertical gravity & jump physics
    if (!this.isGrounded) {
      this.velocity.y -= this.LUNAR_GRAVITY * dt;
      this.position.y += this.velocity.y * dt;
      if (this.position.y <= this.EYE_HEIGHT) {
        this.position.y = this.EYE_HEIGHT;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    this.syncCamera();
    return this.collision.detectRoom(this.position.x, this.position.z);
  }

  private syncCamera(): void {
    this.camera.position.copy(this.position);
    if (this.enableHeadBob && this.isGrounded && this.bobTimer > 0) {
      const bobY = Math.sin(this.bobTimer) * 0.032;
      const bobX = Math.cos(this.bobTimer * 0.5) * 0.016;
      this.camera.position.y += bobY;
      this.camera.position.x += bobX * Math.cos(this.yaw);
      this.camera.position.z += bobX * -Math.sin(this.yaw);
    }
    _euler.set(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(_euler);
  }
}
