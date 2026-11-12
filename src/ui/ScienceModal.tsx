import React from 'react';
import { soundFX } from '../audio/AudioManager';
import { MISSION_ASSUMPTIONS } from '../science/assumptions';
import { NASA_SCIENTIFIC_SOURCES } from '../science/sources';

interface ScienceModalProps {
  onClose: () => void;
}

export const ScienceModal: React.FC<ScienceModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101820]/90 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl border border-[#8E999E]/30 bg-[#101820] text-[#E7E9E6] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#8E999E]/25 bg-[#16202B] px-6 py-4">
          <div>
            <div className="text-xs font-mono-tabular uppercase tracking-wider text-[#76AEC9]">
              NASA Space Apps Challenge 2026 · Scientific Integrity Documentation
            </div>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-[#E7E9E6] font-display">
              Science, Engineering Approximations & NASA Sources
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick(520);
              onClose();
            }}
            className="border border-[#8E999E]/40 bg-[#101820] px-4 py-2 text-xs font-semibold text-[#E7E9E6] hover:border-[#76AEC9] hover:text-[#76AEC9] transition-colors whitespace-nowrap shrink-0"
          >
            Close [Esc]
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-6 space-y-6">
          {/* Baseline Habitat Parameters */}
          <div className="border border-[#8E999E]/20 bg-[#16202B] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#E8AD66] font-display">
              Mission Baseline Parameters ({MISSION_ASSUMPTIONS.habitatName})
            </h3>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono-tabular">
              <div>
                <div className="text-[#8E999E]">COORDINATES</div>
                <div className="text-[#E7E9E6] mt-0.5">{MISSION_ASSUMPTIONS.location}</div>
              </div>
              <div>
                <div className="text-[#8E999E]">PRESSURIZED VOLUME</div>
                <div className="text-[#E7E9E6] mt-0.5">{MISSION_ASSUMPTIONS.pressurizedVolumeM3} m³ (4-Crew Load)</div>
              </div>
              <div>
                <div className="text-[#8E999E]">PEAK SOLAR + STORAGE</div>
                <div className="text-[#E7E9E6] mt-0.5">{MISSION_ASSUMPTIONS.restoredSolarGenerationKw} kW / {MISSION_ASSUMPTIONS.batteryCapacityKwh} kWh Li-S</div>
              </div>
              <div>
                <div className="text-[#8E999E]">SAFETY THRESHOLDS</div>
                <div className="text-[#E7E9E6] mt-0.5">≤ 2,000 ppm CO₂ · ≤ 0.15 mSv/hr</div>
              </div>
            </div>
          </div>

          {/* 4-Part Transparency Matrix for each Subsystem */}
          <div className="space-y-4">
            {NASA_SCIENTIFIC_SOURCES.map((src) => (
              <div key={src.id} className="border border-[#8E999E]/25 bg-[#16202B] p-5 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#8E999E]/15 pb-2">
                  <div>
                    <span className="text-xs font-mono-tabular text-[#76AEC9]">{src.system}</span>
                    <span className="mx-2 text-[#8E999E]">·</span>
                    <span className="text-base font-bold text-[#E7E9E6] font-display">{src.title}</span>
                  </div>
                  <a
                    href={src.citationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono-tabular text-[#E8AD66] hover:underline whitespace-nowrap"
                  >
                    {src.agencyOrPublication} ↗
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                  <div>
                    <div className="font-semibold text-[#77B89A]">1. Real Sourced NASA Measurement</div>
                    <p className="mt-1 text-[#E7E9E6]/90">{src.realWorldMeasurement}</p>
                  </div>
                  <div>
                    <div className="font-semibold text-[#76AEC9]">2. Educational Engineering Approximation</div>
                    <p className="mt-1 text-[#E7E9E6]/90">{src.educationalApproximation}</p>
                  </div>
                  <div>
                    <div className="font-semibold text-[#E8AD66]">3. Fictional Mission Assumption</div>
                    <p className="mt-1 text-[#8E999E]">{src.fictionalMissionAssumption}</p>
                  </div>
                  <div>
                    <div className="font-semibold text-[#8E999E]">4. Game-Balancing Parameter</div>
                    <p className="mt-1 text-[#8E999E]">{src.gameBalanceParameter}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
