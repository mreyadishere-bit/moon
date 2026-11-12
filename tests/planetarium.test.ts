import test from 'node:test';
import assert from 'node:assert/strict';
import {CollisionSystem} from '../src/game/CollisionSystem';
import {createStationGuidePath,insidePressurizedHabitat} from '../src/game/GuidePath';
import {PLANETS,idealDropDistance,solarLightMinutes,planetDiameterInEarths} from '../src/science/planets';
import {CREW,isCrewId,localCrewAnswer,safeCrewContext} from '../src/ai/crewKnowledge';

test('new planetarium is physically accessible from life support',()=>{
 const c=new CollisionSystem();
 const path=createStationGuidePath({x:17.5,z:3.5},{x:17.5,z:14.5});
 assert.ok(path.length>=2,'route through southern hatch exists');
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i];
  for(let j=0;j<=20;j++){
   const t=j/20,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
   assert.ok(insidePressurizedHabitat(x,z),'inside pressurized station');
   assert.ok(c.isPointValid(x,z,.42),'do not cross an invisible wall or display');
  }
 }
 assert.equal(c.detectRoom(17.5,16.7),'planetarium');
 assert.equal(c.detectRoom(17.5,4.1),'lifesupport');
});
test('unreachable exterior destinations never redirect to the planetarium',()=>{
 assert.deepEqual(createStationGuidePath({x:0,z:3.7},{x:41,z:40}),[]);
 assert.deepEqual(createStationGuidePath({x:39,z:39},{x:17.5,z:16}),[]);
});
test('astronomy explorer uses meaningful consistent reference values',()=>{
 assert.equal(PLANETS.length,8);
 assert.equal(new Set(PLANETS.map(p=>p.id)).size,8);
 assert.ok(PLANETS.every(p=>p.diameterKm>0&&p.gravityMs2>0&&p.sunDistanceAU>0&&p.source.startsWith('https://science.nasa.gov/')));
 assert.equal(idealDropDistance(9.8,1),4.9);
 assert.ok(Math.abs(solarLightMinutes(1)-8.316746397)<.001);
 assert.ok(planetDiameterInEarths(139820)>10);
});
test('kid-friendly AI character knowledge is grounded and validated',()=>{
 assert.ok(isCrewId('pix'));
 assert.ok(!isCrewId('villain'));
 assert.equal(Object.keys(CREW).length,5);
 const ctx=safeCrewContext({room:'hub',objective:'Restore battery',nearby:'Solar battery',chapter:2,power:20,air:60,shelter:75,choices:['Save energy']});
 const roomAnswer=localCrewAnswer('leo','what is this room?',{...ctx,room:'power',nearby:'Leo (Chief Engineer)'});
 assert.match(roomAnswer.text,/power core|batteries/i);
 assert.doesNotMatch(roomAnswer.text,/You're looking at Leo/i);
 const observatoryAnswer=localCrewAnswer('pix','where am i?',{...ctx,room:'planetarium'});
 assert.match(observatoryAnswer.text,/Solar System Observatory/i);
 const answer=localCrewAnswer('leo','Why do solar panels matter?',ctx);
 assert.match(answer.text,/batter|electric/i);
 assert.ok(answer.source?.startsWith('https://'));
 const unknown=localCrewAnswer('pix','What is the answer to life universe and everything?',ctx);
 assert.match(unknown.text,/offline field guide/i);
 const unsafe=safeCrewContext({objective:'<script>hi</script>',chapter:1000,power:-20,choices:new Array(30).fill('x')});
 assert.equal(unsafe.chapter,7);
 assert.equal(unsafe.power,0);
 assert.ok(!unsafe.objective.includes('<'));
 assert.ok(unsafe.choices.length<=4);
});
