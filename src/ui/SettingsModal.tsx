import React from 'react';
import { soundFX } from '../audio/AudioManager';
import { GameSettings } from '../game/SaveManager';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onResetMission: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetMission,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101820]/90 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg border border-[#8E999E]/30 bg-[#101820] text-[#E7E9E6] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#8E999E]/25 bg-[#16202B] px-6 py-4">
          <h2 className="text-lg font-bold tracking-tight text-[#E7E9E6] font-display">
            Simulation Settings & Accessibility
          </h2>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick(520);
              onClose();
            }}
            className="border border-[#8E999E]/40 bg-[#101820] px-3 py-1.5 text-xs font-semibold text-[#E7E9E6] hover:border-[#76AEC9]"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          {/* Mouse Sensitivity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#8E999E]">Camera Look Sensitivity</span>
              <span className="font-mono-tabular font-semibold">{settings.mouseSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={2.0}
              step={0.1}
              value={settings.mouseSensitivity}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  mouseSensitivity: Number(e.target.value),
                })
              }
              aria-label="Camera Look Sensitivity"
              className="w-full accent-[#76AEC9] cursor-pointer"
            />
          </div>

          {/* Audio Volume */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#8E999E]">Master Audio Volume</span>
              <span className="font-mono-tabular font-semibold">{Math.round(settings.audioVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.audioVolume}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  audioVolume: Number(e.target.value),
                })
              }
              aria-label="Master Audio Volume"
              className="w-full accent-[#76AEC9] cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-[#8E999E]/20">
            <label className="flex items-center justify-between py-1 cursor-pointer">
              <span className="text-xs text-[#E7E9E6]">Mute All Synthesizer Audio</span>
              <input
                type="checkbox"
                checked={settings.muted}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, muted: e.target.checked })
                }
                className="accent-[#76AEC9] h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between py-1 cursor-pointer">
              <span className="text-xs text-[#E7E9E6]">Show Contextual Objective Hints</span>
              <input
                type="checkbox"
                checked={settings.showHints}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, showHints: e.target.checked })
                }
                className="accent-[#76AEC9] h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between py-1 cursor-pointer">
              <span className="text-xs text-[#E7E9E6]">Reduced Motion Mode</span>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    reducedMotion: e.target.checked,
                  })
                }
                className="accent-[#76AEC9] h-4 w-4"
              />
            </label>
          </div>

          {/* Reset Mission */}
          <div className="pt-4 border-t border-[#8E999E]/20 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                soundFX.playAlertChime();
                onResetMission();
                onClose();
              }}
              className="border border-[#DE6F60]/60 px-4 py-2 text-xs font-semibold text-[#DE6F60] hover:bg-[#DE6F60] hover:text-[#101820] transition-colors"
            >
              Restart Mission From T-24:00
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick(640);
                onClose();
              }}
              className="bg-[#76AEC9] px-5 py-2 text-xs font-semibold text-[#101820]"
            >
              Save & Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
