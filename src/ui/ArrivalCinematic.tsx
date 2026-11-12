import React from 'react';

/**
 * Short in-engine cinematic UI: the actual 3D camera is animated in App.tsx.
 * The overlay only supplies narration, accessible captions, and Skip.
 */
export const ArrivalCinematic:React.FC<{elapsed:number;onSkip:()=>void}> = ({elapsed,onSkip})=>{
  const scene=elapsed<3.5?0:elapsed<7.3?1:2;
  const lines=[
    {speaker:'NOVA · ARRIVAL LOG',text:'Welcome to LUNA-7. Your first adventure on the Moon starts here.'},
    {speaker:'PIX · YOUR NEW FRIEND',text:'Whoa. Look at this place! Come on — let’s meet the crew.'},
    {speaker:'MAYA · FIRST TRANSMISSION',text:'Your training begins with a simple question: how do we make a home on the Moon?'}
  ];
  return <div role="dialog" aria-label="Opening moon base cinematic" aria-modal="true" className="pointer-events-none fixed inset-0 z-[48] flex flex-col justify-between">
    <div className="h-16 bg-gradient-to-b from-[#050b12]/85 to-transparent"/>
    <div className="pointer-events-auto flex items-end justify-between gap-3 bg-gradient-to-t from-[#07111c]/90 via-[#07111c]/65 to-transparent px-5 pb-7 pt-24 sm:px-12 sm:pb-11">
      <div className="max-w-xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.22em] text-[#d9b786]">MOONSHIFT · THE LOST SIGNAL</p>
        <div className="h-20 sm:h-24">
          <p className="text-[11px] font-semibold uppercase tracking-[.17em] text-[#9dd3e6]">{lines[scene].speaker}</p>
          <p aria-live="polite" className="mt-2 text-lg font-medium leading-7 text-[#edf5f8] sm:text-2xl sm:leading-9">{lines[scene].text}</p>
        </div>
        <div className="mt-4 flex gap-2" aria-label="Scene progress">{[0,1,2].map(x=><div key={x} className={'h-1 rounded-full transition-all '+(x<=scene?'w-12 bg-[#d8b78f]':'w-7 bg-[#53697a]')}/>)}</div>
      </div>
      <button type="button" onClick={onSkip} className="shrink-0 rounded-xl border border-[#bcd3df]/45 bg-[#183449]/85 px-5 py-3 text-sm font-semibold text-white hover:bg-[#2b5369]">Skip scene →</button>
    </div>
  </div>;
};
