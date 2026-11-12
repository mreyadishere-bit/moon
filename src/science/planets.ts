/**
 * NASA Solar System reference facts, rounded for a junior-audience explorer.
 * These are static reference values, NOT real-time telemetry. Gas-giant gravity
 * refers to NASA's conventional reference level, not a solid surface.
 */
export type PlanetId='mercury'|'venus'|'earth'|'mars'|'jupiter'|'saturn'|'uranus'|'neptune';
export type PlanetFact={
 id:PlanetId;name:string;diameterKm:number;gravityMs2:number;sunDistanceAU:number;yearEarthDays:number;
 color:number;rim:number;atmosphere:string;highlight:string;look:string;source:string;
};
const nasaBase='https://science.nasa.gov/solar-system/planets/';
export const PLANETS:PlanetFact[]=[
 {id:'mercury',name:'Mercury',diameterKm:4879,gravityMs2:3.7,sunDistanceAU:.39,yearEarthDays:88,color:0x9e9184,rim:0xe3cbb1,atmosphere:'Almost no atmosphere',highlight:'Closest planet to the Sun',look:'A small, heavily cratered rocky world.',source:'https://science.nasa.gov/mercury/'},
 {id:'venus',name:'Venus',diameterKm:12104,gravityMs2:8.87,sunDistanceAU:.72,yearEarthDays:225,color:0xd7ba83,rim:0xffd89d,atmosphere:'Very thick CO₂ atmosphere',highlight:'Hottest planet surface',look:'Covered by thick clouds; the surface is extremely hot.',source:'https://science.nasa.gov/venus/'},
 {id:'earth',name:'Earth',diameterKm:12742,gravityMs2:9.8,sunDistanceAU:1,yearEarthDays:365,color:0x477fb7,rim:0x95c7ff,atmosphere:'Nitrogen and oxygen atmosphere',highlight:'Our only known home with life',look:'Liquid-water oceans, continents, and active weather.',source:'https://science.nasa.gov/earth/'},
 {id:'mars',name:'Mars',diameterKm:6779,gravityMs2:3.71,sunDistanceAU:1.52,yearEarthDays:687,color:0xb77b59,rim:0xd9a080,atmosphere:'Thin, mostly CO₂ atmosphere',highlight:'A world of robotic explorers',look:'Rust-colored dust, craters and giant volcanoes.',source:'https://science.nasa.gov/mars/'},
 {id:'jupiter',name:'Jupiter',diameterKm:139820,gravityMs2:24.79,sunDistanceAU:5.2,yearEarthDays:4333,color:0xc69d7b,rim:0xe9c49e,atmosphere:'Hydrogen and helium',highlight:'Largest planet in our solar system',look:'Gas giant with colored cloud bands and giant storms.',source:'https://science.nasa.gov/jupiter/'},
 {id:'saturn',name:'Saturn',diameterKm:116460,gravityMs2:10.44,sunDistanceAU:9.58,yearEarthDays:10759,color:0xd2bc92,rim:0xf0dcaf,atmosphere:'Hydrogen and helium',highlight:'Famous for its magnificent rings',look:'Gas giant with rings made largely of ice particles.',source:'https://science.nasa.gov/saturn/'},
 {id:'uranus',name:'Uranus',diameterKm:50724,gravityMs2:8.69,sunDistanceAU:19.2,yearEarthDays:30687,color:0x82c6d1,rim:0xa6e0e6,atmosphere:'Hydrogen, helium and methane',highlight:'Rotates on its side',look:'Pale blue-green icy giant with methane clouds.',source:'https://science.nasa.gov/uranus/'},
 {id:'neptune',name:'Neptune',diameterKm:49244,gravityMs2:11.15,sunDistanceAU:30.1,yearEarthDays:60190,color:0x466db6,rim:0x7899db,atmosphere:'Hydrogen, helium and methane',highlight:'The most distant recognized planet',look:'Dark-blue ice giant with powerful winds.',source:'https://science.nasa.gov/neptune/'}
];
export const getPlanet=(id:PlanetId):PlanetFact=>PLANETS.find(p=>p.id===id)!;
export const solarLightMinutes=(au:number)=>au*499.004783836/60;
export const idealDropDistance=(gravityMs2:number,seconds:number)=>.5*gravityMs2*Math.pow(Math.max(0,Math.min(15,seconds)),2);
export const planetDiameterInEarths=(diameterKm:number)=>diameterKm/12742;
export const PLANET_REFERENCE=nasaBase;
