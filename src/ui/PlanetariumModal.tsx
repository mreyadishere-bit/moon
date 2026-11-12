import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {PLANETS,PlanetId,PlanetFact,getPlanet,idealDropDistance,solarLightMinutes,planetDiameterInEarths} from '../science/planets';

const colorCss=(n:number)=>'#'+n.toString(16).padStart(6,'0');
function paintedPlanetTexture(planet:PlanetFact):THREE.CanvasTexture{
 const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d')!;
 const base=new THREE.Color(planet.color);
 let seed=planet.name.length*41231;
 const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const bands=['jupiter','saturn','uranus','neptune','venus'].includes(planet.id);
 g.fillStyle=colorCss(planet.color);g.fillRect(0,0,1024,512);
 if(bands){
  for(let y=0;y<512;y+=5){
   const v=Math.sin(y*(planet.id==='jupiter'?.046:.022))+Math.cos(y*.11)*.24+Math.sin(y*.004)*.25;
   const factor=1+v*(planet.id==='venus'?.1:.22)+rand()*.065;
   const col=base.clone().multiplyScalar(factor);
   g.fillStyle=colorCss(col.getHex());g.fillRect(0,y,1024,5);
  }
  for(let i=0;i<65;i++){
   const x=rand()*1024,y=rand()*512;
   g.fillStyle='rgba(232,223,195,.13)';g.beginPath();g.ellipse(x,y,20+rand()*90,2+rand()*9,0,0,Math.PI*2);g.fill();
  }
 }else if(planet.id==='earth'){
  // Physical 3D viewer loads NASA Blue Marble separately.
 }else{
  for(let i=0;i<470;i++){
   const x=rand()*1024,y=rand()*512,r=2+rand()*18;
   g.fillStyle=rand()>.5?'rgba(12,25,32,.09)':'rgba(255,241,204,.07)';
   g.beginPath();g.ellipse(x,y,r,r*(.3+rand()*.5),0,0,Math.PI*2);g.fill();
  }
 }
 const texture=new THREE.CanvasTexture(c);
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;
 texture.anisotropy=4;
 return texture;
}

function PlanetViewer({planet}:{planet:PlanetFact}){
 const mount=useRef<HTMLDivElement|null>(null);
 const [fallback,setFallback]=useState(false);
 useEffect(()=>{
  const el=mount.current;if(!el)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}
  catch{setFallback(true);return;}
  setFallback(false);
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(40,1,.1,40);
  camera.position.set(0,0,5.7);
  const texture=paintedPlanetTexture(planet);
  const material=new THREE.MeshStandardMaterial({map:texture,roughness:planet.id==='earth'?.91:.86,metalness:0});
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(1.72,64,48),material);
  scene.add(sphere);
  let earthTexture:THREE.Texture|null=null;
  if(planet.id==='earth'){
   new THREE.TextureLoader().load('/assets/earth-blue-marble.jpg',tex=>{
    if(!el.isConnected){tex.dispose();return;}
    tex.colorSpace=THREE.SRGBColorSpace;material.map=tex;material.needsUpdate=true;earthTexture=tex;
   },undefined,()=>{});
  }
  if(planet.id==='saturn'){
   const ring=new THREE.Mesh(new THREE.RingGeometry(2.12,2.95,90,1),new THREE.MeshStandardMaterial({
    color:0xc8b694,side:THREE.DoubleSide,transparent:true,opacity:.81,roughness:.8
   }));
   ring.rotation.x=Math.PI*.36;ring.rotation.y=.18;
   scene.add(ring);
  }
  scene.add(new THREE.AmbientLight(0x819aae,.33));
  const sunlight=new THREE.DirectionalLight(0xffeed6,3.1);sunlight.position.set(-3,2.4,5);scene.add(sunlight);
  const cool=new THREE.DirectionalLight(0x6ca9d4,.7);cool.position.set(2,-1,-5);scene.add(cool);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
  const canvas=renderer.domElement;el.appendChild(canvas);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.4));camera.aspect=w/h;camera.updateProjectionMatrix()};
  resize();const observer=new ResizeObserver(resize);observer.observe(el);
  let dragging=false,prev=0,frame=0,last=performance.now();
  const down=(e:PointerEvent)=>{dragging=true;prev=e.clientX;canvas.setPointerCapture(e.pointerId)};
  const move=(e:PointerEvent)=>{if(dragging){sphere.rotation.y+=(e.clientX-prev)*.007;prev=e.clientX;}};
  const up=()=>{dragging=false};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  const render=(now:number)=>{const dt=Math.min((now-last)/1000,.05);last=now;if(!dragging)sphere.rotation.y+=dt*.09;renderer.render(scene,camera);frame=requestAnimationFrame(render)};
  frame=requestAnimationFrame(render);
  return ()=>{observer.disconnect();cancelAnimationFrame(frame);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);renderer.dispose();sphere.geometry.dispose();material.dispose();texture.dispose();earthTexture?.dispose();scene.traverse(obj=>{if(obj instanceof THREE.Mesh&&obj!==sphere){obj.geometry.dispose();(obj.material as THREE.Material).dispose();}});canvas.remove()};
 },[planet.id]);
 return <div ref={mount} className="relative h-full min-h-[270px] w-full cursor-grab touch-none active:cursor-grabbing" aria-label={'Interactive 3D illustration of '+planet.name}>
  {fallback&&<div className="grid h-full place-items-center"><div className="h-48 w-48 rounded-full shadow-[inset_-35px_-20px_45px_#07111b,0_0_85px_#294b60]" style={{background:'radial-gradient(circle at 32% 30%,#d1dfe4,'+colorCss(planet.color)+' 50%,#07111d 100%)'}}/></div>}
 </div>;
}
export const PlanetariumModal:React.FC<{onClose:()=>void;onAskScientist:()=>void}>=({onClose,onAskScientist})=>{
 const [selection,setSelection]=useState<PlanetId>('earth');
 const [mode,setMode]=useState<'explore'|'gravity'|'distance'>('explore');
 const [seconds,setSeconds]=useState(1);
 const [compare,setCompare]=useState<PlanetId>('mars');
 const selected=getPlanet(selection),other=getPlanet(compare);
 return <div className="fixed inset-0 z-[66] overflow-y-auto bg-[#060e18]/97 text-[#e4eef4] backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Interactive solar-system planetarium">
  <div className="mx-auto flex min-h-screen max-w-[1450px] flex-col px-3 py-3 sm:px-7 sm:py-5">
   <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
    <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#9acbe0]">LUNA-7 / PLANETARY SCIENCE OBSERVATORY</p><h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">The Solar System Explorer</h2></div>
    <button type="button" onClick={onClose} className="rounded-xl border border-[#789cb0]/40 px-4 py-2 text-sm font-semibold hover:bg-white/10">Return to station ✕</button>
   </header>
   <div className="mt-4 grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(290px,.85fr)]">
    <main className="min-w-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#101f2e]">
     <div className="relative h-[360px] overflow-hidden bg-[radial-gradient(ellipse_at_60%_37%,#213c51_0%,#0b1b2b_45%,#060e19_78%)] sm:h-[480px]">
      <div className="absolute left-4 top-4 z-10 rounded-full border border-[#85a9bd]/25 bg-[#102231]/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#aecedf]">Illustrated planet · drag to rotate</div>
      <PlanetViewer key={selection} planet={selected}/>
      <div className="pointer-events-none absolute bottom-5 left-5"><p className="text-xs uppercase tracking-[.18em] text-[#95b5c8]">{selected.highlight}</p><h3 className="mt-1 text-4xl font-semibold sm:text-5xl">{selected.name}</h3></div>
     </div>
     <div className="border-t border-white/10 p-3 sm:p-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#a9c5d5]">Choose a world</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
       {PLANETS.map(p=><button type="button" key={p.id} aria-pressed={selection===p.id} onClick={()=>setSelection(p.id)}
         className={'flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-xl border p-2 text-xs transition '+(selection===p.id?'border-[#b1d7e6] bg-[#2a455a]':'border-white/10 bg-[#172a3b] hover:border-[#648fa5] hover:bg-[#1d374a]')}>
          <span className="h-7 w-7 rounded-full border border-white/25 shadow-[inset_-6px_-4px_8px_#1b2a39]" style={{background:colorCss(p.color)}}/>
          <span>{p.name}</span>
         </button>)}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#9cafbf]">Planet models and selector icons are illustrative and not drawn to scale. The facts and comparisons use rounded NASA reference values. Planetarium is not a live telescope feed.</p>
     </div>
    </main>
    <aside className="space-y-4">
     <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#182d3d] p-1.5">{(['explore','gravity','distance'] as const).map(m=><button type="button" key={m} onClick={()=>setMode(m)} className={'rounded-lg px-2 py-2.5 text-xs font-semibold capitalize '+(mode===m?'bg-[#86bed3] text-[#102b3a]':'text-[#bed0dd] hover:bg-white/10')}>{m==='distance'?'Signals':m}</button>)}</div>
     {mode==='explore'&&<section className="rounded-2xl border border-white/10 bg-[#162b3b] p-5">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.19em] text-[#e2c297]">Discover the planet</p>
      <p className="text-lg font-semibold">{selected.look}</p>
      <p className="mt-3 text-sm leading-6 text-[#b7cedd]">{selected.atmosphere}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
       <div className="rounded-xl bg-[#0f2231] p-3"><div className="text-xl font-semibold">{selected.diameterKm.toLocaleString()} km</div><div className="text-[11px] text-[#a3bccb]">Approx. diameter</div></div>
       <div className="rounded-xl bg-[#0f2231] p-3"><div className="text-xl font-semibold">{(selected.yearEarthDays/365.25).toFixed(2)}</div><div className="text-[11px] text-[#a3bccb]">Earth years per orbit</div></div>
       <div className="rounded-xl bg-[#0f2231] p-3"><div className="text-xl font-semibold">{planetDiameterInEarths(selected.diameterKm).toFixed(2)}×</div><div className="text-[11px] text-[#a3bccb]">Earth's diameter</div></div>
       <div className="rounded-xl bg-[#0f2231] p-3"><div className="text-xl font-semibold">{selected.sunDistanceAU.toFixed(2)} AU</div><div className="text-[11px] text-[#a3bccb]">Average Sun distance</div></div>
      </div>
     </section>}
     {mode==='gravity'&&<section className="rounded-2xl border border-white/10 bg-[#162b3b] p-5">
      <h3 className="text-lg font-semibold">Gravity drop lab</h3>
      <p className="mt-2 text-sm leading-6 text-[#c6d9e3]">Imagine releasing a ball from rest for the same amount of time in two different places. Which one falls farther?</p>
      <label className="mt-4 block text-xs text-[#a8cbdb]">Compare with
       <select value={compare} onChange={e=>setCompare(e.target.value as PlanetId)} className="mt-1 w-full rounded-lg border border-[#57798e] bg-[#0e2131] p-2.5 text-sm text-white">
        {PLANETS.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}
       </select>
      </label>
      <label className="mt-4 block text-xs text-[#c0d2df]">Time: {seconds.toFixed(1)} seconds
       <input type="range" min=".5" max="2" step=".1" value={seconds} onChange={e=>setSeconds(Number(e.target.value))} className="mt-2 w-full accent-[#91cddd]"/>
      </label>
      {[selected,other].map((p,i)=><div key={i} className="mt-3 rounded-xl bg-[#0e2231] p-3">
       <div className="flex justify-between text-xs text-[#b6d0da]"><span>{p.name}</span><span>{p.gravityMs2.toFixed(2)} m/s²</span></div>
       <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#304655]"><div className="h-full rounded-full bg-[#caa87e]" style={{width:Math.min(100,p.gravityMs2/25*100)+'%'}}/></div>
       <div className="mt-2 text-lg font-semibold">{idealDropDistance(p.gravityMs2,seconds).toFixed(2)} m <span className="text-xs font-normal text-[#a7bbc6]">ideal fall</span></div>
      </div>)}
      <p className="mt-3 text-[11px] leading-5 text-[#9db5c2]">Simplified free-fall model. Gas and ice giants lack a solid surface; their reference gravity is defined at an atmospheric level. Real atmospheric drag is not included.</p>
     </section>}
     {mode==='distance'&&<section className="rounded-2xl border border-white/10 bg-[#162b3b] p-5">
      <h3 className="text-lg font-semibold">Race a beam of light</h3>
      <p className="mt-2 text-sm leading-6 text-[#c6d9e3]">Even light takes time to travel. Move to a planet to see how long sunlight travels from the Sun.</p>
      <div className="mt-5 rounded-xl bg-[#0e2231] p-5 text-center">
       <div className="text-4xl font-semibold text-[#dfc599]">{solarLightMinutes(selected.sunDistanceAU).toFixed(1)}</div>
       <div className="mt-1 text-xs text-[#b2cedc]">minutes of light travel: Sun → {selected.name}</div>
      </div>
      <div className="mt-4 space-y-1.5">{PLANETS.map(p=><div key={p.id} className="flex items-center gap-2 text-[10px]"><span className="w-14 text-[#a8c4d5]">{p.name}</span><div className="h-2 flex-1 rounded-full bg-[#293d4d]"><div className="h-2 rounded-full bg-[#8bbfce]" style={{width:(p.sunDistanceAU/30.1*100)+'%'}}/></div><span className="w-12 text-right text-[#d1dfe4]">{solarLightMinutes(p.sunDistanceAU).toFixed(0)}m</span></div>)}</div>
      <p className="mt-4 text-xs text-[#a5c1d0]">AU means astronomical unit, the average Earth–Sun distance. These numbers are approximate Sun-to-planet travel times, not Earth-to-planet communications delays.</p>
     </section>}
     <div className="rounded-xl border border-[#668ca1]/30 bg-[#193243] p-4">
      <p className="text-xs font-bold tracking-widest text-[#9fcbd8]">CURIOUS?</p>
      <p className="mt-2 text-sm leading-6">Ask Maya why planets are so different, or choose another world to compare.</p>
      <div className="mt-3 flex flex-wrap gap-3">
       <button type="button" onClick={onAskScientist} className="rounded-lg bg-[#a3d2df] px-3 py-2 text-xs font-bold text-[#112a37]">Talk to Maya 🎙</button>
       <a href={selected.source} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#7598ad]/40 px-3 py-2 text-xs text-[#c2deea] hover:bg-white/10">NASA: {selected.name} ↗</a>
      </div>
     </div>
    </aside>
   </div>
  </div>
 </div>;
};
