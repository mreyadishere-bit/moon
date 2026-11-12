import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NASA_OBSERVATIONS, START_ADVENTURE, adventureEnding, exampleSolarPowerKw,
  freeFallMeters, oneWayMoonSignalSeconds, trainWithDecision, verifyAdventureModel
} from '../src/game/ScienceAdventure';

test('scientific reference values match documented NASA facts',()=>{
  assert.equal(NASA_OBSERVATIONS.lunarGravityMs2.value,1.62);
  assert.equal(NASA_OBSERVATIONS.earthGravityMs2.value,9.80);
  assert.equal(NASA_OBSERVATIONS.earthMoonDistanceKm.value,384400);
  assert.equal(NASA_OBSERVATIONS.solarIrradianceWm2.value,1361);
  assert.equal(NASA_OBSERVATIONS.stormPeakKp.value,9);
  assert.ok(verifyAdventureModel());
});

test('falling experiment responds to measured gravity',()=>{
  assert.equal(freeFallMeters(1,true),.81);
  assert.equal(freeFallMeters(1,false),4.9);
  assert.equal(freeFallMeters(-1,true),0);
  assert.ok(freeFallMeters(2,true)>freeFallMeters(1,true));
});

test('solar example preserves energy units and responds to sunlight',()=>{
  assert.equal(exampleSolarPowerKw(0),0);
  assert.ok(Math.abs(exampleSolarPowerKw(100)-2.1776)<1e-10);
  assert.equal(exampleSolarPowerKw(-20),0);
  assert.equal(exampleSolarPowerKw(120),exampleSolarPowerKw(100));
  assert.ok(exampleSolarPowerKw(30)<exampleSolarPowerKw(80));
});

test('realistic Moon communication delay remains around 1.28 seconds one way',()=>{
  const oneWay=oneWayMoonSignalSeconds();
  assert.ok(oneWay>1.28&&oneWay<1.29);
  assert.ok(oneWay*2>2.56&&oneWay*2<2.58);
});

function play(branch:'energy'|'air'|'weather',power:'store'|'grow'|'breathe',air:'scrub'|'rest',garden:'recycle'|'lights',storm:'shelter'|'scan',comms:'ask'|'act'){
  let s={...START_ADVENTURE,learned:[],choices:[]};
  const sequence=[branch,'gravity',power,air,garden,storm,comms];
  for(const choice of sequence) {
    const prevStage=s.stage;
    const next=trainWithDecision(s,choice,choice);
    assert.equal(next.stage,prevStage+1);
    assert.equal(next.choices.length,s.choices.length+1);
    assert.ok(next.batteryKwh>=0&&next.batteryKwh<=60);
    assert.ok(next.air>=0&&next.air<=100);
    assert.ok(next.safety>=0&&next.safety<=100);
    assert.ok(next.garden>=0&&next.garden<=100);
    assert.ok(next.water>=0&&next.water<=100);
    assert.equal(trainWithDecision(s,choice,choice).choices.length,next.choices.length);
    s=next;
  }
  assert.equal(s.stage,7);
  assert.equal(s.choices.length,7);
  return s;
}
test('distinct energy, air and weather branches produce different consequences',()=>{
  const a=play('weather','store','scrub','recycle','shelter','act');
  const b=play('air','grow','rest','lights','scan','ask');
  const c=play('energy','breathe','scrub','lights','shelter','act');
  assert.notDeepEqual([a.batteryKwh,a.air,a.safety,a.water],[b.batteryKwh,b.air,b.safety,b.water]);
  assert.notDeepEqual([a.batteryKwh,a.air,a.safety],[c.batteryKwh,c.air,c.safety]);
  assert.notEqual(adventureEnding(a).title,adventureEnding(b).title);
});
test('replaying a mission cannot multiply resources from the same completed stage',()=>{
  const s=trainWithDecision({...START_ADVENTURE,learned:[],choices:[]},'energy','Energy');
  assert.strictEqual(trainWithDecision(s,'energy','Energy'),s);
});
