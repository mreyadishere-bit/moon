import React from 'react';
import { soundFX } from '../audio/AudioManager';

interface MainMenuProps {
  hasSavedGame: boolean;
  onStartNew: () => void;
  onContinue: () => void;
  onOpenSettings: () => void;
  onOpenScience: () => void;
}

/** Art-directed adventure title: the live, explorable station remains in view. */
export const MainMenu: React.FC<MainMenuProps> = ({
  hasSavedGame, onStartNew, onContinue, onOpenSettings, onOpenScience,
}) => (
  <div className="moon-menu fixed inset-0 z-30 flex flex-col overflow-y-auto pointer-events-auto text-[#e9edf1]">
    <div className="moon-menu-shade pointer-events-none absolute inset-0" />
    <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-6 sm:px-10 lg:px-16">
      <div className="flex items-center gap-3">
        <span className="moon-logo-mark" aria-hidden="true" />
        <span className="text-[13px] font-bold tracking-[0.22em] text-white">MOONSHIFT</span>
        <span className="hidden border-l border-white/20 pl-3 text-[10px] uppercase tracking-[0.18em] text-[#bcc9d1] sm:block">LUNA-7 / MISSION 01</span>
      </div>
      <nav className="flex gap-3 text-xs">
        <button onClick={onOpenScience} className="moon-menu-link">The science</button>
        <button onClick={onOpenSettings} className="moon-menu-link">Settings</button>
      </nav>
    </header>

    <main className="relative z-10 my-auto flex w-full max-w-[740px] flex-col justify-center px-7 pb-10 pt-14 sm:px-12 lg:px-20">
      <div className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.26em] text-[#9fc5d4]">
        <span className="h-[1px] w-8 bg-[#9fc5d4]" />A STORY YOU CAN EXPLORE
      </div>
      <h1 className="moon-display-title font-display font-bold leading-[0.92] tracking-[-0.045em] text-white">
        THE LOST<br /><span className="text-[#c5e8ed]">SIGNAL</span><span className="text-[#deb98a]">.</span>
      </h1>
      <p className="mt-6 max-w-md text-xl font-medium leading-snug text-white/95 sm:text-2xl">A small step onto the Moon.<br />An adventure you'll never forget.</p>
      <p className="mt-5 max-w-md text-[15px] leading-7 text-[#b3c1cc]">
        Your first day at a lunar base takes an unexpected turn. Meet a curious robot,
        discover how astronauts live, and help your new friends bring LUNA-7 back to life.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <button
          onClick={() => { soundFX.playSuccessChord(); onStartNew(); }}
          className="moon-menu-primary group inline-flex min-h-14 items-center gap-5 rounded-xl px-7 text-sm font-bold transition-all"
        >
          <span>{hasSavedGame ? 'Start a new adventure' : 'Begin the adventure'}</span>
          <span className="text-xl font-normal transition-transform group-hover:translate-x-1">↗</span>
        </button>
        {hasSavedGame && <button onClick={() => { soundFX.playSuccessChord(); onContinue(); }} className="moon-menu-secondary min-h-14 rounded-xl px-6 text-sm font-semibold">Continue my journey</button>}
      </div>
      <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[#afbdc7]">
        <span>✧ Explore the Moon</span><span>◈ Discover real science</span><span>✦ Save the station</span>
      </div>
    </main>
    <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-7 py-6 text-[10px] tracking-[0.1em] text-[#a8b5bf] sm:px-12 lg:px-20">
      <span>SPACE APPS 2026 · AN INDEPENDENT EDUCATIONAL GAME</span>
      <span>WASD TO MOVE · MOUSE TO LOOK · E TO EXPLORE</span>
    </footer>
  </div>
);
