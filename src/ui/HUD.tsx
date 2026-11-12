import React from 'react';
import { soundFX } from '../audio/AudioManager';
import { MissionStateData } from '../game/MissionState';
import { NovaMessage, StoryDirector } from '../narrative/StoryDirector';
import { InteractiveTarget } from '../world/HabitatBuilder';

interface HUDProps {
  state: MissionStateData;
  focusedTarget: InteractiveTarget | null;
  novaMessage: NovaMessage | null;
  playerYaw?: number;
  onInteract: () => void;
  onOpenGuidebook: (tab?: 'mission' | 'map') => void;
  onToggleGuideTrail: () => void;
  onOpenSettings: () => void;
  onReturnToMenu: () => void;
  onDismissNovaMessage?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  focusedTarget,
  novaMessage,
  playerYaw = 0,
  onInteract,
  onOpenGuidebook,
  onToggleGuideTrail,
  onOpenSettings,
  onReturnToMenu,
  onDismissNovaMessage,
}) => {
  const objective = StoryDirector.getCurrentObjective(state);

  // Compute cardinal compass direction based on player yaw
  // Yaw 0 = looking North (-Z), Math.PI/2 = looking West (-X), Math.PI = South (+Z), -Math.PI/2 = East (+X)
  const deg = ((-playerYaw * 180) / Math.PI + 360) % 360;
  const compassDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const directionIdx = Math.round(deg / 45) % 8;
  const cardinalHeading = compassDirections[directionIdx];

  // Room target heading for the compass needle:
  // North = Power, East = Life Support, South = Radiation, West = Greenhouse
  let targetAngle = 0;
  if (objective.targetRoom === 'power') targetAngle = 0; // North
  if (objective.targetRoom === 'lifesupport') targetAngle = 90; // East
  if (objective.targetRoom === 'radiation') targetAngle = 180; // South
  if (objective.targetRoom === 'greenhouse') targetAngle = 270; // West
  const relativeAngle = ((targetAngle - deg + 540) % 360) - 180;

  return (
    <>
      {/* Subtle Cinematic Vignette */}
      <div className="fixed inset-0 pointer-events-none z-10 cinematic-vignette" />

      {/* Main Gameplay Screen Overlay */}
      <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none">
        {/* Top Header Bar: Clean 3-Zone Layout */}
        <div className="flex items-start justify-between gap-4">
          {/* Top-Left: Sleek Active Objective Card */}
          <div className="pointer-events-auto bg-[#101820]/90 backdrop-blur-md border border-[#8E999E]/30 p-3.5 rounded-sm shadow-xl max-w-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E8AD66] animate-pulse" />
              <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#E8AD66] font-bold">
                {objective.chapterTitle}
              </span>
            </div>
            <h1 className="text-sm font-bold font-display text-[#E7E9E6] mt-1 tracking-wide">
              {objective.title}
            </h1>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#8E999E] pt-2 border-t border-[#8E999E]/20">
              <span>Chapter {objective.chapter} of 6</span>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick(620);
                  onOpenGuidebook('mission');
                }}
                className="text-[#76AEC9] hover:underline font-semibold"
              >
                Journal [J] →
              </button>
            </div>
          </div>

          {/* Top-Center: Minimalist Compass & Objective Marker */}
          <div className="pointer-events-auto hidden sm:flex flex-col items-center bg-[#101820]/80 backdrop-blur-md border border-[#8E999E]/25 px-5 py-2 rounded-full shadow-lg">
            <div className="flex items-center gap-4 text-xs font-mono-tabular text-[#8E999E]">
              <span className={cardinalHeading === 'W' ? 'text-[#76AEC9] font-bold' : ''}>W</span>
              <span className={cardinalHeading === 'NW' ? 'text-[#76AEC9] font-bold' : ''}>·</span>
              <span className={cardinalHeading === 'N' ? 'text-[#E8AD66] font-bold scale-110' : ''}>N</span>
              <span className={cardinalHeading === 'NE' ? 'text-[#76AEC9] font-bold' : ''}>·</span>
              <span className={cardinalHeading === 'E' ? 'text-[#76AEC9] font-bold' : ''}>E</span>
              <span className={cardinalHeading === 'SE' ? 'text-[#76AEC9] font-bold' : ''}>·</span>
              <span className={cardinalHeading === 'S' ? 'text-[#DE6F60] font-bold' : ''}>S</span>
            </div>
            {/* Objective Diamond Needle */}
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono-tabular text-[#E8AD66]">
              <span
                className="inline-block transition-transform duration-100"
                style={{ transform: `rotate(${relativeAngle}deg)` }}
              >
                ▲
              </span>
              <span>{objective.targetRoom.toUpperCase()}</span>
            </div>
          </div>

          {/* Top-Right: Quick Action Controls */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick(600);
                onToggleGuideTrail();
              }}
              title="Toggle Glowing Floor Path [H]"
              className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors ${
                state.guideTrailActive
                  ? 'border-[#76AEC9] bg-[#76AEC9]/20 text-[#76AEC9]'
                  : 'border-[#8E999E]/30 bg-[#101820]/90 text-[#8E999E] hover:text-[#E7E9E6]'
              }`}
            >
              Path [H]
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick(620);
                onOpenGuidebook('map');
              }}
              title="Station Map [M]"
              className="px-3 py-1.5 text-xs font-semibold rounded-sm border border-[#8E999E]/30 bg-[#101820]/90 text-[#E7E9E6] hover:border-[#76AEC9] transition-colors"
            >
              Map [M]
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick(620);
                onOpenGuidebook('mission');
              }}
              title="Astronaut Journal & Guidebook [J]"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-sm bg-[#76AEC9] text-[#101820] hover:bg-[#8cc3dc] transition-colors shadow-md flex items-center gap-1.5"
            >
              <span>📖</span>
              <span>Guidebook [J]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick(520);
                onOpenSettings();
              }}
              title="Settings & Controls [Esc]"
              className="p-1.5 text-xs font-semibold rounded-sm border border-[#8E999E]/30 bg-[#101820]/90 text-[#8E999E] hover:text-[#E7E9E6] transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Center: Minimalist Tactical Crosshair */}
        <div className="my-auto flex flex-col items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div
              className={`transition-all duration-200 ${
                focusedTarget
                  ? 'h-9 w-9 rounded-full border border-[#E8AD66] bg-[#E8AD66]/15 reticle-active shadow-[0_0_15px_rgba(232,173,102,0.6)]'
                  : 'h-2 w-2 rounded-full bg-[#E7E9E6]/80 shadow-[0_0_6px_rgba(231,233,230,0.9)]'
              }`}
            />
            {focusedTarget && (
              <div className="absolute inset-0 -m-1 border border-dashed border-[#E8AD66]/60 rounded-full animate-spin [animation-duration:10s]" />
            )}
          </div>

          {/* Contextual Interaction Card (only visible when aiming at an interactable within reach) */}
          {focusedTarget && (
            <div className="mt-5 pointer-events-auto border border-[#E8AD66] bg-[#101820]/95 backdrop-blur-md px-5 py-3 text-center shadow-2xl max-w-sm rounded-sm">
              <div className="flex items-center justify-center gap-2 text-[11px] font-mono-tabular uppercase tracking-wider text-[#E8AD66] font-bold">
                <span className="w-2 h-2 bg-[#E8AD66] rounded-full animate-ping" />
                <span>
                  {focusedTarget.actionType === 'physical_toggle'
                    ? '[E] Operate Switch / Valve'
                    : '[E] Access Console'}
                </span>
              </div>
              <div className="mt-1 text-sm font-bold text-[#E7E9E6] font-display tracking-wide">
                {focusedTarget.title}
              </div>
              <div className="mt-0.5 text-xs text-[#8E999E]">{focusedTarget.subtitle}</div>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick(680);
                  onInteract();
                }}
                className="mt-2.5 w-full bg-[#E8AD66] px-4 py-1.5 text-xs font-bold text-[#101820] hover:bg-[#f3be7c] transition-colors shadow-md uppercase tracking-wider"
              >
                INTERACT NOW [E]
              </button>
            </div>
          )}
        </div>

        {/* Bottom Banner: Dialogue & Story Notifications */}
        <div className="flex flex-col items-center pointer-events-none pb-2">
          {novaMessage && (
            <div className="pointer-events-auto max-w-xl w-full border border-[#76AEC9]/50 bg-[#0E1620]/95 backdrop-blur-md p-4 rounded-sm shadow-2xl animate-fade-in flex items-start gap-3.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  novaMessage.speaker === 'DR. MAYA CHEN'
                    ? 'bg-[#E8AD66] text-[#101820]'
                    : 'bg-[#76AEC9] text-[#101820]'
                }`}
              >
                {novaMessage.speaker === 'DR. MAYA CHEN' ? '👩‍🚀' : '🤖'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-mono-tabular uppercase font-bold tracking-wider ${
                      novaMessage.speaker === 'DR. MAYA CHEN' ? 'text-[#E8AD66]' : 'text-[#76AEC9]'
                    }`}
                  >
                    {novaMessage.speaker} · INCOMING TRANSMISSION
                  </span>
                  {onDismissNovaMessage && (
                    <button
                      type="button"
                      onClick={onDismissNovaMessage}
                      className="text-[#8E999E] hover:text-[#E7E9E6] text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="text-sm text-[#E7E9E6] mt-1 font-medium leading-relaxed">
                  {novaMessage.text}
                </div>
                {novaMessage.subtext && (
                  <div className="text-xs text-[#8E999E] mt-1 italic">
                    {novaMessage.subtext}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
