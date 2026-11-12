import * as THREE from 'three';

/**
 * StationCrew — 3D Character Models and Behaviors
 * 
 * Characters:
 * 1. Dr. Maya Chen (Chief Scientist Astronaut) - Located in Radiation Shelter / Hub Observation
 * 2. Leo (Senior Outpost Engineer) - Located in Power Core
 * 3. Sprout (Cute Hydroponic Gardening Bot) - Located in Greenhouse
 */

export interface CharacterDialogue {
  speaker: string;
  role: string;
  portrait: string;
  lines: string[];
}

export class StationCrew {
  public group = new THREE.Group();

  // Maya Chen
  public mayaGroup = new THREE.Group();
  private mayaVisor!: THREE.Mesh;
  private mayaTablet!: THREE.Mesh;
  private mayaLeftArm!: THREE.Group;
  private mayaRightArm!: THREE.Group;

  // Leo Engineer
  public leoGroup = new THREE.Group();
  private leoVisor!: THREE.Mesh;
  private leoTool!: THREE.Mesh;
  private leoLeftArm!: THREE.Group;
  private leoRightArm!: THREE.Group;

  // Sprout Bot
  public sproutGroup = new THREE.Group();
  private sproutHead!: THREE.Group;
  private sproutEyeLeft!: THREE.Mesh;
  private sproutEyeRight!: THREE.Mesh;
  private sproutWaterNozzle!: THREE.Mesh;

  private time = 0;

  constructor(scene: THREE.Scene) {
    this.buildMayaChen();
    this.buildLeoEngineer();
    this.buildSproutBot();

    this.group.add(this.mayaGroup);
    this.group.add(this.leoGroup);
    this.group.add(this.sproutGroup);

    scene.add(this.group);
  }

  /* -------------------------------------------------------------------------- */
  /* 1. DR. MAYA CHEN (CHIEF SCIENTIST ASTRONAUT)                               */
  /* -------------------------------------------------------------------------- */
  private buildMayaChen(): void {
    // Placed in the Radiation Shelter near the console (0, 0, 18.5)
    this.mayaGroup.position.set(2.4, 0, 18.2);
    this.mayaGroup.rotation.y = -Math.PI * 0.75; // Looking toward entrance

    const suitWhite = new THREE.MeshStandardMaterial({
      color: 0xedf2f7,
      roughness: 0.45,
      metalness: 0.15,
    });
    const suitOrange = new THREE.MeshStandardMaterial({
      color: 0xdd6b20,
      roughness: 0.5,
      metalness: 0.1,
    });
    const darkGray = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.6,
      metalness: 0.3,
    });
    const goldVisorMat = new THREE.MeshStandardMaterial({
      color: 0xd69e2e,
      roughness: 0.1,
      metalness: 0.95,
      emissive: 0xb7791f,
      emissiveIntensity: 0.3,
    });

    // 1. Boots & Legs
    [-0.2, 0.2].forEach((xOffset) => {
      // Boot
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.34), darkGray);
      boot.position.set(xOffset, 0.09, 0.04);
      this.mayaGroup.add(boot);

      // Leg
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.22), suitWhite);
      leg.position.set(xOffset, 0.48, 0);
      this.mayaGroup.add(leg);

      // Orange Knee Pad
      const knee = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.06), suitOrange);
      knee.position.set(xOffset, 0.48, 0.11);
      this.mayaGroup.add(knee);
    });

    // 2. Torso (Life support chest pack)
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.3), darkGray);
    pelvis.position.y = 0.85;
    this.mayaGroup.add(pelvis);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.62, 0.36), suitWhite);
    torso.position.y = 1.22;
    this.mayaGroup.add(torso);

    // Orange Chest Accent Stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.59, 0.16, 0.37), suitOrange);
    stripe.position.y = 1.34;
    this.mayaGroup.add(stripe);

    // Life support PLSS backpack
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.24), darkGray);
    backpack.position.set(0, 1.25, -0.26);
    this.mayaGroup.add(backpack);

    // Blue Oxygen status LED on backpack
    const o2Led = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    o2Led.rotation.x = Math.PI / 2;
    o2Led.position.set(0.14, 1.45, -0.38);
    this.mayaGroup.add(o2Led);

    // 3. Helmet & Gold Visor
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), suitWhite);
    helmet.position.y = 1.72;
    this.mayaGroup.add(helmet);

    // Shiny Gold Dome Visor
    this.mayaVisor = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16, 0, Math.PI, 0, Math.PI),
      goldVisorMat
    );
    this.mayaVisor.rotation.x = -Math.PI / 2;
    this.mayaVisor.position.set(0, 1.72, 0.08);
    this.mayaGroup.add(this.mayaVisor);

    // Helmet Headlamp
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.05, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    lamp.position.set(0, 1.94, 0.16);
    this.mayaGroup.add(lamp);

    // 4. Arms & Datapad
    // Left Arm (holding datapad)
    this.mayaLeftArm = new THREE.Group();
    this.mayaLeftArm.position.set(-0.36, 1.44, 0);

    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.16), suitWhite);
    lArm.position.y = -0.22;
    this.mayaLeftArm.add(lArm);
    this.mayaLeftArm.rotation.x = -0.55;
    this.mayaLeftArm.rotation.z = 0.2;
    this.mayaGroup.add(this.mayaLeftArm);

    // Right Arm (pointing/tapping datapad)
    this.mayaRightArm = new THREE.Group();
    this.mayaRightArm.position.set(0.36, 1.44, 0);

    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.16), suitWhite);
    rArm.position.y = -0.22;
    this.mayaRightArm.add(rArm);
    this.mayaRightArm.rotation.x = -0.45;
    this.mayaRightArm.rotation.z = -0.3;
    this.mayaGroup.add(this.mayaRightArm);

    // Glowing Science Datapad
    this.mayaTablet = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.02, 0.38),
      darkGray
    );
    this.mayaTablet.position.set(-0.1, 1.08, 0.32);
    this.mayaTablet.rotation.x = 0.45;

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.32),
      new THREE.MeshBasicMaterial({ color: 0x76aec9 })
    );
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = 0.015;
    this.mayaTablet.add(screen);
    this.mayaGroup.add(this.mayaTablet);

    // Floating Nametag Above Head
    this.addFloatingLabel(this.mayaGroup, 'DR. MAYA CHEN · SCIENTIST', '#E8AD66');
  }

  /* -------------------------------------------------------------------------- */
  /* 2. LEO (CHIEF OUTPOST ENGINEER)                                            */
  /* -------------------------------------------------------------------------- */
  private buildLeoEngineer(): void {
    // Placed in Power Core near battery racks (-2.5, 0, -18.2)
    this.leoGroup.position.set(-2.8, 0, -17.8);
    this.leoGroup.rotation.y = Math.PI * 0.4;

    const suitNavy = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.5,
      metalness: 0.2,
    });
    const highVisYellow = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.3,
      metalness: 0.1,
    });
    const darkSteel = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.7,
    });

    // 1. Boots & Legs
    [-0.2, 0.2].forEach((xOffset) => {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.36), darkSteel);
      boot.position.set(xOffset, 0.1, 0.04);
      this.leoGroup.add(boot);

      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.24), suitNavy);
      leg.position.set(xOffset, 0.48, 0);
      this.leoGroup.add(leg);
    });

    // 2. Torso with High-Vis Safety Vest
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.65, 0.38), suitNavy);
    torso.position.y = 1.25;
    this.leoGroup.add(torso);

    // Yellow Safety Vest
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.45, 0.4), highVisYellow);
    vest.position.y = 1.3;
    this.leoGroup.add(vest);

    // Tool Belt
    const toolBelt = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.12, 0.42), darkSteel);
    toolBelt.position.y = 0.95;
    this.leoGroup.add(toolBelt);

    // 3. Engineer Hard-Hat Helmet with Open Clear Visor
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 16), highVisYellow);
    helmet.position.y = 1.74;
    this.leoGroup.add(helmet);

    this.leoVisor = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 16, 16, 0, Math.PI, 0, Math.PI),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.75,
      })
    );
    this.leoVisor.rotation.x = -Math.PI / 2;
    this.leoVisor.position.set(0, 1.74, 0.08);
    this.leoGroup.add(this.leoVisor);

    // 4. Arms & Diagnostic Multimeter Tool
    this.leoLeftArm = new THREE.Group();
    this.leoLeftArm.position.set(-0.38, 1.48, 0);
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.18), suitNavy);
    lArm.position.y = -0.22;
    this.leoLeftArm.add(lArm);
    this.leoLeftArm.rotation.x = -0.6;
    this.leoGroup.add(this.leoLeftArm);

    this.leoRightArm = new THREE.Group();
    this.leoRightArm.position.set(0.38, 1.48, 0);
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.18), suitNavy);
    rArm.position.y = -0.22;
    this.leoRightArm.add(rArm);
    this.leoRightArm.rotation.x = -0.7;
    this.leoGroup.add(this.leoRightArm);

    // Diagnostic Scanner Tool
    this.leoTool = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.1), darkSteel);
    this.leoTool.position.set(0.18, 1.15, 0.35);

    const tip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.15),
      new THREE.MeshBasicMaterial({ color: 0xeab308 })
    );
    tip.position.set(0, 0.14, 0);
    this.leoTool.add(tip);
    this.leoGroup.add(this.leoTool);

    this.addFloatingLabel(this.leoGroup, 'LEO · CHIEF ENGINEER', '#EAB308');
  }

  /* -------------------------------------------------------------------------- */
  /* 3. SPROUT (HYDROPONIC GARDENING ROBOT)                                      */
  /* -------------------------------------------------------------------------- */
  private buildSproutBot(): void {
    // Placed in the Greenhouse near the grow racks (-15.8, 0, 1.8)
    this.sproutGroup.position.set(-15.8, 0, 1.8);
    this.sproutGroup.rotation.y = Math.PI * 0.25;

    const botGreen = new THREE.MeshStandardMaterial({
      color: 0x48bb78,
      roughness: 0.3,
      metalness: 0.4,
    });
    const botWhite = new THREE.MeshStandardMaterial({
      color: 0xf7fafc,
      roughness: 0.2,
      metalness: 0.5,
    });
    const darkBase = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.5,
      metalness: 0.6,
    });

    // 1. Heavy Wheeled Mobile Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.24, 16), darkBase);
    base.position.y = 0.12;
    this.sproutGroup.add(base);

    // 4 Rover Wheels
    [-0.32, 0.32].forEach((wx) => {
      [-0.22, 0.22].forEach((wz) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12), darkBase);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.14, wz);
        this.sproutGroup.add(wheel);
      });
    });

    // 2. Cylindrical Water Storage Tank Body
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.62, 16), botWhite);
    tank.position.y = 0.55;
    this.sproutGroup.add(tank);

    // Water level indicator tube
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    tube.position.set(0.32, 0.55, 0);
    this.sproutGroup.add(tube);

    // 3. Cute Articulated Swivel Head
    this.sproutHead = new THREE.Group();
    this.sproutHead.position.y = 0.95;

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.14, 12), darkBase);
    neck.position.y = 0.07;
    this.sproutHead.add(neck);

    const headDome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), botGreen);
    headDome.position.y = 0.26;
    this.sproutHead.add(headDome);

    // Sprout Leaf on top of head!
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x276749 })
    );
    stem.position.y = 0.56;
    this.sproutHead.add(stem);

    const leafGeo = new THREE.SphereGeometry(0.08, 8, 8);
    leafGeo.scale(1.8, 0.3, 0.8);
    const leaf = new THREE.Mesh(
      leafGeo,
      new THREE.MeshStandardMaterial({ color: 0x68d391, roughness: 0.4 })
    );
    leaf.position.set(0.08, 0.64, 0);
    leaf.rotation.z = 0.3;
    this.sproutHead.add(leaf);

    // Cute Expressive LED Eyes
    const eyeGeo = new THREE.CircleGeometry(0.05, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x9ae6b4 });

    this.sproutEyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    this.sproutEyeLeft.position.set(-0.09, 0.28, 0.25);
    this.sproutHead.add(this.sproutEyeLeft);

    this.sproutEyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    this.sproutEyeRight.position.set(0.09, 0.28, 0.25);
    this.sproutHead.add(this.sproutEyeRight);

    this.sproutGroup.add(this.sproutHead);

    // 4. Articulated Watering Wand Arm
    const arm = new THREE.Group();
    arm.position.set(0.36, 0.65, 0.15);

    const armSegment = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38), darkBase);
    armSegment.rotation.x = Math.PI / 3;
    arm.add(armSegment);

    this.sproutWaterNozzle = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.12, 12),
      botGreen
    );
    this.sproutWaterNozzle.rotation.x = Math.PI / 2;
    this.sproutWaterNozzle.position.set(0, -0.16, 0.25);
    arm.add(this.sproutWaterNozzle);

    this.sproutGroup.add(arm);

    this.addFloatingLabel(this.sproutGroup, 'SPROUT · BOTANY ROBOT', '#68D391');
  }

  /* -------------------------------------------------------------------------- */
  /* FLOATING IN-WORLD NAME BADGES                                              */
  /* -------------------------------------------------------------------------- */
  private addFloatingLabel(parent: THREE.Group, title: string, colorHex: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;

    // Pill background
    ctx.fillStyle = 'rgba(16, 24, 32, 0.88)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 368, 64, 16);
    ctx.fill();

    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text
    ctx.fillStyle = colorHex;
    ctx.font = 'bold 20px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 192, 40);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(0, 2.3, 0);
    sprite.scale.set(1.4, 0.32, 1);
    parent.add(sprite);
  }

  /* -------------------------------------------------------------------------- */
  /* ANIMATION & IDLE BEHAVIORS                                                 */
  /* -------------------------------------------------------------------------- */
  public update(dt: number, playerPos: THREE.Vector3): void {
    this.time += dt;
    const t = this.time;

    // 1. Dr. Maya Chen: Subtle breathing & datapad tilt
    this.mayaGroup.position.y = Math.sin(t * 1.8) * 0.012;
    if (this.mayaTablet) {
      this.mayaTablet.rotation.x = 0.45 + Math.sin(t * 1.5) * 0.04;
    }
    if (this.mayaLeftArm) {
      this.mayaLeftArm.rotation.x = -0.55 + Math.sin(t * 1.2) * 0.03;
    }

    // Turn Maya slightly toward player when player is nearby in the shelter
    const distMaya = this.mayaGroup.position.distanceTo(playerPos);
    if (distMaya < 6.0) {
      const targetAngle = Math.atan2(
        playerPos.x - this.mayaGroup.position.x,
        playerPos.z - this.mayaGroup.position.z
      );
      this.mayaGroup.rotation.y = THREE.MathUtils.lerp(
        this.mayaGroup.rotation.y,
        targetAngle,
        dt * 2.5
      );
    }

    // 2. Leo Engineer: Wrenching/tapping motion
    this.leoGroup.position.y = Math.sin(t * 2.0) * 0.01;
    if (this.leoRightArm) {
      this.leoRightArm.rotation.x = -0.7 + Math.sin(t * 4.5) * 0.12;
    }
    const distLeo = this.leoGroup.position.distanceTo(playerPos);
    if (distLeo < 6.0) {
      const targetAngle = Math.atan2(
        playerPos.x - this.leoGroup.position.x,
        playerPos.z - this.leoGroup.position.z
      );
      this.leoGroup.rotation.y = THREE.MathUtils.lerp(
        this.leoGroup.rotation.y,
        targetAngle,
        dt * 2.5
      );
    }

    // 3. Sprout Gardening Bot: Head swivel and leaf bobbing
    if (this.sproutHead) {
      this.sproutHead.rotation.y = Math.sin(t * 1.2) * 0.35;
      this.sproutHead.position.y = 0.95 + Math.sin(t * 3.0) * 0.015;
    }
    const distSprout = this.sproutGroup.position.distanceTo(playerPos);
    if (distSprout < 5.0) {
      const targetAngle = Math.atan2(
        playerPos.x - this.sproutGroup.position.x,
        playerPos.z - this.sproutGroup.position.z
      );
      this.sproutGroup.rotation.y = THREE.MathUtils.lerp(
        this.sproutGroup.rotation.y,
        targetAngle,
        dt * 2.0
      );
    }
  }

  /** Get dialogue when interacting with a crew member */
  public static getCharacterDialogue(characterId: 'maya' | 'leo' | 'sprout', chapter: number): CharacterDialogue {
    switch (characterId) {
      case 'maya':
        return {
          speaker: 'DR. MAYA CHEN',
          role: 'Chief Scientist · Lunar Geochemistry',
          portrait: '👩‍🚀',
          lines: [
            "Welcome to LUNA-7! I'm so glad you made it safely through the airlock.",
            "Living on the Moon is wonderful, but we're outside Earth's protective blanket. We have no atmosphere to breathe or block solar radiation.",
            "That's why our habitat needs smart energy and thick shielding. With your help, we're going to keep this station safe!",
          ],
        };
      case 'leo':
        return {
          speaker: 'LEO',
          role: 'Chief Outpost Engineer · Power Systems',
          portrait: '🧑‍🔧',
          lines: [
            "Hey there, Junior Astronaut! Welcome to the Power Core.",
            "See these big lithium-sulfur battery racks? They store power when the Sun is shining so we don't go dark during lunar night.",
            "Remember: every kilowatt counts! If we give more power to the greenhouse lights, the batteries drain faster. It's all about balance!",
          ],
        };
      case 'sprout':
        return {
          speaker: 'SPROUT',
          role: 'Botany & Irrigation Automaton',
          portrait: '🌱',
          lines: [
            "*BEEP-BOOP-WHIRR!* Happy photosynthesis, human friend!",
            "Our leafy crops breathe in carbon dioxide and give us crisp, fresh oxygen. Plus tasty lunar salad!",
            "I keep the irrigation loop closed so 96% of water vapor is reclaimed back to clean drinking water. Don't let the valve leak!",
          ],
        };
    }
  }
}
