import React, { useState } from 'react';
import { ChallengeId, MissionStateData } from '../game/MissionState';
import { NASA_SCIENTIFIC_SOURCES } from '../science/sources';
type Option={id:string;label:string;benefit:string;cost:string;apply:(d:MissionStateData)=>void};
export const KidFriendlyConsole:React.FC<{
  challengeId:ChallengeId;
  state:MissionStateData;
  onUpdateState:(updater:(draft:MissionStateData)=>void,log?:{system:string;action:string;impact:string})=>void;
  onClose:()=>void;
  onTriggerFinalStorm:()=>void;
  onOpenAdvanced:()=>void;
}>=({challengeId,state,onUpdateState,onClose,onTriggerFinalStorm,onOpenAdvanced})=>{
  const [lastChoice,setLastChoice]=useState('');
  const name:Record<ChallengeId,string>={power:'Share our Moon base electricity',lifesupport:'Keep our air safe',radiation:'Prepare for the space-weather drill',greenhouse:'Help our Moon garden',master_console:'The final mission check'};
  const intro:Record<ChallengeId,string>={
    power:'LEO: We fixed the energy path! Now we have to decide which machines get more electricity. Every choice uses some of our limited energy.',
    lifesupport:'MAYA: Our air machines are ready to repair. Let’s choose how to keep the air moving and clear extra carbon dioxide.',
    greenhouse:'SPROUT: My seedlings need light and water. But remember, lamps and pumps use electricity too!',
    radiation:'MAYA: Shelter is not just a lockable door. We must choose protective materials and prepare the crew.',
    master_console:'NOVA: Now we must test if all our systems can work together. Are we ready to continue?'
  };
  const options:Record<ChallengeId,Option[]>={
    power:[
      {id:'crew-first',label:'Keep our air safe first',benefit:'Strong air support and safe shelter reserves.',cost:'The greenhouse gets less electricity.',apply:d=>{Object.assign(d.power,{dustCleared:true,busbarBalanced:true,gimbalAngleDeg:88,eclssAllocationKw:6,radiationAllocationKw:2,greenhouseAllocationKw:3.5});}},
      {id:'balanced',label:'Share electricity fairly',benefit:'Each room receives a useful share of the power.',cost:'No system receives maximum power.',apply:d=>{Object.assign(d.power,{dustCleared:true,busbarBalanced:true,gimbalAngleDeg:88,eclssAllocationKw:5.8,radiationAllocationKw:1.9,greenhouseAllocationKw:4.0});}},
      {id:'garden-first',label:'Give more light to the plants',benefit:'More power supports the garden.',cost:'Less power remains for air and shelter.',apply:d=>{Object.assign(d.power,{dustCleared:true,busbarBalanced:true,gimbalAngleDeg:88,eclssAllocationKw:5.5,radiationAllocationKw:1.5,greenhouseAllocationKw:4.5});}}
    ],
    lifesupport:[
      {id:'scrub',label:'Run the air filter and fans',benefit:'Helps remove carbon dioxide and keep air moving.',cost:'Needs electricity from our power system.',apply:d=>{d.lifeSupport.zeoliteBedPurged=true;d.lifeSupport.airflowDamperOpen=true;d.lifeSupport.backupO2ValveCycled=true;d.lifeSupport.sabatierTempC=400;d.power.eclssAllocationKw=6;}},
      {id:'quiet',label:'Use the very low-power mode',benefit:'Saves a little electricity.',cost:'Air cleaning may be too weak to keep the crew safe.',apply:d=>{d.lifeSupport.airflowDamperOpen=true;d.lifeSupport.zeoliteBedPurged=true;d.lifeSupport.sabatierTempC=400;d.power.eclssAllocationKw=2.5;}},
    ],
    greenhouse:[
      {id:'recycle',label:'Recycle water and use efficient lights',benefit:'Helps plants while keeping water loss smaller.',cost:'Still requires electrical energy to run.',apply:d=>{d.greenhouse.condensateLoopClosed=true;d.greenhouse.dripIrrigationLitersHr=2;d.greenhouse.redSpectrumPct=75;d.greenhouse.blueSpectrumPct=20;d.power.greenhouseAllocationKw=3.5;}},
      {id:'bright',label:'Turn all the lamps up high',benefit:'A brighter-looking greenhouse.',cost:'Uses too much power without necessarily helping crops more.',apply:d=>{d.greenhouse.condensateLoopClosed=true;d.greenhouse.dripIrrigationLitersHr=2;d.greenhouse.redSpectrumPct=75;d.greenhouse.blueSpectrumPct=20;d.power.greenhouseAllocationKw=6.5;}},
      {id:'low-water',label:'Give the plants almost no water',benefit:'Uses less water immediately.',cost:'Plant growth suffers.',apply:d=>{d.greenhouse.condensateLoopClosed=true;d.greenhouse.dripIrrigationLitersHr=0.4;d.greenhouse.redSpectrumPct=75;d.greenhouse.blueSpectrumPct=20;d.power.greenhouseAllocationKw=3.5;}}
    ],
    radiation:[
      {id:'safe-shelter',label:'Prepare water and regolith shielding',benefit:'Makes the training shelter more protective.',cost:'Uses space, material mass, and support energy.',apply:d=>{d.radiation.layers=['regolith','water_bladder','hdpe_boron'];d.radiation.stormShutterClosed=true;d.radiation.bulkheadLatched=true;d.power.radiationAllocationKw=2;}},
      {id:'metal-only',label:'Use one heavy metal plate',benefit:'Adds some protective material.',cost:'Does not prepare a sufficiently protective shelter in this lesson.',apply:d=>{d.radiation.layers=['aluminum','empty','empty'];d.radiation.stormShutterClosed=true;d.radiation.bulkheadLatched=true;d.power.radiationAllocationKw=1.1;}},
      {id:'monitor',label:'Leave shelter open and keep watching',benefit:'Lets us keep checking the displays.',cost:'Crew shelter readiness remains poor.',apply:d=>{d.radiation.stormShutterClosed=false;d.radiation.bulkheadLatched=false;}}
    ],
    master_console:[]
  };
  const completed:Record<ChallengeId,boolean>={power:state.power.completed,lifesupport:state.lifeSupport.completed,greenhouse:state.greenhouse.completed,radiation:state.radiation.completed,master_console:state.power.completed&&state.lifeSupport.completed&&state.greenhouse.completed&&state.radiation.completed};
  const realSource:Record<ChallengeId,string>={power:'lunar-solar-power',lifesupport:'eclss-air-water',greenhouse:'space-agriculture',radiation:'lunar-radiation',master_console:'lunar-solar-power'};
  const nasa=NASA_SCIENTIFIC_SOURCES.find(x=>x.id===realSource[challengeId]);
  const color:Record<ChallengeId,string>={power:'#e9b46b',lifesupport:'#87d2df',greenhouse:'#97d8a5',radiation:'#c9b5e9',master_console:'#96c9df'};
  const status=[{label:'POWER',value:state.telemetry.batteryPct,icon:'▰'},{label:'AIR',value:Math.max(0,Math.min(100,Math.round((4500-state.telemetry.co2Ppm)/35))),icon:'◉'},{label:'SHELTER',value:state.telemetry.shieldingIntegrityPct,icon:'▣'}];
  const apply=(o:Option)=>{
    onUpdateState(d=>o.apply(d),{system:'Junior Astronaut Control',action:o.label,impact:o.benefit+' Trade-off: '+o.cost+' All numerical output is from the fictional teaching simulation.'});
    setLastChoice(o.label);
  };
  return <div role="dialog" aria-modal="true" aria-labelledby="junior-console-title" className="fixed inset-0 z-[65] grid place-items-center overflow-y-auto bg-[#07101c]/95 p-3 text-[#e8f3f8] backdrop-blur-xl sm:p-6">
    <div className="w-full max-w-4xl overflow-hidden rounded-[26px] border border-white/15 bg-[#122434] shadow-[0_35px_110px_rgba(0,0,0,.65)]">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-[#1c3447] px-5 py-5 sm:px-7">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em]" style={{color:color[challengeId]}}>LUNA-7 / JUNIOR ASTRONAUT CONTROL</p><h2 id="junior-console-title" className="mt-1 text-2xl font-semibold sm:text-3xl">{name[challengeId]}</h2></div>
        <button type="button" onClick={onClose} className="rounded-xl border border-white/20 p-3 text-sm hover:bg-white/10" aria-label="Close controls">✕</button>
      </header>
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_210px] sm:p-7">
        <main className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-[#1c3848] p-4 text-sm leading-7">{intro[challengeId]}</div>
          {challengeId==='master_console'?<div className="space-y-4 rounded-2xl border border-white/15 bg-[#172c3b] p-5">
            <h3 className="text-lg font-semibold">Is the whole station ready?</h3>
            {([{ok:state.power.completed,label:'Electricity'}, {ok:state.lifeSupport.completed,label:'Safe air'}, {ok:state.greenhouse.completed,label:'Garden and water'},{ok:state.radiation.completed,label:'Shelter protection'}]).map(x=><div key={x.label} className="flex items-center justify-between rounded-xl bg-[#223a4c] p-3 text-sm"><span>{x.label}</span><span className={x.ok?'text-[#a4e5c4]':'text-[#f0ba8a]'}>{x.ok?'Ready ✓':'Needs help'}</span></div>)}
            <p className="text-xs leading-5 text-[#a8c0cc]">The final evaluation uses the existing deterministic station simulation. All emergency numbers are fictional teaching assumptions.</p>
            <button type="button" disabled={!completed.master_console} onClick={onTriggerFinalStorm} className="w-full rounded-xl bg-[#a0daca] p-4 font-semibold text-[#102c2d] disabled:cursor-not-allowed disabled:opacity-40">Run the final mission simulation →</button>
          </div>:
          <section className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a8c4d2]">Choose a plan and see what changes</p>
            {options[challengeId].map(o=><button type="button" onClick={()=>apply(o)} key={o.id} className={'w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-[#a7d1db] hover:bg-[#23485b] '+(lastChoice===o.label?'border-[#b6e7d8] bg-[#285249]':'border-[#6b91a8]/30 bg-[#1a3547]')}>
              <strong className="block text-base">{o.label}</strong><div className="mt-2 grid gap-1.5 text-xs leading-5"><p className="text-[#a9e6c9]">+ {o.benefit}</p><p className="text-[#f0c399]">− {o.cost}</p></div>
            </button>)}
            {lastChoice&&<div role="status" className="rounded-xl border border-[#8dd5ba]/30 bg-[#193a39] p-4 text-sm leading-6">
              {completed[challengeId]?'Great! The system meets our training check. You can keep exploring or try another strategy.':'We changed the plan, but this system still needs improvement. Read the feedback and try another option.'}
            </div>}
          </section>}
        </main>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#1a3447] p-4">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[.15em] text-[#a6c8d8]">LIVING HABITAT</p>
            {status.map(x=><div key={x.label} className="mb-4"><div className="mb-1 flex justify-between text-xs"><span>{x.icon} {x.label}</span><span>{x.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#304758]"><div className="h-full rounded-full bg-[#9acbd9] transition-all duration-500" style={{width:`${Math.max(0,Math.min(100,x.value))}%`}}/></div></div>)}
            <p className="text-[11px] leading-5 text-[#a9c0cd]">Power, air and shelter numbers come from the game's fictional training model, not live NASA spacecraft telemetry.</p>
          </div>
          {nasa&&<a href={nasa.citationUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-[#8abacf]/35 p-3 text-sm text-[#a9d6eb] hover:bg-white/10">📚 Learn the NASA science ↗</a>}
          <button type="button" onClick={onOpenAdvanced} className="w-full rounded-xl border border-white/20 p-3 text-sm text-[#c5d8e4] hover:bg-white/10">Advanced engineering settings</button>
          <button type="button" onClick={onClose} className="w-full rounded-xl bg-[#a5dcd3] p-3 font-semibold text-[#11333a] hover:bg-[#c9f5ec]">Return to station →</button>
        </aside>
      </div>
    </div>
  </div>;
};
