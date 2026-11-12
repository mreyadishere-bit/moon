import React, {useEffect,useRef,useState} from 'react';
import { CrewId, CrewContext, CREW, localCrewAnswer } from '../ai/crewKnowledge';

type Line={role:'assistant'|'user';text:string;source?:string;mode?:'online-ai'|'offline'};
type SpeechResult={results:{[key:number]:{[key:number]:{transcript:string}}}};
type SpeechListener={start:()=>void;stop:()=>void;lang:string;interimResults:boolean;maxAlternatives:number;onresult:((e:SpeechResult)=>void)|null;onend:(()=>void)|null;onerror:((e:{error:string})=>void)|null};
const sessionHistory:Partial<Record<CrewId,Line[]>>={};
const SUGGESTIONS:Record<CrewId,string[]>={
 pix:['What is this machine?','Tell me a space joke','Where do we go next?'],
 maya:['Why is Moon gravity weaker?','How can we breathe here?','Show me an experiment'],
 leo:['What do solar panels do?','What if the battery runs out?','Tell me a joke'],
 sprout:['Can we grow food on the Moon?','How do plants get water?','What uses the most energy?'],
 nova:['What is our mission?','How far away is Earth?','What is solar radiation?']
};
export const CrewConversation:React.FC<{
 character:CrewId;
 context:CrewContext;
 greeting?:string;
 onClose:()=>void;
 onOpenAcademy:()=>void;
 muted:boolean;
}>=({character,context,greeting,onClose,onOpenAcademy,muted})=>{
 const persona=CREW[character];
 const [lines,setLines]=useState<Line[]>(()=>sessionHistory[character]?.slice()||[{role:'assistant',text:greeting||persona.intro}]);
 const [draft,setDraft]=useState('');
 const [busy,setBusy]=useState(false);
 const [mode,setMode]=useState<'checking'|'online-ai'|'offline'>('checking');
 const [voice,setVoice]=useState(true);
 const [listening,setListening]=useState(false);
 const [micSupported,setMicSupported]=useState(false);
 const [notice,setNotice]=useState('');
 const abort=useRef<AbortController|null>(null);
 const recognition=useRef<SpeechListener|null>(null);
 const end=useRef<HTMLDivElement|null>(null);
 const linesRef=useRef(lines);
 const modeRef=useRef(mode);
 const speaking=useRef(false);
 linesRef.current=lines;modeRef.current=mode;
 useEffect(()=>{
   const current=sessionHistory[character]?.slice()||[{role:'assistant' as const,text:greeting||persona.intro}];
   setLines(current);setDraft('');setBusy(false);setNotice('');setMode('checking');
   abort.current?.abort();recognition.current?.stop();
   window.speechSynthesis?.cancel();
 },[character]);
 useEffect(()=>{sessionHistory[character]=lines.slice(-18);end.current?.scrollIntoView({block:'nearest',behavior:'smooth'})},[lines,character]);
 useEffect(()=>{
  const w=window as typeof window & {SpeechRecognition?:new()=>SpeechListener;webkitSpeechRecognition?:new()=>SpeechListener};
  setMicSupported(Boolean(w.SpeechRecognition||w.webkitSpeechRecognition));
  const controller=new AbortController();
  // Resolve availability at opening time: do not leave a permanent
  // misleading "Checking live AI" status on public deployments.
  fetch('/api/crew',{method:'GET',signal:controller.signal,cache:'no-store'})
    .then(async r=>{
      if(!r.ok)throw new Error('not available');
      const status=await r.json() as {available?:boolean};
      const mode=status.available?'online-ai':'offline';
      modeRef.current=mode;
      setMode(mode);
    })
    .catch(()=>{if(!controller.signal.aborted){modeRef.current='offline';setMode('offline');}});
  return ()=>{controller.abort();abort.current?.abort();recognition.current?.stop();window.speechSynthesis?.cancel()};
 },[]);
 const speak=(text:string)=>{
  if(!voice||muted||!('speechSynthesis' in window))return;
  const content=text.replace(/https?:\/\/\S+/g,'').replace(/\*+/g,'').slice(0,450);
  if(!content.trim())return;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(content);
  utterance.lang='en-US';utterance.rate=persona.voiceRate;utterance.pitch=persona.voicePitch;utterance.volume=.9;
  const available=window.speechSynthesis.getVoices();
  const english=available.filter(v=>v.lang.toLowerCase().startsWith('en'));
  const chosen=english.find(v=>character==='leo'?/david|male|daniel|george|alex/i.test(v.name):/samantha|zira|female|aria|jenny|ava/i.test(v.name))||english.find(v=>v.localService===false)||english[0];
  if(chosen)utterance.voice=chosen;
  utterance.onstart=()=>{speaking.current=true;};
  utterance.onend=()=>{speaking.current=false;};
  window.speechSynthesis.speak(utterance);
 };
 const ask=async(question:string)=>{
  const text=question.trim().slice(0,460);
  if(!text||busy)return;
  window.speechSynthesis?.cancel();
  setDraft('');setNotice('');
  const history=linesRef.current.slice(-6);
  const next:Line[]=[...linesRef.current,{role:'user',text}];
  setLines(next);setBusy(true);
  const fallback=()=>{
   const reply=localCrewAnswer(character,text,context);
   setLines(prev=>[...prev,{role:'assistant',text:reply.text,source:reply.source,mode:'offline'}]);
   setMode('offline');speak(reply.text);
  };
  if(modeRef.current==='offline'){fallback();setBusy(false);return;}
  const controller=new AbortController();abort.current=controller;
  try{
   const timer=window.setTimeout(()=>controller.abort(),16000);
   let response:Response;
   try{
    response=await fetch('/api/crew',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
      body:JSON.stringify({character,question:text,context,history:history.map(x=>({role:x.role,text:x.text}))}),
      signal:controller.signal});
   }finally{window.clearTimeout(timer);}
   const data=await response.json() as {mode?:string;text?:string;error?:string};
   if(!response.ok||data.mode!=='online-ai'||!data.text)throw Error(data.error||'AI service offline');
   setMode('online-ai');
   setLines(prev=>[...prev,{role:'assistant',text:data.text!,mode:'online-ai'}]);
   speak(data.text);
  }catch(e){
   if(controller.signal.aborted){
    if(!abort.current||abort.current!==controller){setBusy(false);return;}
    setNotice('Live reply timed out. The local science guide is here to help.');
   }
   fallback();
  }finally{if(abort.current===controller)abort.current=null;setBusy(false);}
 };
 const useMicrophone=()=>{
  if(listening){recognition.current?.stop();setListening(false);return;}
  if(!micSupported){setNotice('Voice recognition is not available in this browser. You can type instead.');return;}
  window.speechSynthesis?.cancel();
  const w=window as typeof window & {SpeechRecognition?:new()=>SpeechListener;webkitSpeechRecognition?:new()=>SpeechListener};
  const Speech=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!Speech)return;
  const r=new Speech();r.lang='en-US';r.interimResults=false;r.maxAlternatives=1;
  r.onresult=(event:SpeechResult)=>{
   const transcript=event.results[0]?.[0]?.transcript?.trim();
   if(transcript){setDraft(transcript);void ask(transcript);}
  };
  r.onerror=e=>{setNotice(e.error==='not-allowed'?'Microphone access was denied. Type your question instead.':'Could not hear you clearly. Please try again.');setListening(false)};
  r.onend=()=>setListening(false);
  recognition.current=r;
  try{r.start();setListening(true);setNotice('Listening… ask your question naturally.');}
  catch{setNotice('The microphone is busy. Try again in a moment.');}
 };
 const close=()=>{abort.current?.abort();recognition.current?.stop();window.speechSynthesis?.cancel();onClose()};
 return <section role="dialog" aria-modal="false" aria-label={'Talk with '+persona.name}
   className="pointer-events-auto fixed bottom-3 right-3 z-[58] flex h-[min(67vh,570px)] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-[22px] border border-[#7699ac]/45 bg-[#0c1a28]/97 text-[#e7f1f3] shadow-[0_22px_90px_rgba(0,0,0,.70)] backdrop-blur-xl sm:bottom-5 sm:right-5">
   <header className="flex items-center gap-3 border-b border-white/10 bg-[#1b3040] px-4 py-3">
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-white/15 bg-[#2a4757] text-2xl" style={{color:persona.color}}>{persona.symbol}</div>
    <div className="min-w-0 flex-1">
     <div className="truncate text-sm font-semibold">{persona.name} <span className="ml-1 text-[10px] font-normal text-[#9bb8cb]">LUNA-7</span></div>
     <p className="truncate text-[11px] text-[#aec3ce]">{persona.role}</p>
    </div>
    <button type="button" aria-label={voice?'Turn spoken answers off':'Turn spoken answers on'} title={voice?'Mute crew voice':'Enable crew voice'}
       className="rounded-lg p-2 text-sm hover:bg-white/10" onClick={()=>{setVoice(v=>!v);window.speechSynthesis?.cancel()}}>{voice&&!muted?'🔊':'🔇'}</button>
    <button type="button" aria-label="Close conversation" className="rounded-lg p-2 text-sm hover:bg-white/10" onClick={close}>✕</button>
   </header>
   <div className="border-b border-white/10 bg-[#102735] px-4 py-2 text-[11px] text-[#b0c7d2]">
    <span className={'mr-2 inline-block h-2 w-2 rounded-full '+(mode==='online-ai'?'bg-[#91ddb9]':mode==='offline'?'bg-[#edc58d]':'bg-[#9fc8dd]')}/>
    {mode==='online-ai'?'Live AI conversation':mode==='offline'?'Offline science guide':'Checking live AI availability'}
    <span className="float-right text-[#87a9ba]">Text + voice</span>
   </div>
   <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4" aria-live="polite">
    {lines.map((line,i)=><div key={i} className={'flex '+(line.role==='user'?'justify-end':'justify-start')}>
      <div className={'max-w-[92%] rounded-2xl px-3.5 py-3 text-[13px] leading-[1.56] '+(line.role==='user'?'rounded-br-sm bg-[#31586d] text-[#f3f8fa]':'rounded-bl-sm border border-white/10 bg-[#1a3141] text-[#e0edf3]')}>
       {line.text}
       {line.source&&<a href={line.source} target="_blank" rel="noopener noreferrer" className="mt-2 block text-[11px] font-semibold text-[#98d2ed] underline underline-offset-2">NASA reference ↗</a>}
      </div>
     </div>)}
    {busy&&<div className="max-w-[80%] rounded-xl bg-[#1d3445] px-4 py-3 text-xs text-[#b4cedc]">Thinking about your question…</div>}
    <div ref={end}/>
   </div>
   <div className="border-t border-white/10 bg-[#122737] px-3 py-3">
    {notice&&<p role="status" className="mb-2 text-[11px] text-[#edcda9]">{notice}</p>}
    {lines.length<4&&<div className="mb-2 flex gap-2 overflow-x-auto pb-1">
     {SUGGESTIONS[character].map(q=><button type="button" key={q} onClick={()=>void ask(q)} disabled={busy}
      className="shrink-0 rounded-full border border-[#718fa2]/40 px-3 py-1.5 text-[11px] text-[#c5dde6] hover:bg-white/10 disabled:opacity-50">{q}</button>)}
    </div>}
    <form className="flex items-center gap-2" onSubmit={e=>{e.preventDefault();void ask(draft)}}>
     <input aria-label="Your question" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={460}
      placeholder="Ask me anything about space…" className="min-w-0 flex-1 rounded-xl border border-[#527589]/50 bg-[#071a2a] px-3 py-3 text-sm outline-none placeholder:text-[#8aa4b2] focus:border-[#9dd2e3]"/>
     <button type="button" onClick={useMicrophone} aria-label={listening?'Stop listening':'Ask with your microphone'} title="Voice input"
      className={'grid h-11 w-10 shrink-0 place-items-center rounded-xl border '+(listening?'border-[#ffb894] bg-[#833f43]':'border-[#638da1] bg-[#254656] hover:bg-[#34596a]')}>
      {listening?'■':'🎙'}</button>
     <button disabled={!draft.trim()||busy} type="submit" className="h-11 rounded-xl bg-[#93cfe0] px-3 font-bold text-[#102a3a] disabled:opacity-50">➤</button>
    </form>
    <div className="mt-2 flex items-center justify-between gap-3">
     <span className="text-[10px] text-[#819dab]">Voice quality depends on your device.</span>
     <button type="button" onClick={()=>{close();onOpenAcademy()}} className="text-[11px] font-semibold text-[#b5dce7] underline underline-offset-4">Science experiments ↗</button>
    </div>
   </div>
 </section>;
};
