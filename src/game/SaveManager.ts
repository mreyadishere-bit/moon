import { createInitialMissionState, MissionStateData } from './MissionState';
import { SimulationEngine } from './SimulationEngine';

const STORAGE_KEY = 'moonshift_save_v1';
const SETTINGS_KEY = 'moonshift_settings_v1';

export interface GameSettings {
  mouseSensitivity: number; // 0.2 to 2.0, default 1.0
  audioVolume: number; // 0 to 1.0, default 0.7
  muted: boolean;
  graphicsQuality: 'high' | 'balanced';
  reducedMotion: boolean;
  showHints: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  mouseSensitivity: 1.0,
  audioVolume: 0.65,
  muted: false,
  graphicsQuality: 'high',
  reducedMotion: false,
  showHints: true,
};

export class SaveManager {
  public static saveMission(state: MissionStateData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors in restricted sandboxes
    }
  }

  public static loadMission(): MissionStateData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<MissionStateData>;
      if (
        !parsed ||
        parsed.version !== 1 ||
        !parsed.power ||
        !parsed.lifeSupport ||
        !parsed.radiation ||
        !parsed.greenhouse ||
        !parsed.telemetry
      ) {
        return null;
      }
      const base = createInitialMissionState();
      const merged: MissionStateData = {
        ...base,
        ...parsed,
        power: { ...base.power, ...parsed.power },
        lifeSupport: { ...base.lifeSupport, ...parsed.lifeSupport },
        radiation: { ...base.radiation, ...parsed.radiation },
        greenhouse: { ...base.greenhouse, ...parsed.greenhouse },
        telemetry: { ...base.telemetry, ...parsed.telemetry },
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
        finalSummaryNotes: Array.isArray(parsed.finalSummaryNotes) ? parsed.finalSummaryNotes : [],
      };
      SimulationEngine.recomputeDerivedState(merged);
      return merged;
    } catch {
      return null;
    }
  }

  public static hasSavedMission(): boolean {
    const loaded = SaveManager.loadMission();
    return Boolean(loaded && loaded.started && !loaded.stormEvaluated);
  }

  public static clearSavedMission(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  public static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }

  public static loadSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }
}
