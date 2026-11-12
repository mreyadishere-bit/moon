import { NASA_OBSERVATIONS } from '../game/ScienceAdventure';

export type CrewId = 'pix' | 'maya' | 'leo' | 'sprout' | 'nova';
export type CrewContext = {
  room: string; chapter: number; objective: string;
  nearby: string; power: number; air: number; shelter: number;
  choices: string[];
};
export const CREW: Record<CrewId,{name:string;role:string;symbol:string;color:string;intro:string;voicePitch:number;voiceRate:number}> = {
  pix:{name:'PIX',role:'Your curious moon companion',symbol:'✦',color:'#8bd3d7',intro:'Psst! Want to discover something amazing? Ask me anything about our Moon mission.',voicePitch:1.19,voiceRate:1.05},
  maya:{name:'Dr. Maya Chen',role:'Lunar scientist',symbol:'◉',color:'#d7bc90',intro:'Welcome, explorer. I love a good question. What shall we investigate together?',voicePitch:1.04,voiceRate:.96},
  leo:{name:'Leo',role:'Station engineer',symbol:'⚡',color:'#e5ac72',intro:'Hey, junior engineer! Anything making weird noises? Or do you have a science question?',voicePitch:.88,voiceRate:1.03},
  sprout:{name:'SPROUT',role:'Garden robot',symbol:'✿',color:'#9bdaa9',intro:'Hello, new plant friend! I know a lot about space gardens. I also know three very bad plant jokes.',voicePitch:1.32,voiceRate:1.08},
  nova:{name:'NOVA',role:'Station computer',symbol:'◇',color:'#94bee4',intro:'LUNA-7 assistance ready. I can help with station systems, directions, and space science.',voicePitch:1,voiceRate:.94},
};

type Fact={test:RegExp;answer:(ctx:CrewContext)=>string;url?:string;topics:string[]};
export const FACTS:Fact[]=[
 {test:/grav|fall|jump|float|weight|heav/i,answer:()=>`Gravity is weaker on the Moon! The Moon pulls down at about ${NASA_OBSERVATIONS.lunarGravityMs2.value} meters per second squared, compared with about ${NASA_OBSERVATIONS.earthGravityMs2.value} on Earth. Want to try dropping a ball in the Science Academy?`,url:NASA_OBSERVATIONS.lunarGravityMs2.url,topics:['gravity','moon','earth']},
 {test:/earth|distance|far away|radio delay|signal|communicat|message|light.speed/i,answer:()=>`Earth is about ${NASA_OBSERVATIONS.earthMoonDistanceKm.value.toLocaleString('en-US')} kilometers away on average. Radio signals travel at light speed, so a message takes around 1.28 seconds just to reach Earth, before anyone replies! Try the telescope or signal experiment.`,url:NASA_OBSERVATIONS.earthMoonDistanceKm.url,topics:['earth','communications','signal']},
 {test:/solar|sunlight|electric|power|battery|energy|panel/i,answer:(ctx)=>`Our station needs electricity for fans, lights, and experiments. Solar panels convert sunlight into electrical power. Batteries save it for darker times. Our simulated battery is at ${Math.round(ctx.power)}%. Leo's power workshop lets you try different plans. Which system would you help first?`,url:NASA_OBSERVATIONS.solarIrradianceWm2.url,topics:['power','solar','battery']},
 {test:/oxygen|air|breathe|co2|carbon dioxide|ventil|filter|life.support/i,answer:()=>`There's almost no air outside on the Moon, so we have to keep breathable air inside our habitat. Fans circulate the air and special systems remove extra carbon dioxide. Want to help Maya fix the air system?`,topics:['air','life support']},
 {test:/plant|garden|water|food|grow|hydropon|recycl|strawberr/i,answer:()=>`Plants need water, light, nutrients, and the right environment. Our greenhouse uses pumps and lamps, which also need electricity. Recycling water helps when every drop matters. Want to experiment with SPROUT?`,topics:['garden','plants','water']},
 {test:/radiat|storm|shield|sunspot|solar flare|sun.?storm|safe room/i,answer:()=>`Space weather can send energetic particles into space. Astronauts prepare sheltered areas and follow mission safety plans. The May 2024 NASA Kp 9 record describes a strong geomagnetic storm at Earth, not a measured radiation dose on the Moon. Our safety drill is a fictional training mission.`,url:NASA_OBSERVATIONS.stormPeakKp.url,topics:['radiation','storm','safety']},
 {test:/saturn|jupiter|mars|venus|mercury|neptune|uranus|planet|solar system/i,answer:()=>`Our solar system has eight recognized planets orbiting the Sun, from rocky Mercury to icy Neptune. The planets are amazingly different in size, temperature, atmosphere, and gravity. The Planet Explorer can help you compare them.`,topics:['planet','solar system']},
 {test:/where|go next|lost|mission|objective|what.*do|help me|find/i,answer:(ctx)=>`You're in the ${ctx.room} area. Our next mission is: ${ctx.objective}. You can follow the subtle path lights, use the Map, or ask me about the nearest machine: ${ctx.nearby||'look for glowing equipment'}.`,topics:['mission','navigation']},
 {test:/machine|what is this|what.s this|device|button|object|console|equipment/i,answer:(ctx)=>ctx.nearby?`You're looking at ${ctx.nearby}. Walk a little closer and press E to interact. Ask which part you want explained — I can help with the science behind it.`:`Look at a nearby device until its name appears, then ask me again. You can also explore any room using the mission map.`,topics:['equipment','interaction']},
];
export function localCrewAnswer(character:CrewId, question:string, ctx:CrewContext):{text:string;source?:string}{
 const q=question.slice(0,500);
 const match=FACTS.find(f=>f.test.test(q));
 if(match)return {text:match.answer(ctx),source:match.url};
 if(/joke|funny|laugh|bored/i.test(q)){
  const jokes:Record<CrewId,string>={
    pix:'Why did the astronaut bring a pencil to the Moon? To draw a little space! Okay, maybe Leo writes better jokes.',
    maya:'My favorite planet joke? I would tell you one about Saturn, but it has too many rings.',
    leo:'Why did the battery go to school? It wanted to get charged with knowledge!',
    sprout:'Why are lunar gardeners so patient? Because their vegetables need a little space to grow!',
    nova:'I calculated that the joke would be 97% funnier if PIX told it. Unfortunately, PIX already did.'
  };return {text:jokes[character]};
 }
 return {text:`That's a thoughtful question! My offline field guide doesn't have a reliable answer for it yet. Try asking about lunar gravity, space stations, planets, solar power, plants, or the mission. When our online AI guide is available, I can help with more questions.`};
}
export const isCrewId=(v:unknown):v is CrewId=>typeof v==='string'&&v in CREW;
export function safeCrewContext(raw:unknown):CrewContext{
 const c=(raw&&typeof raw==='object'?raw:{}) as Record<string,unknown>;
 const short=(v:unknown,n=95)=>typeof v==='string'?v.replace(/[<>\u0000-\u001f]/g,'').slice(0,n):'';
 const num=(v:unknown,limit=100)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(limit,Math.round(v))):0;
 return {room:short(c.room,30),chapter:num(c.chapter,7),objective:short(c.objective,150),
  nearby:short(c.nearby,85),power:num(c.power),air:num(c.air),shelter:num(c.shelter),
  choices:Array.isArray(c.choices)?c.choices.slice(-4).map(x=>short(x,80)).filter(Boolean):[]};
}
