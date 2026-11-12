import { ShieldingLayerOption } from '../science/formulas';

export type RoomId = 'hub' | 'power' | 'lifesupport' | 'radiation' | 'greenhouse' | 'planetarium';

export type ChallengeId = 'power' | 'lifesupport' | 'radiation' | 'greenhouse' | 'master_console';

export type EndingOutcome = 'none' | 'stabilized' | 'compromised' | 'failed';

export interface PowerSubsystemState {
  dustCleared: boolean;
  gimbalAngleDeg: number; // Target: 88°
  busbarBalanced: boolean;
  eclssAllocationKw: number; // Default 3.5, optimal ~6.0
  radiationAllocationKw: number; // Default 1.0, optimal ~1.5-2.0
  greenhouseAllocationKw: number; // Default 6.5 (wasteful), optimal ~3.5
  baseSystemsKw: number; // Fixed 4.0 kW for avionics, thermal loop, comms
  completed: boolean;
}

export interface LifeSupportSubsystemState {
  zeoliteBedPurged: boolean;
  sabatierTempC: number; // Target: 400°C
  airflowDamperOpen: boolean;
  backupO2ValveCycled: boolean;
  completed: boolean;
}

export interface RadiationSubsystemState {
  layers: [ShieldingLayerOption['id'], ShieldingLayerOption['id'], ShieldingLayerOption['id']];
  stormShutterClosed: boolean;
  bulkheadLatched: boolean;
  completed: boolean;
}

export interface GreenhouseSubsystemState {
  redSpectrumPct: number; // Target: 75%
  blueSpectrumPct: number; // Target: 20%
  condensateLoopClosed: boolean;
  dripIrrigationLitersHr: number; // Target: 2.0 L/hr
  completed: boolean;
}

export interface TelemetrySnapshot {
  solarGenerationKw: number;
  totalLoadKw: number;
  netBatteryRateKw: number;
  batteryKwh: number;
  batteryPct: number;
  oxygenReservePct: number;
  o2GenerationKgDay: number;
  co2Ppm: number;
  equilibriumCo2Ppm: number;
  eclssEfficiencyPct: number;
  waterReserveLiters: number;
  waterRecoveryEfficiencyPct: number;
  netWaterLossLitersHr: number;
  foodSupportPct: number;
  photosynthesisIndex: number;
  radiationDoseRateMsvHr: number;
  cumulativeDoseMsv: number;
  shieldingIntegrityPct: number;
  shieldingMassKg: number;
  habitatConditionPct: number;
  missionHoursRemaining: number;
}

export type MissionChapter = 1 | 2 | 3 | 4 | 5 | 6;

export interface MissionDecisionRecord {
  timestampMissionHr: string;
  system: string;
  action: string;
  scientificImpact: string;
}

export interface MissionStateData {
  version: number;
  started: boolean;
  currentRoom: RoomId;
  currentChapter: MissionChapter;
  stationLightsOn: boolean;
  guideTrailActive: boolean;
  mayaCommsRestored: boolean;
  power: PowerSubsystemState;
  lifeSupport: LifeSupportSubsystemState;
  radiation: RadiationSubsystemState;
  greenhouse: GreenhouseSubsystemState;
  telemetry: TelemetrySnapshot;
  decisions: MissionDecisionRecord[];
  ending: EndingOutcome;
  stormEvaluated: boolean;
  finalSummaryNotes: string[];
}

export function createInitialMissionState(): MissionStateData {
  return {
    version: 1,
    started: false,
    currentRoom: 'hub',
    currentChapter: 1,
    stationLightsOn: false,
    guideTrailActive: true,
    mayaCommsRestored: false,
    power: {
      dustCleared: false,
      gimbalAngleDeg: 62, // Misaligned initially
      busbarBalanced: false,
      eclssAllocationKw: 3.5,
      radiationAllocationKw: 0.5,
      greenhouseAllocationKw: 6.5, // Wasteful broad-spectrum initially
      baseSystemsKw: 4.0,
      completed: false,
    },
    lifeSupport: {
      zeoliteBedPurged: false,
      sabatierTempC: 280, // Too cool initially
      airflowDamperOpen: false,
      backupO2ValveCycled: false,
      completed: false,
    },
    radiation: {
      layers: ['aluminum', 'empty', 'empty'], // Poor high-Z single plate initially
      stormShutterClosed: false,
      bulkheadLatched: false,
      completed: false,
    },
    greenhouse: {
      redSpectrumPct: 45,
      blueSpectrumPct: 45,
      condensateLoopClosed: false, // Open loop losing water initially
      dripIrrigationLitersHr: 3.2,
      completed: false,
    },
    telemetry: {
      solarGenerationKw: 9.4,
      totalLoadKw: 14.5,
      netBatteryRateKw: -5.1,
      batteryKwh: 52.0,
      batteryPct: 54,
      oxygenReservePct: 82,
      o2GenerationKgDay: 1.85,
      co2Ppm: 3180,
      equilibriumCo2Ppm: 3420,
      eclssEfficiencyPct: 46,
      waterReserveLiters: 420,
      waterRecoveryEfficiencyPct: 38,
      netWaterLossLitersHr: 1.98,
      foodSupportPct: 52,
      photosynthesisIndex: 34,
      radiationDoseRateMsvHr: 1.38,
      cumulativeDoseMsv: 1.2,
      shieldingIntegrityPct: 26,
      shieldingMassKg: 190,
      habitatConditionPct: 44,
      missionHoursRemaining: 24.0,
    },
    decisions: [],
    ending: 'none',
    stormEvaluated: false,
    finalSummaryNotes: [],
  };
}
