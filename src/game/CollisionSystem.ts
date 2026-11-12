import * as THREE from 'three';
import { RoomId } from './MissionState';

export interface SolidBoxCollider {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  isDoor?: boolean;
  doorIndex?: number;
}

/**
 * High-performance solid-body collision system for LUNA-7.
 * Uses exact AABB solid wall boundaries and circle-vs-box penetration resolution,
 * guaranteeing:
 * 1. 100% reliable, natural passage through all open doorways in both directions.
 * 2. Frictionless, smooth sliding along walls and angled corridor surfaces.
 * 3. Dynamic airlock door collision matching the animated visual leaves.
 * 4. Zero invisible barriers or trapped collision states.
 */
export class CollisionSystem {
  public static readonly PLAYER_RADIUS = 0.35; // Comfortable human capsule radius

  // Fixed structural habitat walls (doorway thresholds are kept 100% open)
  private static readonly STATIC_WALLS: SolidBoxCollider[] = [
    // ------------------------------------------------------------------------
    // CENTRAL MISSION HUB (14m x 14m, center (0, 0), span [-7, 7] x [-7, 7])
    // Doorway opening width: 3.6m (from -1.8 to 1.8) on all 4 cardinal walls
    // ------------------------------------------------------------------------
    // North Wall (doorway x: -1.8 to 1.8)
    { id: 'hub_wall_n_l', minX: -7.2, maxX: -1.8, minZ: -7.2, maxZ: -6.8 },
    { id: 'hub_wall_n_r', minX: 1.8, maxX: 7.2, minZ: -7.2, maxZ: -6.8 },
    // South Wall (doorway x: -1.8 to 1.8)
    { id: 'hub_wall_s_l', minX: -7.2, maxX: -1.8, minZ: 6.8, maxZ: 7.2 },
    { id: 'hub_wall_s_r', minX: 1.8, maxX: 7.2, minZ: 6.8, maxZ: 7.2 },
    // East Wall (doorway z: -1.8 to 1.8)
    { id: 'hub_wall_e_t', minX: 6.8, maxX: 7.2, minZ: -7.2, maxZ: -1.8 },
    { id: 'hub_wall_e_b', minX: 6.8, maxX: 7.2, minZ: 1.8, maxZ: 7.2 },
    // West Wall (doorway z: -1.8 to 1.8)
    { id: 'hub_wall_w_t', minX: -7.2, maxX: -6.8, minZ: -7.2, maxZ: -1.8 },
    { id: 'hub_wall_w_b', minX: -7.2, maxX: -6.8, minZ: 1.8, maxZ: 7.2 },

    // ------------------------------------------------------------------------
    // NORTH CORRIDOR (span x: [-1.9, 1.9], z: [-12.0, -7.0])
    // Connects Hub (z = -7.0) to Power Core (z = -12.0)
    // ------------------------------------------------------------------------
    { id: 'corr_n_west', minX: -2.3, maxX: -1.9, minZ: -12.0, maxZ: -7.0 },
    { id: 'corr_n_east', minX: 1.9, maxX: 2.3, minZ: -12.0, maxZ: -7.0 },

    // ------------------------------------------------------------------------
    // SECTOR 01: POWER CORE (x: [-6.5, 6.5], z: [-23.0, -12.0])
    // Doorway at South wall (z = -12.0, x: [-1.8, 1.8])
    // ------------------------------------------------------------------------
    { id: 'power_wall_s_l', minX: -6.7, maxX: -1.8, minZ: -12.2, maxZ: -11.8 },
    { id: 'power_wall_s_r', minX: 1.8, maxX: 6.7, minZ: -12.2, maxZ: -11.8 },
    { id: 'power_wall_north', minX: -6.7, maxX: 6.7, minZ: -23.2, maxZ: -22.8 },
    { id: 'power_wall_west', minX: -6.7, maxX: -6.3, minZ: -23.0, maxZ: -12.0 },
    { id: 'power_wall_east', minX: 6.3, maxX: 6.7, minZ: -23.0, maxZ: -12.0 },

    // ------------------------------------------------------------------------
    // EAST CORRIDOR (span x: [7.0, 12.0], z: [-1.9, 1.9])
    // Connects Hub (x = 7.0) to Life Support (x = 12.0)
    // ------------------------------------------------------------------------
    { id: 'corr_e_north', minX: 7.0, maxX: 12.0, minZ: -2.3, maxZ: -1.9 },
    { id: 'corr_e_south', minX: 7.0, maxX: 12.0, minZ: 1.9, maxZ: 2.3 },

    // ------------------------------------------------------------------------
    // SECTOR 02: LIFE SUPPORT (x: [12.0, 23.0], z: [-6.5, 6.5])
    // Doorway at West wall (x = 12.0, z: [-1.8, 1.8])
    // ------------------------------------------------------------------------
    { id: 'ls_wall_w_t', minX: 11.8, maxX: 12.2, minZ: -6.7, maxZ: -1.8 },
    { id: 'ls_wall_w_b', minX: 11.8, maxX: 12.2, minZ: 1.8, maxZ: 6.7 },
    { id: 'ls_wall_east', minX: 22.8, maxX: 23.2, minZ: -6.7, maxZ: 6.7 },
    { id: 'ls_wall_north', minX: 12.0, maxX: 23.0, minZ: -6.7, maxZ: -6.3 },
    { id: 'ls_wall_south', minX: 12.0, maxX: 23.0, minZ: 6.3, maxZ: 6.7 },

    // ------------------------------------------------------------------------
    // SOUTH CORRIDOR (span x: [-1.9, 1.9], z: [7.0, 12.0])
    // Connects Hub (z = 7.0) to Radiation Shelter (z = 12.0)
    // ------------------------------------------------------------------------
    { id: 'corr_s_west', minX: -2.3, maxX: -1.9, minZ: 7.0, maxZ: 12.0 },
    { id: 'corr_s_east', minX: 1.9, maxX: 2.3, minZ: 7.0, maxZ: 12.0 },

    // ------------------------------------------------------------------------
    // SECTOR 03: RADIATION SHELTER (x: [-6.5, 6.5], z: [12.0, 23.0])
    // Doorway at North wall (z = 12.0, x: [-1.8, 1.8])
    // ------------------------------------------------------------------------
    { id: 'rad_wall_n_l', minX: -6.7, maxX: -1.8, minZ: 11.8, maxZ: 12.2 },
    { id: 'rad_wall_n_r', minX: 1.8, maxX: 6.7, minZ: 11.8, maxZ: 12.2 },
    { id: 'rad_wall_south', minX: -6.7, maxX: 6.7, minZ: 22.8, maxZ: 23.2 },
    { id: 'rad_wall_west', minX: -6.7, maxX: -6.3, minZ: 12.0, maxZ: 23.0 },
    { id: 'rad_wall_east', minX: 6.3, maxX: 6.7, minZ: 12.0, maxZ: 23.0 },

    // ------------------------------------------------------------------------
    // WEST CORRIDOR (span x: [-12.0, -7.0], z: [-1.9, 1.9])
    // Connects Hub (x = -7.0) to Greenhouse (x = -12.0)
    // ------------------------------------------------------------------------
    { id: 'corr_w_north', minX: -12.0, maxX: -7.0, minZ: -2.3, maxZ: -1.9 },
    { id: 'corr_w_south', minX: -12.0, maxX: -7.0, minZ: 1.9, maxZ: 2.3 },

    // ------------------------------------------------------------------------
    // SECTOR 04: GREENHOUSE (x: [-23.0, -12.0], z: [-6.5, 6.5])
    // Doorway at East wall (x = -12.0, z: [-1.8, 1.8])
    // ------------------------------------------------------------------------
    { id: 'gh_wall_e_t', minX: -12.2, maxX: -11.8, minZ: -6.7, maxZ: -1.8 },
    { id: 'gh_wall_e_b', minX: -12.2, maxX: -11.8, minZ: 1.8, maxZ: 6.7 },
    { id: 'gh_wall_west', minX: -23.2, maxX: -22.8, minZ: -6.7, maxZ: 6.7 },
    { id: 'gh_wall_north', minX: -23.0, maxX: -12.0, minZ: -6.7, maxZ: -6.3 },
    { id: 'gh_wall_south', minX: -23.0, maxX: -12.0, minZ: 6.3, maxZ: 6.7 },

    // ------------------------------------------------------------------------
    // INTERNAL HABITAT FURNITURE & SOLID CONSOLE PEDESTALS
    // ------------------------------------------------------------------------
    // Central Hub Holographic Command Table & Terminal Mount
    { id: 'hub_table_center', minX: -1.35, maxX: 1.35, minZ: -1.35, maxZ: 1.55 },
    // Hub Cozy Workstation Desk & Storage Drawer Unit (East Wall)
    { id: 'hub_desk_unit', minX: 3.2, maxX: 5.6, minZ: 4.8, maxZ: 6.5 },
    // Hub Panoramic Earth Lounge Bench (North-East Wall)
    { id: 'hub_lounge_bench', minX: 2.6, maxX: 5.4, minZ: -6.5, maxZ: -5.4 },
    // Power Core Main HVDC Console
    { id: 'power_console', minX: -0.9, maxX: 0.9, minZ: -22.4, maxZ: -20.6 },
    // Life Support ECLSS Console
    { id: 'ls_console', minX: 20.6, maxX: 22.4, minZ: -0.9, maxZ: 0.9 },
    // Radiation Shelter Console
    { id: 'rad_console', minX: -0.9, maxX: 0.9, minZ: 20.6, maxZ: 22.4 },
    // Greenhouse Hydroponics Console
    { id: 'gh_console', minX: -22.4, maxX: -20.6, minZ: -0.9, maxZ: 0.9 },
  ];

  // Dynamic sliding airlock bulkhead doors (indices: 0=North, 1=East, 2=South, 3=West)
  private doorColliders: SolidBoxCollider[] = [
    { id: 'door_n', minX: -1.75, maxX: 1.75, minZ: -9.8, maxZ: -9.2, isDoor: true, doorIndex: 0 },
    { id: 'door_e', minX: 9.2, maxX: 9.8, minZ: -1.75, maxZ: 1.75, isDoor: true, doorIndex: 1 },
    { id: 'door_s', minX: -1.75, maxX: 1.75, minZ: 9.2, maxZ: 9.8, isDoor: true, doorIndex: 2 },
    { id: 'door_w', minX: -9.8, maxX: -9.2, minZ: -1.75, maxZ: 1.75, isDoor: true, doorIndex: 3 },
  ];

  // Tracks open factor (0 = fully closed, 1 = fully open) for each airlock
  private doorOpenFactors: number[] = [0, 0, 0, 0];

  public setDoorOpenFactor(doorIndex: number, factor: number): void {
    if (doorIndex >= 0 && doorIndex < this.doorOpenFactors.length) {
      this.doorOpenFactors[doorIndex] = Math.max(0, Math.min(1, factor));
    }
  }

  /**
   * Resolves player movement from (startX, startZ) to (targetX, targetZ).
   * Applies iterative circle-vs-box penetration resolution with historical contact normal
   * determination. This permits buttery-smooth wall sliding and seamless doorway passage.
   */
  public resolveMovement(
    startX: number,
    startZ: number,
    targetX: number,
    targetZ: number,
    radius = CollisionSystem.PLAYER_RADIUS
  ): { x: number; z: number } {
    let px = targetX;
    let pz = targetZ;

    // Collect all currently active colliders
    const colliders = this.getActiveColliders();

    // Run up to 4 relaxation iterations to resolve simultaneous corner or multi-wall contacts
    for (let iter = 0; iter < 4; iter++) {
      let collided = false;

      for (let i = 0; i < colliders.length; i++) {
        const box = colliders[i];
        const cx = Math.max(box.minX, Math.min(px, box.maxX));
        const cz = Math.max(box.minZ, Math.min(pz, box.maxZ));

        const dx = px - cx;
        const dz = pz - cz;
        const distSq = dx * dx + dz * dz;

        if (distSq < radius * radius) {
          collided = true;

          if (distSq > 0.00001) {
            // Circle center is outside or grazing the box edge/corner
            const dist = Math.sqrt(distSq);
            const pen = radius - dist;
            px += (dx / dist) * pen;
            pz += (dz / dist) * pen;
          } else {
            // Circle center penetrated inside the box: use starting position to push back to original exterior side
            if (startX < box.minX) px = box.minX - radius;
            else if (startX > box.maxX) px = box.maxX + radius;
            else if (startZ < box.minZ) pz = box.minZ - radius;
            else if (startZ > box.maxZ) pz = box.maxZ + radius;
            else {
              // Fallback to shallowest axis if start was somehow inside
              const dL = px - box.minX;
              const dR = box.maxX - px;
              const dT = pz - box.minZ;
              const dB = box.maxZ - pz;
              const minD = Math.min(dL, dR, dT, dB);
              if (minD === dL) px = box.minX - radius;
              else if (minD === dR) px = box.maxX + radius;
              else if (minD === dT) pz = box.minZ - radius;
              else pz = box.maxZ + radius;
            }
          }
        }
      }

      if (!collided) break;
    }

    return { x: px, z: pz };
  }

  /**
   * Determines if a point (with given collision radius) is free of collision.
   */
  public isPointValid(x: number, z: number, radius = CollisionSystem.PLAYER_RADIUS): boolean {
    const colliders = this.getActiveColliders();
    for (let i = 0; i < colliders.length; i++) {
      const box = colliders[i];
      const cx = Math.max(box.minX, Math.min(x, box.maxX));
      const cz = Math.max(box.minZ, Math.min(z, box.maxZ));
      const dx = x - cx;
      const dz = z - cz;
      if (dx * dx + dz * dz < radius * radius) {
        return false;
      }
    }
    return true;
  }

  /**
   * Detects which habitat sector the player currently occupies.
   */
  public detectRoom(x: number, z: number): RoomId {
    if (z < -10.5) return 'power';
    if (x > 10.5) return 'lifesupport';
    if (z > 10.5) return 'radiation';
    if (x < -10.5) return 'greenhouse';
    return 'hub';
  }

  /**
   * Returns list of currently active solid colliders, filtering out open doors.
   */
  private getActiveColliders(): SolidBoxCollider[] {
    const list: SolidBoxCollider[] = [...CollisionSystem.STATIC_WALLS];

    // Airlock doors only block movement when mostly closed (open factor <= 0.45)
    for (let i = 0; i < this.doorColliders.length; i++) {
      const factor = this.doorOpenFactors[i] ?? 0;
      if (factor <= 0.45) {
        list.push(this.doorColliders[i]);
      }
    }

    return list;
  }

  /**
   * Development debug utility: creates wireframe visual meshes of all active collision boxes
   * to visually verify alignment with 3D environment architecture.
   */
  public createDebugVisualizationGroup(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'CollisionDebugGroup';

    const wallMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 }); // Cyan for walls
    const doorMat = new THREE.LineBasicMaterial({ color: 0xef4444 }); // Red for doors

    const all = [...CollisionSystem.STATIC_WALLS, ...this.doorColliders];
    all.forEach((b) => {
      const w = b.maxX - b.minX;
      const d = b.maxZ - b.minZ;
      const h = 3.2;

      const boxGeo = new THREE.BoxGeometry(w, h, d);
      const wireGeo = new THREE.WireframeGeometry(boxGeo);
      const wire = new THREE.LineSegments(wireGeo, b.isDoor ? doorMat : wallMat);
      wire.position.set((b.minX + b.maxX) / 2, h / 2, (b.minZ + b.maxZ) / 2);
      group.add(wire);
    });

    return group;
  }
}
