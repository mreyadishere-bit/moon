import React, { useState } from 'react';
import { soundFX } from '../audio/AudioManager';
import { CharacterDialogue } from '../characters/StationCrew';

interface DialogueModalProps {
  dialogue: CharacterDialogue;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({ dialogue, onClose }) => {
  const [lineIndex, setLineIndex] = useState(0);

  const handleNext = () => {
    soundFX.playClick(620);
    if (lineIndex < dialogue.lines.length - 1) {
      setLineIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-xl bg-[#0E1722] border-2 border-[#76AEC9]/60 rounded-lg shadow-2xl p-6 overflow-hidden">
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#76AEC9] via-[#E8AD66] to-[#77B89A]" />

        {/* Character Header */}
        <div className="flex items-center gap-4 border-b border-[#2A3642] pb-4">
          <div className="w-16 h-16 rounded-full bg-[#182635] border-2 border-[#76AEC9] flex items-center justify-center text-3xl shadow-inner shrink-0">
            {dialogue.portrait}
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-[#E7E9E6] tracking-wide">
              {dialogue.speaker}
            </h2>
            <p className="text-xs font-mono-tabular text-[#8E999E] mt-0.5">
              {dialogue.role}
            </p>
          </div>
        </div>

        {/* Dialogue Body */}
        <div className="py-6 min-h-[110px] flex items-center">
          <p className="text-base sm:text-lg text-[#F1F5F9] leading-relaxed font-medium">
            "{dialogue.lines[lineIndex]}"
          </p>
        </div>

        {/* Progress & Navigation Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-[#2A3642]">
          {/* Step dots */}
          <div className="flex items-center gap-2">
            {dialogue.lines.map((_, idx) => (
              <span
                key={idx}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === lineIndex
                    ? 'w-6 bg-[#76AEC9]'
                    : idx < lineIndex
                      ? 'w-2.5 bg-[#77B89A]'
                      : 'w-2.5 bg-[#2A3642]'
                }`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {lineIndex < dialogue.lines.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-sm bg-[#76AEC9] text-[#101820] font-bold text-sm hover:bg-[#8cc3dc] transition-colors shadow-md flex items-center gap-2"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-sm bg-[#77B89A] text-[#101820] font-bold text-sm hover:bg-[#8fd2b2] transition-colors shadow-md flex items-center gap-2"
              >
                <span>Got It, Let's Go!</span>
                <span>✓</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
