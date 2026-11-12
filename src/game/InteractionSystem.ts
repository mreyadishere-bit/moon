import * as THREE from 'three';
import { InteractiveTarget } from '../world/HabitatBuilder';

const _toTarget = new THREE.Vector3();
const _camDir = new THREE.Vector3();

export class InteractionSystem {
  private readonly MAX_DISTANCE = 4.6;

  public findFocusedTarget(
    camera: THREE.PerspectiveCamera,
    targets: InteractiveTarget[]
  ): InteractiveTarget | null {
    camera.getWorldDirection(_camDir);

    let bestTarget: InteractiveTarget | null = null;
    let bestScore = -Infinity;

    for (const t of targets) {
      _toTarget.subVectors(t.position, camera.position);
      const dist = _toTarget.length();
      if (dist > this.MAX_DISTANCE) continue;

      _toTarget.normalize();
      const dot = _camDir.dot(_toTarget);

      // Allow generous look cone when close (< 2.5m), tighter cone up to 4.6m
      const minDot = dist < 2.3 ? 0.35 : 0.68;
      if (dot >= minDot) {
        const score = dot * 2.0 - dist * 0.25;
        if (score > bestScore) {
          bestScore = score;
          bestTarget = t;
        }
      }
    }

    return bestTarget;
  }
}
