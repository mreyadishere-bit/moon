import React from 'react';
import { soundFX } from '../audio/AudioManager';
import { MissionStateData } from '../game/MissionState';

interface MissionDebriefProps {
  state: MissionStateData;
  onRestart: () => void;
  onContinueExploring: () => void;
  onOpenScience: () => void;
}

export const MissionDebrief: React.FC<MissionDebriefProps> = ({
  state,
  onRestart,
  onContinueExploring,
  onOpenScience,
}) => {
  const { ending, telemetry, finalSummaryNotes, decisions } = state;

  const badgeTone =
    ending === 'stabilized'
      ? { label: 'MISSION STABILIZED — LUNA-7 TRAINING COMPLETE', color: 'text-[#77B89A]', border: 'border-[#77B89A]' }
      : ending === 'compromised'
        ? { label: 'MISSION SURVIVED WITH COMPROMISES', color: 'text-[#E8AD66]', border: 'border-[#E8AD66]' }
        : { label: 'MISSION UNSUCCESSFUL — HABITAT EVACUATION TRIGGERED', color: 'text-[#DE6F60]', border: 'border-[#DE6F60]' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101820]/92 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl border border-[#8E999E]/35 bg-[#101820] text-[#E7E9E6] shadow-2xl">
        {/* Header */}
        <div className="border-b border-[#8E999E]/25 bg-[#16202B] px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className={`text-xs font-mono-tabular font-bold uppercase tracking-wider ${badgeTone.color}`}>
              ● {badgeTone.label}
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#E7E9E6] font-display">
              Post-Storm Telemetry & Mission Debrief
            </h2>
          </div>

          <div className="text-right font-mono-tabular text-xs text-[#8E999E]">
            <div>HABITAT INTEGRITY INDEX</div>
            <div className="text-xl font-bold text-[#E7E9E6]">{telemetry.habitatConditionPct}%</div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          <div className="rounded-xl border border-[#9ec9e1]/30 bg-[#1a3141] p-4 text-xs leading-5 text-[#c9e0ea]">
            Scientific integrity: This is a fictional LUNA-7 training scenario. The radiation and subsystem figures below are simplified simulated outputs, not NASA-measured astronaut doses or certified flight limits. Explore the NASA Sources for actual reference measurements.
          </div>
          {/* 4 Final Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-[#8E999E]/25 bg-[#16202B] p-4">
              <div className="text-xs font-mono-tabular text-[#8E999E]">POST-TRANSIT BATTERY</div>
              <div className="mt-1 text-2xl font-mono-tabular font-bold text-[#E8AD66]">
                {telemetry.batteryPct}%
              </div>
              <div className="text-xs font-mono-tabular text-[#8E999E] mt-0.5">
                {telemetry.batteryKwh.toFixed(1)} / 96.0 kWh
              </div>
            </div>

            <div className="border border-[#8E999E]/25 bg-[#16202B] p-4">
              <div className="text-xs font-mono-tabular text-[#8E999E]">FINAL CABIN CO₂</div>
              <div className="mt-1 text-2xl font-mono-tabular font-bold text-[#76AEC9]">
                {telemetry.co2Ppm} <span className="text-xs font-normal">ppm</span>
              </div>
              <div className="text-xs font-mono-tabular text-[#8E999E] mt-0.5">
                Training scenario goal: ≤ 2,000 ppm
              </div>
            </div>

            <div className="border border-[#8E999E]/25 bg-[#16202B] p-4">
              <div className="text-xs font-mono-tabular text-[#8E999E]">SIMULATED STORM DOSE RATE</div>
              <div className="mt-1 text-2xl font-mono-tabular font-bold text-[#DE6F60]">
                {telemetry.radiationDoseRateMsvHr.toFixed(3)} <span className="text-xs font-normal">mSv/h</span>
              </div>
              <div className="text-xs font-mono-tabular text-[#8E999E] mt-0.5">
                Modelled cumulative dose: {telemetry.cumulativeDoseMsv.toFixed(2)} mSv
              </div>
            </div>

            <div className="border border-[#8E999E]/25 bg-[#16202B] p-4">
              <div className="text-xs font-mono-tabular text-[#8E999E]">WATER RECLAMATION</div>
              <div className="mt-1 text-2xl font-mono-tabular font-bold text-[#77B89A]">
                {telemetry.waterRecoveryEfficiencyPct}%
              </div>
              <div className="text-xs font-mono-tabular text-[#8E999E] mt-0.5">
                Reserve: {telemetry.waterReserveLiters.toFixed(0)} L
              </div>
            </div>
          </div>

          {/* System Evaluation Notes */}
          <div className="border border-[#8E999E]/25 bg-[#16202B] p-5 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#E7E9E6] font-display">
              Training Simulation Evaluation
            </h3>
            <ul className="space-y-2 text-xs leading-relaxed text-[#E7E9E6]/90">
              {finalSummaryNotes.map((note, idx) => (
                <li key={idx} className="border-b border-[#8E999E]/15 pb-2 last:border-b-0 last:pb-0">
                  {note}
                </li>
              ))}
            </ul>
          </div>

          {/* Key Decisions Log */}
          {decisions.length > 0 && (
            <div className="border border-[#8E999E]/25 bg-[#16202B] p-5 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#E7E9E6] font-display">
                Recorded Mission Log ({decisions.length} Engineering Actions)
              </h3>
              <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono-tabular">
                {decisions.slice(-8).map((d, i) => (
                  <div key={i} className="flex flex-wrap justify-between gap-2 text-[#8E999E]">
                    <span>
                      <strong className="text-[#76AEC9]">[{d.timestampMissionHr}]</strong> {d.system}: <span className="text-[#E7E9E6]">{d.action}</span>
                    </span>
                    <span className="text-[#8E999E]">{d.scientificImpact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick(640);
                onOpenScience();
              }}
              className="border border-[#76AEC9]/60 px-4 py-2.5 text-xs font-semibold text-[#76AEC9] hover:bg-[#76AEC9] hover:text-[#101820] transition-colors"
            >
              Inspect NASA Scientific Sources
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick(580);
                  onContinueExploring();
                }}
                className="border border-[#8E999E]/40 px-4 py-2.5 text-xs font-semibold text-[#E7E9E6] hover:border-[#E7E9E6]"
              >
                Re-Calibration Mode (Keep Exploring)
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick(740);
                  onRestart();
                }}
                className="bg-[#77B89A] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#101820] hover:bg-[#77B89A]/90"
              >
                Start New Mission
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
