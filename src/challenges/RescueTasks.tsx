import React, { useState } from 'react';
import { ChallengeId } from '../game/MissionState';
import { NASA_SCIENTIFIC_SOURCES } from '../science/sources';

/**
 * Three different accessible tactile repair interactions. These are mission
 * maintenance demonstrations, NOT a physical high-fidelity spacecraft emulator.
 */
export const RescueTasks:React.FC<{
  challengeId: ChallengeId;
  onClose:()=>void;
  onComplete:()=>void;
}>=({challengeId,onClose,onComplete})=>{
  const [steps,setSteps]=useState<string[]>([]);
  const [water,setWater]=useState(20);
  const [light,setLight]=useState(20);
  const [materials,setMaterials]=useState<string[]>([]);
  const [hint,setHint]=useState(false);
  const air=challengeId==='lifesupport',garden=challengeId==='greenhouse',radiation=challengeId==='radiation';
  const details = air?{tag:'AIR MANAGEMENT',title:'Get the air moving',speaker:'MAYA',intro:'Our little Moon home cannot open a window for fresh air. Help me start the fan, the air filter, and the backup controller.',color:'#84cfe0',url:NASA_SCIENTIFIC_SOURCES.find(s=>s.id==='eclss-air-water')?.citationUrl}
    :garden?{tag:'MOON GARDEN',title:'Bring the seedlings back',speaker:'SPROUT',intro:'My tiny plants need some water and light! Try balancing both controls without leaving the pump or lamps running at full blast.',color:'#92d5ac',url:NASA_SCIENTIFIC_SOURCES.find(s=>s.id==='space-agriculture')?.citationUrl}
    :{tag:'SAFETY DRILL',title:'Prepare our safe room',speaker:'MAYA',intro:'A solar event is in our training scenario. Choose useful supplies to prepare the shelter without using more than our available resources.',color:'#d5b7eb',url:NASA_SCIENTIFIC_SOURCES.find(s=>s.id==='lunar-radiation')?.citationUrl};
  const done=air?steps.length===3:garden?water>=50&&water<=70&&light>=55&&light<=80:materials.includes('water')&&materials.includes('regolith');
  const button='rounded-xl border border-[#7895a7]/45 bg-[#223b50]/85 px-4 py-3 text-sm font-semibold text-[#e3f3f7] transition hover:border-[#a7d6e3] hover:bg-[#33566e] active:scale-[.98]';
  const add=(id:string)=>{
    if(air){
      if(steps.includes(id))return;
      const seq=['fan','filter','controller'];
      if(id!==seq[steps.length]){setHint(true);return;}
      setSteps(old=>[...old,id]);
    }else if(radiation){
      setMaterials(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
    }
  };
  return <div role="dialog" aria-modal="true" aria-labelledby="rescue-title" className="fixed inset-0 z-[65] grid place-items-center overflow-y-auto bg-[#07111c]/95 p-3 text-[#e8f3f6] backdrop-blur-lg sm:p-6">
    <div className="w-full max-w-3xl overflow-hidden rounded-[26px] border border-[#7a9bb2]/25 bg-[#152737] shadow-[0_26px_110px_rgba(0,0,0,.6)]">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-[#20374a] px-5 py-5 sm:px-7">
        <div><p className="text-[10px] font-bold tracking-[.2em] text-[#a9c7d8]">{details.tag} · INTERACTIVE REPAIR</p><h2 id="rescue-title" className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{details.title}</h2></div>
        <button type="button" onClick={onClose} className={button} aria-label="Close mission">✕</button>
      </header>
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_200px] sm:p-7">
        <div className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-[#1a3546] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9dcce6]">{details.speaker}</p>
            <p className="mt-1 text-sm leading-6">{details.intro}</p>
          </div>
          {air&&<section className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[['fan','◉','Air fan'],['filter','▥','CO₂ filter'],['controller','▣','Controller']].map(([id,icon,title],i)=>{
                const active=steps.includes(id);
                return <button key={id} type="button" onClick={()=>add(id)} className={'rounded-2xl border p-4 text-center transition '+(active?'border-[#83dec5] bg-[#1f544e]':'border-[#71899c]/50 bg-[#1c3547] hover:border-[#9fc7da]')}>
                  <span className={'block text-4xl '+(active?'text-[#a8efdf]':'text-[#9eb8cb]')}>{icon}</span>
                  <strong className="mt-3 block text-sm">{title}</strong>
                  <span className="mt-1 block text-[11px] text-[#b8d2df]">{active?'Online ✓':i===steps.length?'Activate next':'Standby'}</span>
                </button>;
              })}
            </div>
            <div aria-label="Cabin airflow visualizer" className="flex h-16 items-center justify-around overflow-hidden rounded-xl border border-[#4a8292]/40 bg-[#0d2330] px-5">
              {Array.from({length:8},(_,i)=><span key={i} className="text-2xl transition-colors duration-300" style={{color:i<(steps.length/3)*8?'#83e5e0':'#405668'}}>➜</span>)}
            </div>
            <p className="text-sm text-[#c4dce7]">Complete the air path in order: <strong>fan → filter → controller.</strong> The airflow grows as each system starts.</p>
          </section>}
          {garden&&<section className="space-y-5">
            <div className="relative flex h-40 items-end justify-center gap-2 overflow-hidden rounded-2xl border border-[#628b7a]/40 bg-gradient-to-b from-[#162d38] to-[#183b31] p-5">
              <div className="absolute left-5 top-5 text-3xl opacity-70">☀</div>
              {Array.from({length:5},(_,i)=><div key={i} className="relative flex flex-col items-center justify-end" style={{height:30+light*.85+water*.22+i*5}}>
                <span style={{opacity:.25+water/150,fontSize:18+light/8}} className="text-[#9ce8a7]">✿</span>
                <div style={{height:'55%',background:'#638d64'}} className="w-1.5 rounded-full"/>
              </div>)}
            </div>
            <label className="block text-sm font-semibold">💧 Water flow: {water}%<input type="range" min="0" max="100" step="5" value={water} onChange={e=>setWater(Number(e.target.value))} className="mt-3 w-full accent-[#87c7e2]"/></label>
            <label className="block text-sm font-semibold">☀ Grow lights: {light}%<input type="range" min="0" max="100" step="5" value={light} onChange={e=>setLight(Number(e.target.value))} className="mt-3 w-full accent-[#e4ba88]"/></label>
            <p className="text-xs leading-5 text-[#afcad8]">Training-model target bands: water 50–70%, light 55–80%. These are illustrative game settings, not NASA-recommended plant-growth percentages.</p>
          </section>}
          {radiation&&<section className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                {id:'water',label:'Water tanks',icon:'◉',note:'Hydrogen-rich shelter material'},
                {id:'regolith',label:'Lunar soil',icon:'▥',note:'Local mass for habitat protection'},
                {id:'display',label:'Shiny display',icon:'▣',note:'Not a practical shelter layer'},
              ].map(v=><button key={v.id} type="button" onClick={()=>add(v.id)} className={'rounded-2xl border p-3 text-center transition '+(materials.includes(v.id)?'border-[#c2e1d3] bg-[#28534e]':'border-[#7e879b]/45 bg-[#253449] hover:bg-[#34465b]')}>
                <span className="block text-3xl">{v.icon}</span><strong className="mt-2 block text-xs">{v.label}</strong><span className="mt-2 block text-[10px] leading-4 text-[#b5cbd8]">{v.note}</span>
                <span className="mt-2 block text-xs text-[#c8f4df]">{materials.includes(v.id)?'Installed ✓':'Tap to add'}</span>
              </button>)}
            </div>
            <div className="rounded-xl border border-white/10 bg-[#101f32] p-4 text-sm">
              <p className="font-semibold">Shelter preparation</p>
              <p className="mt-2 text-[#c0d7e6]">{materials.length?materials.join(' + '):'No modules added yet'}</p>
              <p className="mt-2 text-xs leading-5 text-[#abc5d8]">Real shielding effectiveness depends on particles, material properties, thickness and geometry. This is a qualitative preparation activity, not a radiation-dose calculator.</p>
            </div>
          </section>}
          <div aria-live="polite" className={'rounded-xl border px-4 py-3 text-sm '+(done?'border-[#81cfaa]/40 bg-[#1b4b3d] text-[#d0ffdf]':'border-white/10 bg-[#1d3344] text-[#c8dce9]')}>
            {done?'Mission task complete! Now check the system controls to decide how this repair affects the whole station.':air?'Start each device in the right order.':garden?'Adjust the sliders until the plants have enough light and water, without wasting either.':'Select both useful protective materials to prepare the shelter.'}
          </div>
        </div>
        <aside className="flex flex-col gap-3">
          <div className="rounded-xl bg-[#1e364a] p-4"><h3 className="text-base font-semibold">PIX’s quick tip</h3><p className="mt-2 text-sm leading-6 text-[#d0e0e7]">{air?'Move air first, then clean it.':garden?'Try the middle of each slider instead of setting everything to 100%.':'Look for materials that can form helpful shelter layers. Real radiation is more complicated.'}</p></div>
          <button type="button" onClick={()=>setHint(v=>!v)} className={button}>💡 {hint?'Hide hint':'Need a hint?'}</button>
          {hint&&<p className="rounded-lg bg-[#2a4553] p-3 text-xs leading-5">{air?'The next active module has the word “Activate next”.':garden?'Aim for 60% water and 65% light.': 'Tap Water tanks and Lunar soil. Avoid the decorative display.'}</p>}
          {details.url&&<a href={details.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#9bd0e8] underline underline-offset-4">NASA background research ↗</a>}
          {done&&<button type="button" onClick={onComplete} className="mt-auto rounded-xl bg-[#a4dfcf] px-4 py-4 text-base font-bold text-[#0d2d2c] hover:bg-[#caffeb]">Finish repair →</button>}
          <p className="text-xs leading-5 text-[#9dbaca]">An interactive teaching demonstration. The actual station resource choices follow in the next panel.</p>
        </aside>
      </div>
    </div>
  </div>;
};
