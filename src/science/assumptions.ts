export interface MissionBaselineAssumptions {
  habitatName: string;
  location: string;
  pressurizedVolumeM3: number;
  crewEquivalentLoad: number;
  baseSolarGenerationKw: number;
  restoredSolarGenerationKw: number;
  batteryCapacityKwh: number;
  initialBatteryKwh: number;
  safeCo2LimitPpm: number;
  criticalCo2LimitPpm: number;
  safeRadiationRateMsvHr: number;
  unshieldedStormPeakMsvHr: number;
  initialWaterLiters: number;
  minimumSafeWaterLiters: number;
}

export const MISSION_ASSUMPTIONS: MissionBaselineAssumptions = {
  habitatName: 'Artemis Lunar Research Habitat Beta-4',
  location: 'Shackleton Crater Connecting Ridge (89.54° S, 129.2° E)',
  pressurizedVolumeM3: 320,
  crewEquivalentLoad: 4, // 4-astronaut metabolic load simulated during trainer evaluation
  baseSolarGenerationKw: 16.5, // Dust-occluded initial solar output
  restoredSolarGenerationKw: 24.0, // Output after electrostatic dust clearing & busbar phase balance
  batteryCapacityKwh: 96.0, // 4 x 24 kWh Li-S habitat storage cabinets
  initialBatteryKwh: 52.0,
  safeCo2LimitPpm: 2000,
  criticalCo2LimitPpm: 4500,
  safeRadiationRateMsvHr: 0.15,
  unshieldedStormPeakMsvHr: 1.85,
  initialWaterLiters: 420,
  minimumSafeWaterLiters: 360,
};
