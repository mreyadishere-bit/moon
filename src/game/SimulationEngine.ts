import { MISSION_ASSUMPTIONS } from '../science/assumptions';
import {
  calculateEclssPerformance,
  calculateGreenhousePerformance,
  calculateRadiationProtection,
  calculateSolarGenerationKw,
} from '../science/formulas';
import { MissionStateData } from './MissionState';

/**
 * Recomputes instantaneous derived equilibria and advances time-dependent
 * reservoirs (battery charge, CO2 concentration, water reserve, radiation dose,
 * and mission clock) in a frame-rate-independent manner.
 */
export class SimulationEngine {
  public static recomputeDerivedState(state: MissionStateData): void {
    // 1. Solar Generation & Load
    const solarGenerationKw = calculateSolarGenerationKw(
      state.power.dustCleared,
      state.power.gimbalAngleDeg,
      state.power.busbarBalanced
    );

    const totalLoadKw =
      Math.round(
        (state.power.eclssAllocationKw +
          state.power.radiationAllocationKw +
          state.power.greenhouseAllocationKw +
          state.power.baseSystemsKw) *
          10
      ) / 10;

    const netBatteryRateKw = Math.round((solarGenerationKw - totalLoadKw) * 10) / 10;

    // If battery is depleted and net rate is negative, effective power delivered to subsystems scales down
    const powerShortfallRatio =
      state.telemetry.batteryKwh <= 0.5 && totalLoadKw > solarGenerationKw
        ? Math.max(0.2, solarGenerationKw / totalLoadKw)
        : 1.0;

    // 2. Greenhouse Performance (computed before ECLSS so photosynthetic CO2 bonus feeds into ECLSS)
    const gh = calculateGreenhousePerformance({
      greenhousePowerKw: state.power.greenhouseAllocationKw * powerShortfallRatio,
      redSpectrumPct: state.greenhouse.redSpectrumPct,
      blueSpectrumPct: state.greenhouse.blueSpectrumPct,
      condensateLoopClosed: state.greenhouse.condensateLoopClosed,
      dripIrrigationLitersHr: state.greenhouse.dripIrrigationLitersHr,
    });

    // 3. ECLSS Performance
    const eclss = calculateEclssPerformance({
      eclssPowerKw: state.power.eclssAllocationKw * powerShortfallRatio,
      zeoliteBedPurged: state.lifeSupport.zeoliteBedPurged,
      sabatierTempC: state.lifeSupport.sabatierTempC,
      airflowDamperOpen: state.lifeSupport.airflowDamperOpen,
      greenhousePhotosynthesisIndex: gh.photosynthesisIndex,
    });

    // 4. Radiation Protection
    const rad = calculateRadiationProtection({
      layers: state.radiation.layers,
      stormShutterClosed: state.radiation.stormShutterClosed && state.radiation.bulkheadLatched,
      radiationPowerKw: state.power.radiationAllocationKw * powerShortfallRatio,
    });

    // Update completion flags based on real physical criteria
    state.power.completed =
      state.power.dustCleared &&
      state.power.busbarBalanced &&
      Math.abs(state.power.gimbalAngleDeg - 88) <= 4 &&
      netBatteryRateKw >= 0.5;

    state.lifeSupport.completed =
      state.lifeSupport.zeoliteBedPurged &&
      state.lifeSupport.airflowDamperOpen &&
      Math.abs(state.lifeSupport.sabatierTempC - 400) <= 25 &&
      eclss.equilibriumCo2Ppm <= MISSION_ASSUMPTIONS.safeCo2LimitPpm;

    state.radiation.completed =
      state.radiation.stormShutterClosed &&
      state.radiation.bulkheadLatched &&
      rad.totalMassKg <= 650 &&
      rad.doseRateMsvHr <= MISSION_ASSUMPTIONS.safeRadiationRateMsvHr;

    state.greenhouse.completed =
      state.greenhouse.condensateLoopClosed &&
      gh.photosynthesisIndex >= 78 &&
      state.power.greenhouseAllocationKw <= 4.5;

    // Update telemetry snapshot
    state.telemetry.solarGenerationKw = solarGenerationKw;
    state.telemetry.totalLoadKw = totalLoadKw;
    state.telemetry.netBatteryRateKw = netBatteryRateKw;
    state.telemetry.equilibriumCo2Ppm = eclss.equilibriumCo2Ppm;
    state.telemetry.o2GenerationKgDay = eclss.o2GenerationKgDay;
    state.telemetry.eclssEfficiencyPct = eclss.eclssEfficiencyPct;
    state.telemetry.photosynthesisIndex = gh.photosynthesisIndex;
    state.telemetry.waterRecoveryEfficiencyPct = gh.waterRecoveryEfficiencyPct;
    state.telemetry.netWaterLossLitersHr = gh.netWaterLossLitersHr;
    state.telemetry.foodSupportPct = gh.foodSupportPct;
    state.telemetry.radiationDoseRateMsvHr = rad.doseRateMsvHr;
    state.telemetry.shieldingIntegrityPct = rad.shieldingIntegrityPct;
    state.telemetry.shieldingMassKg = rad.totalMassKg;

    // Overall Habitat Condition Index (0 - 100%)
    const powerScore = Math.min(100, Math.max(0, 50 + netBatteryRateKw * 10));
    const airScore = Math.min(
      100,
      Math.max(0, ((4500 - state.telemetry.co2Ppm) / (4500 - 950)) * 100)
    );
    const radScore = rad.shieldingIntegrityPct;
    const ghScore = (gh.photosynthesisIndex + gh.waterRecoveryEfficiencyPct) / 2;

    state.telemetry.habitatConditionPct = Math.round(
      powerScore * 0.25 + airScore * 0.3 + radScore * 0.25 + ghScore * 0.2
    );
  }

  /**
   * Steps the continuous simulation forward by deltaSeconds of real time.
   * 1 mission hour = 45 real-time seconds during exploration.
   */
  public static step(state: MissionStateData, deltaSeconds: number): void {
    if (!state.started || state.stormEvaluated) return;

    const clampedDt = Math.min(deltaSeconds, 0.25);
    const missionHoursDelta = clampedDt / 45.0;

    SimulationEngine.recomputeDerivedState(state);

    // Advance mission clock (floor at 0.5 hrs until player initiates final storm evaluation)
    state.telemetry.missionHoursRemaining = Math.max(
      0.5,
      Math.round((state.telemetry.missionHoursRemaining - missionHoursDelta) * 100) / 100
    );

    // Update battery charge (kWh)
    const nextBattery =
      state.telemetry.batteryKwh + state.telemetry.netBatteryRateKw * missionHoursDelta;
    state.telemetry.batteryKwh =
      Math.round(
        Math.max(0, Math.min(MISSION_ASSUMPTIONS.batteryCapacityKwh, nextBattery)) * 100
      ) / 100;
    state.telemetry.batteryPct = Math.round(
      (state.telemetry.batteryKwh / MISSION_ASSUMPTIONS.batteryCapacityKwh) * 100
    );

    // Smoothly relax actual cabin CO2 toward equilibriumCO2Ppm (also responds noticeably when player fixes scrubbers)
    const co2Diff = state.telemetry.equilibriumCo2Ppm - state.telemetry.co2Ppm;
    const relaxationRate = Math.min(1, clampedDt * 0.85);
    state.telemetry.co2Ppm = Math.round(state.telemetry.co2Ppm + co2Diff * relaxationRate);

    // Update Oxygen Reserve % based on O2 generation vs 3.36 kg/day crew metabolic demand
    const netO2KgHr = (state.telemetry.o2GenerationKgDay - 3.36) / 24;
    const nextO2Pct =
      state.telemetry.oxygenReservePct +
      netO2KgHr * missionHoursDelta * 12 +
      (state.lifeSupport.backupO2ValveCycled ? 0.02 * clampedDt : 0);
    state.telemetry.oxygenReservePct =
      Math.round(Math.max(15, Math.min(100, nextO2Pct)) * 10) / 10;

    // Update Water Reserve (Liters)
    const nextWater =
      state.telemetry.waterReserveLiters -
      state.telemetry.netWaterLossLitersHr * missionHoursDelta;
    state.telemetry.waterReserveLiters =
      Math.round(Math.max(0, Math.min(500, nextWater)) * 10) / 10;

    // Update Cumulative Radiation Dose (mSv)
    // Ambient pre-storm rate is 20% of storm peak until final storm hits
    const ambientFactor = 0.2;
    state.telemetry.cumulativeDoseMsv =
      Math.round(
        (state.telemetry.cumulativeDoseMsv +
          state.telemetry.radiationDoseRateMsvHr * ambientFactor * missionHoursDelta) *
          1000
      ) / 1000;
  }

  /**
   * Simulates the final 6-hour Solar Particle Event + Lunar Horizon Shadow Transit
   * when the player commits the habitat configuration at the Master Console.
   */
  public static evaluateFinalStormTransit(state: MissionStateData): {
    outcome: 'stabilized' | 'compromised' | 'failed';
    summaryNotes: string[];
  } {
    SimulationEngine.recomputeDerivedState(state);

    const stormDurationHours = 6.0;
    const notes: string[] = [];

    // During the 6-hour shadow transit, solar input drops by 55% (grazing horizon shadow)
    const shadowSolarKw = state.telemetry.solarGenerationKw * 0.45;
    const netShadowDrainKw = state.telemetry.totalLoadKw - shadowSolarKw;
    const batteryChangeKwh = -netShadowDrainKw * stormDurationHours;
    const finalBatteryKwh = Math.max(
      0,
      Math.min(MISSION_ASSUMPTIONS.batteryCapacityKwh, state.telemetry.batteryKwh + batteryChangeKwh)
    );

    state.telemetry.batteryKwh = Math.round(finalBatteryKwh * 10) / 10;
    state.telemetry.batteryPct = Math.round(
      (state.telemetry.batteryKwh / MISSION_ASSUMPTIONS.batteryCapacityKwh) * 100
    );

    // Storm radiation dose accumulated over 6-hour peak proton flux
    const stormDoseMsv = state.telemetry.radiationDoseRateMsvHr * stormDurationHours;
    state.telemetry.cumulativeDoseMsv =
      Math.round((state.telemetry.cumulativeDoseMsv + stormDoseMsv) * 100) / 100;

    // Water change over 6 hours
    state.telemetry.waterReserveLiters = Math.max(
      0,
      Math.round(
        (state.telemetry.waterReserveLiters -
          state.telemetry.netWaterLossLitersHr * stormDurationHours) *
          10
      ) / 10
    );

    // Finalize CO2 to equilibrium
    state.telemetry.co2Ppm = state.telemetry.equilibriumCo2Ppm;
    state.telemetry.missionHoursRemaining = 0;
    state.stormEvaluated = true;

    // Evaluate each pillar
    let criticalFailures = 0;
    let compromises = 0;

    // 1. Power check
    if (finalBatteryKwh <= 2.0) {
      criticalFailures++;
      notes.push(
        'CRITICAL POWER BLACKOUT: Battery reserves exhausted during the 6-hour crater ridge shadow transit due to unmitigated solar dust loss or excessive load.'
      );
    } else if (finalBatteryKwh < 22.0 || !state.power.completed) {
      compromises++;
      notes.push(
        `POWER MARGIN NARROW: Habitat survived shadow transit with ${state.telemetry.batteryPct}% (${state.telemetry.batteryKwh} kWh) reserve remaining.`
      );
    } else {
      notes.push(
        `POWER CORE NOMINAL: Electrostatic dust clearing and 88° gimbal tracking sustained ${state.telemetry.solarGenerationKw} kW generation, finishing transit at ${state.telemetry.batteryPct}% battery.`
      );
    }

    // 2. Life Support check
    if (state.telemetry.co2Ppm >= 3800) {
      criticalFailures++;
      notes.push(
        `HYPERCAPNIA HAZARD: Cabin CO₂ reached ${state.telemetry.co2Ppm} ppm (exceeding NASA emergency threshold) due to unpurged Zeolite beds or insufficient ECLSS power.`
      );
    } else if (state.telemetry.co2Ppm > MISSION_ASSUMPTIONS.safeCo2LimitPpm) {
      compromises++;
      notes.push(
        `ELEVATED CABIN CO₂: Air remained breathable at ${state.telemetry.co2Ppm} ppm, though above the 2,000 ppm long-duration cognitive optimum.`
      );
    } else {
      notes.push(
        `LIFE SUPPORT OPTIMAL: Regenerated Zeolite 5A sorbent beds and 400°C Sabatier loop stabilized cabin CO₂ at ${state.telemetry.co2Ppm} ppm.`
      );
    }

    // 3. Radiation check
    if (state.telemetry.radiationDoseRateMsvHr > 0.65 || state.telemetry.shieldingMassKg > 650) {
      criticalFailures++;
      notes.push(
        `RADIATION EXPOSURE EXCEEDED: Storm peak delivered ${state.telemetry.radiationDoseRateMsvHr} mSv/hr (${state.telemetry.cumulativeDoseMsv} mSv total) because hydrogen-rich shielding or storm shutters were incomplete.`
      );
    } else if (state.telemetry.radiationDoseRateMsvHr > MISSION_ASSUMPTIONS.safeRadiationRateMsvHr) {
      compromises++;
      notes.push(
        `MODERATE RADIATION DOSE: Shielding attenuated the SPE to ${state.telemetry.radiationDoseRateMsvHr} mSv/hr, slightly above the 0.15 mSv/hr target.`
      );
    } else {
      notes.push(
        `RADIATION SHELTER VERIFIED: Graded-Z regolith + hydrogenous water/HDPE shielding cut Solar Particle Event flux to ${state.telemetry.radiationDoseRateMsvHr} mSv/hr.`
      );
    }

    // 4. Greenhouse & Water check
    if (state.telemetry.waterReserveLiters < 320) {
      criticalFailures++;
      notes.push(
        `WATER DEPLETION: Open greenhouse transpiration vent lost critical potable water (${state.telemetry.waterReserveLiters} L left).`
      );
    } else if (!state.greenhouse.condensateLoopClosed || state.telemetry.photosynthesisIndex < 70) {
      compromises++;
      notes.push(
        `SUBOPTIMAL BIOREGENERATION: Crop photosynthetic index reached ${state.telemetry.photosynthesisIndex}% with ${state.telemetry.waterRecoveryEfficiencyPct}% water reclamation.`
      );
    } else {
      notes.push(
        `CLOSED-LOOP AGRICULTURE: 96% transpirational condensate reclamation and 660nm/450nm PAR tuning achieved ${state.telemetry.photosynthesisIndex}% crop vigor at minimal power cost.`
      );
    }

    let outcome: 'stabilized' | 'compromised' | 'failed' = 'stabilized';
    if (criticalFailures > 0) {
      outcome = 'failed';
    } else if (compromises > 0) {
      outcome = 'compromised';
    }

    state.ending = outcome;
    state.finalSummaryNotes = notes;

    return { outcome, summaryNotes: notes };
  }
}
