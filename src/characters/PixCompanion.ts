import * as THREE from 'three';

/**
 * PIX — Floating Robot Companion
 * A small, cute, expressive hovering robot that follows the player around the station.
 * Inspired by companions in Portal 2 and Astro Bot.
 * 
 * Features:
 * - Sphere head with animated LED face (eyes + mouth via canvas texture)
 * - Antenna with bobbing tip light
 * - Gentle hovering/bobbing idle animation
 * - Smooth follow behavior with collision avoidance
 * - Emotional states: idle, curious, happy, concerned, celebrating
 * - Look-at behavior: faces player, then faces interactables
 * - Speech bubble system
 */

export type PixEmotion = 'idle' | 'curious' | 'happy' | 'concerned' | 'celebrating';

export class PixCompanion {
  public group: THREE.Group;
  public position: THREE.Vector3;
  
  private headMesh!: THREE.Mesh;
  private bodyMesh!: THREE.Mesh;
  private antennaGroup!: THREE.Group;
  private antennaTip!: THREE.Mesh;
  private antennaTipLight!: THREE.PointLight;
  private leftEar!: THREE.Mesh;
  private rightEar!: THREE.Mesh;
  private jetGroup!: THREE.Group;
  private jetParticles: THREE.Mesh[] = [];

  // Face rendering
  private faceCanvas!: HTMLCanvasElement;
  private faceCtx!: CanvasRenderingContext2D;
  private faceTex!: THREE.CanvasTexture;
  private faceMesh!: THREE.Mesh;

  // Animation state
  private time = 0;
  private blinkTimer = 0;
  private blinkDuration = 0;
  private isBlinking = false;
  private emotion: PixEmotion = 'idle';
  private emotionTimer = 0;
  private targetPos = new THREE.Vector3(0, 1.6, 0);
  private velocity = new THREE.Vector3();
  private lookTarget = new THREE.Vector3();
  private currentLookTarget = new THREE.Vector3();

  // Speech bubble
  private speechGroup!: THREE.Group;
  private speechCanvas!: HTMLCanvasElement;
  private speechCtx!: CanvasRenderingContext2D;
  private speechTex!: THREE.CanvasTexture;
  private speechMesh!: THREE.Mesh;
  private speechText = '';
  private speechTimer = 0;
  private speechVisible = false;

  // Glow ring around body
  private glowRing!: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.position = new THREE.Vector3(1.5, 1.6, 1.5);
    this.group.position.copy(this.position);

    this.buildBody();
    this.buildFace();
    this.buildAntenna();
    this.buildEars();
    this.buildJetThrusters();
    this.buildGlowRing();
    this.buildSpeechBubble();

    scene.add(this.group);
    
    // Schedule first blink
    this.blinkTimer = 2 + Math.random() * 3;
  }

  private buildBody(): void {
    // Main spherical head/body (PIX is mostly head, like a cute robot)
    const bodyGeo = new THREE.SphereGeometry(0.22, 24, 24);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xe8edf2,
      roughness: 0.25,
      metalness: 0.6,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.group.add(this.bodyMesh);

    // Darker visor band around the equator
    const visorGeo = new THREE.CylinderGeometry(0.225, 0.225, 0.09, 24, 1, true);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x1a2332,
      roughness: 0.15,
      metalness: 0.8,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.rotation.x = Math.PI / 2;
    this.group.add(visor);

    // Bottom half slightly darker
    const bottomGeo = new THREE.SphereGeometry(0.20, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bottomMat = new THREE.MeshStandardMaterial({
      color: 0x8e999e,
      roughness: 0.35,
      metalness: 0.5,
    });
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.rotation.x = Math.PI;
    this.group.add(bottom);
  }

  private buildFace(): void {
    // Canvas-based animated LED face
    this.faceCanvas = document.createElement('canvas');
    this.faceCanvas.width = 256;
    this.faceCanvas.height = 128;
    this.faceCtx = this.faceCanvas.getContext('2d')!;
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas);
    this.faceTex.colorSpace = THREE.SRGBColorSpace;

    const faceMat = new THREE.MeshBasicMaterial({
      map: this.faceTex,
      transparent: true,
      depthWrite: false,
    });
    // Slightly curved face panel
    const faceGeo = new THREE.PlaneGeometry(0.28, 0.14);
    this.faceMesh = new THREE.Mesh(faceGeo, faceMat);
    this.faceMesh.position.z = 0.195;
    this.faceMesh.position.y = 0.02;
    this.group.add(this.faceMesh);

    this.renderFace();
  }

  private renderFace(): void {
    const ctx = this.faceCtx;
    const w = 256, h = 128;
    ctx.clearRect(0, 0, w, h);

    // Eye color based on emotion
    let eyeColor = '#76AEC9'; // calm cyan
    let mouthShape: 'smile' | 'neutral' | 'open' | 'worry' = 'smile';
    
    switch (this.emotion) {
      case 'curious':
        eyeColor = '#E8AD66';
        mouthShape = 'open';
        break;
      case 'happy':
        eyeColor = '#77B89A';
        mouthShape = 'smile';
        break;
      case 'concerned':
        eyeColor = '#DE6F60';
        mouthShape = 'worry';
        break;
      case 'celebrating':
        eyeColor = '#E8AD66';
        mouthShape = 'smile';
        break;
      default:
        eyeColor = '#76AEC9';
        mouthShape = 'neutral';
    }

    // Blink state
    const eyeOpenness = this.isBlinking ? 0.15 : 1.0;

    // Left eye
    const lx = 80, ly = 48;
    const rx = 176, ry = 48;
    const eyeW = 28 * (this.emotion === 'curious' ? 1.2 : 1.0);
    const eyeH = 24 * eyeOpenness * (this.emotion === 'curious' ? 1.3 : 1.0);

    // Glow behind eyes
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = 16;

    // Draw eyes as rounded rects
    ctx.fillStyle = eyeColor;
    this.roundRect(ctx, lx - eyeW/2, ly - eyeH/2, eyeW, eyeH, 6);
    this.roundRect(ctx, rx - eyeW/2, ry - eyeH/2, eyeW, eyeH, 6);

    // Eye highlight (white gleam)
    if (!this.isBlinking) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(lx + 6, ly - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx + 6, ry - 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouth
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const mx = 128, my = 88;
    ctx.beginPath();
    switch (mouthShape) {
      case 'smile':
        ctx.arc(mx, my - 8, 16, 0.2, Math.PI - 0.2);
        break;
      case 'open':
        ctx.ellipse(mx, my, 10, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = eyeColor;
        ctx.fill();
        break;
      case 'worry':
        ctx.arc(mx, my + 12, 14, Math.PI + 0.3, -0.3);
        break;
      case 'neutral':
        ctx.moveTo(mx - 12, my);
        ctx.lineTo(mx + 12, my);
        break;
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
    this.faceTex.needsUpdate = true;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  private buildAntenna(): void {
    this.antennaGroup = new THREE.Group();
    this.antennaGroup.position.y = 0.22;

    // Thin antenna stalk
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.015, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0x8e999e, metalness: 0.7, roughness: 0.3 })
    );
    stalk.position.y = 0.07;
    this.antennaGroup.add(stalk);

    // Glowing tip ball
    this.antennaTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0x76aec9,
        emissive: 0x76aec9,
        emissiveIntensity: 2.0,
        roughness: 0.1,
      })
    );
    this.antennaTip.position.y = 0.16;
    this.antennaGroup.add(this.antennaTip);

    // Small point light at tip
    this.antennaTipLight = new THREE.PointLight(0x76aec9, 0.8, 3, 1.5);
    this.antennaTipLight.position.y = 0.16;
    this.antennaGroup.add(this.antennaTipLight);

    this.group.add(this.antennaGroup);
  }

  private buildEars(): void {
    // Small wing/ear flaps on sides (can wiggle for expression)
    const earGeo = new THREE.BoxGeometry(0.06, 0.08, 0.03);
    const earMat = new THREE.MeshStandardMaterial({
      color: 0x76aec9,
      emissive: 0x76aec9,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.4,
    });

    this.leftEar = new THREE.Mesh(earGeo, earMat);
    this.leftEar.position.set(-0.24, 0.04, 0);
    this.group.add(this.leftEar);

    this.rightEar = new THREE.Mesh(earGeo, earMat);
    this.rightEar.position.set(0.24, 0.04, 0);
    this.group.add(this.rightEar);
  }

  private buildJetThrusters(): void {
    this.jetGroup = new THREE.Group();
    this.jetGroup.position.y = -0.2;

    // Two small thruster nozzles
    [-0.08, 0.08].forEach(xOffset => {
      const nozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.04, 0.05, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a5768, roughness: 0.4, metalness: 0.6 })
      );
      nozzle.position.x = xOffset;
      this.jetGroup.add(nozzle);

      // Small glowing exhaust plume
      const plume = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.06, 8),
        new THREE.MeshBasicMaterial({
          color: 0x76aec9,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
        })
      );
      plume.position.set(xOffset, -0.04, 0);
      plume.rotation.x = Math.PI;
      this.jetParticles.push(plume);
      this.jetGroup.add(plume);
    });

    this.group.add(this.jetGroup);
  }

  private buildGlowRing(): void {
    const ringGeo = new THREE.TorusGeometry(0.24, 0.012, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x76aec9,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    this.glowRing = new THREE.Mesh(ringGeo, ringMat);
    this.glowRing.rotation.x = Math.PI / 2;
    this.glowRing.position.y = -0.04;
    this.group.add(this.glowRing);
  }

  private buildSpeechBubble(): void {
    this.speechGroup = new THREE.Group();
    this.speechGroup.visible = false;

    this.speechCanvas = document.createElement('canvas');
    this.speechCanvas.width = 512;
    this.speechCanvas.height = 128;
    this.speechCtx = this.speechCanvas.getContext('2d')!;
    this.speechTex = new THREE.CanvasTexture(this.speechCanvas);
    this.speechTex.colorSpace = THREE.SRGBColorSpace;

    const speechMat = new THREE.MeshBasicMaterial({
      map: this.speechTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.speechMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.2),
      speechMat
    );
    this.speechMesh.position.set(0, 0.42, 0);
    this.speechGroup.add(this.speechMesh);

    this.group.add(this.speechGroup);
  }

  private renderSpeechBubble(): void {
    const ctx = this.speechCtx;
    const w = 512, h = 128;
    ctx.clearRect(0, 0, w, h);

    if (!this.speechText) return;

    // Rounded bubble background
    const pad = 16;
    ctx.fillStyle = 'rgba(16, 24, 32, 0.92)';
    ctx.beginPath();
    const bw = w - pad * 2, bh = h - pad * 2 - 10;
    const br = 16;
    ctx.moveTo(pad + br, pad);
    ctx.lineTo(pad + bw - br, pad);
    ctx.quadraticCurveTo(pad + bw, pad, pad + bw, pad + br);
    ctx.lineTo(pad + bw, pad + bh - br);
    ctx.quadraticCurveTo(pad + bw, pad + bh, pad + bw - br, pad + bh);
    // Tail
    ctx.lineTo(w / 2 + 10, pad + bh);
    ctx.lineTo(w / 2, h - pad);
    ctx.lineTo(w / 2 - 10, pad + bh);
    ctx.lineTo(pad + br, pad + bh);
    ctx.quadraticCurveTo(pad, pad + bh, pad, pad + bh - br);
    ctx.lineTo(pad, pad + br);
    ctx.quadraticCurveTo(pad, pad, pad + br, pad);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(118, 174, 201, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#E7E9E6';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Word wrap
    const maxWidth = bw - 24;
    const words = this.speechText.split(' ');
    let line = '';
    const lines: string[] = [];
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineHeight = 26;
    const startY = pad + bh / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => {
      ctx.fillText(l, w / 2, startY + i * lineHeight);
    });

    this.speechTex.needsUpdate = true;
  }

  /** Show a speech bubble above PIX for a few seconds */
  public say(text: string, duration = 4): void {
    this.speechText = text;
    this.speechTimer = duration;
    this.speechVisible = true;
    this.speechGroup.visible = true;
    this.renderSpeechBubble();
  }

  /** Set PIX's emotional state */
  public setEmotion(emotion: PixEmotion, duration = 3): void {
    this.emotion = emotion;
    this.emotionTimer = duration;
    this.renderFace();
    
    // Update glow color based on emotion
    const color = this.getEmotionColor();
    (this.antennaTip.material as THREE.MeshStandardMaterial).emissive.setHex(color);
    (this.antennaTip.material as THREE.MeshStandardMaterial).color.setHex(color);
    this.antennaTipLight.color.setHex(color);
    (this.glowRing.material as THREE.MeshBasicMaterial).color.setHex(color);
    (this.leftEar.material as THREE.MeshStandardMaterial).emissive.setHex(color);
    (this.rightEar.material as THREE.MeshStandardMaterial).emissive.setHex(color);
  }

  private getEmotionColor(): number {
    switch (this.emotion) {
      case 'curious': return 0xe8ad66;
      case 'happy': return 0x77b89a;
      case 'concerned': return 0xde6f60;
      case 'celebrating': return 0xe8ad66;
      default: return 0x76aec9;
    }
  }

  /** Make PIX look at a specific world position */
  public lookAt(target: THREE.Vector3): void {
    this.lookTarget.copy(target);
  }

  public update(dt: number, playerPos: THREE.Vector3, playerYaw: number): void {
    this.time += dt;
    const t = this.time;

    // 1. Follow player with offset (hover to the right and slightly behind)
    const followDist = 1.2;
    const followHeight = 1.55;
    const rightOffset = 0.8;
    
    // Calculate position to the player's right and slightly behind
    const behindAngle = playerYaw + Math.PI;
    const rightAngle = playerYaw - Math.PI / 2;
    
    this.targetPos.set(
      playerPos.x + Math.sin(behindAngle) * 0.3 + Math.sin(rightAngle) * rightOffset,
      followHeight,
      playerPos.z + Math.cos(behindAngle) * 0.3 + Math.cos(rightAngle) * rightOffset
    );

    // Smooth follow with spring physics
    const dx = this.targetPos.x - this.position.x;
    const dy = this.targetPos.y - this.position.y;
    const dz = this.targetPos.z - this.position.z;
    
    const springK = 3.0;
    const damping = 0.85;
    
    this.velocity.x += dx * springK * dt;
    this.velocity.y += dy * springK * dt;
    this.velocity.z += dz * springK * dt;
    
    this.velocity.multiplyScalar(Math.pow(damping, dt * 60));
    
    // Clamp max speed
    const maxSpeed = 6.0;
    const speed = this.velocity.length();
    if (speed > maxSpeed) {
      this.velocity.multiplyScalar(maxSpeed / speed);
    }
    
    this.position.add(this.velocity.clone().multiplyScalar(dt));
    
    // 2. Idle hovering bob
    const bobAmplitude = 0.04;
    const bobFreq = 2.2;
    this.position.y += Math.sin(t * bobFreq) * bobAmplitude * 0.5;
    
    this.group.position.copy(this.position);
    
    // 3. Gentle tilt toward movement direction
    const tiltX = -this.velocity.z * 0.08;
    const tiltZ = this.velocity.x * 0.08;
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, tiltX, dt * 5);
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, tiltZ, dt * 5);

    // 4. Look at player (smooth lerp toward look target)
    this.currentLookTarget.lerp(playerPos, dt * 4);
    const lookDir = new THREE.Vector3().subVectors(this.currentLookTarget, this.position);
    lookDir.y = 0;
    if (lookDir.lengthSq() > 0.01) {
      const targetYaw = Math.atan2(lookDir.x, lookDir.z);
      let currentYaw = this.group.rotation.y;
      let diff = targetYaw - currentYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.group.rotation.y += diff * dt * 6;
    }

    // 5. Antenna wobble
    if (this.antennaGroup) {
      this.antennaGroup.rotation.z = Math.sin(t * 3.5) * 0.12;
      this.antennaGroup.rotation.x = Math.cos(t * 2.8) * 0.08;
    }

    // 6. Antenna tip pulse
    if (this.antennaTipLight) {
      this.antennaTipLight.intensity = 0.5 + Math.sin(t * 4) * 0.3;
    }

    // 7. Ear flutter
    const earFlutter = this.emotion === 'happy' || this.emotion === 'celebrating' ? 0.3 : 0.1;
    this.leftEar.rotation.z = Math.sin(t * 4) * earFlutter;
    this.rightEar.rotation.z = -Math.sin(t * 4) * earFlutter;

    // 8. Jet thruster particles
    this.jetParticles.forEach((plume, i) => {
      const scale = 0.7 + Math.sin(t * 12 + i * Math.PI) * 0.3;
      plume.scale.setScalar(scale);
      (plume.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 15 + i) * 0.2;
    });

    // 9. Glow ring rotation and pulse
    this.glowRing.rotation.z += dt * 1.5;
    (this.glowRing.material as THREE.MeshBasicMaterial).opacity =
      0.25 + Math.sin(t * 2) * 0.15;

    // 10. Blink logic
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0 && !this.isBlinking) {
      this.isBlinking = true;
      this.blinkDuration = 0.12;
      this.blinkTimer = 2 + Math.random() * 4;
      this.renderFace();
    }
    if (this.isBlinking) {
      this.blinkDuration -= dt;
      if (this.blinkDuration <= 0) {
        this.isBlinking = false;
        this.renderFace();
      }
    }

    // 11. Emotion timer
    if (this.emotionTimer > 0) {
      this.emotionTimer -= dt;
      if (this.emotionTimer <= 0 && this.emotion !== 'idle') {
        this.emotion = 'idle';
        this.renderFace();
        this.setEmotion('idle');
      }
    }

    // 12. Speech bubble timer
    if (this.speechVisible) {
      this.speechTimer -= dt;
      // Billboard the speech bubble toward camera
      this.speechGroup.rotation.y = -this.group.rotation.y;
      if (this.speechTimer <= 0) {
        this.speechVisible = false;
        this.speechGroup.visible = false;
      }
    }

    // 13. Celebrating spin
    if (this.emotion === 'celebrating') {
      this.bodyMesh.rotation.y += dt * 8;
    } else {
      this.bodyMesh.rotation.y = THREE.MathUtils.lerp(this.bodyMesh.rotation.y, 0, dt * 3);
    }

    // 14. Face always renders forward on the body
    this.faceMesh.rotation.y = -this.bodyMesh.rotation.y;
  }

  /** Trigger celebration animation */
  public celebrate(): void {
    this.setEmotion('celebrating', 3);
    this.say('🎉 Great job!', 3);
  }

  /** React to entering a new room */
  public reactToRoom(room: string): void {
    switch (room) {
      case 'power':
        this.setEmotion('curious', 4);
        this.say('Look at all these batteries!', 3.5);
        break;
      case 'lifesupport':
        this.setEmotion('curious', 4);
        this.say('I can hear the fans spinning!', 3.5);
        break;
      case 'greenhouse':
        this.setEmotion('happy', 4);
        this.say('Mmm, fresh plants! 🌱', 3.5);
        break;
      case 'radiation':
        this.setEmotion('concerned', 4);
        this.say('Storm sensors active...', 3.5);
        break;
      case 'hub':
        this.setEmotion('happy', 3);
        break;
    }
  }

  /** React to player completing a challenge */
  public reactToSuccess(): void {
    this.celebrate();
  }

  /** React to a warning situation */
  public reactToWarning(message: string): void {
    this.setEmotion('concerned', 4);
    this.say(message, 4);
  }
}
