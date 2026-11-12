import { MISSION_ASSUMPTIONS } from './assumptions';

export interface ShieldingLayerOption {
  id: 'empty' | 'aluminum' | 'regolith' | 'water_bladder' | 'hdpe_boron';
  name: string;
  arealDensityGcm2: number;
  hydrogenEffectiveness: number; // Multiplier for proton/secondary neutron attenuation
  massKg: number;
  powerDrawKw: number; // Active pump or thermal keep-alive
  description: string;
  scientificNote: string;
}

export const SHIELDING_MATERIALS: Record<ShieldingLayerOption['id'], ShieldingLayerOption> = {
  empty: {
    id: 'empty',
    name: 'Unshielded Bay Slot',
    arealDensityGcm2: 0,
    hydrogenEffectiveness: 0,
    massKg: 0,
    powerDrawKw: 0,
    description: 'No supplemental shielding module installed in this bay.',
    scientificNote: 'Base hull provides only 2.5 g/cm² aluminum micrometeoroid skin.'
  },
  aluminum: {
    id: 'aluminum',
    name: 'Thick 6061-T6 Aluminum Plate',
    arealDensityGcm2: 12,
    hydrogenEffectiveness: 0.35,
    massKg: 190,
    powerDrawKw: 0,
    description: 'Heavy metallic bulkhead plate (high structural mass, poor secondary neutron stopping).',
    scientificNote: 'High-Z/medium-Z metals produce secondary spallation neutrons when struck by high-energy protons.'
  },
  regolith: {
    id: 'regolith',
    name: 'Sintered Lunar Regolith Tile (15 cm)',
    arealDensityGcm2: 24,
    hydrogenEffectiveness: 0.72,
    massKg: 210,
    powerDrawKw: 0.2,
    description: 'In-situ resource utilization (ISRU) sintered basaltic regolith mass barrier.',
    scientificNote: 'Excellent primary bulk mass shield utilizing local lunar soil without Earth launch mass penalty.'
  },
  water_bladder: {
    id: 'water_bladder',
    name: 'Pressurized Greywater Bladder Wall',
    arealDensityGcm2: 18,
    hydrogenEffectiveness: 1.35,
    massKg: 160,
    powerDrawKw: 0.8,
    description: 'Circulating habitat water jacket rich in hydrogen nuclei.',
    scientificNote: 'Hydrogen atoms have the same mass as protons, maximizing kinetic energy transfer without neutron spallation.'
  },
  hdpe_boron: {
    id: 'hdpe_boron',
    name: 'Boronated HDPE Polymer Slab (C₂H₄)',
    arealDensityGcm2: 15,
    hydrogenEffectiveness: 1.45,
    massKg: 135,
    powerDrawKw: 0.1,
    description: 'High-Density Polyethylene doped with Boron-10 for thermal neutron capture.',
    scientificNote: 'Used aboard the ISS crew quarters; highest hydrogen density per kilogram of solid shielding.'
  }
};

/**
 * Calculates deterministic solar generation (kW) from electrostatic dust clearing,
 * sun-tracking gimbal alignment, and 3-phase busbar balance.
 */
export function calculateSolarGenerationKw(
  dustCleared: boolean,
  gimbalAngleDeg: number, // Optimal = 88 deg for 89.5°S grazing sun
  busbarBalanced: boolean
): number {
  const dustFactor = dustCleared ? 1.0 : 0.72;
  const angleError = Math.abs(gimbalAngleDeg - 88);
  const cosineLoss = Math.max(0.65, Math.cos((angleError * Math.PI) / 180));
  const phaseFactor = busbarBalanced ? 1.0 : 0.88;
  const raw = MISSION_ASSUMPTIONS.restoredSolarGenerationKw * dustFactor * cosineLoss * phaseFactor;
  return Math.round(raw * 10) / 10;
}

/**
 * Calculates ECLSS CO2 equilibrium target (ppm) and O2 reserve trend
 * based on ECLSS power allocation, zeolite bed regeneration, Sabatier temperature,
 * and supplemental greenhouse photosynthesis.
 */
export function calculateEclssPerformance(params: {
  eclssPowerKw: number;
  zeoliteBedPurged: boolean;
  sabatierTempC: number; // Optimal = 400°C (range 250-500)
  airflowDamperOpen: boolean;
  greenhousePhotosynthesisIndex: number; // 0 to 100
}): {
  equilibriumCo2Ppm: number;
  o2GenerationKgDay: number;
  eclssEfficiencyPct: number;
} {
  const { eclssPowerKw, zeoliteBedPurged, sabatierTempC, airflowDamperOpen, greenhousePhotosynthesisIndex } = params;

  // Power factor: ECLSS needs at least 5.5 kW for full 4-crew OGA + CDRA operation
  const powerFactor = Math.min(1.15, Math.max(0.2, eclssPowerKw / 6.0));
  const bedFactor = zeoliteBedPurged ? 1.0 : 0.48;
  const tempError = Math.abs(sabatierTempC - 400);
  const sabatierFactor = Math.max(0.4, 1 - tempError / 250);
  const damperFactor = airflowDamperOpen ? 1.0 : 0.55;

  const combinedEfficiency = Math.min(1.0, powerFactor * 0.4 + bedFactor * 0.3 + sabatierFactor * 0.15 + damperFactor * 0.15);
  const eclssEfficiencyPct = Math.round(combinedEfficiency * 100);

  // Plant supplemental scrubbing bonus (up to 160 ppm reduction)
  const plantBonusPpm = (greenhousePhotosynthesisIndex / 100) * 160;

  // At 100% efficiency, CO2 settles near 950 ppm; at low efficiency it climbs past 4500 ppm
  const rawCo2 = 4800 - combinedEfficiency * 3750 - plantBonusPpm;
  const equilibriumCo2Ppm = Math.round(Math.max(680, Math.min(5800, rawCo2)));

  // Crew needs 3.36 kg/day O2 (4 * 0.84 kg/day)
  const o2GenerationKgDay = Math.round(3.8 * combinedEfficiency * 100) / 100;

  return {
    equilibriumCo2Ppm,
    o2GenerationKgDay,
    eclssEfficiencyPct
  };
}

/**
 * Calculates radiation dose rate (mSv/hr) during the Solar Particle Event
 * based on selected shielding layers, storm shutter closure, and active water-wall pump power.
 */
export function calculateRadiationProtection(params: {
  layers: [ShieldingLayerOption['id'], ShieldingLayerOption['id'], ShieldingLayerOption['id']];
  stormShutterClosed: boolean;
  radiationPowerKw: number;
}): {
  doseRateMsvHr: number;
  shieldingIntegrityPct: number;
  totalMassKg: number;
  requiredPumpKw: number;
  synergyBonus: boolean;
} {
  const { layers, stormShutterClosed, radiationPowerKw } = params;

  let effectiveArealScore = 0;
  let totalMassKg = 0;
  let requiredPumpKw = stormShutterClosed ? 0.5 : 0;

  layers.forEach((id) => {
    const mat = SHIELDING_MATERIALS[id];
    totalMassKg += mat.massKg;
    requiredPumpKw += mat.powerDrawKw;
    effectiveArealScore += mat.arealDensityGcm2 * mat.hydrogenEffectiveness;
  });

  // Physics ordering synergy: Outer bulk mass (regolith) + Middle/Inner hydrogen moderator (water/HDPE)
  const hasRegolithOuter = layers[0] === 'regolith';
  const hasHydrogenInner =
    layers.includes('water_bladder') || layers.includes('hdpe_boron');
  const synergyBonus = hasRegolithOuter && hasHydrogenInner;
  if (synergyBonus) {
    effectiveArealScore *= 1.22;
  }

  // If radiation bus lacks required pump power for water bladders, effectiveness drops
  const powerRatio = requiredPumpKw > 0 ? Math.min(1, radiationPowerKw / requiredPumpKw) : 1;
  const poweredScore = effectiveArealScore * (0.55 + 0.45 * powerRatio);

  const shutterBonus = stormShutterClosed ? 18 : 0;
  const totalProtectionScore = poweredScore + shutterBonus;

  // Exponential attenuation model: I = I0 * exp(-mu * x)
  const attenuation = Math.exp(-totalProtectionScore / 28);
  const doseRateMsvHr =
    Math.round(Math.max(0.04, MISSION_ASSUMPTIONS.unshieldedStormPeakMsvHr * attenuation) * 1000) / 1000;

  const shieldingIntegrityPct = Math.round(
    Math.min(100, Math.max(0, (1 - doseRateMsvHr / MISSION_ASSUMPTIONS.unshieldedStormPeakMsvHr) * 104))
  );

  return {
    doseRateMsvHr,
    shieldingIntegrityPct,
    totalMassKg,
    requiredPumpKw: Math.round(requiredPumpKw * 10) / 10,
    synergyBonus
  };
}

/**
 * Calculates Greenhouse photosynthesis index, food support, and net water recovery
 */
export function calculateGreenhousePerformance(params: {
  greenhousePowerKw: number;
  redSpectrumPct: number; // Optimal ~75% Red (660nm)
  blueSpectrumPct: number; // Optimal ~20% Blue (450nm), 5% Green
  condensateLoopClosed: boolean;
  dripIrrigationLitersHr: number; // Optimal 2.0 L/hr
}): {
  photosynthesisIndex: number;
  waterRecoveryEfficiencyPct: number;
  netWaterLossLitersHr: number;
  foodSupportPct: number;
} {
  const { greenhousePowerKw, redSpectrumPct, blueSpectrumPct, condensateLoopClosed, dripIrrigationLitersHr } = params;

  // Power adequacy: Optimal LED array draw is 3.5 kW (down from wasteful 6.5 kW broad spectrum)
  const powerAdequacy = Math.min(1.0, Math.max(0.15, greenhousePowerKw / 3.5));

  // PAR Spectrum efficiency: plants peak near 75% Red, 20% Blue
  const redError = Math.abs(redSpectrumPct - 75);
  const blueError = Math.abs(blueSpectrumPct - 20);
  const spectrumQuality = Math.max(0.3, 1 - (redError + blueError) / 90);

  // Irrigation adequacy: optimal around 2.0 L/hr
  const waterError = Math.abs(dripIrrigationLitersHr - 2.0);
  const irrigationQuality = Math.max(0.3, 1 - waterError / 2.2);

  const photosynthesisIndex = Math.round(
    Math.min(100, powerAdequacy * spectrumQuality * irrigationQuality * 105)
  );

  // Water recovery: closed condensate loop recovers 96% of transpired water; open vent recovers only 35%
  const waterRecoveryEfficiencyPct = condensateLoopClosed ? 96 : 38;
  const netWaterLossLitersHr =
    Math.round(dripIrrigationLitersHr * (1 - waterRecoveryEfficiencyPct / 100) * 100) / 100;

  const foodSupportPct = Math.round(Math.min(100, 35 + photosynthesisIndex * 0.65));

  return {
    photosynthesisIndex,
    waterRecoveryEfficiencyPct,
    netWaterLossLitersHr,
    foodSupportPct
  };
}
