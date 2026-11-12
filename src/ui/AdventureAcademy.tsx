import React, { useEffect, useState } from 'react';
import {
  AdventureState, ChoiceId, NASA_OBSERVATIONS, STORY_STAGES, StoryBranch,
  adventureEnding, exampleSolarPowerKw, freeFallMeters,
  oneWayMoonSignalSeconds, readAdventure, resetAdventure, saveAdventure, trainWithDecision
} from '../game/ScienceAdventure';

interface Props {
  onClose: () => void;
  onDecision: (stage:number,choice:string,newState:AdventureState)=>void;
  onExplore: () => void;
}
type Option = {id:ChoiceId|string;label:string;caption:string;glyph:string;effect:string};
const branchNames:Record<StoryBranch,string>={energy:'Energy Crisis',air:'Life-Support Emergency',weather:'Space-Weather Alert'};
const narration:Record<StoryBranch,string>={
  energy:'Leo: Our batteries are nearly empty. We need a plan before the next shadow passes.',
  air:'Maya: The air filters are slowing down. We need to protect our breathing air first.',
  weather:'NOVA: Shelter preparations are behind schedule. We must prepare before the drill.'
};
const optionsFor=(stage:number):Option[]=>{
  switch(stage) {
    case 0:return [
      {id:'energy',label:'The Energy Crisis',caption:'Why do solar panels and batteries matter?',glyph:'⚡',effect:'Begin with low stored energy.'},
      {id:'air',label:'The Air Emergency',caption:'How does our habitat stay breathable?',glyph:'◉',effect:'Begin with an air-system problem.'},
      {id:'weather',label:'The Solar Alert',caption:'Why do astronauts need shelter?',glyph:'☀',effect:'Begin with low shelter readiness.'},
    ];
    case 1:return [{id:'gravity',label:'I tested both worlds!',caption:'I noticed that objects fall more slowly on the Moon.',glyph:'✓',effect:'Unlock the gravity discovery.'}];
    case 2:return [
      {id:'breathe',label:'Power the air machines',caption:'Keep the habitat air system working.',glyph:'◉',effect:'Uses 11 kWh of training-model energy and helps AIR.'},
      {id:'grow',label:'Help the greenhouse',caption:'Give the seedlings more grow light.',glyph:'✿',effect:'Uses 12 kWh and improves GARDEN support.'},
      {id:'store',label:'Save some battery',caption:'Keep backup electricity for later.',glyph:'▰',effect:'Uses only 3 kWh but delays other tasks.'}
    ];
    case 3:return [
      {id:'scrub',label:'Switch on the air filters',caption:'Use electricity to keep cabin air safer.',glyph:'◉',effect:'Costs 5 kWh; improves AIR.'},
      {id:'rest',label:'Save energy for now',caption:'Slow the equipment while we plan.',glyph:'▰',effect:'AIR readiness drops. Choose carefully.'}
    ];
    case 4:return [
      {id:'recycle',label:'Recover and reuse water',caption:'Let the recycling system help the plants.',glyph:'◉',effect:'Uses 3 kWh; protects WATER reserves.'},
      {id:'lights',label:'Turn on extra grow lights',caption:'Grow the seedlings faster in this model.',glyph:'☀',effect:'Costs 7 kWh; improves GARDEN but uses WATER.'}
    ];
    case 5:return [
      {id:'shelter',label:'Prepare the crew shelter',caption:'Secure the shielded area and move the crew.',glyph:'▣',effect:'Uses 4 kWh; much better SAFETY readiness.'},
      {id:'scan',label:'Keep monitoring first',caption:'Read more instruments before acting.',glyph:'⌁',effect:'Learn more, but shelter readiness is still limited.'}
    ];
    case 6:return [
      {id:'ask',label:'Ask Earth for advice',caption:'Send a message and wait for a response.',glyph:'◎',effect:'Uses 1 kWh; introduces real signal travel time.'},
      {id:'act',label:'Use what we already know',caption:'Make a careful decision with the crew.',glyph:'✦',effect:'Improves our training-model SAFETY score.'}
    ];
    default:return [];
  }
};
const miniCard:React.CSSProperties={border:'1px solid rgba(183,211,226,.17)',borderRadius:18,background:'rgba(23,43,58,.76)',padding:16};
const ProgressMeter=({label,value,color,unit='%'}:{label:string;value:number;color:string;unit?:string})=><div>
  <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold tracking-wide text-[#c0d5e2]"><span>{label}</span><span>{Math.round(value)}{unit}</span></div>
  <div className="h-2 overflow-hidden rounded-full bg-[#324556]"><div style={{width:`${Math.max(0,Math.min(value,100))}%`,background:color}} className="h-full rounded-full transition-all duration-500"/></div>
</div>;

export const AdventureAcademy:React.FC<Props>=({onClose,onDecision,onExplore})=>{
  const [state,setState]=useState<AdventureState>(readAdventure);
  const [observed,setObserved]=useState(false);
  const [signalSent,setSignalSent]=useState(false);
  const [sourceOpen,setSourceOpen]=useState(false);
  const [lastConsequence,setLastConsequence]=useState('');
  useEffect(()=>saveAdventure(state),[state]);
  const stage=state.stage,screen=STORY_STAGES[stage],completion=adventureEnding(state);
  const progress=stage/7*100;
  const sourceList=stage===1?[NASA_OBSERVATIONS.lunarGravityMs2,NASA_OBSERVATIONS.earthGravityMs2]:
    stage===2?[NASA_OBSERVATIONS.solarIrradianceWm2]:stage===5?[NASA_OBSERVATIONS.stormPeakKp]:
    stage===6?[NASA_OBSERVATIONS.earthMoonDistanceKm]:[];
  const choose=(opt:Option)=>{
    if(stage===1&&!observed)return;
    if(stage===6&&!signalSent)return;
    const next=trainWithDecision(state,opt.id,opt.label);
    if(next===state)return;
    const newChoice=next.choices[next.choices.length-1];
    setLastConsequence(newChoice.consequence);
    setState(next);
    setObserved(false);setSignalSent(false);setSourceOpen(false);
    onDecision(stage,opt.id,next);
  };
  const setExperimental=(key:'sunlightPct'|'dropTimeSeconds'|'experimentWorld',value:number|string)=>setState(s=>({...s,[key]:value}));
  return <div className="fixed inset-0 z-[75] overflow-y-auto bg-[#06101b]/95 text-[#e8f0f4] backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="academy-title">
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-20 -top-40 h-[550px] w-[550px] rounded-full opacity-25" style={{background:'radial-gradient(circle at 36% 40%,#80bbdc 0%,#154267 27%,#091b2e 56%,transparent 70%)'}}/>
      <div className="absolute -left-40 top-[45%] h-[470px] w-[470px] rounded-full opacity-20" style={{background:'radial-gradient(circle at center,#d9b78c 0%,transparent 66%)'}}/>
    </div>
    <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-4 sm:px-8 sm:py-7">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#92b5c9]">MOONSHIFT / INTERACTIVE FIELD ACADEMY</p><h1 id="academy-title" className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">The Lost Signal</h1></div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-[#b4c9d4]">Chapter {Math.min(stage+1,7)} / 7</span>
          <button type="button" onClick={onClose} className="rounded-xl border border-[#9fbdd1]/40 px-4 py-2 text-sm font-medium hover:bg-white/10">Explore station ✕</button>
        </div>
      </header>
      <div className="mb-6 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d7b48a] transition-all duration-500" style={{width:`${progress}%`}}/></div>
      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.48fr)_minmax(290px,.78fr)]">
        <main className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-[26px] border border-white/15 bg-[#132536]/80 shadow-2xl">
            <div className="relative flex min-h-[195px] flex-col justify-end overflow-hidden border-b border-white/10 p-5 sm:min-h-[235px] sm:p-7" style={{background:stage===4?'linear-gradient(125deg,#28463b,#122b37 52%,#0c1829)':stage===5?'linear-gradient(120deg,#633c45,#1b3243 60%,#0b1729)':'linear-gradient(115deg,#274258,#152d40 45%,#0b1725)'}}>
              <div className="absolute right-7 top-5 flex h-32 w-32 items-center justify-center rounded-full border border-white/15 bg-[#b8d2de]/10 text-7xl shadow-[0_0_70px_rgba(180,220,246,.12)] sm:right-12 sm:top-8 sm:h-40 sm:w-40">
                <span aria-hidden="true">{['☾','◌','☀','◉','✿','✦','◎','★'][stage]}</span>
              </div>
              <div className="relative z-10 max-w-[70%]">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[.2em] text-[#d5b68a]">{screen.chapter}</p>
                <h2 className="text-2xl font-semibold leading-tight sm:text-4xl">{screen.title}</h2>
              </div>
            </div>
            <div className="space-y-4 p-5 sm:p-7">
              <div className="flex items-start gap-3 rounded-2xl border border-[#80b7d8]/20 bg-[#183344] p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#31536a] text-xl">{screen.speaker==='PIX'?'◈':screen.speaker==='LEO'?'⚡':screen.speaker==='SPROUT'?'✿':screen.speaker==='MAYA'?'☾':'◎'}</div>
                <div><span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#91c7e2]">{screen.speaker}</span><p className="mt-1 text-sm leading-6 text-[#e7f1f5] sm:text-base">{stage===0?screen.intro:(stage===2?narration[state.branch]+' '+screen.intro:screen.intro)}</p></div>
              </div>
              {lastConsequence&&stage!==7&&<div className="rounded-xl border border-[#8ecaac]/25 bg-[#1a4239]/50 p-3 text-sm text-[#c5f1d8]" role="status">Last decision: {lastConsequence}</div>}
              <p className="text-sm leading-6 text-[#c4d6e0]">{screen.lesson}</p>
              {stage===1&&<section style={miniCard} aria-label="Gravity experiment" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-base">Drop lab · 1 real physics rule</strong><div className="flex gap-2">{(['earth','moon'] as const).map(world=><button type="button" onClick={()=>{setExperimental('experimentWorld',world);setObserved(true)}} key={world} className={'rounded-lg border px-4 py-2 text-sm font-medium '+(state.experimentWorld===world?'border-[#9bd8ec] bg-[#28536b]':'border-white/20 hover:bg-white/10')}>{world==='moon'?'Moon':'Earth'}</button>)}</div></div>
                <label className="block text-xs text-[#ccdfed]">Time falling: {state.dropTimeSeconds.toFixed(1)} seconds <input type="range" min=".5" max="1.5" step=".1" value={state.dropTimeSeconds} onChange={e=>{setExperimental('dropTimeSeconds',Number(e.target.value));setObserved(true)}} className="mt-2 w-full accent-[#89c6df]"/></label>
                <div className="flex h-24 items-center gap-4 overflow-hidden rounded-xl bg-[#0a1a27] p-4"><span aria-hidden="true" className="text-4xl">◯</span><div className="flex-1"><p className="text-xs text-[#aac4d2]">Estimated fall distance (from rest)</p><p className="text-3xl font-semibold">{freeFallMeters(state.dropTimeSeconds,state.experimentWorld==='moon').toFixed(2)} m</p><p className="text-xs text-[#9ec9e2]">NASA gravity: {state.experimentWorld==='moon'?1.62:9.80} m/s²</p></div></div>
                <p className="text-xs leading-5 text-[#aac1ce]">Simplification: a freely falling object in a vacuum, ignoring other forces. The experiment is not a real 3D physics measurement.</p>
              </section>}
              {stage===2&&<section style={miniCard} className="space-y-4">
                <h3 className="font-semibold">Experiment: move the Sunlight slider</h3>
                <label className="block text-sm text-[#c7dce8]">Sunlight reaching our example panels: <strong>{state.sunlightPct}%</strong><input type="range" min="0" max="100" step="5" value={state.sunlightPct} onChange={e=>setExperimental('sunlightPct',Number(e.target.value))} className="mt-3 w-full accent-[#e9b56d]"/></label>
                <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#0a1b27] p-4"><p className="text-[11px] text-[#adccdc]">Example solar generation</p><p className="mt-1 text-2xl font-semibold">{exampleSolarPowerKw(state.sunlightPct).toFixed(2)} kW</p></div><div className="rounded-xl bg-[#0a1b27] p-4"><p className="text-[11px] text-[#adccdc]">Energy in 4 simulated hours</p><p className="mt-1 text-2xl font-semibold">{(exampleSolarPowerKw(state.sunlightPct)*4).toFixed(1)} kWh</p></div></div>
                <p className="text-xs text-[#adc3d2]">NASA input: 1,361 W/m². Example assumptions: 8 m² panels, 20% efficiency, four hours. These are NOT actual LUNA-7 engineering specifications.</p>
              </section>}
              {stage===5&&<div className="rounded-2xl border border-[#e1b4ad]/30 bg-[#3b2936]/60 p-4">
                <p className="text-xs font-bold tracking-wider text-[#ffd0b4]">REAL NASA HISTORICAL RECORD · MAY 2024</p>
                <p className="mt-2 text-3xl font-semibold">Kp 9 <span className="text-sm font-normal text-[#e1b6b1]">Earth's measured geomagnetic activity</span></p>
                <p className="mt-2 text-xs leading-5 text-[#f0cfd1]">This number is an Earth geomagnetic index, not an astronaut radiation reading on the Moon. The LUNA-7 shelter incident is an imagined training scenario.</p>
              </div>}
              {stage===6&&<section className="space-y-3 rounded-2xl border border-[#9ac7e1]/30 bg-[#182d40] p-5">
                <p className="text-sm">NASA mean Earth–Moon distance: <strong>384,400 km</strong></p><p className="text-sm">Radio travel time (one way): <strong>{oneWayMoonSignalSeconds().toFixed(2)} seconds</strong></p>
                <button type="button" className="rounded-xl bg-[#9ad3e6] px-5 py-3 text-sm font-bold text-[#112633]" onClick={()=>setSignalSent(true)}>Send test signal to Earth →</button>
                {signalSent&&<div role="status" className="space-y-2"><div className="h-2 overflow-hidden rounded-full bg-[#28455d]"><div className="h-full w-full origin-left bg-[#a0dcf0]" style={{animation:'moonshift-signal 1.28s ease-out both'}}/></div><p className="text-xs text-[#cce6f1]">Transmission launched. Earth needs time to receive it, and a reply needs another trip back.</p></div>}
                <style>{'@keyframes moonshift-signal {from{transform:scaleX(0)}to{transform:scaleX(1)}}'}</style>
              </section>}
              {stage<7&&<section className="space-y-3" aria-label="Your next decision">
                <h3 className="text-xs font-bold uppercase tracking-[.18em] text-[#a9c1d0]">{stage===1?'After you try the experiment':'What should we do next?'}</h3>
                <div className="grid gap-3 sm:grid-cols-2">{optionsFor(stage).map(o=><button key={o.id} type="button" disabled={(stage===1&&!observed)||(stage===6&&!signalSent)} onClick={()=>choose(o)} className="group rounded-2xl border border-[#698da2]/35 bg-[#1a3446]/80 p-4 text-left transition duration-150 hover:-translate-y-0.5 hover:border-[#a6d7e5] hover:bg-[#274b60] disabled:cursor-not-allowed disabled:opacity-50">
                  <span className="mb-2 block text-2xl text-[#f1cea1]">{o.glyph}</span><strong className="block text-base">{o.label}</strong><span className="mt-1 block text-sm leading-5 text-[#c3d9e6]">{o.caption}</span><span className="mt-2 block text-xs leading-5 text-[#a3c3cd]">{o.effect}</span>
                </button>)}</div>
                {stage===1&&!observed&&<p className="text-xs text-[#f1d6a7]">Try switching Earth/Moon or moving the time slider before continuing.</p>}
                {stage===6&&!signalSent&&<p className="text-xs text-[#f1d6a7]">Send the test signal first!</p>}
              </section>}
              {stage===7&&<section className="space-y-4">
                <div className="rounded-2xl border border-[#a9d9bd]/30 bg-[#20423c]/65 p-5"><div className="mb-2 text-xs font-bold tracking-[.18em] text-[#b6ead0]">MISSION RESULT</div><h3 className="text-2xl font-semibold">{completion.title}</h3><p className="mt-2 text-sm leading-6 text-[#d8eee8]">{completion.summary}</p></div>
                <div className="grid gap-2">{state.choices.map((c,i)=><div className="rounded-xl border border-white/10 bg-[#152d3f] p-3" key={i}><span className="text-sm font-semibold text-[#f0d0a5]">{c.label}</span><p className="mt-1 text-xs leading-5 text-[#c6d8e1]">{c.consequence}</p></div>)}</div>
                <div className="flex flex-wrap gap-3"><button type="button" onClick={onExplore} className="rounded-xl bg-[#9fdbcc] px-5 py-3 font-semibold text-[#09272a]">Continue exploring LUNA-7</button><button type="button" onClick={()=>{setState(resetAdventure());setLastConsequence('')}} className="rounded-xl border border-white/25 px-5 py-3 font-semibold">Try a different mission ↻</button></div>
              </section>}
            </div>
          </div>
        </main>
        <aside className="space-y-4">
          <div style={miniCard} className="space-y-4">
            <div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[.17em] text-[#a1bece]">Living station simulation</p><span className="rounded-full bg-[#284556] px-2 py-1 text-[10px] text-[#d4e7ee]">TRAINING</span></div>
            <ProgressMeter label="BATTERY (sample kWh / 60)" value={state.batteryKwh/60*100} color="#e7b579" unit="%"/>
            <ProgressMeter label="AIR readiness" value={state.air} color="#83cce0"/>
            <ProgressMeter label="SHELTER readiness" value={state.safety} color="#b9a3e2"/>
            <ProgressMeter label="GARDEN support" value={state.garden} color="#8bd5ad"/>
            <ProgressMeter label="WATER readiness" value={state.water} color="#92bedb"/>
            <p className="text-[11px] leading-5 text-[#a6bfcc]">Only battery energy is modeled in kWh. Readiness scores are fictional 0–100 teaching indicators — not NASA spacecraft telemetry.</p>
          </div>
          <div style={miniCard}>
            <p className="text-xs font-bold tracking-wide text-[#f0d2aa]">Your story path</p><p className="mt-2 text-lg font-semibold">{branchNames[state.branch]}</p>
            <p className="mt-2 text-sm leading-6 text-[#c1d7e2]">Your choices stay saved on this device and change the mission result. You can explore the 3D station any time.</p>
            <p className="mt-3 text-xs text-[#adc6d2]">Discoveries: {state.learned.length} / 7</p>
          </div>
          {sourceList.length>0&&<div style={miniCard} className="space-y-2">
            <button type="button" onClick={()=>setSourceOpen(v=>!v)} className="w-full text-left text-sm font-semibold text-[#a4d4eb]">📚 NASA source & assumptions {sourceOpen?'−':'+'}</button>
            {sourceOpen&&sourceList.map(s=><a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/10 p-3 text-xs text-[#d4e7f0] hover:bg-white/10"><strong className="block">{s.label}</strong><span>{s.value.toLocaleString()} {s.unit} · Open official source ↗</span></a>)}
          </div>}
          <p className="px-1 text-xs leading-5 text-[#9cb8c9]">This is a child-friendly teaching simulation using documented NASA reference values and clearly labeled fictional colony assumptions.</p>
        </aside>
      </div>
    </div>
  </div>;
};
