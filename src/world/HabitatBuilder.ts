import * as THREE from 'three';
import { TrainingWallExhibit } from './TrainingWallExhibit';
import { LunarWonderArchitecture } from './LunarWonderArchitecture';
import { PremiumBulkheads } from './PremiumBulkheads';
import { HubDressing } from './HubDressing';
import { GuidePoint, createStationGuidePath, currentMissionGuideDestination } from '../game/GuidePath';
import { soundFX } from '../audio/AudioManager';
import { StationCrew } from '../characters/StationCrew';
import { ChallengeId, MissionStateData } from '../game/MissionState';

export interface InteractiveTarget {
  id: string;
  title: string;
  subtitle: string;
  actionType: 'open_challenge' | 'physical_toggle' | 'dialogue' | 'observation' | 'academy';
  challengeId?: ChallengeId;
  characterId?: 'maya' | 'leo' | 'sprout';
  position: THREE.Vector3;
  mesh: THREE.Object3D;
}

interface SlidingDoorPair {
  axis: 'x' | 'z';
  doorCenter: THREE.Vector3;
  leftLeaf: THREE.Mesh;
  rightLeaf: THREE.Mesh;
  statusLight: THREE.PointLight;
  statusStrip: THREE.Mesh;
  openFactor: number;
  wasOpen: boolean;
}

export class HabitatBuilder {
  public scene: THREE.Scene;
  public interactives: InteractiveTarget[] = [];
  private renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean;

  // Dynamic elements updated each frame
  public doors: SlidingDoorPair[] = [];
  private holoCoreGroup = new THREE.Group();
  private holoRings: THREE.Mesh[] = [];
  private holoOrbiters: THREE.Group[] = [];
  private holoGlobe!: THREE.Mesh;
  private fanBlades: THREE.Object3D[] = [];
  private cropMeshes: THREE.Mesh[] = [];
  private growLightMat!: THREE.MeshStandardMaterial;
  private powerCoreLight!: THREE.PointLight;
  private lifeSupportLight!: THREE.PointLight;
  private radiationBeaconLight!: THREE.PointLight;
  private radiationBeaconRotator!: THREE.Group;
  private greenhouseLight!: THREE.PointLight;
  private hubStatusLight!: THREE.PointLight;
  private stormShutterMesh!: THREE.Mesh;
  private shieldLayerMeshes: THREE.Mesh[] = [];
  private dustBreakerLever!: THREE.Mesh;
  private airflowValveWheel!: THREE.Group;
  private bulkheadLatchLever!: THREE.Mesh;
  private condensateValveWheel!: THREE.Group;

  // Earth rotation and clouds
  private earthMesh!: THREE.Mesh;
  private cloudsMesh!: THREE.Mesh;

  // Animated terminals and screens
  private screenMaterials: THREE.MeshBasicMaterial[] = [];
  private animatedCanvases: Array<{
    ctx: CanvasRenderingContext2D;
    tex: THREE.CanvasTexture;
    type: 'power' | 'life' | 'rad' | 'green' | 'hub';
  }> = [];

  // Airborne dust motes
  private dustParticles!: THREE.Points;

  // Dynamic Floor Navigation Trail
  private guideTrailGroup = new THREE.Group();
  private guideTrailNodes: THREE.Mesh[] = [];
  private guideTrailTime = 0;
  private guideRoute: GuidePoint[] = [];
  private guideTarget: GuidePoint = {x:999,z:999};
  private guideFrom: GuidePoint = {x:999,z:999};
  private guideLastRoutedAt = -10;

  // Active Objective Beacon
  private objectiveBeacon = new THREE.Group();
  private beaconArrow!: THREE.Mesh;
  private beaconRing!: THREE.Mesh;

  // Station Crew Characters
  public crew: StationCrew;

  // Shared high-detail materials
  private matCeramicWhite!: THREE.MeshStandardMaterial;
  private matMoonstoneGray!: THREE.MeshStandardMaterial;
  private matDeepGraphite!: THREE.MeshStandardMaterial;
  private matCeiling!: THREE.MeshStandardMaterial;
  private matDarkDeck!: THREE.MeshStandardMaterial;
  private matBrushedSteel!: THREE.MeshStandardMaterial;
  private matTechnicalBlue!: THREE.MeshStandardMaterial;
  private matWarmAmber!: THREE.MeshStandardMaterial;
  private matEmergencyCoral!: THREE.MeshStandardMaterial;
  private matHealthyGreen!: THREE.MeshStandardMaterial;
  private matHazardStripe!: THREE.MeshStandardMaterial;
  private matEmissiveLightBar!: THREE.MeshStandardMaterial;
  private matEmissiveBlueBar!: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, isSoftwareGl: boolean = false) {
    this.scene = scene;
    this.renderer = renderer;
    this.isSoftwareGl = isSoftwareGl;

    this.initMaterials();
    this.buildLightingAndExterior();
    this.buildCentralHub();
    this.buildScienceAcademyKiosk();
    this.buildCorridorsAndDoors();
    this.buildPowerRoom();
    this.buildLifeSupportRoom();
    this.buildRadiationRoom();
    this.buildGreenhouseRoom();
    // Deliberately replace oversized cabinets/voxel furniture which crossed
    // the greenhouse approach. Keep all crew interaction targets intact.
    const dressing = new HubDressing(scene);
    this.interactives.push({
      id: 'observation_telescope',
      title: 'Earth Observation Telescope',
      subtitle: 'Explore Earth from the Moon [E]',
      actionType: 'observation',
      position: dressing.telescopePosition,
      mesh: dressing.telescope,
    });
    if (!this.isSoftwareGl) {
      new LunarWonderArchitecture(scene);
      new PremiumBulkheads(scene);
    }
    this.buildDynamicFloorGuideTrail();
    this.buildObjectiveBeacon();
    this.buildAirborneDustMotes();

    // Crew Characters
    this.crew = new StationCrew(scene);
    this.registerCrewInteractives();
  }

  private buildScienceAcademyKiosk(): void {
    const station = new TrainingWallExhibit(this.scene);
    this.interactives.push({id:'academy_hub', title:'Astronaut Science Academy',subtitle:'Open the interactive learning adventure [E]',actionType:'academy', position:station.interactionPoint,mesh:station.group});
  }

  private registerCrewInteractives(): void {
    this.interactives.push({
      id: 'crew_maya',
      title: 'Dr. Maya Chen (Chief Scientist)',
      subtitle: 'Ask about Lunar Radiation, Gravity & Shielding [E]',
      actionType: 'dialogue',
      characterId: 'maya',
      position: new THREE.Vector3(3.0, 1.4, -1.7),
      mesh: this.crew.mayaGroup,
    });

    this.interactives.push({
      id: 'crew_leo',
      title: 'Leo (Chief Engineer)',
      subtitle: 'Ask about Battery Storage, Solar Generation & Trade-offs [E]',
      actionType: 'dialogue',
      characterId: 'leo',
      position: new THREE.Vector3(-2.8, 1.4, -17.8),
      mesh: this.crew.leoGroup,
    });

    this.interactives.push({
      id: 'crew_sprout',
      title: 'SPROUT (Gardening Bot)',
      subtitle: 'Ask about Hydroponics, Photosynthesis & Clean Water [E]',
      actionType: 'dialogue',
      characterId: 'sprout',
      position: new THREE.Vector3(-15.8, 1.0, 1.8),
      mesh: this.crew.sproutGroup,
    });
  }

  /* -------------------------------------------------------------------------- */
  /* PROCEDURAL SCI-FI TEXTURE GENERATORS (1024x1024 High-Resolution Canvas)   */
  /* -------------------------------------------------------------------------- */

  private createDeckTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Dark titanium structural floor plate base
    ctx.fillStyle = '#161e27';
    ctx.fillRect(0, 0, size, size);

    // Subtle metallic noise grain
    for (let i = 0; i < 6000; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      const val = 18 + Math.floor(Math.random() * 14);
      ctx.fillStyle = `rgba(${val}, ${val + 4}, ${val + 10}, 0.12)`;
      ctx.fillRect(rx, ry, 2, 2);
    }

    const tileSize = 256;
    for (let tx = 0; tx < size; tx += tileSize) {
      for (let ty = 0; ty < size; ty += tileSize) {
        // Tile panel border shadow
        ctx.strokeStyle = '#0d131a';
        ctx.lineWidth = 6;
        ctx.strokeRect(tx + 3, ty + 3, tileSize - 6, tileSize - 6);

        // Tile inner bevel highlight
        ctx.strokeStyle = '#2b3a4a';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx + 8, ty + 8, tileSize - 16, tileSize - 16);

        // Non-slip diamond tread / grip plate in center
        ctx.fillStyle = '#1b242e';
        ctx.fillRect(tx + 32, ty + 32, tileSize - 64, tileSize - 64);

        ctx.strokeStyle = '#283646';
        ctx.lineWidth = 2;
        for (let gx = tx + 40; gx < tx + tileSize - 40; gx += 16) {
          ctx.beginPath();
          ctx.moveTo(gx, ty + 36);
          ctx.lineTo(gx + 8, ty + tileSize - 36);
          ctx.stroke();
        }

        // 4 corner titanium hex bolts
        const boltOffsets = [
          [16, 16],
          [tileSize - 16, 16],
          [16, tileSize - 16],
          [tileSize - 16, tileSize - 16],
        ];
        boltOffsets.forEach(([bx, by]) => {
          ctx.fillStyle = '#3a4c5e';
          ctx.beginPath();
          ctx.arc(tx + bx, ty + by, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#121820';
          ctx.beginPath();
          ctx.arc(tx + bx, ty + by, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    // No caution-tape pattern on normal walking surfaces: safety markings
    // belong only beside genuinely hazardous equipment, never every floor tile.
    ctx.strokeStyle = 'rgba(142, 153, 158, 0.18)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, size - 12, size - 12);

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    bumpCanvas.getContext('2d')!.drawImage(canvas, 0, 0, 512, 512);

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(12, 12);
    map.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;
    bump.repeat.set(12, 12);

    return { map, bump };
  }

  private createWallTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    // One art-directed, low-glare modular ceramic-composite material for the
    // entire habitat. Dark recessed chassis + satin service panels make the
    // lighting read as physical architecture, rather than a white tile grid.
    const size=1024;
    const canvas=document.createElement('canvas');
    canvas.width=size;canvas.height=size;
    const g=canvas.getContext('2d')!;
    g.fillStyle='#263746';g.fillRect(0,0,size,size);
    const bumpCanvas=document.createElement('canvas');
    bumpCanvas.width=512;bumpCanvas.height=512;
    const h=bumpCanvas.getContext('2d')!;
    h.fillStyle='#777777';h.fillRect(0,0,512,512);
    const colW=size/2,rowH=size/3;
    for(let c=0;c<2;c++)for(let row=0;row<3;row++){
      const x=c*colW,y=row*rowH;
      // Welded structural recess. Clear edges and deep reveal, no fake chalk lines.
      g.fillStyle='#172b39';g.fillRect(x+6,y+6,colW-12,rowH-12);
      g.fillStyle='#4a5d68';g.fillRect(x+15,y+14,colW-30,rowH-29);
      g.fillStyle='#acb9be';g.fillRect(x+21,y+20,colW-42,rowH-43);
      // A broad quiet material field: enough visual rest for important props.
      g.fillStyle=row===1?'#a4afb6':'#aeb9bf';
      g.fillRect(x+31,y+30,colW-62,rowH-70);
      // Warm edge catches and graphite service channels share one visual logic.
      g.fillStyle='#d0cbc0';g.fillRect(x+26,y+25,colW-52,3);
      g.fillStyle='#263947';g.fillRect(x+23,y+rowH-43,colW-46,18);
      g.fillStyle='#677b88';g.fillRect(x+27,y+rowH-39,colW-54,3);
      // Precision fasteners mounted to the recess, not scattered randomly.
      for(const ox of [32,colW-32]){
        for(const oy of [34,rowH-33]){
          g.fillStyle='#364957';g.beginPath();g.arc(x+ox,y+oy,6,0,Math.PI*2);g.fill();
          g.fillStyle='#a2aeb5';g.beginPath();g.arc(x+ox,y+oy,2.1,0,Math.PI*2);g.fill();
        }
      }
      // Some panels contain a functional access cover; not every tile needs it.
      if((c+row)%3===0){
        g.fillStyle='#71848e';g.fillRect(x+colW*.58,y+rowH*.28,124,89);
        g.fillStyle='#283c49';g.fillRect(x+colW*.59,y+rowH*.30,114,82);
        for(let k=0;k<5;k++){
          g.fillStyle='#91a5ae';g.fillRect(x+colW*.615,y+rowH*.33+k*11,88,2);
        }
      } else if((c+row)%3===1){
        g.fillStyle='rgba(36,67,83,.35)';
        g.fillRect(x+57,y+rowH*.40,155,40);
        g.fillStyle='#8e9fa8';g.fillRect(x+62,y+rowH*.43,85,7);
        g.fillStyle='#b5a17e';g.fillRect(x+62,y+rowH*.51,42,5);
      }
      // Bump is actual tonal relief, not the full color map reused as height.
      const qx=x/2,qy=y/2,qw=colW/2,qh=rowH/2;
      h.fillStyle='#555555';h.fillRect(qx+4,qy+4,qw-8,qh-8);
      h.fillStyle='#a1a1a1';h.fillRect(qx+11,qy+11,qw-22,qh-22);
      h.fillStyle='#bebebe';h.fillRect(qx+16,qy+16,qw-32,qh-37);
    }
    // Subtle directional micro-brushing, restrained at gameplay distance.
    for(let i=0;i<1024;i+=7){
      g.fillStyle='rgba(11,26,37,.028)';
      g.fillRect(0,i,1024,1);
    }
    const map=new THREE.CanvasTexture(canvas);
    map.colorSpace=THREE.SRGBColorSpace;
    map.wrapS=THREE.RepeatWrapping;map.wrapT=THREE.RepeatWrapping;
    map.repeat.set(4,2);map.anisotropy=Math.min(this.renderer.capabilities.getMaxAnisotropy(),8);
    const bump=new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS=THREE.RepeatWrapping;bump.wrapT=THREE.RepeatWrapping;
    bump.repeat.set(4,2);
    return {map,bump};
  }

  private createBulkheadTexture(): THREE.CanvasTexture {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Heavy graphite / tungsten composite
    ctx.fillStyle = '#161d26';
    ctx.fillRect(0, 0, size, size);

    // Brushed titanium horizontal streaks
    ctx.fillStyle = '#222d3b';
    for (let y = 0; y < size; y += 6) {
      ctx.fillRect(0, y, size, 2);
    }

    // Heavy structural reinforcing ribs
    ctx.strokeStyle = '#0b0f14';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, size - 20, size - 20);

    ctx.strokeStyle = '#38485c';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, size - 40, size - 40);

    // Beveled inner armor plate inserts
    ctx.fillStyle = '#1e2834';
    ctx.fillRect(40, 40, size - 80, size - 80);
    ctx.strokeStyle = '#2d3d50';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, size - 96, size - 96);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);
    return tex;
  }

  private createCeilingTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#101720';
    ctx.fillRect(0, 0, size, size);

    // Acoustic perforated tile grid
    const s = 64;
    ctx.strokeStyle = '#1b2633';
    ctx.lineWidth = 4;
    for (let x = 0; x <= size; x += s) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, x);
      ctx.lineTo(size, x);
      ctx.stroke();
    }

    // Perforation dot cluster
    ctx.fillStyle = '#080d12';
    for (let x = 8; x < size; x += 16) {
      for (let y = 8; y < size; y += 16) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
  }

  private createHazardStripeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#111827';
    for (let x = -256; x < 512; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 24, 0);
      ctx.lineTo(x - 40, 256);
      ctx.lineTo(x - 64, 256);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }

  private createSignageTexture(
    code: string,
    title: string,
    subtitle: string,
    accentHex: string
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;

    // Dark glass body with glowing rim
    ctx.fillStyle = '#0b1118';
    ctx.fillRect(0, 0, 512, 200);

    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 188);

    // Corner glow accents
    ctx.fillStyle = accentHex;
    ctx.fillRect(6, 6, 24, 24);
    ctx.fillRect(482, 6, 24, 24);
    ctx.fillRect(6, 170, 24, 24);
    ctx.fillRect(482, 170, 24, 24);

    // Code badge
    ctx.fillStyle = accentHex;
    ctx.fillRect(36, 28, 100, 36);

    ctx.fillStyle = '#0b1118';
    ctx.font = 'bold 22px "Chakra Petch", sans-serif';
    ctx.fillText(code, 46, 54);

    // Title
    ctx.fillStyle = '#e7e9e6';
    ctx.font = 'bold 36px "Chakra Petch", sans-serif';
    ctx.fillText(title, 36, 114);

    // Subtitle
    ctx.fillStyle = '#8e999e';
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText(subtitle, 36, 156);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);
    return tex;
  }

  private createConsoleScreenTexture(
    type: 'power' | 'life' | 'rad' | 'green' | 'hub',
    header: string,
    sub: string,
    accentHex: string
  ): { texture: THREE.CanvasTexture; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // CRT / OLED glass background
    ctx.fillStyle = '#080d14';
    ctx.fillRect(0, 0, 1024, 512);

    // Top Header Banner
    ctx.fillStyle = '#121b26';
    ctx.fillRect(16, 16, 992, 70);

    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 992, 480);

    // Blinking status indicator circle
    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(48, 51, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e7e9e6';
    ctx.font = 'bold 32px "Chakra Petch", sans-serif';
    ctx.fillText(header, 76, 61);

    ctx.fillStyle = accentHex;
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText('STATUS: ONLINE · REAL-TIME TELEMETRY', 680, 61);

    // Left display: Multi-bar telemetry gauges
    ctx.strokeStyle = '#233242';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 110, 460, 360);

    ctx.fillStyle = '#8e999e';
    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.fillText(sub, 50, 140);

    // Simulated gauge bars
    const labels = ['PRIMARY BUS', 'AUX STORAGE', 'HEAT REJECTION', 'SYSTEM FLUX'];
    labels.forEach((lbl, i) => {
      const by = 180 + i * 65;
      ctx.fillStyle = '#a0aec0';
      ctx.font = '500 16px "JetBrains Mono", monospace';
      ctx.fillText(lbl, 50, by);

      // Bar outline
      ctx.strokeStyle = '#2d3e52';
      ctx.strokeRect(50, by + 8, 420, 20);

      // Bar fill
      ctx.fillStyle = accentHex;
      const fillW = 220 + Math.sin(i * 1.5) * 120;
      ctx.fillRect(52, by + 10, fillW, 16);
    });

    // Right display: Simulated active waveform monitor
    ctx.strokeStyle = '#233242';
    ctx.strokeRect(520, 110, 468, 360);

    // Grid lines
    ctx.strokeStyle = '#15212e';
    for (let gx = 520; gx <= 988; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 110);
      ctx.lineTo(gx, 470);
      ctx.stroke();
    }
    for (let gy = 110; gy <= 470; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(520, gy);
      ctx.lineTo(988, gy);
      ctx.stroke();
    }

    // Waveform curve
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let wx = 520; wx <= 988; wx += 4) {
      const rel = (wx - 520) / 468;
      const wy = 290 + Math.sin(rel * Math.PI * 8) * 55 + Math.cos(rel * Math.PI * 14) * 20;
      if (wx === 520) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.stroke();

    // CRT Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let sy = 0; sy < 512; sy += 4) {
      ctx.fillRect(0, sy, 1024, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);

    return { texture, canvas, ctx };
  }

  private createEarthTexture(): THREE.CanvasTexture {
    const width = 1024;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Deep ocean blue gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
    oceanGrad.addColorStop(0, '#0a2342');
    oceanGrad.addColorStop(0.5, '#0d325c');
    oceanGrad.addColorStop(1, '#0a2342');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // Realistic procedural continents
    const drawLandmass = (x: number, y: number, radX: number, radY: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, radX, radY, 0.2, 0, Math.PI * 2);
      ctx.fill();
    };

    // Americas
    drawLandmass(260, 180, 110, 80, '#2d5a3f');
    drawLandmass(320, 340, 70, 110, '#386641');
    // Eurasia & Africa
    drawLandmass(620, 160, 160, 90, '#4f772d');
    drawLandmass(580, 310, 90, 110, '#a3704c');
    // Australia
    drawLandmass(820, 360, 60, 50, '#c28e5c');
    // Polar ice caps
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, 25);
    ctx.fillRect(0, height - 25, width, 25);

    // Cloud swirls
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let c = 0; c < 28; c++) {
      const cx = (c * 73) % width;
      const cy = 60 + ((c * 47) % (height - 120));
      ctx.beginPath();
      ctx.ellipse(cx, cy, 70 + (c % 5) * 15, 20 + (c % 3) * 10, 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private initMaterials(): void {
    const { map: deckMap, bump: deckBump } = this.createDeckTexture();
    const { map: wallMap, bump: wallBump } = this.createWallTexture();
    const bulkheadTex = this.createBulkheadTexture();
    const ceilingTex = this.createCeilingTexture();
    const hazardTex = this.createHazardStripeTexture();

    this.matCeramicWhite = new THREE.MeshStandardMaterial({
      map: wallMap,
      bumpMap: wallBump,
      bumpScale: 0.04,
      color: 0xa5b3bb,
      roughness: 0.68,
      metalness: 0.11,
    });

    this.matMoonstoneGray = new THREE.MeshStandardMaterial({
      color: 0x8e999e,
      roughness: 0.52,
      metalness: 0.35,
    });

    this.matDeepGraphite = new THREE.MeshStandardMaterial({
      map: bulkheadTex,
      roughness: 0.65,
      metalness: 0.52,
    });

    this.matCeiling = new THREE.MeshStandardMaterial({
      map: ceilingTex,
      roughness: 0.8,
      metalness: 0.2,
    });

    this.matDarkDeck = new THREE.MeshStandardMaterial({
      map: deckMap,
      bumpMap: deckBump,
      bumpScale: 0.05,
      roughness: 0.55,
      metalness: 0.38,
    });

    this.matBrushedSteel = new THREE.MeshStandardMaterial({
      color: 0x9daeb8,
      roughness: 0.42,
      metalness: 0.70,
    });

    this.matHazardStripe = new THREE.MeshStandardMaterial({
      map: hazardTex,
      roughness: 0.45,
      metalness: 0.25,
    });

    this.matEmissiveLightBar = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfff5eb,
      emissiveIntensity: 0.98,
      roughness: 0.25,
    });

    this.matEmissiveBlueBar = new THREE.MeshStandardMaterial({
      color: 0x76aec9,
      emissive: 0x76aec9,
      emissiveIntensity: 0.85,
      roughness: 0.28,
    });

    this.matTechnicalBlue = new THREE.MeshStandardMaterial({
      color: 0x76aec9,
      emissive: 0x76aec9,
      emissiveIntensity: 0.75,
      roughness: 0.25,
      metalness: 0.3,
    });

    this.matWarmAmber = new THREE.MeshStandardMaterial({
      color: 0xe8ad66,
      emissive: 0xe8ad66,
      emissiveIntensity: 0.8,
      roughness: 0.25,
      metalness: 0.3,
    });

    this.matEmergencyCoral = new THREE.MeshStandardMaterial({
      color: 0xde6f60,
      emissive: 0xde6f60,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.3,
    });

    this.matHealthyGreen = new THREE.MeshStandardMaterial({
      color: 0x77b89a,
      emissive: 0x77b89a,
      emissiveIntensity: 0.75,
      roughness: 0.3,
      metalness: 0.2,
    });

    this.growLightMat = new THREE.MeshStandardMaterial({
      color: 0xe87ab8,
      emissive: 0xd946ef,
      emissiveIntensity: 1.4,
      roughness: 0.15,
    });
  }

  /* -------------------------------------------------------------------------- */
  /* LIGHTING, CELESTIAL ENVIRONMENT & EXTERIOR LUNAR CRATER                    */
  /* -------------------------------------------------------------------------- */

  private buildLightingAndExterior(): void {
    // Rich ambient fill light for deep atmospheric contrast
    const hemiLight = new THREE.HemisphereLight(0x6b8494, 0x0d1a25, 0.34);
    this.scene.add(hemiLight);

    // Direct lunar South Pole grazing sunlight (sharp shadows through observation window)
    const sunLight = new THREE.DirectionalLight(0xffe9cf, 1.38);
    sunLight.position.set(45, 18, -45);
    sunLight.castShadow = !this.isSoftwareGl;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 150;
    const d = 38;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    this.scene.add(sunLight);

    // Sculpted Shackleton Rim lunar terrain
    const terrainGeo = new THREE.PlaneGeometry(280, 280, 64, 64);
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const dist = Math.hypot(vx, vy);
      if (dist > 28) {
        // High-frequency crater ridge elevations
        const ridge =
          Math.sin(vx * 0.07) * Math.cos(vy * 0.07) * 4.8 +
          Math.sin(vx * 0.18 + 1.2) * Math.cos(vy * 0.18) * 1.8 +
          Math.max(0, (dist - 38) * 0.22);
        pos.setZ(i, ridge);
      } else {
        pos.setZ(i, -0.4);
      }
    }
    terrainGeo.computeVertexNormals();

    const terrainTex = new THREE.TextureLoader().load('/assets/lunar-regolith.jpg');
    terrainTex.colorSpace = THREE.SRGBColorSpace;
    terrainTex.wrapS = THREE.RepeatWrapping;
    terrainTex.wrapT = THREE.RepeatWrapping;
    terrainTex.repeat.set(22, 22);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0xa3a4a4,
      map: terrainTex,
      bumpMap: terrainTex,
      bumpScale: 0.07,
      roughness: 0.98,
      metalness: 0.0,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.15;
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    // Instanced lunar regolith boulders & crater ejecta
    const rockGeo = new THREE.DodecahedronGeometry(0.85, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x727b82,
      roughness: 0.9,
      metalness: 0.08,
    });
    const rockCount = 95;
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < rockCount; i++) {
      const angle = (i / rockCount) * Math.PI * 2;
      const radius = 30 + (i % 9) * 8.5;
      dummy.position.set(
        Math.cos(angle) * radius,
        -0.1,
        Math.sin(angle) * radius
      );
      const s = 0.45 + (i % 6) * 0.4;
      dummy.scale.set(s * 1.3, s * 0.65, s * 1.1);
      dummy.rotation.set(i * 0.35, i * 0.8, 0);
      dummy.updateMatrix();
      rockInst.setMatrixAt(i, dummy.matrix);
    }
    rockInst.computeBoundingSphere();
    rockInst.castShadow = true;
    rockInst.receiveShadow = true;
    this.scene.add(rockInst);

    // Exterior Solar Array Towers visible through the observation window
    for (let i = 0; i < 3; i++) {
      const tower = this.createExteriorSolarTower();
      tower.position.set(16 + i * 8, 0, -20 - i * 5);
      this.scene.add(tower);
    }

    // Gorgeous Distant Earth with procedural continents and atmospheric haze
    const earthGroup = new THREE.Group();
    // NASA Blue Marble base map. At this scene distance ~2 degrees across,
    // approximately Earth's true apparent angular diameter from the Moon.
    const earthRadius = 2.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 48);
    const earthTex = new THREE.TextureLoader().load('/assets/earth-blue-marble.jpg');
    earthTex.colorSpace = THREE.SRGBColorSpace;
    earthTex.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.45,
      metalness: 0.1,
    });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(this.earthMesh);

    // Cloud shell
    const cloudGeo = new THREE.SphereGeometry(2.027, 48, 32);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.025,
      blending: THREE.NormalBlending,
    });
    this.cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(this.cloudsMesh);

    // Rayleigh atmospheric blue haze outer ring
    const atmoGeo = new THREE.SphereGeometry(2.07, 48, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    earthGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

    // Earth appears just above a south-polar horizon; window sightline from hub.
    earthGroup.position.set(50, 12, -105);
    this.scene.add(earthGroup);

    // 2,500+ Starfield using Points with spectral colors (O, B, A, G, M stars)
    const starCount = 2800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const spectralColors = [
      new THREE.Color(0xa5c4ff), // O/B: blue-white
      new THREE.Color(0xf8f9ff), // A: pure white
      new THREE.Color(0xfff3e0), // G: yellow solar
      new THREE.Color(0xffcca2), // K/M: warm amber
    ];

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.92);
      const r = 135;

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.max(4, r * Math.cos(phi));
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const col = spectralColors[i % spectralColors.length];
      const brightness = 0.65 + Math.random() * 0.35;
      starColors[i * 3] = col.r * brightness;
      starColors[i * 3 + 1] = col.g * brightness;
      starColors[i * 3 + 2] = col.b * brightness;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starPointsMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: false,
    });
    this.scene.add(new THREE.Points(starGeo, starPointsMat));
  }

  private createExteriorSolarTower(): THREE.Group {
    const group = new THREE.Group();
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.38, 9, 12),
      this.matBrushedSteel
    );
    mast.position.y = 4.5;
    group.add(mast);

    // Articulated tracking gimbal mount
    const gimbal = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 12, 12),
      this.matDeepGraphite
    );
    gimbal.position.y = 7.2;
    group.add(gimbal);

    // High efficiency photovoltaic wings
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x112338,
      emissive: 0x081524,
      roughness: 0.18,
      metalness: 0.85,
    });

    [-1, 1].forEach((dir) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.2, 0.14), wingMat);
      wing.position.set(dir * 3.0, 7.2, 0);
      group.add(wing);

      // Gold MLI insulation collar
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.9,
        roughness: 0.3,
      });
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8), goldMat);
      strut.rotation.z = dir * 0.45;
      strut.position.set(dir * 1.4, 6.2, 0);
      group.add(strut);
    });

    return group;
  }

  /* -------------------------------------------------------------------------- */
  /* AIRBORNE DUST PARTICLES (HABITAT INTERIOR MOTE SIMULATION)                 */
  /* -------------------------------------------------------------------------- */

  private buildAirborneDustMotes(): void {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = 0.4 + Math.random() * 3.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xccd6dd,
      size: 2.2,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false,
    });
    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  /* -------------------------------------------------------------------------- */
  /* ROOM ARCHITECTURE & STRUCTURAL RIBS                                       */
  /* -------------------------------------------------------------------------- */

  private buildRoomShell(
    centerX: number,
    centerZ: number,
    width: number,
    depth: number,
    height: number,
    openings: { north?: boolean; east?: boolean; south?: boolean; west?: boolean; windowNorthEast?: boolean }
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(centerX, 0, centerZ);

    // Modular Deck Floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.22, depth),
      this.matDarkDeck
    );
    floor.position.y = -0.11;
    floor.receiveShadow = true;
    group.add(floor);

    // Modular Acoustic Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.25, depth),
      this.matCeiling
    );
    ceiling.position.y = height + 0.12;
    group.add(ceiling);

    // Overhead structural reinforcement ribs with recessed LED diffusers
    for (let offset = -width / 2 + 2; offset <= width / 2 - 2; offset += 4) {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.38, depth - 0.4),
        this.matMoonstoneGray
      );
      rib.position.set(offset, height - 0.16, 0);
      group.add(rib);

      // Embedded LED linear diffuser light fixture
      const lightBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, depth - 1.2),
        this.matEmissiveLightBar
      );
      lightBar.position.set(offset, height - 0.32, 0);
      group.add(lightBar);
    }

    const doorWidth = 3.6;
    const doorHeight = 3.1;

    const addWallWithOptionalDoor = (
      side: 'north' | 'south' | 'east' | 'west',
      hasDoor: boolean
    ) => {
      const span = side === 'north' || side === 'south' ? width : depth;
      const wallThickness = 0.4;
      const isZWall = side === 'north' || side === 'south';
      const posCoord =
        side === 'north'
          ? -depth / 2
          : side === 'south'
            ? depth / 2
            : side === 'east'
              ? width / 2
              : -width / 2;

      if (!hasDoor) {
        // Panoramic Observation Viewport on Hub North-East wall
        if (side === 'north' && openings.windowNorthEast) {
          const leftSeg = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, height, wallThickness),
            this.matCeramicWhite
          );
          leftSeg.position.set(-width / 2 + 1.6, height / 2, posCoord);
          group.add(leftSeg);

          // Reinforced window sill & header
          const sill = new THREE.Mesh(
            new THREE.BoxGeometry(5.6, 1.1, wallThickness),
            this.matDeepGraphite
          );
          sill.position.set(width / 2 - 2.8, 0.55, posCoord);
          group.add(sill);

          const header = new THREE.Mesh(
            new THREE.BoxGeometry(5.6, 0.9, wallThickness),
            this.matDeepGraphite
          );
          header.position.set(width / 2 - 2.8, height - 0.45, posCoord);
          group.add(header);

          // Triple-pane radiation shielded viewport glass
          const glass = new THREE.Mesh(
            new THREE.BoxGeometry(5.4, height - 2.0, 0.1),
            new THREE.MeshPhysicalMaterial({
              color: 0x99e6ff,
              transparent: true,
              opacity: 0.28,
              roughness: 0.08,
              metalness: 0.15,
              transmission: 0.85,
              ior: 1.52,
              depthWrite: false,
            })
          );
          glass.position.set(width / 2 - 2.8, 1.1 + (height - 2.0) / 2, posCoord);
          group.add(glass);
          return;
        }

        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(
            isZWall ? span : wallThickness,
            height,
            isZWall ? wallThickness : span
          ),
          this.matCeramicWhite
        );
        wall.position.set(
          isZWall ? 0 : posCoord,
          height / 2,
          isZWall ? posCoord : 0
        );
        group.add(wall);

        // Lower wainscoting trim with hazard strip accent
        const trim = new THREE.Mesh(
          new THREE.BoxGeometry(
            isZWall ? span - 0.2 : wallThickness + 0.06,
            0.9,
            isZWall ? wallThickness + 0.06 : span - 0.2
          ),
          this.matDeepGraphite
        );
        trim.position.set(isZWall ? 0 : posCoord, 0.45, isZWall ? posCoord : 0);
        group.add(trim);
      } else {
        const sideSpan = (span - doorWidth) / 2;
        [-1, 1].forEach((dir) => {
          const offset = dir * (doorWidth / 2 + sideSpan / 2);
          if (side === 'north' && openings.windowNorthEast) {
            // Real, deliberately framed observation glazing on BOTH sides
            // of the northern access corridor. Previously the `north:true`
            // branch drew opaque wall panels over the intended window.
            const sillHeight = 1.12;
            const upperStart = 3.36;
            const thickness = wallThickness;
            const lower = new THREE.Mesh(
              new THREE.BoxGeometry(sideSpan, sillHeight, thickness),
              this.matCeramicWhite
            );
            lower.position.set(offset, sillHeight / 2, posCoord);
            group.add(lower);
            const upper = new THREE.Mesh(
              new THREE.BoxGeometry(sideSpan, height - upperStart, thickness),
              this.matCeramicWhite
            );
            upper.position.set(offset, (height + upperStart) / 2, posCoord);
            group.add(upper);
            const pane = new THREE.Mesh(
              new THREE.PlaneGeometry(sideSpan - 0.32, upperStart - sillHeight - 0.18),
              new THREE.MeshPhysicalMaterial({
                color: 0xb9dfed,
                transparent: true,
                opacity: 0.075,
                roughness: 0.055,
                metalness: 0,
                depthWrite: false,
                side: THREE.DoubleSide,
              })
            );
            pane.position.set(offset, (sillHeight + upperStart) / 2, posCoord);
            group.add(pane);
            const metal = new THREE.MeshStandardMaterial({
              color: 0x263541, roughness: 0.42, metalness: 0.68,
            });
            const frameW = sideSpan + 0.12;
            const windowH = upperStart - sillHeight;
            for (const yy of [sillHeight, upperStart]) {
              const beam = new THREE.Mesh(new THREE.BoxGeometry(frameW, 0.10, 0.18), metal);
              beam.position.set(offset, yy, posCoord + 0.07);
              group.add(beam);
            }
            for (const xx of [offset - frameW / 2, offset + frameW / 2, offset]) {
              const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.10, windowH, 0.18), metal);
              mullion.position.set(xx, (sillHeight + upperStart) / 2, posCoord + 0.07);
              group.add(mullion);
            }
            return;
          }
          const seg = new THREE.Mesh(
            new THREE.BoxGeometry(
              isZWall ? sideSpan : wallThickness,
              height,
              isZWall ? wallThickness : sideSpan
            ),
            this.matCeramicWhite
          );
          seg.position.set(
            isZWall ? offset : posCoord,
            height / 2,
            isZWall ? posCoord : offset
          );
          group.add(seg);
        });

        // Overhead doorway lintel with hazard chevrons
        const headerHeight = height - doorHeight;
        const header = new THREE.Mesh(
          new THREE.BoxGeometry(
            isZWall ? doorWidth : wallThickness,
            headerHeight,
            isZWall ? wallThickness : doorWidth
          ),
          this.matDeepGraphite
        );
        header.position.set(
          isZWall ? 0 : posCoord,
          doorHeight + headerHeight / 2,
          isZWall ? posCoord : 0
        );
        group.add(header);

        const hazardBanner = new THREE.Mesh(
          new THREE.BoxGeometry(
            isZWall ? doorWidth : wallThickness + 0.04,
            0.08,
            isZWall ? wallThickness + 0.04 : doorWidth
          ),
          this.matHazardStripe
        );
        hazardBanner.position.set(
          isZWall ? 0 : posCoord,
          doorHeight + 0.1,
          isZWall ? posCoord : 0
        );
        group.add(hazardBanner);
      }
    };

    addWallWithOptionalDoor('north', Boolean(openings.north));
    addWallWithOptionalDoor('south', Boolean(openings.south));
    addWallWithOptionalDoor('east', Boolean(openings.east));
    addWallWithOptionalDoor('west', Boolean(openings.west));

    this.scene.add(group);
    return group;
  }

  /* -------------------------------------------------------------------------- */
  /* CENTRAL MISSION HUB & 3D HOLOGRAPHIC COMMAND TABLE                         */
  /* -------------------------------------------------------------------------- */

  private createTrainingMoonTexture(): THREE.CanvasTexture {
    // Restrained, original illustration for the interactive hub globe.
    // Explicitly NOT a mapped NASA LOLA geological dataset.
    const c=document.createElement('canvas');c.width=512;c.height=256;
    const g=c.getContext('2d')!;
    g.fillStyle='#6d7a80';g.fillRect(0,0,512,256);
    // Repeatable low-amplitude surface tonal variation.
    for(let y=0;y<256;y+=4){
      for(let x=0;x<512;x+=4){
        const v=Math.sin(x*0.13+y*0.27)*0.5+Math.cos(x*.037-y*.11)*.5;
        const light=Math.round(112+v*12);
        g.fillStyle='rgb('+light+','+(light+7)+','+(light+10)+')';
        g.fillRect(x,y,4,4);
      }
    }
    let seed=41;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<140;i++){
      const x=rand()*512,y=rand()*256,r=2+rand()*13;
      g.beginPath();g.ellipse(x,y,r,r*(.45+rand()*.4),rand()*.5,0,Math.PI*2);
      g.fillStyle='rgba(40,53,63,.14)';g.fill();
      g.strokeStyle='rgba(223,226,219,.29)';g.lineWidth=1.5;g.stroke();
    }
    const tex=new THREE.CanvasTexture(c);
    tex.colorSpace=THREE.SRGBColorSpace;
    tex.wrapS=THREE.RepeatWrapping;
    tex.anisotropy=4;
    return tex;
  }

  private buildCentralHub(): void {
    // 14x14m central command center
    this.buildRoomShell(0, 0, 14, 14, 4.4, {
      north: true,
      east: true,
      south: true,
      west: true,
      windowNorthEast: true,
    });

    // Overhead suspended octagonal luminaire chandelier fixture
    const chandelier = new THREE.Group();
    chandelier.position.set(0, 4.0, 0);

    const octRing = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 0.22, 8, 1, true),
      this.matDeepGraphite
    );
    chandelier.add(octRing);

    const glowDiffuser = new THREE.Mesh(
      new THREE.TorusGeometry(2.18, 0.065, 8, 48),
      this.matEmissiveLightBar
    );
    glowDiffuser.rotation.x = Math.PI / 2;
    chandelier.add(glowDiffuser);
    this.scene.add(chandelier);

    // Directional LED floor runways from hub center to each wing
    const addFloorStrip = (
      x: number,
      z: number,
      w: number,
      d: number,
      mat: THREE.Material
    ) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), mat);
      strip.position.set(x, 0.02, z);
      this.scene.add(strip);
    };

    addFloorStrip(0, -6.5, 0.095, 9.4, this.matWarmAmber); // North -> Power
    addFloorStrip(6.5, 0, 9.4, 0.095, this.matTechnicalBlue); // East -> Life Support
    addFloorStrip(0, 6.5, 0.095, 9.4, this.matEmergencyCoral); // South -> Radiation
    addFloorStrip(-6.5, 0, 9.4, 0.095, this.matHealthyGreen); // West -> Greenhouse

    // Corridor entrance signs above all 4 hub airlocks
    this.addCorridorSign(
      0,
      3.55,
      -6.72,
      0,
      'SEC-01',
      'POWER CORE',
      'SOLAR ARRAY & HVDC BUS',
      '#E8AD66'
    );
    this.addCorridorSign(
      6.72,
      3.55,
      0,
      -Math.PI / 2,
      'SEC-02',
      'LIFE SUPPORT',
      'OGA & ZEOLITE CO2 SCRUBBER',
      '#76AEC9'
    );
    this.addCorridorSign(
      0,
      3.55,
      6.72,
      Math.PI,
      'SEC-03',
      'RADIATION SHELTER',
      'GRADED-Z STORM BULKHEAD',
      '#DE6F60'
    );
    this.addCorridorSign(
      -6.72,
      3.55,
      0,
      Math.PI / 2,
      'SEC-04',
      'GREENHOUSE',
      'PAR LED & WATER RECOVERY',
      '#77B89A'
    );

    // Central 3D Holographic Status Table
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, -0.4);

    const basePedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.45, 0.9, 12),
      this.matDeepGraphite
    );
    basePedestal.position.y = 0.45;
    tableGroup.add(basePedestal);

    const rimRing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.35, 0.16, 12),
      this.matBrushedSteel
    );
    rimRing.position.y = 0.95;
    tableGroup.add(rimRing);

    // Glowing cyan projector lens on table surface
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.05, 24),
      this.matTechnicalBlue
    );
    lens.position.y = 1.01;
    tableGroup.add(lens);

    // Sculpted physical training globe, replacing the exposed triangle wireframe
    // which looked like unfinished debug geometry in the player's camera.
    this.holoCoreGroup.position.set(0, 1.69, 0);
    const globeGeo = new THREE.SphereGeometry(0.43, 48, 32);
    const globeMat = new THREE.MeshStandardMaterial({
      map: this.createTrainingMoonTexture(),
      color: 0xdbe1e4,
      metalness: 0.09,
      roughness: 0.88,
      emissive: 0x1c3143,
      emissiveIntensity: 0.17,
    });
    this.holoGlobe = new THREE.Mesh(globeGeo, globeMat);
    this.holoCoreGroup.add(this.holoGlobe);
    const axis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 1.06, 12),
      this.matWarmAmber
    );
    axis.rotation.z = 0.18;
    this.holoCoreGroup.add(axis);
    // Scientific reference marker: geometry is decorative, not a NASA terrain model.
    const globeStand = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.017, 10, 48),
      new THREE.MeshStandardMaterial({ color: 0x89bac9, emissive: 0x164e69, emissiveIntensity: 0.3, roughness: .42 }));
    globeStand.rotation.x = Math.PI/2;
    this.holoCoreGroup.add(globeStand);

    // Concentric holographic rings
    [0.72, 1.05].forEach((rad, idx) => {
      const ringGeo = new THREE.RingGeometry(rad - 0.02, rad + 0.02, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x76aec9 : 0xe8ad66,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      this.holoRings.push(ringMesh);
      this.holoCoreGroup.add(ringMesh);
    });

    // Orbiting holographic sector beacons
    const sectorColors = [0xe8ad66, 0x76aec9, 0xde6f60, 0x77b89a];
    for (let s = 0; s < 4; s++) {
      const orbGroup = new THREE.Group();
      const angle = (s * Math.PI) / 2;
      orbGroup.position.set(Math.cos(angle) * 0.95, 0, Math.sin(angle) * 0.95);

      const orbMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, 0.18),
        new THREE.MeshBasicMaterial({ color: sectorColors[s] })
      );
      orbGroup.add(orbMesh);

      // Vertical energy connection beam to core
      const beamGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.95, 6);
      const beamMat = new THREE.MeshBasicMaterial({
        color: sectorColors[s],
        transparent: true,
        opacity: 0.5,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.rotation.z = Math.PI / 2;
      beam.position.x = -Math.cos(angle) * 0.475;
      beam.position.z = -Math.sin(angle) * 0.475;

      this.holoOrbiters.push(orbGroup);
      this.holoCoreGroup.add(orbGroup);
    }

    tableGroup.add(this.holoCoreGroup);
    this.scene.add(tableGroup);

    // Master Mission Command Console desk
    const masterConsole = this.createConsoleUnit(
      'hub',
      'MASTER MISSION CONSOLE',
      'STORM TRANSIT COMMIT · STATUS OK',
      '#76AEC9'
    );
    masterConsole.position.set(0, 0, 1.15);
    this.scene.add(masterConsole);

    this.interactives.push({
      id: 'console_hub',
      title: 'Master Mission Command Console',
      subtitle: 'Inspect Interconnected Systems & Commit Storm Transit',
      actionType: 'open_challenge',
      challengeId: 'master_console',
      position: new THREE.Vector3(0, 1.2, 1.15),
      mesh: masterConsole,
    });

    this.hubStatusLight = new THREE.PointLight(0x76aec9, 1.6, 13, 1.8);
    this.hubStatusLight.position.set(0, 3.6, 0);
    this.scene.add(this.hubStatusLight);
  }

  private addCorridorSign(
    x: number,
    y: number,
    z: number,
    rotY: number,
    code: string,
    title: string,
    subtitle: string,
    accentHex: string
  ): void {
    const tex = this.createSignageTexture(code, title, subtitle, accentHex);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.05), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    this.scene.add(mesh);
  }

  private createConsoleUnit(
    screenType: 'power' | 'life' | 'rad' | 'green' | 'hub',
    header: string,
    sub: string,
    accentHex: string
  ): THREE.Group {
    const group = new THREE.Group();

    // Console base pedestal with ventilation grilles
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.95, 0.8),
      this.matDeepGraphite
    );
    base.position.y = 0.475;
    group.add(base);

    // Brushed titanium trim & keyboard deck
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(1.72, 0.12, 0.88),
      this.matBrushedSteel
    );
    trim.position.y = 0.95;
    group.add(trim);

    // Keyboard & tactile switches
    const kbd = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.04, 0.28),
      this.matMoonstoneGray
    );
    kbd.position.set(0, 1.02, 0.18);
    group.add(kbd);

    // Tilted primary monitor frame
    const screenMount = new THREE.Mesh(
      new THREE.BoxGeometry(1.52, 0.78, 0.14),
      this.matMoonstoneGray
    );
    screenMount.position.set(0, 1.34, -0.12);
    screenMount.rotation.x = -0.38;
    group.add(screenMount);

    // Dynamic animated terminal screen
    const { texture, canvas, ctx } = this.createConsoleScreenTexture(
      screenType,
      header,
      sub,
      accentHex
    );
    const screenMat = new THREE.MeshBasicMaterial({ map: texture });
    this.screenMaterials.push(screenMat);
    this.animatedCanvases.push({ ctx, tex: texture, type: screenType });

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.68), screenMat);
    screen.position.set(0, 1.35, -0.04);
    screen.rotation.x = -0.38;
    group.add(screen);

    return group;
  }

  /* -------------------------------------------------------------------------- */
  /* CONNECTING CORRIDORS & AIRLOCK BULKHEAD DOORS                             */
  /* -------------------------------------------------------------------------- */

  private buildCorridorsAndDoors(): void {
    const specs: Array<{
      cx: number;
      cz: number;
      w: number;
      d: number;
      axis: 'x' | 'z';
      doorPos: THREE.Vector3;
    }> = [
      {
        cx: 0,
        cz: -9.5,
        w: 3.8,
        d: 5.0,
        axis: 'z',
        doorPos: new THREE.Vector3(0, 0, -9.5),
      },
      {
        cx: 9.5,
        cz: 0,
        w: 5.0,
        d: 3.8,
        axis: 'x',
        doorPos: new THREE.Vector3(9.5, 0, 0),
      },
      {
        cx: 0,
        cz: 9.5,
        w: 3.8,
        d: 5.0,
        axis: 'z',
        doorPos: new THREE.Vector3(0, 0, 9.5),
      },
      {
        cx: -9.5,
        cz: 0,
        w: 5.0,
        d: 3.8,
        axis: 'x',
        doorPos: new THREE.Vector3(-9.5, 0, 0),
      },
    ];

    specs.forEach((s) => {
      const openNorth = s.axis === 'z';
      this.buildRoomShell(s.cx, s.cz, s.w, s.d, 3.5, {
        north: openNorth,
        south: openNorth,
        east: !openNorth,
        west: !openNorth,
      });

      // Recessed linear LED ceiling light fixtures illuminating the corridor
      const corridorLight = new THREE.PointLight(0xffe5cc, 1.3, 8, 1.9);
      corridorLight.position.set(s.cx, 3.1, s.cz);
      this.scene.add(corridorLight);

      // Dual-leaf sliding armored airlock bulkhead door
      const leafWidth = 1.75;
      const leafHeight = 3.05;
      const leafThick = 0.18;

      const leftLeaf = new THREE.Mesh(
        new THREE.BoxGeometry(
          s.axis === 'z' ? leafWidth : leafThick,
          leafHeight,
          s.axis === 'z' ? leafThick : leafWidth
        ),
        this.matDeepGraphite
      );
      const rightLeaf = leftLeaf.clone();

      leftLeaf.position.copy(s.doorPos);
      rightLeaf.position.copy(s.doorPos);
      leftLeaf.position.y = leafHeight / 2;
      rightLeaf.position.y = leafHeight / 2;

      if (s.axis === 'z') {
        leftLeaf.position.x = -leafWidth / 2;
        rightLeaf.position.x = leafWidth / 2;
      } else {
        leftLeaf.position.z = -leafWidth / 2;
        rightLeaf.position.z = leafWidth / 2;
      }

      this.scene.add(leftLeaf);
      this.scene.add(rightLeaf);

      // Illuminated door status indicator bar (Green when open, red when closed)
      const statusStrip = new THREE.Mesh(
        new THREE.BoxGeometry(
          s.axis === 'z' ? 1.4 : 0.12,
          0.14,
          s.axis === 'z' ? 0.12 : 1.4
        ),
        new THREE.MeshStandardMaterial({
          color: 0x77b89a,
          emissive: 0x77b89a,
          emissiveIntensity: 1.5,
        })
      );
      statusStrip.position.copy(s.doorPos);
      statusStrip.position.y = leafHeight + 0.15;
      this.scene.add(statusStrip);

      const statusLight = new THREE.PointLight(0x77b89a, 1.2, 5);
      statusLight.position.copy(statusStrip.position);
      this.scene.add(statusLight);

      this.doors.push({
        axis: s.axis,
        doorCenter: s.doorPos.clone(),
        leftLeaf,
        rightLeaf,
        statusLight,
        statusStrip,
        openFactor: 0,
        wasOpen: false,
      });
    });
  }

  /* -------------------------------------------------------------------------- */
  /* SECTOR 01: POWER CORE (NORTH WING)                                         */
  /* -------------------------------------------------------------------------- */

  private buildPowerRoom(): void {
    this.buildRoomShell(0, -17.5, 13, 11, 4.2, { south: true });

    this.powerCoreLight = new THREE.PointLight(0xe8ad66, 1.85, 14, 1.65);
    this.powerCoreLight.position.set(0, 3.6, -17.5);
    this.scene.add(this.powerCoreLight);

    // 4 Lithium-Sulfur Solid-State Battery Racks along East & West walls
    [-4.8, 4.8].forEach((xPos) => {
      [-15.5, -19.0].forEach((zPos) => {
        const cab = new THREE.Group();
        cab.position.set(xPos, 0, zPos);

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 2.8, 1.8),
          this.matDeepGraphite
        );
        body.position.y = 1.4;
        cab.add(body);

        // Glowing charge indicator LED bar
        const ledBar = new THREE.Mesh(
          new THREE.BoxGeometry(1.46, 0.22, 1.2),
          this.matWarmAmber
        );
        ledBar.position.y = 2.1;
        cab.add(ledBar);

        // High voltage warning badge
        const badge = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.4, 1.84),
          this.matHazardStripe
        );
        badge.position.y = 1.2;
        cab.add(badge);

        this.scene.add(cab);
      });
    });

    // High Voltage Power Routing Console at North end
    const powerConsole = this.createConsoleUnit(
      'power',
      'HVDC MICROGRID CONSOLE',
      'BUS A/B VOLTAGE · GIMBAL 88°',
      '#E8AD66'
    );
    powerConsole.position.set(0, 0, -20.6);
    this.scene.add(powerConsole);

    this.interactives.push({
      id: 'console_power',
      title: 'HVDC Power Routing & Solar Console',
      subtitle: 'Route kW Buses, Align 88° Gimbal & Clear Regolith Dust',
      actionType: 'open_challenge',
      challengeId: 'power',
      position: new THREE.Vector3(0, 1.2, -20.6),
      mesh: powerConsole,
    });

    // Physical 3D Breaker: Electrostatic Dust Sweeper & Busbar Breaker
    const breakerGroup = new THREE.Group();
    breakerGroup.position.set(-5.9, 1.4, -17.2);
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.95, 0.75),
      this.matDeepGraphite
    );
    breakerGroup.add(box);

    const hazardBorder = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.2, 0.78),
      this.matHazardStripe
    );
    hazardBorder.position.y = 0.35;
    breakerGroup.add(hazardBorder);

    this.dustBreakerLever = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.16, 0.24),
      this.matWarmAmber
    );
    this.dustBreakerLever.position.set(0.24, 0, 0);
    this.dustBreakerLever.rotation.z = -0.45;
    breakerGroup.add(this.dustBreakerLever);
    this.scene.add(breakerGroup);

    this.interactives.push({
      id: 'switch_power_dust',
      title: 'Electrostatic Array Dust Breaker (Physical Switch)',
      subtitle: 'Engage High-Voltage Dust Repulsion & Phase Balance',
      actionType: 'physical_toggle',
      position: new THREE.Vector3(-5.7, 1.4, -17.2),
      mesh: breakerGroup,
    });

    // Leo's Mobile Engineering Tool Cart & High-Voltage Conduits
    const toolCart = new THREE.Group();
    toolCart.position.set(3.2, 0, -17.2);
    const cartBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.85, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.5, metalness: 0.6 })
    );
    cartBody.position.y = 0.45;
    toolCart.add(cartBody);

    const cartTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.26, 0.06, 0.76),
      this.matBrushedSteel
    );
    cartTop.position.y = 0.9;
    toolCart.add(cartTop);

    // Spare lithium-ion energy cells on top
    [-0.3, 0, 0.3].forEach((cx, i) => {
      const cell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.28, 12),
        new THREE.MeshStandardMaterial({
          color: i === 0 ? 0xeab308 : 0x48bb78,
          metalness: 0.7,
          roughness: 0.3,
        })
      );
      cell.position.set(cx, 1.05, 0);
      toolCart.add(cell);
    });

    this.scene.add(toolCart);
  }

  /* -------------------------------------------------------------------------- */
  /* SECTOR 02: LIFE SUPPORT (ECLSS - EAST WING)                                */
  /* -------------------------------------------------------------------------- */

  private buildLifeSupportRoom(): void {
    this.buildRoomShell(17.5, 0, 11, 13, 4.2, { west: true });

    this.lifeSupportLight = new THREE.PointLight(0x76aec9, 3.2, 20, 1.2);
    this.lifeSupportLight.position.set(17.5, 3.6, 0);
    this.scene.add(this.lifeSupportLight);

    // Dual OGA Electrolysis & Sabatier Columns + Rotating Ventilation Fans
    [-3.8, 3.8].forEach((zPos) => {
      const colGroup = new THREE.Group();
      colGroup.position.set(16.8, 0, zPos);

      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.78, 0.78, 3.2, 24),
        this.matBrushedSteel
      );
      tank.position.y = 1.6;
      colGroup.add(tank);

      // Glowing circular status collar
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.88, 0.88, 0.32, 24),
        this.matTechnicalBlue
      );
      collar.position.y = 2.2;
      colGroup.add(collar);

      // Rotating ventilation circulation fan
      const fanGroup = new THREE.Group();
      fanGroup.position.set(-0.82, 2.6, 0);

      const fanRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.48, 0.06, 8, 24),
        this.matDeepGraphite
      );
      fanRim.rotation.y = Math.PI / 2;
      colGroup.add(fanRim);

      const blade1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.88, 0.18),
        this.matCeramicWhite
      );
      const blade2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.18, 0.88),
        this.matCeramicWhite
      );
      fanGroup.add(blade1, blade2);
      this.fanBlades.push(fanGroup);
      colGroup.add(fanGroup);

      this.scene.add(colGroup);
    });

    // ECLSS Atmospheric Scrubber Console
    const eclssConsole = this.createConsoleUnit(
      'life',
      'ECLSS CONTROL CONSOLE',
      'ZEOLITE BED · SABATIER 400°C',
      '#76AEC9'
    );
    eclssConsole.position.set(20.6, 0, 0);
    eclssConsole.rotation.y = -Math.PI / 2;
    this.scene.add(eclssConsole);

    this.interactives.push({
      id: 'console_lifesupport',
      title: 'ECLSS Atmospheric Scrubber Console',
      subtitle: 'Regenerate Zeolite 5A CO₂ Bed & Tune Sabatier Reactor',
      actionType: 'open_challenge',
      challengeId: 'lifesupport',
      position: new THREE.Vector3(20.6, 1.2, 0),
      mesh: eclssConsole,
    });

    // Physical 3D Valve: Emergency Airflow Damper & O2 Surge Wheel
    const valveMount = new THREE.Group();
    valveMount.position.set(17.2, 1.4, -5.9);

    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.6, 16),
      this.matBrushedSteel
    );
    pipe.rotation.x = Math.PI / 2;
    valveMount.add(pipe);

    this.airflowValveWheel = new THREE.Group();
    this.airflowValveWheel.position.z = 0.32;
    const wheelRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.06, 12, 24),
      this.matTechnicalBlue
    );
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.08, 0.08),
      this.matBrushedSteel
    );
    this.airflowValveWheel.add(wheelRim, spoke);
    valveMount.add(this.airflowValveWheel);
    this.scene.add(valveMount);

    this.interactives.push({
      id: 'switch_lifesupport_valve',
      title: 'Main Airflow Damper & Zeolite Thermal Purge Valve',
      subtitle: 'Open Circulation Damper & Bake Out Saturated CO₂ Bed',
      actionType: 'physical_toggle',
      position: new THREE.Vector3(17.2, 1.4, -5.7),
      mesh: valveMount,
    });

    // Atmospheric Chemistry Analysis Workbench & Pressurized O2 Bottles
    const chemBench = new THREE.Group();
    chemBench.position.set(18.2, 0, 4.8);

    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.08, 0.9),
      this.matBrushedSteel
    );
    tableTop.position.y = 0.95;
    chemBench.add(tableTop);

    const tableBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.9, 0.8),
      this.matDeepGraphite
    );
    tableBase.position.y = 0.45;
    chemBench.add(tableBase);

    // Pressurized Oxygen reserve canisters
    [-0.6, -0.2].forEach((cx) => {
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          metalness: 0.8,
          roughness: 0.2,
        })
      );
      bottle.position.set(cx, 1.35, 0);
      chemBench.add(bottle);

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8),
        this.matBrushedSteel
      );
      cap.position.set(cx, 1.72, 0);
      chemBench.add(cap);
    });

    // Illuminated Atmospheric Gas Centrifuge
    const centrifuge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.35, 16),
      this.matTechnicalBlue
    );
    centrifuge.position.set(0.5, 1.15, 0);
    chemBench.add(centrifuge);

    this.scene.add(chemBench);
  }

  /* -------------------------------------------------------------------------- */
  /* SECTOR 03: RADIATION SHELTER (SOUTH WING)                                 */
  /* -------------------------------------------------------------------------- */

  private buildRadiationRoom(): void {
    this.buildRoomShell(0, 17.5, 13, 11, 4.2, { north: true });

    this.radiationBeaconLight = new THREE.PointLight(0xde6f60, 1.8, 14, 1.6);
    this.radiationBeaconLight.position.set(0, 3.6, 17.5);
    this.scene.add(this.radiationBeaconLight);

    // Rotating overhead warning beacon fixture
    this.radiationBeaconRotator = new THREE.Group();
    this.radiationBeaconRotator.position.set(0, 3.8, 17.5);
    const beaconBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      this.matEmergencyCoral
    );
    this.radiationBeaconRotator.add(beaconBulb);
    this.scene.add(this.radiationBeaconRotator);

    // Modular Graded-Z Shielding Bay on South Bulkhead (Regolith, Water, HDPE)
    for (let i = 0; i < 3; i++) {
      const slotMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 2.5, 0.32),
        this.matMoonstoneGray.clone()
      );
      slotMesh.position.set((i - 1) * 3.8, 1.9, 22.4 - i * 0.12);
      this.shieldLayerMeshes.push(slotMesh);
      this.scene.add(slotMesh);
    }

    // Heavy Armored Hydraulic Storm Shutter above South Bulkhead
    this.stormShutterMesh = new THREE.Mesh(
      new THREE.BoxGeometry(11.8, 2.8, 0.28),
      this.matDeepGraphite
    );
    this.stormShutterMesh.position.set(0, 3.3, 22.1);
    this.scene.add(this.stormShutterMesh);

    // Radiation Shielding Console
    const radConsole = this.createConsoleUnit(
      'rad',
      'RADIATION BULKHEAD CONSOLE',
      'GRADED-Z MASS CONFIG · SPE FLUX',
      '#DE6F60'
    );
    radConsole.position.set(0, 0, 20.6);
    radConsole.rotation.y = Math.PI;
    this.scene.add(radConsole);

    this.interactives.push({
      id: 'console_radiation',
      title: 'Radiation Shielding & Bulkhead Console',
      subtitle: 'Configure Regolith, Water Bladder & Boronated HDPE Layers',
      actionType: 'open_challenge',
      challengeId: 'radiation',
      position: new THREE.Vector3(0, 1.2, 20.6),
      mesh: radConsole,
    });

    // Physical 3D Switch: Storm Bulkhead Hydraulic Latch
    const latchGroup = new THREE.Group();
    latchGroup.position.set(5.9, 1.4, 17.2);
    const latchBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.95, 0.75),
      this.matDeepGraphite
    );
    latchGroup.add(latchBase);

    this.bulkheadLatchLever = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.16, 0.24),
      this.matEmergencyCoral
    );
    this.bulkheadLatchLever.position.set(-0.24, 0, 0);
    latchGroup.add(this.bulkheadLatchLever);
    this.scene.add(latchGroup);

    this.interactives.push({
      id: 'switch_radiation_latch',
      title: 'Hydraulic Storm Shutter & Bulkhead Latch',
      subtitle: 'Deploy Armored Storm Shutter & Lock Shielding Bays',
      actionType: 'physical_toggle',
      position: new THREE.Vector3(5.7, 1.4, 17.2),
      mesh: latchGroup,
    });

    // Cozy Armored Storm Bunk & Emergency Supply Cache
    const shelterBunkGroup = new THREE.Group();
    shelterBunkGroup.position.set(-4.8, 0, 18.2);

    const bunkBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.6, 2.4),
      this.matDeepGraphite
    );
    bunkBase.position.y = 0.3;
    shelterBunkGroup.add(bunkBase);

    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.15, 2.1),
      new THREE.MeshStandardMaterial({ color: 0x2b384a, roughness: 0.9 })
    );
    mattress.position.y = 0.65;
    shelterBunkGroup.add(mattress);

    const blanket = new THREE.Mesh(
      new THREE.BoxGeometry(1.32, 0.1, 1.3),
      new THREE.MeshStandardMaterial({ color: 0xdd6b20, roughness: 0.85 })
    );
    blanket.position.set(0, 0.72, 0.35);
    shelterBunkGroup.add(blanket);

    // Wall-mounted medical dosimeter monitor
    const monitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.45, 0.08),
      this.matDeepGraphite
    );
    monitor.position.set(0, 1.4, -1.1);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 0.38),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    screen.position.set(0, 1.4, -1.055);
    shelterBunkGroup.add(monitor, screen);

    // Stacked high-density lead-lined emergency supply containers
    [-0.5, 0.5].forEach((dx, i) => {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.5, 0.6),
        new THREE.MeshStandardMaterial({
          color: i === 0 ? 0xeab308 : 0x4a5568,
          roughness: 0.4,
          metalness: 0.5,
        })
      );
      crate.position.set(dx, 0.25, 1.7);
      shelterBunkGroup.add(crate);
    });

    this.scene.add(shelterBunkGroup);
  }

  /* -------------------------------------------------------------------------- */
  /* SECTOR 04: HYDROPONIC GREENHOUSE (WEST WING)                               */
  /* -------------------------------------------------------------------------- */

  private buildGreenhouseRoom(): void {
    this.buildRoomShell(-17.5, 0, 11, 13, 4.2, { east: true });

    this.greenhouseLight = new THREE.PointLight(0x77b89a, 3.2, 20, 1.2);
    this.greenhouseLight.position.set(-17.5, 3.6, 0);
    this.scene.add(this.greenhouseLight);

    // Multi-tiered Hydroponic Grow Racks with PAR LED grow canopies
    [-3.2, 3.2].forEach((zPos) => {
      const rack = new THREE.Group();
      rack.position.set(-16.8, 0, zPos);

      [0.85, 1.85].forEach((trayY) => {
        const tray = new THREE.Mesh(
          new THREE.BoxGeometry(5.0, 0.22, 1.6),
          this.matCeramicWhite
        );
        tray.position.y = trayY;
        rack.add(tray);

        // Dual-spectrum PAR LED grow lamp bar
        const ledCanopy = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 0.1, 1.3),
          this.growLightMat
        );
        ledCanopy.position.y = trayY + 0.78;
        rack.add(ledCanopy);

        // High density leafy crop foliage clusters
        for (let px = -2.0; px <= 2.0; px += 0.55) {
          const plantMat = new THREE.MeshStandardMaterial({
            color: 0x4d8c63,
            roughness: 0.55,
            metalness: 0.1,
          });
          const crop = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.28, 1),
            plantMat
          );
          crop.position.set(px, trayY + 0.26, 0);
          this.cropMeshes.push(crop);
          rack.add(crop);
        }
      });

      this.scene.add(rack);
    });

    // Vertical Aeroponic Crop Towers (NASA space strawberry & tomato vertical agriculture)
    [-4.5, 4.5].forEach((zPos) => {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(-20.5, 0, zPos);

      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.42, 3.4, 16),
        this.matCeramicWhite
      );
      col.position.y = 1.7;
      towerGroup.add(col);

      // Spiral crop pods with red berries
      const berryMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.3,
        emissive: 0x991b1b,
        emissiveIntensity: 0.2,
      });
      const leafyMat = new THREE.MeshStandardMaterial({
        color: 0x38a169,
        roughness: 0.6,
      });

      for (let ring = 0; ring < 6; ring++) {
        const ry = 0.6 + ring * 0.45;
        const angle = ring * 1.1;
        const berry = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 1), berryMat);
        berry.position.set(Math.cos(angle) * 0.42, ry, Math.sin(angle) * 0.42);
        towerGroup.add(berry);

        const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 1), leafyMat);
        leaf.position.set(Math.cos(angle) * 0.38, ry + 0.05, Math.sin(angle) * 0.38);
        towerGroup.add(leaf);
      }

      this.scene.add(towerGroup);
    });

    // Sprout's Gardening Workbench & Seed Station
    const gardenBench = new THREE.Group();
    gardenBench.position.set(-14.2, 0, -4.8);
    const benchTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.08, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x936037, roughness: 0.7 })
    );
    benchTop.position.y = 0.95;
    gardenBench.add(benchTop);

    const benchLegs = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.9, 0.8),
      this.matDeepGraphite
    );
    benchLegs.position.y = 0.45;
    gardenBench.add(benchLegs);

    // Seed packets & mini plant cloche
    const seedEnvelope = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.02, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xf6ad55 })
    );
    seedEnvelope.position.set(-0.5, 1.0, 0.1);
    gardenBench.add(seedEnvelope);

    // Glass seedling germination bell dome
    const bellDome = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 0.3, 12),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
      })
    );
    bellDome.position.set(0.4, 1.14, 0);
    gardenBench.add(bellDome);

    const seedling = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: 0x48bb78 })
    );
    seedling.position.set(0.4, 1.08, 0);
    gardenBench.add(seedling);

    this.scene.add(gardenBench);

    // Hydroponic PAR & Transpiration Console
    const ghConsole = this.createConsoleUnit(
      'green',
      'HYDROPONIC CONSOLE',
      'PAR 660nm/450nm · CONDENSATE RECOVERY',
      '#77B89A'
    );
    ghConsole.position.set(-20.6, 0, 0);
    ghConsole.rotation.y = Math.PI / 2;
    this.scene.add(ghConsole);

    this.interactives.push({
      id: 'console_greenhouse',
      title: 'Hydroponic PAR & Water Recovery Console',
      subtitle: 'Tune 660nm/450nm PAR LEDs & Reclaim Transpired Water',
      actionType: 'open_challenge',
      challengeId: 'greenhouse',
      position: new THREE.Vector3(-20.6, 1.2, 0),
      mesh: ghConsole,
    });

    // Physical 3D Valve: Transpiration Condensate Recovery Valve
    const condGroup = new THREE.Group();
    condGroup.position.set(-17.2, 1.4, 5.9);

    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.6, 16),
      this.matBrushedSteel
    );
    pipe.rotation.x = Math.PI / 2;
    condGroup.add(pipe);

    this.condensateValveWheel = new THREE.Group();
    this.condensateValveWheel.position.z = -0.32;
    const wheelRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.06, 12, 24),
      this.matHealthyGreen
    );
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.08, 0.08),
      this.matBrushedSteel
    );
    this.condensateValveWheel.add(wheelRim, spoke);
    condGroup.add(this.condensateValveWheel);
    this.scene.add(condGroup);

    this.interactives.push({
      id: 'switch_greenhouse_valve',
      title: 'Transpiration Condensate Recovery Valve',
      subtitle: 'Close Humidity Loop to Reclaim 96% of Irrigation Water',
      actionType: 'physical_toggle',
      position: new THREE.Vector3(-17.2, 1.4, 5.7),
      mesh: condGroup,
    });
  }

  /* -------------------------------------------------------------------------- */
  /* COZY VOXEL FURNITURE & HABITAT DECORATIONS (MINECRAFT SCI-FI AESTHETIC)    */
  /* -------------------------------------------------------------------------- */

  private buildCozyVoxelDecorations(): void {
    const hubDecor = new THREE.Group();

    // 1. Cozy Oak Wood Workstation Desk on the West side of Central Hub
    const deskGroup = new THREE.Group();
    deskGroup.position.set(-4.6, 0, -3.6);

    const matWood = new THREE.MeshStandardMaterial({
      color: 0x936037,
      roughness: 0.72,
      metalness: 0.1,
    });
    const matCushion = new THREE.MeshStandardMaterial({
      color: 0xedf2f7,
      roughness: 0.85,
      metalness: 0.05,
    });
    const matClay = new THREE.MeshStandardMaterial({
      color: 0xba5d3b,
      roughness: 0.8,
    });
    const matPlant = new THREE.MeshStandardMaterial({
      color: 0x38a169,
      roughness: 0.6,
    });

    // Desktop counter
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.2), matWood);
    deskTop.position.y = 0.95;
    deskGroup.add(deskTop);

    // Left and Right drawer pedestals
    [-1.0, 1.0].forEach((dx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 1.1), this.matDeepGraphite);
      leg.position.set(dx, 0.45, 0);
      deskGroup.add(leg);

      // Cyan illuminated drawer handles
      for (let y = 0.3; y <= 0.7; y += 0.2) {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.04), this.matTechnicalBlue);
        handle.position.set(dx, y, 0.56);
        deskGroup.add(handle);
      }
    });

    // Voxel Chair
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 0.75);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.65), matCushion);
    seat.position.y = 0.52;
    chairGroup.add(seat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.08), matWood);
    backrest.position.set(0, 0.85, 0.28);
    chairGroup.add(backrest);

    // 4 wooden legs
    [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].forEach(([cx, cz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), matWood);
      leg.position.set(cx, 0.25, cz);
      chairGroup.add(leg);
    });
    deskGroup.add(chairGroup);

    // Desktop Mini Terminal ("CORE OK")
    const miniScreen = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.06), this.matDeepGraphite);
    miniScreen.position.set(-0.6, 1.25, -0.2);
    miniScreen.rotation.y = 0.2;
    deskGroup.add(miniScreen);

    const miniFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.48, 0.32),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    miniFace.position.set(-0.6, 1.25, -0.16);
    miniFace.rotation.y = 0.2;
    deskGroup.add(miniFace);

    // Ceramic Coffee Mug
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.16, 12), this.matCeramicWhite);
    mug.position.set(0.3, 1.08, -0.1);
    deskGroup.add(mug);

    // Potted Succulent Plant in Terracotta Pot
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.22, 8), matClay);
    pot.position.set(0.75, 1.1, -0.2);
    deskGroup.add(pot);

    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 1), matPlant);
    foliage.position.set(0.75, 1.28, -0.2);
    deskGroup.add(foliage);

    // Maya's Astronaut Field Notebook
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.36), this.matWarmAmber);
    book.position.set(-0.1, 1.02, 0.1);
    book.rotation.y = 0.15;
    deskGroup.add(book);

    hubDecor.add(deskGroup);

    // 2. Viewing Lounge Bench near Panoramic Window (East side of North Wall)
    const benchGroup = new THREE.Group();
    benchGroup.position.set(4.2, 0, -5.5);

    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.8), matCushion);
    benchSeat.position.y = 0.48;
    benchGroup.add(benchSeat);

    const benchBase = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.42, 0.7), this.matDeepGraphite);
    benchBase.position.y = 0.21;
    benchGroup.add(benchBase);

    // Observation Telescope pointing out through window toward Earth
    const scopeStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.1, 8), this.matBrushedSteel);
    scopeStand.position.set(1.2, 0.55, -0.6);
    benchGroup.add(scopeStand);

    const scopeBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.85, 12), this.matBrushedSteel);
    scopeBarrel.rotation.x = 0.45;
    scopeBarrel.position.set(1.2, 1.15, -0.6);
    benchGroup.add(scopeBarrel);

    const scopeLens = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    scopeLens.position.set(1.2, 1.32, -0.92);
    scopeLens.rotation.x = -0.45;
    benchGroup.add(scopeLens);
    // The observation viewer is now a true interactive learning station.
    // World position = benchGroup(4.2,0,-5.5) + scope(1.2,1.2,-0.6).
    this.interactives.push({
      id: 'observation_telescope',
      title: 'Earth Observation Telescope',
      subtitle: 'Explore Earth from the Moon [E]',
      actionType: 'observation',
      position: new THREE.Vector3(5.4, 1.18, -6.1),
      mesh: scopeBarrel,
    });

    // Warm insulated mug on the bench
    const cocoaMug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.06, 0.14, 10),
      this.matWarmAmber
    );
    cocoaMug.position.set(-0.8, 0.61, 0);
    benchGroup.add(cocoaMug);

    hubDecor.add(benchGroup);

    // 3. Cozy Astronaut Sleeping Bunk Nook (South-West Corner of Hub)
    const bunkGroup = new THREE.Group();
    bunkGroup.position.set(-4.8, 0, 4.6);

    const bunkFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 2.6), this.matDeepGraphite);
    bunkFrame.position.y = 0.9;
    bunkGroup.add(bunkFrame);

    // Mattress with warm quilted blanket
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 2.2), matCushion);
    mattress.position.set(0, 0.5, 0);
    bunkGroup.add(mattress);

    const blanket = new THREE.Mesh(
      new THREE.BoxGeometry(1.32, 0.12, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xdd6b20, roughness: 0.85 })
    );
    blanket.position.set(0, 0.58, 0.35);
    bunkGroup.add(blanket);

    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.14, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    pillow.position.set(0, 0.6, -0.75);
    bunkGroup.add(pillow);

    // Warm Bedside Reading Lamp (2700K incandescent glow)
    const readingLamp = new THREE.PointLight(0xffecd1, 1.8, 4.5, 1.5);
    readingLamp.position.set(0, 1.4, -0.9);
    bunkGroup.add(readingLamp);

    // Wall shelf with Earth photo
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.25), matWood);
    shelf.position.set(0, 1.35, -1.1);
    bunkGroup.add(shelf);

    const photoFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.02), matWood);
    photoFrame.position.set(0, 1.46, -1.1);
    const photo = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.14),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    photo.position.set(0, 1.46, -1.085);
    bunkGroup.add(photoFrame, photo);

    hubDecor.add(bunkGroup);

    // 4. Habitat Galley & Food Rehydrator Station (East Wall of Hub)
    const galleyGroup = new THREE.Group();
    galleyGroup.position.set(5.8, 0, 3.2);
    galleyGroup.rotation.y = -Math.PI / 2;

    const galleyCounter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.95, 0.8), this.matDeepGraphite);
    galleyCounter.position.y = 0.475;
    galleyGroup.add(galleyCounter);

    const galleyTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 0.86), this.matBrushedSteel);
    galleyTop.position.y = 0.95;
    galleyGroup.add(galleyTop);

    // Rehydration chamber with hot water dispenser
    const rehydrator = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.45), this.matMoonstoneGray);
    rehydrator.position.set(-0.6, 1.25, -0.15);
    galleyGroup.add(rehydrator);

    const dispenserSpout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.08),
      this.matBrushedSteel
    );
    dispenserSpout.position.set(-0.6, 1.05, 0.05);
    galleyGroup.add(dispenserSpout);

    // Colorful astronaut meal pouches on counter
    const pouchColors = [0xed8936, 0x48bb78, 0x4299e1];
    pouchColors.forEach((col, idx) => {
      const pouch = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.03, 0.24),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.3 })
      );
      pouch.position.set(0.15 + idx * 0.22, 1.01, 0.05);
      pouch.rotation.y = idx * 0.15;
      galleyGroup.add(pouch);
    });

    hubDecor.add(galleyGroup);

    // 3. Astronaut Equipment Locker Bank on West Wall
    const lockerGroup = new THREE.Group();
    lockerGroup.position.set(-6.6, 0, 1.5);
    lockerGroup.rotation.y = Math.PI / 2;

    const lockerBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.7), this.matDeepGraphite);
    lockerBody.position.y = 1.4;
    lockerGroup.add(lockerBody);

    // Locker Nameplates & LED strips
    [-0.6, 0.6].forEach((lx, i) => {
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.25),
        new THREE.MeshBasicMaterial({ color: i === 0 ? 0xe8ad66 : 0x76aec9 })
      );
      plate.position.set(lx, 2.1, 0.36);
      lockerGroup.add(plate);
    });

    hubDecor.add(lockerGroup);
    this.scene.add(hubDecor);
  }

  /* -------------------------------------------------------------------------- */
  /* DYNAMIC GLOWING FLOOR NAVIGATION TRAIL (FOLLOWS WALKABLE CORRIDORS)       */
  /* -------------------------------------------------------------------------- */

  private buildDynamicFloorGuideTrail(): void {
    // Small luminous footsteps rather than the previous oversized discs.
    const nodeGeo = new THREE.CylinderGeometry(0.10,0.10,0.012,12);
    for(let i=0;i<36;i++){
      const node=new THREE.Mesh(nodeGeo,new THREE.MeshBasicMaterial({
        color:0x8bcce1,transparent:true,opacity:0.63,depthWrite:false,
      }));
      node.position.set(0,-10,0);
      node.visible=false;
      this.guideTrailNodes.push(node);
      this.guideTrailGroup.add(node);
    }
    this.scene.add(this.guideTrailGroup);
  }

  private updateGuideTrail(dt:number,state:MissionStateData,playerPos:THREE.Vector3):void {
    this.guideTrailTime+=dt;
    this.guideTrailGroup.visible=Boolean(state.guideTrailActive);
    if(!this.guideTrailGroup.visible)return;
    const goal=currentMissionGuideDestination(state);
    const moved=(playerPos.x-this.guideFrom.x)**2+(playerPos.z-this.guideFrom.z)**2>1.1**2;
    const goalChanged=goal.x!==this.guideTarget.x||goal.z!==this.guideTarget.z;
    if(goalChanged||moved||this.guideTrailTime-this.guideLastRoutedAt>2.5){
      this.guideRoute=createStationGuidePath({x:playerPos.x,z:playerPos.z},goal);
      this.guideFrom={x:playerPos.x,z:playerPos.z};
      this.guideTarget=goal;
      this.guideLastRoutedAt=this.guideTrailTime;
    }
    const route=this.guideRoute;
    if(route.length<2){
      this.guideTrailGroup.visible=false;
      return;
    }
    const cumulative=[0];
    for(let i=1;i<route.length;i++){
      cumulative.push(cumulative[i-1]+Math.hypot(route[i].x-route[i-1].x,route[i].z-route[i-1].z));
    }
    const length=cumulative[cumulative.length-1];
    if(length<=0.001){this.guideTrailGroup.visible=false;return;}
    const color=!state.stationLightsOn?0x79c9d8:
      !state.power.completed?0xe9ad65:
      !state.lifeSupport.completed?0x79c9d8:
      !state.greenhouse.completed?0x89be96:
      !state.radiation.completed?0xb8a5dc:0x79c9d8;
    const visibleCount=Math.min(this.guideTrailNodes.length,Math.ceil(length/.78));
    for(let i=0;i<this.guideTrailNodes.length;i++){
      const node=this.guideTrailNodes[i];
      node.visible=i<visibleCount;
      if(!node.visible)continue;
      const travel=(i+.4)*length/Math.max(visibleCount,1);
      let segment=1;
      while(segment<cumulative.length-1&&cumulative[segment]<travel)segment++;
      const start=route[segment-1],end=route[segment];
      const part=Math.max(0,Math.min(1,(travel-cumulative[segment-1])/Math.max(.0001,cumulative[segment]-cumulative[segment-1])));
      node.position.set(THREE.MathUtils.lerp(start.x,end.x,part),.04,THREE.MathUtils.lerp(start.z,end.z,part));
      const wave=.72+.28*Math.sin(this.guideTrailTime*3.2-i*.62);
      const mat=node.material as THREE.MeshBasicMaterial;
      mat.color.setHex(color);
      mat.opacity=wave*(i<3?.35:.68);
      node.scale.setScalar(.86+.12*wave);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* ACTIVE OBJECTIVE BEACON                                                    */
  /* -------------------------------------------------------------------------- */

  private buildObjectiveBeacon(): void {
    const ringGeo = new THREE.TorusGeometry(0.48, 0.05, 12, 24);
    const arrowGeo = new THREE.ConeGeometry(0.18, 0.4, 16);

    const mat = new THREE.MeshBasicMaterial({
      color: 0xe8ad66,
      transparent: true,
      opacity: 0.85,
    });

    this.beaconRing = new THREE.Mesh(ringGeo, mat);
    this.beaconRing.rotation.x = Math.PI / 2;
    this.objectiveBeacon.add(this.beaconRing);

    this.beaconArrow = new THREE.Mesh(arrowGeo, mat);
    this.beaconArrow.rotation.x = Math.PI;
    this.beaconArrow.position.y = 0.35;
    this.objectiveBeacon.add(this.beaconArrow);

    this.scene.add(this.objectiveBeacon);
  }

  private updateObjectiveBeacon(dt: number, state: MissionStateData): void {
    const time = performance.now() * 0.003;
    this.beaconRing.rotation.z += dt * 1.8;
    this.beaconArrow.position.y = 0.35 + Math.sin(time * 3) * 0.08;

    let targetPos = new THREE.Vector3(0, 1.2, 1.15);
    let beaconHex = 0x76aec9;

    if (!state.stationLightsOn) {
      targetPos.set(0, 1.3, 1.15);
      beaconHex = 0x76aec9;
    } else if (!state.power.completed) {
      targetPos.set(0, 1.3, -20.6);
      beaconHex = 0xe8ad66;
    } else if (!state.lifeSupport.completed) {
      targetPos.set(20.6, 1.3, 0);
      beaconHex = 0x76aec9;
    } else if (!state.greenhouse.completed) {
      targetPos.set(-20.6, 1.3, 0);
      beaconHex = 0x77b89a;
    } else if (!state.radiation.completed) {
      targetPos.set(0, 1.3, 20.6);
      beaconHex = 0xde6f60;
    } else {
      targetPos.set(0, 1.3, 1.15);
      beaconHex = 0x76aec9;
    }

    this.objectiveBeacon.position.copy(targetPos);
    this.objectiveBeacon.position.y += 0.8;

    (this.beaconRing.material as THREE.MeshBasicMaterial).color.setHex(beaconHex);
    (this.beaconArrow.material as THREE.MeshBasicMaterial).color.setHex(beaconHex);
  }

  /* -------------------------------------------------------------------------- */
  /* REAL-TIME SIMULATION & ANIMATION UPDATE                                    */
  /* -------------------------------------------------------------------------- */

  public update(
    deltaSeconds: number,
    playerPos: THREE.Vector3,
    state: MissionStateData
  ): void {
    const dt = Math.min(deltaSeconds, 0.1);

    // 1. Rotate Central Hub Hologram & Orbiters
    this.holoCoreGroup.rotation.y += dt * 0.45;
    if (this.holoGlobe) {
      this.holoGlobe.rotation.y += dt * 0.6;
    }
    this.holoRings.forEach((ring, i) => {
      ring.rotation.z += dt * (i === 0 ? 0.35 : -0.25);
    });

    // 2. Rotate Earth & Clouds slowly
    if (this.earthMesh) this.earthMesh.rotation.y += dt * 0.02;
    if (this.cloudsMesh) this.cloudsMesh.rotation.y += dt * 0.035;

    // 3. Proximity-triggered sliding airlock bulkhead doors
    this.doors.forEach((door) => {
      const dist = Math.hypot(
        playerPos.x - door.doorCenter.x,
        playerPos.z - door.doorCenter.z
      );
      const shouldOpen = dist < 4.8;
      if (shouldOpen && !door.wasOpen) {
        soundFX.playDoorSlide();
      }
      door.wasOpen = shouldOpen;
      door.openFactor = THREE.MathUtils.damp(
        door.openFactor,
        shouldOpen ? 1 : 0,
        8,
        dt
      );

      const baseOffset = 0.875 + door.openFactor * 1.55;
      if (door.axis === 'z') {
        door.leftLeaf.position.x = -baseOffset;
        door.rightLeaf.position.x = baseOffset;
      } else {
        door.leftLeaf.position.z = -baseOffset;
        door.rightLeaf.position.z = baseOffset;
      }

      // Update door status indicator color
      const statusMat = door.statusStrip.material as THREE.MeshStandardMaterial;
      if (shouldOpen) {
        statusMat.color.setHex(0x77b89a);
        statusMat.emissive.setHex(0x77b89a);
        door.statusLight.color.setHex(0x77b89a);
      } else {
        statusMat.color.setHex(0xde6f60);
        statusMat.emissive.setHex(0xde6f60);
        door.statusLight.color.setHex(0xde6f60);
      }
    });

    // 4. Spin ECLSS Ventilation Fans
    const fanSpeed = state.lifeSupport.airflowDamperOpen
      ? 2.4 + (state.telemetry.eclssEfficiencyPct / 100) * 5.2
      : 0.4;
    this.fanBlades.forEach((f) => {
      f.rotation.x += dt * fanSpeed;
    });

    // 5. Rotate radiation alert beacon
    if (this.radiationBeaconRotator) {
      this.radiationBeaconRotator.rotation.y += dt * 3.5;
    }

    // 6. Update Physical Lever & Valve orientations
    if (this.dustBreakerLever) {
      const targetRot = state.power.dustCleared ? 0.45 : -0.45;
      this.dustBreakerLever.rotation.z = THREE.MathUtils.damp(
        this.dustBreakerLever.rotation.z,
        targetRot,
        10,
        dt
      );
    }

    if (this.airflowValveWheel) {
      const targetRot = state.lifeSupport.airflowDamperOpen ? Math.PI : 0;
      this.airflowValveWheel.rotation.z = THREE.MathUtils.damp(
        this.airflowValveWheel.rotation.z,
        targetRot,
        8,
        dt
      );
    }

    if (this.bulkheadLatchLever) {
      const targetRot = state.radiation.bulkheadLatched ? 0.45 : -0.45;
      this.bulkheadLatchLever.rotation.z = THREE.MathUtils.damp(
        this.bulkheadLatchLever.rotation.z,
        targetRot,
        10,
        dt
      );
    }

    if (this.condensateValveWheel) {
      const targetRot = state.greenhouse.condensateLoopClosed ? Math.PI : 0;
      this.condensateValveWheel.rotation.z = THREE.MathUtils.damp(
        this.condensateValveWheel.rotation.z,
        targetRot,
        8,
        dt
      );
    }

    // 7. Update Storm Shutter & Shielding Layer Meshes
    if (this.stormShutterMesh) {
      const targetY =
        state.radiation.stormShutterClosed && state.radiation.bulkheadLatched
          ? 1.95
          : 3.35;
      this.stormShutterMesh.position.y = THREE.MathUtils.damp(
        this.stormShutterMesh.position.y,
        targetY,
        6,
        dt
      );
    }

    this.shieldLayerMeshes.forEach((mesh, idx) => {
      const layerId = state.radiation.layers[idx];
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mesh.visible = layerId !== 'empty';
      if (layerId === 'regolith') {
        mat.color.setHex(0x6e6a64);
      } else if (layerId === 'water_bladder') {
        mat.color.setHex(0x38bdf8);
      } else if (layerId === 'hdpe_boron') {
        mat.color.setHex(0xe7e9e6);
      } else {
        mat.color.setHex(0x8e999e);
      }
    });

    // 8. Update Greenhouse Crop Vigor & PAR LED color
    const vigor = state.telemetry.photosynthesisIndex / 100;
    this.cropMeshes.forEach((crop) => {
      const scaleY = 0.65 + vigor * 0.75;
      crop.scale.set(0.85 + vigor * 0.25, scaleY, 0.85 + vigor * 0.25);
      const mat = crop.material as THREE.MeshStandardMaterial;
      mat.color.setRGB(
        0.32 - vigor * 0.1,
        0.5 + vigor * 0.3,
        0.36 + vigor * 0.16
      );
    });

    // 9. Reactive Room Lighting based on Subsystem Status
    this.powerCoreLight.color.setHex(state.power.completed ? 0x77b89a : 0xe8ad66);
    this.lifeSupportLight.color.setHex(
      state.lifeSupport.completed ? 0x77b89a : 0x76aec9
    );
    this.radiationBeaconLight.color.setHex(
      state.radiation.completed ? 0x77b89a : 0xde6f60
    );
    const shelterDrillActive=state.currentChapter>=5 && !state.radiation.completed;
    this.hubStatusLight.color.setHex(
      shelterDrillActive ? 0xda7468 : state.telemetry.habitatConditionPct >= 80 ? 0x77b89a : 0x76aec9
    );

    // 10. Drift airborne dust particles
    if (this.dustParticles) {
      const posAttr = this.dustParticles.geometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        let py = posAttr.getY(i) - dt * 0.08;
        if (py < 0.2) py = 3.6;
        posAttr.setY(i, py);
      }
      posAttr.needsUpdate = true;
    }

    // 11. Dynamic Navigation Trail & Objective Beacon
    this.updateGuideTrail(dt, state, playerPos);
    this.updateObjectiveBeacon(dt, state);

    // 12. Chapter 1 Emergency Dimming vs Full Station Illumination
    const lightMultiplier = state.stationLightsOn ? 1.0 : 0.28;
    this.powerCoreLight.intensity = THREE.MathUtils.damp(this.powerCoreLight.intensity, 3.2 * lightMultiplier, 4, dt);
    this.lifeSupportLight.intensity = THREE.MathUtils.damp(this.lifeSupportLight.intensity, 3.2 * lightMultiplier, 4, dt);
    this.greenhouseLight.intensity = THREE.MathUtils.damp(this.greenhouseLight.intensity, 3.2 * lightMultiplier, 4, dt);
    const gentleAlertPulse=shelterDrillActive ? 2.65+0.6*(0.5+Math.sin(performance.now()*0.002)*0.5) : 3.4;
    this.radiationBeaconLight.intensity = THREE.MathUtils.damp(this.radiationBeaconLight.intensity, gentleAlertPulse * lightMultiplier, 4, dt);
    this.hubStatusLight.intensity = THREE.MathUtils.damp(this.hubStatusLight.intensity, state.stationLightsOn ? 3.2 : 1.4, 4, dt);

    // 13. Update Station Crew Characters
    if (this.crew) {
      this.crew.update(dt, playerPos, state.currentChapter);
      const mayaTarget=this.interactives.find(t=>t.id==='crew_maya');
      if(mayaTarget){
        const p=this.crew.mayaGroup.position;
        mayaTarget.position.set(p.x,1.4,p.z);
      }
    }
  }
}
