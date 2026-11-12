import React, { useState } from 'react';
import { soundFX } from '../audio/AudioManager';
import { ChallengeId, MissionStateData } from '../game/MissionState';
import { StoryDirector } from '../narrative/StoryDirector';
import { SHIELDING_MATERIALS, ShieldingLayerOption } from '../science/formulas';

interface ChallengeOverlayProps {
  challengeId: ChallengeId;
  state: MissionStateData;
  onUpdateState: (
    updater: (draft: MissionStateData) => void,
    logAction?: { system: string; action: string; impact: string }
  ) => void;
  onClose: () => void;
  onTriggerFinalStorm: () => void;
}

export const ChallengeOverlay: React.FC<ChallengeOverlayProps> = ({
  challengeId,
  state,
  onUpdateState,
  onClose,
  onTriggerFinalStorm,
}) => {
  const { telemetry } = state;
  const coach = {
    power: { icon: '⚡', title: 'Where does our electricity come from?', words: 'Sunlight powers our solar panels. Batteries save extra energy for later. Help the panels work, then share the power between our machines.' },
    lifesupport: { icon: '💨', title: 'How do we keep the air safe?', words: 'We cannot open a window on the Moon. Our machines move the air and remove extra carbon dioxide. Let’s get them working again!' },
    greenhouse: { icon: '🌱', title: 'Can plants grow in space?', words: 'They can, with the right light, water, and care. But lights and pumps need electricity, so we have to choose wisely.' },
    radiation: { icon: '🛡️', title: 'Why do astronauts need a shelter?', words: 'Particles from the Sun can be dangerous. Thick shielding and good shelter planning help reduce exposure. Let’s protect our crew!' },
    master_console: { icon: '🚀', title: 'Everything is connected!', words: 'Before we contact Maya, check our power, air, food, and shelter. We cannot spend the same battery energy twice.' },
  }[challengeId];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#070b10]/90 backdrop-blur-md p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl border border-[#8E999E]/30 bg-[#101820] text-[#E7E9E6] shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-[92vh]">
        {/* Console Header */}
        <div className="flex items-center justify-between border-b border-[#8E999E]/25 bg-[#16222F] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {challengeId === 'power' && '⚡'}
              {challengeId === 'lifesupport' && '💨'}
              {challengeId === 'radiation' && '🛡️'}
              {challengeId === 'greenhouse' && '🌱'}
              {challengeId === 'master_console' && '🛰️'}
            </span>
            <div>
              <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#76AEC9] font-bold">
                {challengeId === 'power' && 'Sector 01 · Power Core · Solar & Battery Grid'}
                {challengeId === 'lifesupport' && 'Sector 02 · Life Support · Cabin Air Loop'}
                {challengeId === 'greenhouse' && 'Sector 04 · Greenhouse · Crops & Water'}
                {challengeId === 'radiation' && 'Sector 03 · Radiation Shelter · Storm Bulkhead'}
                {challengeId === 'master_console' && 'Central Hub · Master Command Terminal'}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#E7E9E6] font-display">
                {challengeId === 'power' && 'Restore Station Power Grid'}
                {challengeId === 'lifesupport' && 'Restore Cabin Airflow & Oxygen'}
                {challengeId === 'greenhouse' && 'Restore Plant Irrigation & Lighting'}
                {challengeId === 'radiation' && 'Reinforce Storm Shelter Bulkhead'}
                {challengeId === 'master_console' && 'Master Habitat Integration & Comms'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick(520);
              onClose();
            }}
            className="border border-[#8E999E]/40 bg-[#101820] px-4 py-1.5 text-xs font-semibold text-[#E7E9E6] hover:border-[#76AEC9] hover:text-[#76AEC9] transition-colors"
          >
            Close [Esc]
          </button>
        </div>

        {/* Console Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0E151E]">
          <div className="flex items-start gap-4 rounded-xl border border-[#77b9c9]/20 bg-[#203445]/70 p-4 sm:p-5">
            <span className="text-3xl" aria-hidden="true">{coach.icon}</span>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-[0.17em] text-[#9ad4df]">PIX · LET'S LEARN TOGETHER</div>
              <h3 className="mt-1 text-lg font-semibold text-white">{coach.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#d0dde4]">{coach.words}</p>
            </div>
          </div>

          {challengeId === 'power' && (
            <PowerChallengeView state={state} onUpdateState={onUpdateState} onClose={onClose} />
          )}
          {challengeId === 'lifesupport' && (
            <LifeSupportChallengeView state={state} onUpdateState={onUpdateState} onClose={onClose} />
          )}
          {challengeId === 'greenhouse' && (
            <GreenhouseChallengeView state={state} onUpdateState={onUpdateState} onClose={onClose} />
          )}
          {challengeId === 'radiation' && (
            <RadiationChallengeView state={state} onUpdateState={onUpdateState} onClose={onClose} />
          )}
          {challengeId === 'master_console' && (
            <MasterConsoleView
              state={state}
              onTriggerFinalStorm={onTriggerFinalStorm}
              onClose={onClose}
            />
          )}

          {/* Intuitive Status Summary Strip */}
          <div className="border-t border-[#8E999E]/20 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono-tabular text-[#8E999E]">
            <div className="flex items-center gap-2">
              <span>BATTERY RATE:</span>
              <span className={`font-bold ${telemetry.netBatteryRateKw >= 0 ? 'text-[#77B89A]' : 'text-[#DE6F60]'}`}>
                {telemetry.netBatteryRateKw >= 0 ? `+${telemetry.netBatteryRateKw.toFixed(1)} kW (CHARGING)` : `${telemetry.netBatteryRateKw.toFixed(1)} kW (DRAINING)`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span>CABIN AIR:</span>
              <span className={`font-bold ${telemetry.equilibriumCo2Ppm <= 2000 ? 'text-[#77B89A]' : 'text-[#DE6F60]'}`}>
                {telemetry.equilibriumCo2Ppm <= 2000 ? 'FRESH (O₂ NOMINAL)' : 'HIGH CO₂ (STALE)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span>STORM SHELTER:</span>
              <span className={`font-bold ${state.radiation.completed ? 'text-[#77B89A]' : 'text-[#E8AD66]'}`}>
                {state.radiation.completed ? 'SHIELDED (< 0.15 mSv)' : 'UNPREPARED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/* 1. POWER CHALLENGE: VISUAL ENERGY CONNECTION PUZZLE                        */
/* ========================================================================== */

const PowerChallengeView: React.FC<{
  state: MissionStateData;
  onUpdateState: ChallengeOverlayProps['onUpdateState'];
  onClose: () => void;
}> = ({ state, onUpdateState, onClose }) => {
  const { power, telemetry } = state;

  return (
    <div className="space-y-6">
      {/* Friendly Guide Banner */}
      <div className="p-4 bg-[#14202B] border-l-4 border-[#E8AD66] rounded-sm">
        <h3 className="text-sm font-bold text-[#E7E9E6] font-display">
          Goal: Restore clean solar energy so the batteries charge up!
        </h3>
        <p className="text-xs text-[#8E999E] mt-1 leading-relaxed">
          The Moon dust outside is blocking the solar panels, and the sun angle is off. Clear the dust, track the sun, and route power to Maya’s life support systems.
        </p>
      </div>

      {/* Visual Step-by-Step Tactile Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Dust Sweeper */}
        <div className={`p-4 border rounded-sm flex flex-col justify-between transition-colors ${
          power.dustCleared ? 'border-[#77B89A]/60 bg-[#12221B]' : 'border-[#E8AD66]/50 bg-[#19222B]'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#8E999E]">
              <span>STEP 1</span>
              <span>{power.dustCleared ? '✓ CLEAN' : '▲ DUST OCCLUDED'}</span>
            </div>
            <div className="text-base font-bold font-display text-[#E7E9E6] mt-2">
              Solar Array Surface
            </div>
            <p className="text-xs text-[#8E999E] mt-1">
              Repel electrostatically charged lunar dust from solar panels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playSwitchMechanical();
              onUpdateState(
                (d) => {
                  d.power.dustCleared = !d.power.dustCleared;
                  d.power.busbarBalanced = true;
                },
                {
                  system: 'Power Grid',
                  action: !power.dustCleared ? 'Cleared Lunar Dust' : 'Turned Off Dust Sweeper',
                  impact: 'Restored 24 kW direct solar irradiance.',
                }
              );
            }}
            className={`mt-4 w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors ${
              power.dustCleared
                ? 'bg-[#77B89A] text-[#101820]'
                : 'bg-[#E8AD66] text-[#101820] hover:bg-[#f3be7c]'
            }`}
          >
            {power.dustCleared ? '✓ Dust Repeller Active' : '⚡ Clear Lunar Dust'}
          </button>
        </div>

        {/* Step 2: Polar Sun Gimbal Tracker */}
        <div className={`p-4 border rounded-sm flex flex-col justify-between transition-colors ${
          Math.abs(power.gimbalAngleDeg - 88) <= 4 ? 'border-[#77B89A]/60 bg-[#12221B]' : 'border-[#E8AD66]/50 bg-[#19222B]'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#8E999E]">
              <span>STEP 2</span>
              <span className="text-[#E8AD66] font-bold">{power.gimbalAngleDeg}° (Ideal: 88°)</span>
            </div>
            <div className="text-base font-bold font-display text-[#E7E9E6] mt-2">
              Sun Horizon Tracker
            </div>
            <p className="text-xs text-[#8E999E] mt-1">
              At the lunar South Pole, the sun skims the horizon at 88°.
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick(620);
                onUpdateState((d) => {
                  d.power.gimbalAngleDeg = 88;
                });
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xs transition-colors ${
                Math.abs(power.gimbalAngleDeg - 88) <= 2
                  ? 'bg-[#77B89A] text-[#101820]'
                  : 'bg-[#1E293B] text-[#E7E9E6] hover:bg-[#28384D]'
              }`}
            >
              88° (Auto-Align)
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick(580);
                onUpdateState((d) => {
                  d.power.gimbalAngleDeg = 62;
                });
              }}
              className="px-3 py-2 text-xs bg-[#1E293B] text-[#8E999E] rounded-xs"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Step 3: Balanced Power Routing */}
        <div className={`p-4 border rounded-sm flex flex-col justify-between transition-colors ${
          telemetry.netBatteryRateKw >= 0.5 ? 'border-[#77B89A]/60 bg-[#12221B]' : 'border-[#E8AD66]/50 bg-[#19222B]'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#8E999E]">
              <span>STEP 3</span>
              <span className={telemetry.netBatteryRateKw >= 0.5 ? 'text-[#77B89A]' : 'text-[#DE6F60]'}>
                {telemetry.netBatteryRateKw >= 0.5 ? '✓ SURPLUS' : '▲ DEFICIT'}
              </span>
            </div>
            <div className="text-base font-bold font-display text-[#E7E9E6] mt-2">
              Subsystem Distribution
            </div>
            <p className="text-xs text-[#8E999E] mt-1">
              Balance power to Life Support (6.0 kW) and trim wasted energy.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick(680);
              onUpdateState((d) => {
                d.power.eclssAllocationKw = 6.0;
                d.power.greenhouseAllocationKw = 3.5;
                d.power.radiationAllocationKw = 1.5;
                d.power.busbarBalanced = true;
                d.power.dustCleared = true;
                d.power.gimbalAngleDeg = 88;
              });
            }}
            className="mt-4 w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider bg-[#76AEC9] text-[#101820] hover:bg-[#8cc3dc] rounded-xs transition-colors"
          >
            ⚡ Optimize All Circuits
          </button>
        </div>
      </div>

      {/* Completion Confirmation Banner */}
      {power.completed && (
        <div className="p-4 border border-[#77B89A] bg-[#12241D] rounded-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="text-sm font-bold font-display text-[#77B89A]">
                Power Grid Successfully Restored!
              </div>
              <div className="text-xs text-[#8E999E]">
                Generating {telemetry.solarGenerationKw.toFixed(1)} kW · Net battery charging at +{telemetry.netBatteryRateKw.toFixed(1)} kW.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#77B89A] text-[#101820] font-bold text-xs uppercase tracking-wider rounded-xs hover:bg-[#8dd0b1] transition-colors"
          >
            Continue Journey [Esc]
          </button>
        </div>
      )}
    </div>
  );
};

/* ========================================================================== */
/* 2. LIFE SUPPORT CHALLENGE: VISUAL AIRFLOW & OXYGEN VENTILATION PUZZLE       */
/* ========================================================================== */

const LifeSupportChallengeView: React.FC<{
  state: MissionStateData;
  onUpdateState: ChallengeOverlayProps['onUpdateState'];
  onClose: () => void;
}> = ({ state, onUpdateState, onClose }) => {
  const { lifeSupport, power, telemetry } = state;

  return (
    <div className="space-y-6">
      {/* Friendly Guide Banner */}
      <div className="p-4 bg-[#14202B] border-l-4 border-[#76AEC9] rounded-sm">
        <h3 className="text-sm font-bold text-[#E7E9E6] font-display">
          Goal: Clear stale carbon dioxide and get fresh oxygen circulating!
        </h3>
        <p className="text-xs text-[#8E999E] mt-1 leading-relaxed">
          Astronauts exhale CO₂. When air filters saturate, CO₂ builds up. Open the circulation damper, bake out the saturated filters, and ignite the oxygen reactor.
        </p>
      </div>

      {/* 3 Clickable Airflow Components */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Component 1: Air Damper */}
        <div className={`p-4 border rounded-sm flex flex-col justify-between transition-colors ${
          lifeSupport.airflowDamperOpen ? 'border-[#77B89A]/60 bg-[#12221B]' : 'border-[#76AEC9]/50 bg-[#16212D]'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#8E999E]">
              <span>AIR DUCT</span>
              <span>{lifeSupport.airflowDamperOpen ? '✓ OPEN' : '▲ CLOSED'}</span>
            </div>
            <div className="text-base font-bold font-display text-[#E7E9E6] mt-2">
              Main Airflow Damper
            </div>
            <p className="text-xs text-[#8E999E] mt-1">
              Opens the cabin ducts so ceiling fans can mix fresh air across rooms.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playSwitchMechanical();
              onUpdateState(
                (d) => {
                  d.lifeSupport.airflowDamperOpen = !d.lifeSupport.airflowDamperOpen;
                },
                {
                  system: 'Life Support',
                  action: !lifeSupport.airflowDamperOpen ? 'Opened Airflow Damper' : 'Closed Damper',
                  impact: 'Restored air circulation fan loop.',
                }
              );
            }}
            className={`mt-4 w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors ${
              lifeSupport.airflowDamperOpen
                ? 'bg-[#77B89A] text-[#101820]'
                : 'bg-[#76AEC9] text-[#101820] hover:bg-[#8ec3dc]'
            }`}
          >
            {lifeSupport.airflowDamperOpen ? '✓ Damper Open (Circulating)' : '💨 Open Air Damper'}
          </button>
        </div>

        {/* Component 2: CO2 Filter Purge */}
        <div className={`p-4 border rounded-sm flex flex-col justify-between transition-colors ${
          lifeSupport.zeoliteBedPurged ? 'border-[#77B89A]/60 bg-[#12221B]' : 'border-[#76AEC9]/50 bg-[#16212D]'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#8E999E]">
              <span>CO₂ SCRUBBER</span>
              <span>{lifeSupport.zeoliteBedPurged ? '✓ REGENERATED' : '▲ SATURATED'}</span>
            </div>
            <div className="text-base font-bold font-display text-[#E7E9E6] mt-2">
              Zeolite 5A Filter Bed
            </div>
            <p className="text-xs text-[#8E999E] mt-1">
              Heats the molecular sieve to bake out trapped carbon dioxide.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playSwitchMechanical();
              onUpdateState(
                (d) => {
                  d.lifeSupport.zeoliteBedPurged = !d.lifeSupport.zeoliteBedPurged;
                },
                {
                  system: 'Life Support',
                  action: 'Regenerated Zeolite 5A CO₂ Bed',
                  impact: 'Restored molecular sieve CO₂ capture capacity.',
                }
              );
            }}
            className={`mt-4 w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors ${
              lifeSupport.zeoliteBedPurged
                ? 'bg-[#77B89A] text-[#101820]'
                : 'bg-[#76AEC9] text-[#101820] hover:bg-[#8ec3dc]'
            }`}
          >
            {lifeSupport.zeoliteBedPurged ? '✓ Filter Purged & Clean' : '🔥 Purge Trapped CO₂'}
          </button>
        </div>

        {/* Component 3: Sabatier Oxygen Loop */}
        <div className={`p-4 border rounded-sm flex flex-col justify-between transition-colors ${
          Math.abs(lifeSupport.sabatierTempC - 400) <= 20 ? 'border-[#77B89A]/60 bg-[#12221B]' : 'border-[#76AEC9]/50 bg-[#16212D]'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#8E999E]">
              <span>OXYGEN REACTOR</span>
              <span className="text-[#76AEC9] font-bold">{lifeSupport.sabatierTempC}°C (Ideal: 400°)</span>
            </div>
            <div className="text-base font-bold font-display text-[#E7E9E6] mt-2">
              Sabatier Reactor Temp
            </div>
            <p className="text-xs text-[#8E999E] mt-1">
              Recovers oxygen and water from exhaled air over catalyst.
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick(640);
                onUpdateState((d) => {
                  d.lifeSupport.sabatierTempC = 400;
                  d.power.eclssAllocationKw = 6.0;
                });
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xs transition-colors ${
                Math.abs(lifeSupport.sabatierTempC - 400) <= 20
                  ? 'bg-[#77B89A] text-[#101820]'
                  : 'bg-[#1E293B] text-[#E7E9E6] hover:bg-[#28384D]'
              }`}
            >
              400°C (Auto-Set)
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick(580);
                onUpdateState((d) => {
                  d.lifeSupport.sabatierTempC = 250;
                });
              }}
              className="px-3 py-2 text-xs bg-[#1E293B] text-[#8E999E] rounded-xs"
            >
              Cold
            </button>
          </div>
        </div>
      </div>

      {/* Completion Confirmation Banner */}
      {lifeSupport.completed && (
        <div className="p-4 border border-[#77B89A] bg-[#12241D] rounded-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌱</span>
            <div>
              <div className="text-sm font-bold font-display text-[#77B89A]">
                Cabin Atmosphere Nominal & Fresh!
              </div>
              <div className="text-xs text-[#8E999E]">
                CO₂ stabilized at safe {telemetry.equilibriumCo2Ppm} ppm · Generating {telemetry.o2GenerationKgDay.toFixed(1)} kg/day of clean O₂ for Maya.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#77B89A] text-[#101820] font-bold text-xs uppercase tracking-wider rounded-xs hover:bg-[#8dd0b1] transition-colors"
          >
            Continue Journey [Esc]
          </button>
        </div>
      )}
    </div>
  );
};

/* ========================================================================== */
/* 3. GREENHOUSE CHALLENGE: VISUAL IRRIGATION & PAR LIGHTING PUZZLE           */
/* ========================================================================== */

const GreenhouseChallengeView: React.FC<{
  state: MissionStateData;
  onUpdateState: ChallengeOverlayProps['onUpdateState'];
  onClose: () => void;
}> = ({ state, onUpdateState, onClose }) => {
  const { greenhouse, telemetry } = state;

  return (
    <div className="space-y-6">
      {/* Friendly Guide Banner */}
      <div className="p-4 bg-[#14202B] border-l-4 border-[#77B89A] rounded-sm">
        <h3 className="text-sm font-bold text-[#E7E9E6] font-display">
          Goal: Restore crop irrigation water and adjust sunlight spectrum!
        </h3>
        <p className="text-xs text-[#8E999E] mt-1 leading-relaxed">
          Plants provide fresh oxygen and food for astronauts. Close the water recovery loop so transpired moisture is 96% recycled, and tune the efficient red/blue grow lamps.
        </p>
      </div>

      {/* Tactile Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module 1: Water Recovery Loop */}
        <div className={`p-5 border rounded-sm flex flex-col justify-between transition-colors ${
          greenhouse.condensateLoopClosed ? 'border-[#77B89A]/60 bg-[#12221B]' : 'border-[#77B89A]/40 bg-[#15231D]'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#8E999E]">
              <span>WATER RECOVERY</span>
              <span className="text-[#77B89A] font-bold">
                {greenhouse.condensateLoopClosed ? '96% RECLAIMED' : '20% (LEAKING)'}
              </span>
            </div>
            <div className="text-base font-bold font-display text-[#E7E9E6] mt-2">
              Transpiration Moisture Loop
            </div>
            <p className="text-xs text-[#8E999E] mt-1">
              Catches moisture transpired by plant leaves and returns it to potable storage tanks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playSwitchMechanical();
              onUpdateState(
                (d) => {
                  d.greenhouse.condensateLoopClosed = !d.greenhouse.condensateLoopClosed;
                },
                {
                  system: 'Greenhouse',
                  action: !greenhouse.condensateLoopClosed ? 'Closed Condensate Loop' : 'Opened Loop',
                  impact: 'Recovered 96% of irrigation water vapor.',
                }
              );
            }}
            className={`mt-4 w-full py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors ${
              greenhouse.condensateLoopClosed
                ? 'bg-[#77B89A] text-[#101820]'
                : 'bg-[#77B89A] text-[#101820] hover:bg-[#8dd0b1]'
            }`}
          >
            {greenhouse.condensateLoopClosed ? '✓ Loop Sealed (96% Reclaimed)' : '💧 Seal Water Loop'}
          </button>
        </div>

        {/* Module 2: PAR Grow Light Presets */}
        <div className="p-5 border border-[#77B89A]/40 bg-[#15231D] rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#8E999E]">
              <span>LED SPECTRUM</span>
              <span className="text-[#E7E9E6] font-bold">{greenhouse.redSpectrumPct}% Red / {greenhouse.blueSpectrumPct}% Blue</span>
            </div>
            <div className="text-base font-bold font-display text-[#E7E9E6] mt-2">
              Full-Spectrum Grow Lamps
            </div>
            <p className="text-xs text-[#8E999E] mt-1">
              Photosynthesis peaks at 660nm red (chlorophyll absorption) and 450nm blue (leaf structure).
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick(660);
                onUpdateState((d) => {
                  d.greenhouse.redSpectrumPct = 75;
                  d.greenhouse.blueSpectrumPct = 20;
                  d.greenhouse.dripIrrigationLitersHr = 2.0;
                  d.power.greenhouseAllocationKw = 3.5;
                });
              }}
              className="flex-1 py-2.5 px-3 text-xs font-bold bg-[#77B89A] text-[#101820] hover:bg-[#8dd0b1] rounded-xs transition-colors"
            >
              🌸 Artemis Bloom (75/20)
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick(580);
                onUpdateState((d) => {
                  d.greenhouse.redSpectrumPct = 40;
                  d.greenhouse.blueSpectrumPct = 40;
                });
              }}
              className="px-3 py-2 text-xs bg-[#1E293B] text-[#8E999E] rounded-xs"
            >
              Balanced
            </button>
          </div>
        </div>
      </div>

      {/* Completion Confirmation Banner */}
      {greenhouse.completed && (
        <div className="p-4 border border-[#77B89A] bg-[#12241D] rounded-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <div>
              <div className="text-sm font-bold font-display text-[#77B89A]">
                Crops Thriving & Water 96% Recycled!
              </div>
              <div className="text-xs text-[#8E999E]">
                Photosynthetic vigor is at {telemetry.photosynthesisIndex}% · Net water loss minimized to 0.1 L/hr.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#77B89A] text-[#101820] font-bold text-xs uppercase tracking-wider rounded-xs hover:bg-[#8dd0b1] transition-colors"
          >
            Continue Journey [Esc]
          </button>
        </div>
      )}
    </div>
  );
};

/* ========================================================================== */
/* 4. RADIATION CHALLENGE: VISUAL PROTECTIVE SHELTER PREPARATION              */
/* ========================================================================== */

const RadiationChallengeView: React.FC<{
  state: MissionStateData;
  onUpdateState: ChallengeOverlayProps['onUpdateState'];
  onClose: () => void;
}> = ({ state, onUpdateState, onClose }) => {
  const { radiation, telemetry } = state;

  return (
    <div className="space-y-6">
      {/* Friendly Guide Banner */}
      <div className="p-4 bg-[#14202B] border-l-4 border-[#DE6F60] rounded-sm">
        <h3 className="text-sm font-bold text-[#E7E9E6] font-display">
          Goal: Build multi-layer radiation shielding to protect Dr. Maya Chen!
        </h3>
        <p className="text-xs text-[#8E999E] mt-1 leading-relaxed">
          High-energy protons from solar flares pierce unshielded walls. Stacking dense Moon regolith on the outside and hydrogen-rich water & polymers on the inside keeps radiation well below safe limits.
        </p>
      </div>

      {/* 3 Material Slot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { idx: 0, label: 'OUTER SHIELD', ideal: 'regolith', name: 'Sintered Lunar Regolith' },
          { idx: 1, label: 'CORE SHIELD', ideal: 'water_bladder', name: 'Greywater Storage Bladder' },
          { idx: 2, label: 'INNER SHIELD', ideal: 'hdpe_boron', name: 'Boronated Polyethylene (HDPE)' },
        ].map((slot) => {
          const currentMat = radiation.layers[slot.idx];
          const isCorrect = currentMat === slot.ideal;

          return (
            <div
              key={slot.idx}
              className={`p-4 border rounded-sm flex flex-col justify-between transition-colors ${
                isCorrect ? 'border-[#77B89A]/60 bg-[#12221B]' : 'border-[#DE6F60]/40 bg-[#211618]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#8E999E]">
                  <span>{slot.label}</span>
                  <span className={isCorrect ? 'text-[#77B89A]' : 'text-[#DE6F60]'}>
                    {isCorrect ? '✓ OPTIMAL' : '▲ EMPTY'}
                  </span>
                </div>
                <div className="text-base font-bold font-display text-[#E7E9E6] mt-2">
                  {slot.name}
                </div>
                <p className="text-xs text-[#8E999E] mt-1">
                  {slot.idx === 0 && 'Absorbs heavy primary cosmic rays & micrometeorites.'}
                  {slot.idx === 1 && 'Abundant hydrogen nuclei safely slow down protons.'}
                  {slot.idx === 2 && 'Boron atoms absorb scattered secondary neutrons.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFX.playSwitchMechanical();
                  onUpdateState((d) => {
                    d.radiation.layers[slot.idx] = slot.ideal as any;
                  });
                }}
                className={`mt-4 w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors ${
                  isCorrect
                    ? 'bg-[#77B89A] text-[#101820]'
                    : 'bg-[#DE6F60] text-[#101820] hover:bg-[#e88577]'
                }`}
              >
                {isCorrect ? '✓ Layer Installed' : '🛡️ Install Shield Layer'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Hydraulic Storm Shutter Lever */}
      <div className="p-4 border border-[#8E999E]/25 bg-[#16202B] rounded-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold font-display text-[#E7E9E6]">
            Hydraulic Storm Shutter & Bulkhead Latch
          </div>
          <div className="text-xs text-[#8E999E] mt-0.5">
            Lowers the heavy armored titanium shutter over the South Bulkhead window.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFX.playSwitchMechanical();
            onUpdateState((d) => {
              d.radiation.stormShutterClosed = true;
              d.radiation.bulkheadLatched = true;
            });
          }}
          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors ${
            radiation.stormShutterClosed && radiation.bulkheadLatched
              ? 'bg-[#77B89A] text-[#101820]'
              : 'bg-[#DE6F60] text-[#101820] hover:bg-[#e88577]'
          }`}
        >
          {radiation.stormShutterClosed && radiation.bulkheadLatched
            ? '✓ Shutter Closed & Latched'
            : '🔒 Deploy & Latch Shutter'}
        </button>
      </div>

      {/* Completion Confirmation Banner */}
      {radiation.completed && (
        <div className="p-4 border border-[#77B89A] bg-[#12241D] rounded-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <div className="text-sm font-bold font-display text-[#77B89A]">
                Radiation Shelter 100% Prepared!
              </div>
              <div className="text-xs text-[#8E999E]">
                Dose rate reduced to safe {telemetry.radiationDoseRateMsvHr.toFixed(3)} mSv/hr. Dr. Maya Chen is completely shielded.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#77B89A] text-[#101820] font-bold text-xs uppercase tracking-wider rounded-xs hover:bg-[#8dd0b1] transition-colors"
          >
            Continue Journey [Esc]
          </button>
        </div>
      )}
    </div>
  );
};

/* ========================================================================== */
/* 5. MASTER CONSOLE: FINAL STORM TRANSIT & RECONNECT WITH MAYA               */
/* ========================================================================== */

const MasterConsoleView: React.FC<{
  state: MissionStateData;
  onTriggerFinalStorm: () => void;
  onClose: () => void;
}> = ({ state, onTriggerFinalStorm, onClose }) => {
  const { power, lifeSupport, radiation, greenhouse, telemetry } = state;
  const [commsInitiated, setCommsInitiated] = useState(false);

  const pillars = [
    {
      name: 'Power Core Grid',
      ok: power.completed,
      metric: `${telemetry.solarGenerationKw.toFixed(1)} kW Generated · Charging`,
      icon: '⚡',
    },
    {
      name: 'Life Support ECLSS',
      ok: lifeSupport.completed,
      metric: `CO₂: ${telemetry.equilibriumCo2Ppm} ppm · Fresh Oxygen`,
      icon: '💨',
    },
    {
      name: 'Hydroponic Crops',
      ok: greenhouse.completed,
      metric: `Vitality: ${telemetry.photosynthesisIndex}% · 96% Water Reclaimed`,
      icon: '🌱',
    },
    {
      name: 'Radiation Shelter',
      ok: radiation.completed,
      metric: `Dose: ${telemetry.radiationDoseRateMsvHr.toFixed(3)} mSv/hr · Latched`,
      icon: '🛡️',
    },
  ];

  const allReady = power.completed && lifeSupport.completed && radiation.completed && greenhouse.completed;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-[#14202B] border-l-4 border-[#76AEC9] rounded-sm">
        <h3 className="text-sm font-bold text-[#E7E9E6] font-display">
          Final Objective: Commit Habitat Configuration & Connect with Maya!
        </h3>
        <p className="text-xs text-[#8E999E] mt-1 leading-relaxed">
          All four sectors of Station LUNA-7 have been restored. Initiate the storm lockdown sequence to establish the two-way communication link with Dr. Maya Chen.
        </p>
      </div>

      {/* 4 Systems Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pillars.map((p) => (
          <div
            key={p.name}
            className={`p-4 border rounded-sm flex items-center justify-between gap-3 ${
              p.ok ? 'border-[#77B89A]/50 bg-[#12221B]' : 'border-[#E8AD66]/50 bg-[#1A222B]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{p.icon}</span>
              <div>
                <div className="text-sm font-bold font-display text-[#E7E9E6]">{p.name}</div>
                <div className="text-xs text-[#8E999E]">{p.metric}</div>
              </div>
            </div>
            <span className={`text-xs font-bold font-mono-tabular ${p.ok ? 'text-[#77B89A]' : 'text-[#E8AD66]'}`}>
              {p.ok ? '● READY' : '▲ PENDING'}
            </span>
          </div>
        ))}
      </div>

      {/* Transmission Terminal Box */}
      <div className="border border-[#76AEC9]/40 bg-[#121B26] p-5 rounded-sm shadow-inner">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-[#E8AD66]/20 border border-[#E8AD66] flex items-center justify-center text-2xl shrink-0">
            👩‍🚀
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tabular uppercase font-bold text-[#E8AD66]">
                Dr. Maya Chen · Station Lead
              </span>
              <span className="text-[11px] font-mono-tabular text-[#77B89A]">
                SIGNAL: ACTIVE (SHACKLETON SHELTER)
              </span>
            </div>
            <p className="text-sm text-[#E7E9E6] mt-1 leading-relaxed italic">
              "LUNA-7... I can see all your repairs coming through on my emergency terminal. Power is charging, the air is clean, and the radiation shielding is holding tight. When you're ready, hit the lockdown button!"
            </p>
          </div>
        </div>
      </div>

      {/* Hero Commit Button */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-3 text-xs font-semibold border border-[#8E999E]/40 text-[#8E999E] hover:text-[#E7E9E6]"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playSuccessChord();
            onTriggerFinalStorm();
          }}
          className="px-8 py-3.5 bg-[#77B89A] hover:bg-[#8dd0b1] text-[#101820] text-sm font-bold uppercase tracking-wider rounded-xs shadow-xl transition-transform active:scale-95"
        >
          🚀 Initiate Storm Transit & Finish Mission
        </button>
      </div>
    </div>
  );
};
