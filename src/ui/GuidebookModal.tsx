import React, { useState } from 'react';
import { soundFX } from '../audio/AudioManager';
import { MissionStateData, RoomId } from '../game/MissionState';
import { StoryDirector } from '../narrative/StoryDirector';
import { NASA_OBSERVATIONS, readAdventure } from '../game/ScienceAdventure';

interface GuidebookModalProps {
  state: MissionStateData;
  playerPos: { x: number; z: number };
  initialTab?: 'mission' | 'map' | 'controls' | 'discoveries' | 'science';
  onClose: () => void;
  onOpenAcademy?: () => void;
  onTeleportToRoom?: (room: RoomId) => void;
}

export const GuidebookModal: React.FC<GuidebookModalProps> = ({
  state,
  playerPos,
  initialTab = 'mission',
  onClose,
  onOpenAcademy,
  onTeleportToRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'mission' | 'map' | 'controls' | 'discoveries' | 'science'>(initialTab);

  const objective = StoryDirector.getCurrentObjective(state);
  const training = readAdventure();

  const chapters = [
    {
      num: 1,
      title: 'The Silent Station',
      desc: 'Wake up LUNA-7 from emergency standby.',
      completed: state.stationLightsOn,
      room: 'hub' as RoomId,
    },
    {
      num: 2,
      title: 'The Power Failure',
      desc: 'Align solar panels & restore battery charging.',
      completed: state.power.completed,
      room: 'power' as RoomId,
    },
    {
      num: 3,
      title: 'A Breath of Fresh Air',
      desc: 'Clear CO₂ filters & restart cabin air circulation.',
      completed: state.lifeSupport.completed,
      room: 'lifesupport' as RoomId,
    },
    {
      num: 4,
      title: 'The Green Room',
      desc: 'Reconnect plant irrigation & adjust grow lighting.',
      completed: state.greenhouse.completed,
      room: 'greenhouse' as RoomId,
    },
    {
      num: 5,
      title: 'Before the Storm',
      desc: 'Stack multi-layer radiation shielding bulkheads.',
      completed: state.radiation.completed,
      room: 'radiation' as RoomId,
    },
    {
      num: 6,
      title: 'The Last Signal',
      desc: 'Seal habitat for storm & reconnect with Dr. Maya Chen.',
      completed: state.stormEvaluated,
      room: 'hub' as RoomId,
    },
  ];

  // Convert 3D world coordinates (-22 to +22) to a 2D map view box (0 to 100%)
  const mapPlayerX = Math.max(10, Math.min(90, 50 + (playerPos.x / 24) * 40));
  const mapPlayerY = Math.max(10, Math.min(90, 50 + (playerPos.z / 24) * 40));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b10]/90 backdrop-blur-md p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl h-[90vh] max-h-[720px] flex flex-col border border-[#8E999E]/30 bg-[#101820] text-[#E7E9E6] shadow-2xl rounded-sm overflow-hidden">
        {/* Guidebook Header */}
        <div className="flex items-center justify-between border-b border-[#8E999E]/20 bg-[#16222F] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#76AEC9]/20 border border-[#76AEC9] flex items-center justify-center text-[#76AEC9] font-bold text-sm">
              📖
            </div>
            <div>
              <span className="text-[11px] font-mono-tabular tracking-wider uppercase text-[#76AEC9]">
                Station LUNA-7 · Astronaut Field Journal
              </span>
              <h2 className="text-xl font-bold font-display text-[#E7E9E6]">
                Mission Guidebook & Station Map
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick(520);
              onClose();
            }}
            className="border border-[#8E999E]/40 bg-[#101820] px-3.5 py-1.5 text-xs font-semibold text-[#E7E9E6] hover:border-[#76AEC9] hover:text-[#76AEC9] transition-colors"
          >
            Close [Esc]
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#8E999E]/20 bg-[#121B24] px-6 text-xs font-semibold tracking-wider overflow-x-auto">
          {[
            { id: 'mission', label: '1. My Mission', icon: '🎯' },
            { id: 'map', label: '2. Station Map', icon: '🗺️' },
            { id: 'controls', label: '3. How to Play', icon: '🎮' },
            { id: 'discoveries', label: '4. Maya’s Notes', icon: '📝' },
            { id: 'science', label: '5. NASA Science', icon: '🚀' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundFX.playClick(600);
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-display uppercase whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-[#76AEC9] text-[#76AEC9] bg-[#16222F]'
                  : 'border-transparent text-[#8E999E] hover:text-[#E7E9E6]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0E151E]">
          {/* TAB 1: MY MISSION */}
          {activeTab === 'mission' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#80c8dc]/35 bg-gradient-to-r from-[#1e3b4e] to-[#192e3f] p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#9ed8ea]">✦ Story & Science Academy</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Your lunar learning journey</h3>
                <p className="mt-2 text-sm leading-6 text-[#cbdce7]">{training.choices.length} of 7 lessons explored. Experiment with real NASA reference values, make choices, then see how your decisions change our Moon base.</p>
                {training.choices.length>0&&<p className="mt-2 text-xs text-[#a5ced7]">Last decision: {training.choices[training.choices.length-1].label}</p>}
                {onOpenAcademy&&<button type="button" onClick={onOpenAcademy} className="mt-4 rounded-xl bg-[#a3d9de] px-5 py-3 text-sm font-bold text-[#112b36] hover:bg-[#c6edf2]">{training.stage===7?'Review your story':'Continue your story & experiments'} →</button>}
              </div>
              {/* Active Current Objective Hero Card */}
              <div className="border border-[#E8AD66] bg-[#16212D]/80 p-5 rounded-sm shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#E8AD66] font-bold">
                    Active Mission · {objective.chapterTitle}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#E8AD66]/20 text-[#E8AD66] font-bold border border-[#E8AD66]/40">
                    IN PROGRESS
                  </span>
                </div>
                <h3 className="text-xl font-bold font-display text-[#E7E9E6] mt-2">
                  {objective.title}
                </h3>
                <p className="text-sm text-[#ccd3d8] mt-1 leading-relaxed">
                  {objective.detail}
                </p>
                <div className="mt-4 pt-3 border-t border-[#8E999E]/20 flex flex-wrap items-center justify-between text-xs text-[#8E999E]">
                  <span>💡 Tip: Press <strong className="text-[#E7E9E6]">[H]</strong> at any time to toggle the glowing floor navigation trail.</span>
                  {onTeleportToRoom && (
                    <button
                      type="button"
                      onClick={() => {
                        onTeleportToRoom(objective.targetRoom);
                        onClose();
                      }}
                      className="mt-2 sm:mt-0 px-3 py-1 bg-[#E8AD66] text-[#101820] font-bold rounded-xs hover:bg-[#f3be7c] transition-colors"
                    >
                      Fast Travel to {objective.targetRoom.toUpperCase()} →
                    </button>
                  )}
                </div>
              </div>

              {/* Chapter Progression Checklist */}
              <div>
                <h4 className="text-xs font-mono-tabular uppercase tracking-wider text-[#8E999E] mb-3">
                  Story Journey · 6 Chapters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {chapters.map((ch) => (
                    <div
                      key={ch.num}
                      className={`p-4 border rounded-sm flex items-start gap-3 transition-colors ${
                        ch.completed
                          ? 'border-[#77B89A]/50 bg-[#13221E]'
                          : ch.num === objective.chapter
                          ? 'border-[#E8AD66] bg-[#1E251E]'
                          : 'border-[#8E999E]/20 bg-[#121A23] opacity-60'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          ch.completed
                            ? 'bg-[#77B89A] text-[#101820]'
                            : ch.num === objective.chapter
                            ? 'bg-[#E8AD66] text-[#101820] animate-pulse'
                            : 'bg-[#1E293B] text-[#8E999E]'
                        }`}
                      >
                        {ch.completed ? '✓' : ch.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold font-display text-[#E7E9E6]">
                          {ch.title}
                        </div>
                        <div className="text-xs text-[#8E999E] mt-0.5 leading-normal">
                          {ch.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STATION MAP */}
          {activeTab === 'map' && (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-xl aspect-square relative bg-[#090E15] border border-[#76AEC9]/30 rounded-sm p-4 overflow-hidden shadow-inner">
                {/* Grid Blueprint Lines */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#76AEC9_1px,transparent_1px)] [background-size:24px_24px]" />

                {/* Central Hub Room Box */}
                <div className="absolute top-[36%] left-[36%] w-[28%] h-[28%] border-2 border-[#76AEC9] bg-[#162433]/70 flex flex-col items-center justify-center text-center p-1">
                  <span className="text-[11px] font-bold font-display text-[#E7E9E6]">CENTRAL HUB</span>
                  <span className="text-[9px] text-[#76AEC9]">Command Center</span>
                  {state.stationLightsOn && <span className="text-[9px] text-[#77B89A] mt-0.5">● ONLINE</span>}
                </div>

                {/* North Wing: Power Room */}
                <div className="absolute top-[4%] left-[36%] w-[28%] h-[24%] border-2 border-[#E8AD66] bg-[#241F16]/70 flex flex-col items-center justify-center text-center p-1">
                  <span className="text-[11px] font-bold font-display text-[#E7E9E6]">POWER CORE</span>
                  <span className="text-[9px] text-[#E8AD66]">Solar & Batteries</span>
                  {state.power.completed ? (
                    <span className="text-[9px] text-[#77B89A] font-bold">✓ NOMINAL</span>
                  ) : (
                    <span className="text-[9px] text-[#E8AD66] animate-pulse">▲ LOW CHARGE</span>
                  )}
                </div>

                {/* East Wing: Life Support */}
                <div className="absolute top-[36%] right-[4%] w-[24%] h-[28%] border-2 border-[#76AEC9] bg-[#14232C]/70 flex flex-col items-center justify-center text-center p-1">
                  <span className="text-[11px] font-bold font-display text-[#E7E9E6]">LIFE SUPPORT</span>
                  <span className="text-[9px] text-[#76AEC9]">ECLSS Air Loop</span>
                  {state.lifeSupport.completed ? (
                    <span className="text-[9px] text-[#77B89A] font-bold">✓ NOMINAL</span>
                  ) : (
                    <span className="text-[9px] text-[#DE6F60] animate-pulse">▲ CO₂ RISING</span>
                  )}
                </div>

                {/* South Wing: Radiation Shelter */}
                <div className="absolute bottom-[4%] left-[36%] w-[28%] h-[24%] border-2 border-[#DE6F60] bg-[#291618]/70 flex flex-col items-center justify-center text-center p-1">
                  <span className="text-[11px] font-bold font-display text-[#E7E9E6]">SHELTER</span>
                  <span className="text-[9px] text-[#DE6F60]">Maya's Bunker</span>
                  {state.radiation.completed ? (
                    <span className="text-[9px] text-[#77B89A] font-bold">✓ SHIELDED</span>
                  ) : (
                    <span className="text-[9px] text-[#DE6F60] animate-pulse">▲ UNPROTECTED</span>
                  )}
                </div>

                {/* West Wing: Greenhouse */}
                <div className="absolute top-[36%] left-[4%] w-[24%] h-[28%] border-2 border-[#77B89A] bg-[#13221C]/70 flex flex-col items-center justify-center text-center p-1">
                  <span className="text-[11px] font-bold font-display text-[#E7E9E6]">GREENHOUSE</span>
                  <span className="text-[9px] text-[#77B89A]">Crops & Water</span>
                  {state.greenhouse.completed ? (
                    <span className="text-[9px] text-[#77B89A] font-bold">✓ NOMINAL</span>
                  ) : (
                    <span className="text-[9px] text-[#E8AD66] animate-pulse">▲ WATER PAUSED</span>
                  )}
                </div>

                {/* Corridors */}
                <div className="absolute top-[28%] left-[46%] w-[8%] h-[8%] bg-[#1E293B]" />
                <div className="absolute top-[46%] right-[28%] w-[8%] h-[8%] bg-[#1E293B]" />
                <div className="absolute bottom-[28%] left-[46%] w-[8%] h-[8%] bg-[#1E293B]" />
                <div className="absolute top-[46%] left-[28%] w-[8%] h-[8%] bg-[#1E293B]" />

                {/* Live Player Position Beacon */}
                <div
                  className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-[#38BDF8] border-2 border-white shadow-[0_0_12px_#38BDF8] animate-ping"
                  style={{ left: `${mapPlayerX}%`, top: `${mapPlayerY}%` }}
                />
                <div
                  className="absolute w-3.5 h-3.5 -ml-1.75 -mt-1.75 rounded-full bg-[#38BDF8] border border-white z-10 flex items-center justify-center text-[8px] font-bold text-black"
                  style={{ left: `${mapPlayerX}%`, top: `${mapPlayerY}%` }}
                >
                  ▲
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-[#8E999E]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#38BDF8] inline-block" />
                  <span>You (Live Position)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#77B89A] inline-block" />
                  <span>System Restored</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#E8AD66] inline-block" />
                  <span>Active Objective</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOW TO PLAY */}
          {activeTab === 'controls' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#141C25] border border-[#8E999E]/20 rounded-sm">
                  <div className="text-sm font-bold font-display text-[#76AEC9]">🚶 Movement</div>
                  <div className="mt-2 space-y-1.5 text-xs text-[#ccd3d8]">
                    <div><kbd className="px-2 py-0.5 bg-[#1E293B] border border-[#8E999E]/40 rounded text-[#E7E9E6]">W A S D</kbd> or Arrow Keys — Walk</div>
                    <div><kbd className="px-2 py-0.5 bg-[#1E293B] border border-[#8E999E]/40 rounded text-[#E7E9E6]">Shift</kbd> — Sprint</div>
                    <div><kbd className="px-2 py-0.5 bg-[#1E293B] border border-[#8E999E]/40 rounded text-[#E7E9E6]">Space</kbd> — Jump in 1/6th Lunar Gravity</div>
                  </div>
                </div>

                <div className="p-4 bg-[#141C25] border border-[#8E999E]/20 rounded-sm">
                  <div className="text-sm font-bold font-display text-[#E8AD66]">🔍 Camera & Interaction</div>
                  <div className="mt-2 space-y-1.5 text-xs text-[#ccd3d8]">
                    <div><kbd className="px-2 py-0.5 bg-[#1E293B] border border-[#8E999E]/40 rounded text-[#E7E9E6]">Mouse</kbd> — Look Around (Click screen to lock)</div>
                    <div><kbd className="px-2 py-0.5 bg-[#1E293B] border border-[#8E999E]/40 rounded text-[#E7E9E6]">E</kbd> or Left Click — Operate Console / Switch</div>
                    <div><kbd className="px-2 py-0.5 bg-[#1E293B] border border-[#8E999E]/40 rounded text-[#E7E9E6]">Esc</kbd> — Unlock Mouse / Settings Menu</div>
                  </div>
                </div>

                <div className="p-4 bg-[#141C25] border border-[#8E999E]/20 rounded-sm">
                  <div className="text-sm font-bold font-display text-[#77B89A]">🗺️ Navigation Aids</div>
                  <div className="mt-2 space-y-1.5 text-xs text-[#ccd3d8]">
                    <div><kbd className="px-2 py-0.5 bg-[#1E293B] border border-[#8E999E]/40 rounded text-[#E7E9E6]">H</kbd> — Toggle Glowing Floor Navigation Trail</div>
                    <div><kbd className="px-2 py-0.5 bg-[#1E293B] border border-[#8E999E]/40 rounded text-[#E7E9E6]">M</kbd> — Open Station Map</div>
                    <div><kbd className="px-2 py-0.5 bg-[#1E293B] border border-[#8E999E]/40 rounded text-[#E7E9E6]">J</kbd> — Open Astronaut Field Journal / Guidebook</div>
                  </div>
                </div>

                <div className="p-4 bg-[#141C25] border border-[#8E999E]/20 rounded-sm">
                  <div className="text-sm font-bold font-display text-[#DE6F60]">🧩 Solving Puzzles</div>
                  <div className="mt-2 space-y-1.5 text-xs text-[#ccd3d8]">
                    <div>Every challenge is visual and intuitive!</div>
                    <div>Click power nodes to connect energy lines.</div>
                    <div>Rotate ventilation dials to clear airflow.</div>
                    <div>Stack regolith & water slabs to block storm radiation.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DISCOVERIES & MAYA'S NOTES */}
          {activeTab === 'discoveries' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="p-4 bg-[#141E28] border-l-4 border-[#76AEC9] text-xs">
                <span className="font-bold text-[#E7E9E6]">LOG ENTRY #01 · LUNA-7 ARRIVAL</span>
                <p className="mt-1 text-[#8E999E] leading-relaxed">
                  "The view of Earth from Shackleton Crater never gets old. We're nestled on the rim where the peaks experience nearly continuous sunlight. But when an M-class solar flare is detected, the proton flux turns deadly within hours. Good design isn't a luxury here—it's survival." — Dr. Maya Chen
                </p>
              </div>

              <div className="p-4 bg-[#141E28] border-l-4 border-[#E8AD66] text-xs">
                <span className="font-bold text-[#E7E9E6]">LOG ENTRY #02 · THE POWER EQUATION</span>
                <p className="mt-1 text-[#8E999E] leading-relaxed">
                  "Lunar dust is electrostatically charged and sharp as crushed glass. When it settles on the photovoltaic arrays, output plummets. Our high-voltage dust repeller shakes it off, restoring 24 kW of clean power into our lithium-sulfur battery packs."
                </p>
              </div>

              <div className="p-4 bg-[#141E28] border-l-4 border-[#77B89A] text-xs">
                <span className="font-bold text-[#E7E9E6]">LOG ENTRY #03 · THE LIVING GREENHOUSE</span>
                <p className="mt-1 text-[#8E999E] leading-relaxed">
                  "Plants transpire almost all the water they take in. By condensing moisture from the greenhouse air, we reclaim 96% of irrigation water! Combined with 660nm red and 450nm blue LEDs, the crops grow twice as fast with zero wasted photons."
                </p>
              </div>

              <div className="p-4 bg-[#141E28] border-l-4 border-[#DE6F60] text-xs">
                <span className="font-bold text-[#E7E9E6]">LOG ENTRY #04 · THE STORM BULKHEAD</span>
                <p className="mt-1 text-[#8E999E] leading-relaxed">
                  "Solar particle events consist of high-energy protons. Heavy metals cause secondary radiation (bremsstrahlung), but hydrogen-rich materials like water and polyethylene absorb them safely. Sintered lunar regolith makes an incredible outer thermal shield."
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: NASA SCIENCE */}
          {activeTab === 'science' && (
            <div className="space-y-4 max-w-2xl mx-auto text-xs text-[#ccd3d8]">
              <div className="rounded-2xl border border-[#a0cce1]/30 bg-[#182d40] p-5">
                <h4 className="text-base font-bold text-[#bce1f2]">NASA values used in our experiments</h4>
                <p className="mt-2 text-sm leading-6">These measurements drive the gravity demonstration, example solar energy calculation, Moon communication delay and historical space-weather training alert.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(NASA_OBSERVATIONS).map(([id,source])=><a key={id} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/10 bg-[#122436] p-3 hover:border-[#8acbdd]"><strong className="block text-sm text-white">{source.label}</strong><span className="mt-1 block text-xs text-[#9dd2e8]">{source.value.toLocaleString()} {source.unit} · NASA ↗</span></a>)}</div>
                <p className="mt-3 text-xs leading-5 text-[#a6becd]">Our colony equipment sizes, energy allocations, radiation readiness scores and event sequence are fictional teaching assumptions. May 2024 Kp 9 describes Earth’s geomagnetic conditions, not a measured lunar astronaut dose.</p>
              </div>
              <div className="p-4 bg-[#141C25] border border-[#76AEC9]/30 rounded-sm">
                <h4 className="font-bold text-sm text-[#76AEC9] font-display">
                  1. Artemis & Lunar South Pole Sunlight
                </h4>
                <p className="mt-1 leading-relaxed text-[#94a3b8]">
                  NASA's Artemis missions target the Moon's South Pole because elevated crater rims (like Shackleton) receive nearly continuous sunlight (up to 88° polar tracking angle), while permanently shadowed craters hold millions of tons of water ice.
                </p>
              </div>

              <div className="p-4 bg-[#141C25] border border-[#76AEC9]/30 rounded-sm">
                <h4 className="font-bold text-sm text-[#76AEC9] font-display">
                  2. Sabatier Carbon Dioxide Recycling
                </h4>
                <p className="mt-1 leading-relaxed text-[#94a3b8]">
                  Astronauts exhale CO₂. On the ISS and Artemis habitats, the Sabatier reactor combines CO₂ with hydrogen (from water electrolysis) at 400°C over a nickel catalyst to produce water and methane. This recovers up to 50% of oxygen from exhaled air!
                </p>
              </div>

              <div className="p-4 bg-[#141C25] border border-[#76AEC9]/30 rounded-sm">
                <h4 className="font-bold text-sm text-[#76AEC9] font-display">
                  3. Graded-Z Radiation Protection
                </h4>
                <p className="mt-1 leading-relaxed text-[#94a3b8]">
                  During a Solar Particle Event (SPE), incoming protons collide with atoms. Using high-Z material on the outside (sintered lunar regolith) followed by low-Z hydrogenous material on the inside (water tanks, borated polyethylene) minimizes dangerous secondary neutron scatter.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
