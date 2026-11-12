import test from 'node:test';
import assert from 'node:assert/strict';
import { CollisionSystem } from '../src/game/CollisionSystem';

test('all four closed doors physically block the corridor, open doors are traversable',()=>{
  const c=new CollisionSystem();
  const positions=[{index:0,x:0,z:-9.5},{index:1,x:9.5,z:0},{index:2,x:0,z:9.5},{index:3,x:-9.5,z:0}];
  for(const door of positions)assert.equal(c.isPointValid(door.x,door.z),false,'Closed door '+door.index+' must block');
  positions.forEach(p=>c.setDoorOpenFactor(p.index,1));
  for(const door of positions)assert.equal(c.isPointValid(door.x,door.z),true,'Open door '+door.index+' must be traversable');
});
test('walk between hub and each sector in steps without invisible collisions',()=>{
  const c=new CollisionSystem();
  for(let i=0;i<4;i++)c.setDoorOpenFactor(i,1);
  const routes=[
    [{x:0,z:-4},{x:0,z:-16}],
    [{x:4,z:0},{x:16,z:0}],
    [{x:0,z:4},{x:0,z:16}],
    [{x:-4,z:0},{x:-16,z:0}],
  ];
  for(const [start,end] of routes){
    let pos={...start};
    for(let i=1;i<=60;i++){
      const next={x:start.x+(end.x-start.x)*i/60,z:start.z+(end.z-start.z)*i/60};
      pos=c.resolveMovement(pos.x,pos.z,next.x,next.z);
      assert.ok(c.isPointValid(pos.x,pos.z),'Unexpected blocker near '+JSON.stringify(pos));
    }
    assert.ok(Math.hypot(pos.x-end.x,pos.z-end.z)<.001, 'Failed to reach '+JSON.stringify(end)+', reached '+JSON.stringify(pos));
  }
});
test('wall collision remains active when doors are open',()=>{
  const c=new CollisionSystem();
  for(let i=0;i<4;i++)c.setDoorOpenFactor(i,1);
  assert.equal(c.isPointValid(4,7),false,'South hub wall should remain solid away from doorway');
  assert.equal(c.isPointValid(7,4),false,'East hub wall should remain solid away from doorway');
  assert.equal(c.isPointValid(0,7),true,'South hub doorway remains open');
  assert.equal(c.isPointValid(7,0),true,'East hub doorway remains open');
});
test('room detection matches four cardinal sectors',()=>{
  const c=new CollisionSystem();
  assert.equal(c.detectRoom(0,0),'hub');
  assert.equal(c.detectRoom(0,-15),'power');
  assert.equal(c.detectRoom(15,0),'lifesupport');
  assert.equal(c.detectRoom(0,15),'radiation');
  assert.equal(c.detectRoom(-15,0),'greenhouse');
});
