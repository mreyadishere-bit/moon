import * as THREE from 'three';
import { MissionStateData, RoomId } from '../game/MissionState';
import { InteractiveTarget } from './HabitatBuilder';

/**
 * Software 3D First-Person Perspective Renderer using HTML5 Canvas 2D.
 * Activates automatically when the browser environment has WebGL completely disabled
 * (e.g. GL_VENDOR = Disabled), providing a real-time first-person 3D view of the lunar
 * habitat, corridors, consoles, switches, and exterior lunar horizon with zero WebGL errors.
 */
export class Canvas2DRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public interactives: InteractiveTarget[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.initInteractives();
  }

  private initInteractives(): void {
    const dummyObj = new THREE.Object3D();
    this.interactives = [
      {
        id: 'console_hub',
        title: 'Master Mission Command Console',
        subtitle: 'Inspect Interconnected Systems & Commit Storm Transit',
        actionType: 'open_challenge',
        challengeId: 'master_console',
        position: new THREE.Vector3(0, 1.2, 1.15),
        mesh: dummyObj,
      },
      {
        id: 'console_power',
        title: 'HVDC Power Routing & Solar Console',
        subtitle: 'Route kW Buses, Align 88° Gimbal & Clear Regolith Dust',
        actionType: 'open_challenge',
        challengeId: 'power',
        position: new THREE.Vector3(0, 1.2, -20.6),
        mesh: dummyObj,
      },
      {
        id: 'switch_power_dust',
        title: 'Electrostatic Array Dust Breaker (Physical Switch)',
        subtitle: 'Engage High-Voltage Dust Repulsion & Phase Balance',
        actionType: 'physical_toggle',
        position: new THREE.Vector3(-5.7, 1.4, -17.2),
        mesh: dummyObj,
      },
      {
        id: 'console_lifesupport',
        title: 'ECLSS Atmospheric Scrubber Console',
        subtitle: 'Regenerate Zeolite 5A CO₂ Bed & Tune Sabatier Reactor',
        actionType: 'open_challenge',
        challengeId: 'lifesupport',
        position: new THREE.Vector3(20.6, 1.2, 0),
        mesh: dummyObj,
      },
      {
        id: 'switch_lifesupport_valve',
        title: 'Main Airflow Damper & Zeolite Thermal Purge Valve',
        subtitle: 'Open Circulation Damper & Bake Out Saturated CO₂ Bed',
        actionType: 'physical_toggle',
        position: new THREE.Vector3(17.2, 1.4, -5.7),
        mesh: dummyObj,
      },
      {
        id: 'console_radiation',
        title: 'Radiation Shielding & Bulkhead Console',
        subtitle: 'Configure Regolith, Water Bladder & Boronated HDPE Layers',
        actionType: 'open_challenge',
        challengeId: 'radiation',
        position: new THREE.Vector3(0, 1.2, 20.6),
        mesh: dummyObj,
      },
      {
        id: 'switch_radiation_latch',
        title: 'Hydraulic Storm Shutter & Bulkhead Latch',
        subtitle: 'Deploy Armored Storm Shutter & Lock Shielding Bays',
        actionType: 'physical_toggle',
        position: new THREE.Vector3(5.7, 1.4, 17.2),
        mesh: dummyObj,
      },
      {
        id: 'console_greenhouse',
        title: 'Hydroponic PAR & Water Recovery Console',
        subtitle: 'Tune 660nm/450nm PAR LEDs & Reclaim Transpired Water',
        actionType: 'open_challenge',
        challengeId: 'greenhouse',
        position: new THREE.Vector3(-20.6, 1.2, 0),
        mesh: dummyObj,
      },
      {
        id: 'switch_greenhouse_valve',
        title: 'Transpiration Condensate Recovery Valve',
        subtitle: 'Close Humidity Loop to Reclaim 96% of Irrigation Water',
        actionType: 'physical_toggle',
        position: new THREE.Vector3(-17.2, 1.4, 5.7),
        mesh: dummyObj,
      },
    ];
  }

  public setSize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  public render(
    camera: THREE.PerspectiveCamera,
    state: MissionStateData,
    elapsedTime: number
  ): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;
    if (!ctx || w === 0 || h === 0) return;

    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    // 1. Background Ceiling & Deck Gradient shifted by camera pitch
    const horizonY = h * 0.5 + Math.tan(camera.rotation.x) * (h * 0.45);

    const ceilGrad = ctx.createLinearGradient(0, 0, 0, Math.max(10, horizonY));
    ceilGrad.addColorStop(0, '#0B1117');
    ceilGrad.addColorStop(1, '#16222E');
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, w, Math.max(0, horizonY));

    const floorGrad = ctx.createLinearGradient(0, Math.max(0, horizonY), 0, h);
    floorGrad.addColorStop(0, '#141E28');
    floorGrad.addColorStop(1, '#1D2B3A');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, Math.max(0, horizonY), w, h - Math.max(0, horizonY));

    // 2. Project 3D Room Wireframe / Structural Ribs & Floor Grid
    this.drawFloorGrid(camera, w, h);
    this.drawRoomArchitecture(camera, w, h, state, elapsedTime);
    this.drawInteractiveNodes(camera, w, h, state);
  }

  private projectPoint(
    pt: THREE.Vector3,
    camera: THREE.PerspectiveCamera,
    w: number,
    h: number
  ): { x: number; y: number; z: number; visible: boolean } {
    const local = pt.clone().applyMatrix4(camera.matrixWorldInverse);
    if (local.z > -0.15) {
      return { x: 0, y: 0, z: local.z, visible: false };
    }
    const ndc = pt.clone().project(camera);
    return {
      x: (ndc.x * 0.5 + 0.5) * w,
      y: (-ndc.y * 0.5 + 0.5) * h,
      z: -local.z,
      visible: Math.abs(ndc.x) <= 1.4 && Math.abs(ndc.y) <= 1.4,
    };
  }

  private drawLine3D(
    a: THREE.Vector3,
    b: THREE.Vector3,
    camera: THREE.PerspectiveCamera,
    w: number,
    h: number,
    color: string,
    lineWidth = 2
  ): void {
    const pa = this.projectPoint(a, camera, w, h);
    const pb = this.projectPoint(b, camera, w, h);
    if (!pa.visible && !pb.visible) return;
    if (pa.z <= 0 || pb.z <= 0) return;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(pa.x, pa.y);
    this.ctx.lineTo(pb.x, pb.y);
    this.ctx.stroke();
  }

  private drawFloorGrid(
    camera: THREE.PerspectiveCamera,
    w: number,
    h: number
  ): void {
    // Draw Central Hub and Corridor LED floor guide lines
    const guides: Array<{ a: THREE.Vector3; b: THREE.Vector3; color: string }> = [
      {
        a: new THREE.Vector3(0, 0.02, 0),
        b: new THREE.Vector3(0, 0.02, -20),
        color: '#E8AD66',
      },
      {
        a: new THREE.Vector3(0, 0.02, 0),
        b: new THREE.Vector3(20, 0.02, 0),
        color: '#76AEC9',
      },
      {
        a: new THREE.Vector3(0, 0.02, 0),
        b: new THREE.Vector3(0, 0.02, 20),
        color: '#DE6F60',
      },
      {
        a: new THREE.Vector3(0, 0.02, 0),
        b: new THREE.Vector3(-20, 0.02, 0),
        color: '#77B89A',
      },
    ];

    guides.forEach((g) => {
      this.drawLine3D(g.a, g.b, camera, w, h, g.color, 4);
    });

    // Subtle modular deck grid in active area
    for (let x = -20; x <= 20; x += 4) {
      this.drawLine3D(
        new THREE.Vector3(x, 0, -20),
        new THREE.Vector3(x, 0, 20),
        camera,
        w,
        h,
        'rgba(142, 153, 158, 0.14)',
        1
      );
    }
    for (let z = -20; z <= 20; z += 4) {
      this.drawLine3D(
        new THREE.Vector3(-20, 0, z),
        new THREE.Vector3(20, 0, z),
        camera,
        w,
        h,
        'rgba(142, 153, 158, 0.14)',
        1
      );
    }
  }

  private drawRoomArchitecture(
    camera: THREE.PerspectiveCamera,
    w: number,
    h: number,
    state: MissionStateData,
    elapsedTime: number
  ): void {
    const roomColors: Record<RoomId, string> = {
      hub: '#76AEC9',
      power: state.power.completed ? '#77B89A' : '#E8AD66',
      lifesupport: state.lifeSupport.completed ? '#77B89A' : '#76AEC9',
      radiation: state.radiation.completed ? '#77B89A' : '#DE6F60',
      greenhouse: '#77B89A',
      planetarium: '#9eb9df',
    };

    const roomBoxes: Array<{
      id: RoomId;
      cx: number;
      cz: number;
      rx: number;
      rz: number;
    }> = [
      { id: 'hub', cx: 0, cz: 0, rx: 6.8, rz: 6.8 },
      { id: 'power', cx: 0, cz: -17.5, rx: 6.2, rz: 5.4 },
      { id: 'lifesupport', cx: 17.5, cz: 0, rx: 5.4, rz: 6.2 },
      { id: 'radiation', cx: 0, cz: 17.5, rx: 6.2, rz: 5.4 },
      { id: 'greenhouse', cx: -17.5, cz: 0, rx: 5.4, rz: 6.2 },
      { id: 'planetarium', cx: 17.5, cz: 17.5, rx: 5.4, rz: 5.4 },
    ];

    roomBoxes.forEach((b) => {
      const c = roomColors[b.id];
      const corners = [
        new THREE.Vector3(b.cx - b.rx, 0, b.cz - b.rz),
        new THREE.Vector3(b.cx + b.rx, 0, b.cz - b.rz),
        new THREE.Vector3(b.cx + b.rx, 0, b.cz + b.rz),
        new THREE.Vector3(b.cx - b.rx, 0, b.cz + b.rz),
      ];
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        const topA = corners[i].clone().setY(4.0);
        const topB = corners[next].clone().setY(4.0);
        this.drawLine3D(corners[i], corners[next], camera, w, h, c, 2);
        this.drawLine3D(topA, topB, camera, w, h, c, 2);
        this.drawLine3D(corners[i], topA, camera, w, h, 'rgba(231,233,230,0.35)', 2);
      }
    });

    // Central Holographic Status Core
    const holoCenter = this.projectPoint(
      new THREE.Vector3(0, 1.5 + Math.sin(elapsedTime * 2) * 0.08, -0.4),
      camera,
      w,
      h
    );
    if (holoCenter.visible && holoCenter.z > 0.4) {
      const r = Math.min(85, Math.max(14, 210 / holoCenter.z));
      this.ctx.strokeStyle = '#76AEC9';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(holoCenter.x - r, holoCenter.y - r * 0.65, r * 2, r * 1.3);
      this.ctx.fillStyle = 'rgba(118, 174, 201, 0.14)';
      this.ctx.fillRect(holoCenter.x - r, holoCenter.y - r * 0.65, r * 2, r * 1.3);
    }

    // Distant Earth visible through North-East Lunar Window
    const earthPt = this.projectPoint(new THREE.Vector3(48, 22, -68), camera, w, h);
    if (earthPt.visible && earthPt.z > 1) {
      this.ctx.fillStyle = '#3B82F6';
      this.ctx.beginPath();
      this.ctx.arc(earthPt.x, earthPt.y, 26, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawInteractiveNodes(
    camera: THREE.PerspectiveCamera,
    w: number,
    h: number,
    state: MissionStateData
  ): void {
    this.interactives.forEach((item) => {
      const proj = this.projectPoint(item.position, camera, w, h);
      if (!proj.visible || proj.z <= 0.3 || proj.z > 28) return;

      const size = Math.min(130, Math.max(18, 240 / proj.z));
      const isSwitch = item.actionType === 'physical_toggle';

      let accent = '#76AEC9';
      if (item.id.includes('power')) accent = state.power.completed ? '#77B89A' : '#E8AD66';
      if (item.id.includes('lifesupport')) accent = state.lifeSupport.completed ? '#77B89A' : '#76AEC9';
      if (item.id.includes('radiation')) accent = state.radiation.completed ? '#77B89A' : '#DE6F60';
      if (item.id.includes('greenhouse')) accent = state.greenhouse.completed ? '#77B89A' : '#77B89A';

      this.ctx.fillStyle = '#101820';
      this.ctx.strokeStyle = accent;
      this.ctx.lineWidth = 2.5;
      this.ctx.fillRect(proj.x - size * 0.7, proj.y - size * 0.45, size * 1.4, size * 0.9);
      this.ctx.strokeRect(proj.x - size * 0.7, proj.y - size * 0.45, size * 1.4, size * 0.9);

      if (proj.z < 14) {
        this.ctx.fillStyle = '#E7E9E6';
        this.ctx.font = 'bold 12px "Chakra Petch", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          isSwitch ? `[E] SWITCH: ${item.title.slice(0, 22)}` : `[E] ${item.title.slice(0, 24)}`,
          proj.x,
          proj.y + 4
        );
      }
    });
  }
}
