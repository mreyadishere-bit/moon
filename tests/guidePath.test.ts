import test from 'node:test';
import assert from 'node:assert/strict';
import { CollisionSystem } from '../src/game/CollisionSystem';
import { createStationGuidePath, currentMissionGuideDestination, insidePressurizedHabitat } from '../src/game/GuidePath';

const collision=new CollisionSystem();
for(let i=0;i<4;i++) collision.setDoorOpenFactor(i,1);

const mission=(sector:'power'|'lifesupport'|'greenhouse'|'radiation')=>({
  stationLightsOn:true,
  power:{completed:sector!=='power'},
  lifeSupport:{completed:sector!=='lifesupport'},
  greenhouse:{completed:sector!=='greenhouse'},
  radiation:{completed:sector!=='radiation'},
});

for(const sector of ['power','lifesupport','greenhouse','radiation'] as const){
  test('floor guide stays out of obstacles on the way to '+sector,()=>{
    const target=currentMissionGuideDestination(mission(sector));
    const path=createStationGuidePath({x:0,z:3.7},target);
    assert.ok(path.length>=2,'Must find a navigable route, not disappear');
    for(let j=1;j<path.length;j++){
      const a=path[j-1],b=path[j];
      const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.15));
      for(let k=0;k<=steps;k++){
        const f=k/steps,x=a.x+(b.x-a.x)*f,z=a.z+(b.z-a.z)*f;
        assert.ok(insidePressurizedHabitat(x,z),'Cannot guide outside pressurized base');
        assert.ok(collision.isPointValid(x,z,.42),'Cannot cross solid collision / furniture');
      }
    }
    assert.ok(Math.hypot(path[path.length-1].x-target.x,path[path.length-1].z-target.z)<1,'Must end near target');
  });
}
test('guide origin and destination remain outside central table',()=>{
  const path=createStationGuidePath({x:0,z:3.7},{x:0,z:-19.15});
  assert.ok(path.length>2);
  assert.ok(path.every(p=>!(Math.abs(p.x)<1.35&&p.z>-1.35&&p.z<1.55)));
});
test('no fantasy route to isolated exterior position',()=>{
  assert.deepEqual(createStationGuidePath({x:0,z:3.7},{x:41,z:40}),[]);
});
