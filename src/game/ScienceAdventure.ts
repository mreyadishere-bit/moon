/**
 * MOONSHIFT science-adventure data and deterministic learning scenario.
 * Scientific references are explicit. The habitat resource model is FICTIONAL,
 * with declared assumptions: never call its scores NASA measurements.
 */
export type StoryBranch = 'energy' | 'air' | 'weather';
export type LearningStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type TrainingEnding = 'brilliant' | 'compromise' | 'retry';
export type ChoiceId = 'store' | 'grow' | 'breathe' | 'scrub' | 'rest' | 'recycle' | 'lights' | 'shelter' | 'scan' | 'ask' | 'act';

export const NASA_OBSERVATIONS = {
  lunarGravityMs2: { value: 1.62, unit: 'm/s²', label: 'Surface gravity of the Moon', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' },
  earthGravityMs2: { value: 9.80, unit: 'm/s²', label: 'Surface gravity of Earth', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' },
  earthMoonDistanceKm: { value: 384400, unit: 'km', label: 'Average distance to the Moon', url: 'https://science.nasa.gov/moon/facts/' },
  solarIrradianceWm2: { value: 1361, unit: 'W/m²', label: 'Solar irradiance near the Moon at approximately 1 AU', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' },
  stormPeakKp: { value: 9, unit: 'Kp index', label: 'Peak Earth geomagnetic Kp, May 2024 event', url: 'https://ccmc.gsfc.nasa.gov/storms/may2024/' },
} as const;

/** Physics: distances in meters; no game balancing in this function. */
export function freeFallMeters(timeSeconds: number, onMoon: boolean): number {
  const t = Math.max(0, Math.min(timeSeconds, 20));
  return 0.5 * (onMoon ? NASA_OBSERVATIONS.lunarGravityMs2.value : NASA_OBSERVATIONS.earthGravityMs2.value) * t * t;
}
/** Assumes vacuum light travel, uses NASA's mean Earth-Moon distance. */
export function oneWayMoonSignalSeconds(): number {
  return NASA_OBSERVATIONS.earthMoonDistanceKm.value / 299792.458;
}
/** NASA irradiance with explicitly fictional panel assumptions. kW is energy output per hour. */
export function exampleSolarPowerKw(sunlightPct: number): number {
  const areaM2 = 8; // fictional colony: 8 square meter teaching array
  const efficiency = 0.20; // simplifying hypothetical efficiency
  return NASA_OBSERVATIONS.solarIrradianceWm2.value * areaM2 * efficiency * Math.max(0,Math.min(sunlightPct,100))/100/1000;
}
export const STORY_STAGES = [
  {chapter:'WELCOME TO LUNA-7',title:'A home on the Moon',speaker:'PIX',intro:'You made it! Maya is waiting inside. But first, what kind of training mission would you like?',lesson:'Choose your training scenario. The science stays the same; the station starts with different problems.'},
  {chapter:'THE GRAVITY LAB',title:'Why is everything so floaty?',speaker:'MAYA',intro:'Welcome, explorer! Let me show you something wonderful. Things fall on the Moon, too — just more slowly than on Earth.',lesson:'Change the place and watch how far an object falls in one second. Gravity is not the same on every world.'},
  {chapter:'THE POWER WORKSHOP',title:'A little sunlight goes a long way',speaker:'LEO',intro:'Our panels capture sunlight. Our batteries store electricity for later. What should we use the power for?',lesson:'Change the sunlight slider. The solar calculation uses a real NASA value and clearly labeled example panel assumptions.'},
  {chapter:'THE AIR LAB',title:'Keeping our home breathable',speaker:'MAYA',intro:'We cannot open a window for fresh air here. Our equipment keeps the air safe. Which repair should we try?',lesson:'Machines need electricity to move cabin air and remove carbon dioxide. You cannot spend the same energy twice.'},
  {chapter:'SPROUT’S GARDEN',title:'Tiny plants, big decisions',speaker:'SPROUT',intro:'Hello, hello! My seedlings need water and light. But I promised Leo I would not use all the electricity.',lesson:'Plants need resources. Recycling water and managing lighting can help a small space habitat.'},
  {chapter:'THE SPACE WEATHER ALERT',title:'Everyone to the safe room!',speaker:'NOVA',intro:'We are studying a real NASA record of strong space weather from May 2024. Our training station must prepare for a simulated hazard.',lesson:'The observed Kp index describes Earth’s geomagnetic storm, NOT radiation dose on the Moon. Our shelter emergency is a fictional training exercise.'},
  {chapter:'THE LAST SIGNAL',title:'What will you tell Maya?',speaker:'PIX',intro:'Our link to Maya has finally reconnected! Do we wait for advice from Earth or use what we have learned?',lesson:'Radio travels at light speed. Even a message to the Moon takes time. A broken radio can cause a much longer outage.'},
  {chapter:'MISSION DEBRIEF',title:'You did it, Moon explorer!',speaker:'MAYA',intro:'The best astronaut is not the one who never makes mistakes. It is the one who learns, checks the evidence, and tries again.',lesson:'Compare your mission choices and their consequences. You can choose a different path on your next visit.'},
] as const;

export interface AdventureChoice {
  stage: number; id: string; label: string; consequence: string;
}
export interface AdventureState {
  version: 2;
  stage: LearningStage;
  branch: StoryBranch;
  sunlightPct: number;
  experimentWorld: 'moon' | 'earth';
  dropTimeSeconds: number;
  batteryKwh: number;
  air: number;
  safety: number;
  garden: number;
  water: number;
  learned: number[];
  choices: AdventureChoice[];
}
const cap = (n:number,lo=0,hi=100)=>Math.max(lo,Math.min(hi,n));
export const START_ADVENTURE: AdventureState = {version:2,stage:0,branch:'energy',sunlightPct:80,experimentWorld:'moon',dropTimeSeconds:1,batteryKwh:24,air:62,safety:55,garden:52,water:65,learned:[],choices:[]};
const STORAGE_KEY = 'moonshift_science_adventure_v2';
export function readAdventure(): AdventureState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(saved?.version===2 && Array.isArray(saved.choices) && Number.isInteger(saved.stage) && saved.stage>=0 && saved.stage<=7) {
      return {...START_ADVENTURE,...saved};
    }
  }catch{/* restricted storage */}
  return {...START_ADVENTURE,learned:[],choices:[]};
}
export function saveAdventure(state: AdventureState): void {
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{/* storage disabled */}
}
export function resetAdventure():AdventureState {
  const s={...START_ADVENTURE,learned:[],choices:[]};saveAdventure(s);return s;
}
export function trainWithDecision(previous: AdventureState,id:ChoiceId|string,label:string): AdventureState {
  // Each chapter can be completed only once. Saving and revisiting cannot create resources.
  if(previous.choices.some(c=>c.stage===previous.stage))return previous;
  const next:AdventureState = {...previous,choices:[...previous.choices],learned:[...previous.learned]};
  let consequence='';
  switch(previous.stage) {
    case 0:
      if(!['energy','air','weather'].includes(id))return previous;
      next.branch=id as StoryBranch;
      if(id==='energy'){next.batteryKwh=17;consequence='A low-battery mission begins.';}
      if(id==='air'){next.air=40;consequence='A ventilation fault makes the air system the priority.';}
      if(id==='weather'){next.safety=28;consequence='A space-weather preparedness drill begins.';}
      break;
    case 1:
      consequence='You compared the same fall time on the Moon and on Earth using NASA gravity data.';
      break;
    case 2: {
      const generatedKwh=exampleSolarPowerKw(previous.sunlightPct)*4; // fictional four-hour illumination window
      const allocation=id==='breathe'?11:id==='grow'?12:id==='store'?3:-1;
      if(allocation<0)return previous;
      next.batteryKwh=cap(previous.batteryKwh+generatedKwh-allocation,0,60);
      if(id==='breathe')next.air=cap(previous.air+14);
      if(id==='grow')next.garden=cap(previous.garden+20);
      consequence=`The demo panels made ${generatedKwh.toFixed(1)} kWh in four simulated hours. Your chosen equipment used ${allocation} kWh.`;
      break;
    }
    case 3:
      if(id==='scrub'){next.batteryKwh=cap(previous.batteryKwh-5,0,60);next.air=cap(previous.air+26);consequence='Powered filters improve the fictional air-readiness score but use 5 kWh.';}
      else if(id==='rest'){next.air=cap(previous.air-10);consequence='Saving energy helps the battery, but air support cannot stay reduced forever.';}
      else return previous;
      break;
    case 4:
      if(id==='recycle'){next.water=cap(previous.water+20);next.batteryKwh=cap(previous.batteryKwh-3,0,60);next.garden=cap(previous.garden+7);consequence='The water-recovery system used energy and reduced water loss.';}
      else if(id==='lights'){next.batteryKwh=cap(previous.batteryKwh-7,0,60);next.garden=cap(previous.garden+23);next.water=cap(previous.water-7);consequence='Extra light supported the plants but used stored energy and water.';}
      else return previous;
      break;
    case 5:
      if(id==='shelter'){next.batteryKwh=cap(previous.batteryKwh-4,0,60);next.safety=cap(previous.safety+38);consequence='You prepared a protective shelter. This readiness score is a fictional educational metric, not measured lunar radiation dose.';}
      else if(id==='scan'){next.safety=cap(previous.safety+11);consequence='Monitoring improved awareness, but crew shelter readiness remained limited.';}
      else return previous;
      break;
    case 6:
      if(id==='ask'){next.batteryKwh=cap(previous.batteryKwh-1,0,60);consequence='You waited for guidance. Radio propagation is about 1.28 seconds one way at the mean lunar distance.';}
      else if(id==='act'){next.safety=cap(previous.safety+5);consequence='You made a documented decision with the information already available.';}
      else return previous;
      break;
    default:return previous;
  }
  next.choices.push({stage:previous.stage,id,label,consequence});
  if(!next.learned.includes(previous.stage))next.learned.push(previous.stage);
  next.stage=Math.min(7,previous.stage+1) as LearningStage;
  return next;
}
export function adventureEnding(state:AdventureState):{kind:TrainingEnding,title:string,summary:string} {
  const ready = Number(state.batteryKwh>=10)+Number(state.air>=60)+Number(state.safety>=60);
  if(ready===3)return {kind:'brilliant',title:'The brilliant rescue',summary:'Your mission kept enough battery energy, breathable-air support, and shelter readiness.'};
  if(ready>=2)return {kind:'compromise',title:'A tough but successful mission',summary:'Your team made it through, but some important reserves need attention. Can you improve your strategy?'};
  return {kind:'retry',title:'The learning mission',summary:'You discovered a plan that needs improvement. Maya and PIX will help you test a new strategy.'};
}
export function verifyAdventureModel():boolean {
  const gravity = freeFallMeters(1,true);
  const solar = exampleSolarPowerKw(100);
  const signal=oneWayMoonSignalSeconds();
  return Math.abs(gravity-0.81)<1e-8 && Math.abs(solar-2.1776)<0.00001 && signal>1.28 && signal<1.29 &&
    trainWithDecision(START_ADVENTURE,'energy','Energy').batteryKwh===17;
}
