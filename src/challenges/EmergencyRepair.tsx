import React, { useMemo, useState } from 'react';
import { ChallengeId } from '../game/MissionState';
import { NASA_SCIENTIFIC_SOURCES } from '../science/sources';

type Direction = 0 | 1 | 2 | 3;
type Cell = { ports: [Direction, Direction]; rotation: number; label: string; path: boolean };
const directions = [[-1,0],[0,1],[1,0],[0,-1]];
const actualPorts: Record<number, [Direction,Direction]> = {
  3:[3,0], 0:[2,1], 1:[3,2], 4:[0,2], 7:[0,1], 8:[3,0], 5:[2,1]
};
const initialTurns: Record<number,number> = {3:2,0:1,1:3,4:1,7:2,8:3,5:1};
const scenarios: Record<ChallengeId,{title:string; line:string; story:string; item:string; source:string; destination:string; note:string; color:string}> = {
  power: {title:'Get the lights back!', line:'Turn the connectors to send energy through the circuit.', story:'LEO: The solar power is here, but the broken path is keeping it from reaching our batteries. Can you join the pieces?',item:'ENERGY',source:'SOLAR',destination:'BATTERY',note:'Solar panels convert sunlight into electricity. Batteries save some energy for later.',color:'#ffc56d'},
  lifesupport: {title:'Help our air machines!',line:'Turn each duct to make a continuous path for moving air.',story:'PIX: Our air system needs a clear route. I will keep an eye on the fans while you repair it!',item:'AIR',source:'FAN',destination:'FILTER',note:'Astronauts need equipment that moves cabin air and removes extra carbon dioxide.',color:'#84dbeb'},
  greenhouse:{title:'Water the Moon garden!',line:'Turn the pipes so water can reach the plant roots.',story:'SPROUT: Oh, my little plants are thirsty! Connect the water pipes and we can get growing.',item:'WATER',source:'TANK',destination:'PLANTS',note:'Growing plants requires water, light, and nutrients. Recycling water matters in space.',color:'#91db9b'},
  radiation:{title:'Protect our shelter!',line:'Connect the control circuits to secure the storm shutters.',story:'MAYA: Our shelter protects us better when its protective systems are ready. Let us check every link.',item:'SIGNAL',source:'CONTROL',destination:'SHIELD',note:'Shelter design and suitable shielding help reduce exposure during hazardous solar particle events.',color:'#d8a5f5'},
  master_console:{title:'Reconnect with Maya!',line:'Turn the communication links until the signal is connected.',story:'NOVA: This is our final connection. Make a clear signal route, then let us check the whole station.',item:'SIGNAL',source:'STATION',destination:'MAYA',note:'Earth–Moon radio signals travel at light speed, so they still take around 1.3 seconds one way.',color:'#9bbfff'}
};
const turn = (d:Direction,n:number):Direction => ((d+n)%4) as Direction;
const initial = ():Cell[] => Array.from({length:9},(_,i)=>({ports:actualPorts[i] || [0,2],rotation:initialTurns[i] || 0,label:String(i+1),path:!!actualPorts[i]}));
const ports = (cell:Cell) => cell.ports.map(p=>turn(p,cell.rotation)) as [Direction,Direction];
const connected = (cells:Cell[]) => {
  const result=new Set<number>();
  const stack=[3];
  const startPorts=ports(cells[3]);
  if(!startPorts.includes(3)) return {visited:result,won:false};
  while(stack.length){
    const index=stack.pop()!;
    if(result.has(index))continue;
    result.add(index);
    const y=Math.floor(index/3),x=index%3;
    for(const dir of ports(cells[index])){
      const nextY=y+directions[dir][0], nextX=x+directions[dir][1];
      if(nextX<0||nextX>=3||nextY<0||nextY>=3)continue;
      const next=nextY*3+nextX;
      if(!cells[next].path)continue;
      if(ports(cells[next]).includes(turn(dir,2)))stack.push(next);
    }
  }
  return {visited:result,won:result.has(5)&&ports(cells[5]).includes(1)};
};
export const EmergencyRepair:React.FC<{challengeId:ChallengeId;onComplete:()=>void;onClose:()=>void}> = ({challengeId,onComplete,onClose})=>{
  const config=scenarios[challengeId];
  const scienceSource = NASA_SCIENTIFIC_SOURCES.find(s => s.id === ({power:'lunar-solar-power',lifesupport:'eclss-air-water',greenhouse:'space-agriculture',radiation:'lunar-radiation',master_console:'lunar-solar-power'} as Record<ChallengeId,string>)[challengeId]);
  const [cells,setCells]=useState<Cell[]>(initial);
  const [hint,setHint]=useState(false);
  const [showScience,setShowScience]=useState(false);
  const [turns,setTurns]=useState(0);
  const status=useMemo(()=>connected(cells),[cells]);
  const rotateCell=(i:number)=>{
    if(!cells[i].path||status.won)return;
    setCells(previous=>previous.map((cell,j)=>i===j?{...cell,rotation:(cell.rotation+1)%4}:cell));
    setTurns(v=>v+1);
  };
  const revealed = status.won? 'Connected! You brought the system back online.' : 'Tap the curved and straight pipes to rotate them. Follow the glowing flow from left to right.';
  return <div role="dialog" aria-modal="true" aria-labelledby="repair-title" className="fixed inset-0 z-[65] grid place-items-center overflow-y-auto bg-[#070d18]/95 p-3 sm:p-6 backdrop-blur-xl">
    <div className="w-full max-w-3xl overflow-hidden rounded-[26px] border border-white/15 bg-[#111e2c] text-white shadow-[0_30px_120px_rgba(0,0,0,.65)]">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-[#192f42] to-[#101b29] p-5 sm:p-7">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-[.24em] text-[#94bbce]">LUNA-7 / EMERGENCY REPAIR</div>
          <h2 id="repair-title" className="text-2xl font-bold sm:text-3xl">{config.title}</h2>
          <p className="max-w-xl text-sm leading-6 text-[#d1dfeb]">{config.line}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-xl border border-white/15 p-2 text-sm text-white hover:bg-white/10" aria-label="Close repair">✕</button>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_230px] sm:gap-6 sm:p-7">
        <div>
          <div className="mb-4 rounded-xl bg-[#1e3444] p-3 text-sm leading-6 text-[#e1edf4]">{config.story}</div>
          <div className="relative mx-auto max-w-[405px] rounded-2xl border border-[#64859a]/35 bg-[#09131e] p-3 sm:p-5" style={{['--flow' as string]:config.color} as React.CSSProperties}>
            <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#c6d8e4]"><span>◉ {config.source}</span><span>{config.destination} ◉</span></div>
            <div className="grid grid-cols-3 gap-2">
              {cells.map((cell,i)=>{
                const connectedTile=status.visited.has(i);
                const p=ports(cell);
                const shape=(d:Direction)=>{const rot=[0,90,180,270][d];return <path key={d} d="M50 50 L50 2" transform={'rotate('+rot+' 50 50)'} />};
                return <button key={i} type="button" disabled={!cell.path||status.won} aria-label={cell.path?'Rotate connection '+(i+1):'Empty slot'} onClick={()=>rotateCell(i)}
                className={'relative aspect-square rounded-xl border transition-all duration-200 '+(cell.path?'cursor-pointer active:scale-[.96] ':'cursor-default ')+(connectedTile?'border-[#9ae8cf] bg-[#153b3a] shadow-[inset_0_0_24px_rgba(81,205,169,.12)]':'border-[#3d5264] bg-[#1a2a3a] hover:border-white/35')}>
                  {cell.path&&<svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
                    <circle cx="50" cy="50" r="8" fill={connectedTile?config.color:'#b2c4d1'} />
                    <g fill="none" stroke={connectedTile?config.color:'#8da8be'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="19">{p.map(shape)}</g>
                    <g fill="none" stroke={connectedTile?'#f4fffa':'#d1deeb'} strokeWidth="2" opacity=".65">{p.map(shape)}</g>
                  </svg>}
                  {hint&&!status.won&&cell.path&&<span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 text-[10px] text-white">↻</span>}
                </button>
              })}
            </div>
            <div aria-live="polite" className={'mt-4 rounded-xl px-3 py-2 text-center text-xs font-semibold leading-5 '+(status.won?'bg-[#235b4e] text-[#c3ffe7]':'bg-[#142333] text-[#cbdae5]')}>{revealed}</div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-white/10 bg-[#192a39] p-4">
            <div className="mb-2 text-[11px] font-bold tracking-[.18em] text-[#8bb5cf]">MISSION GUIDE</div>
            <div className="text-lg font-semibold">{status.won?'Fantastic work!':'Connect the route'}</div>
            <p className="mt-2 text-sm leading-6 text-[#d1dfeb]">{status.won?'Now we can inspect the main control panel and decide how much of this resource we can safely use.':'Start at the left-side connector and finish at the right. Rotate pieces until every join fits.'}</p>
            <div className="mt-3 text-xs text-[#a3b8c8]">Turns: {turns} · No time limit</div>
          </div>
          <button type="button" onClick={()=>setShowScience(v=>!v)} className="rounded-xl border border-white/20 bg-[#1b303d] px-4 py-3 text-left text-sm font-semibold hover:bg-[#284152]">📖 {showScience?'Hide':'Learn'} the science</button>
          {showScience&&<div className="rounded-xl bg-[#1c3041] p-3 text-sm leading-6 text-[#daebf2]"><p>{config.note}</p><p className="mt-2 text-xs text-[#89aec8]">Educational model — not a real wiring diagram or a live NASA measurement.</p>{scienceSource&&<a href={scienceSource.citationUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-[#a5dbff] underline underline-offset-4">Explore the NASA science source ↗</a>}</div>}
          <button type="button" onClick={()=>setHint(v=>!v)} className="rounded-xl border border-white/20 px-4 py-3 text-left text-sm font-semibold hover:bg-white/10">{hint?'Hide help':'💡 Need a hint?'}</button>
          {hint&&!status.won&&<p className="text-xs leading-5 text-[#c7d7e3]">Follow the route: left-middle → top-left → top-middle → center → bottom-middle → bottom-right → right-middle. Tap each tile to rotate.</p>}
          {status.won&&<button type="button" onClick={onComplete} className="mt-auto rounded-xl bg-[#a8e7d5] px-4 py-4 text-base font-bold text-[#092923] hover:bg-[#d1fff1]">Continue mission →</button>}
        </div>
      </div>
    </div>
  </div>;
};
