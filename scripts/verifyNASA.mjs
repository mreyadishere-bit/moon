#!/usr/bin/env node
/** Reproducible NASA reference audit. Offline validates the checked-in data;
 * --online additionally fetches primary NASA pages, checks source content and
 * writes evidence with SHA-256 hashes. Never silently fabricates observations.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const projectRoot=path.resolve(import.meta.dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(projectRoot,'src/science/nasaDataset.json'),'utf8'));
const expected=['lunarGravityMs2','earthGravityMs2','earthMoonDistanceKm','solarIrradianceWm2','stormPeakKp'];
const lookup=new Map(data.records.map(record=>[record.id,record]));
for(const id of expected){
  const r=lookup.get(id);
  if(!r||!Number.isFinite(r.value)||!r.units||!r.source?.startsWith('https://'))throw new Error('Invalid NASA record '+id);
}
const val=id=>lookup.get(id).value;
if(Math.abs(val('lunarGravityMs2')-1.62)>.03)throw new Error('Unexpected lunar gravity');
if(Math.abs(val('earthMoonDistanceKm')-384400)>1000)throw new Error('Unexpected lunar distance');
if(Math.abs(val('solarIrradianceWm2')-1361)>20)throw new Error('Unexpected irradiance');
if(val('stormPeakKp')!==9)throw new Error('Unexpected May 2024 historical Kp observation');
const p=val('solarIrradianceWm2')*data.teachingAssumptions.panelAreaM2*data.teachingAssumptions.panelEfficiency/1000;
const delay=val('earthMoonDistanceKm')/299792.458;
if(!Number.isFinite(p)||p<=0||!Number.isFinite(delay)||delay<=0)throw new Error('Derived scientific result invalid');
console.log('NASA_REFERENCE_SNAPSHOT_VERIFIED',data.records.length,'records; peak sample solar kW',p.toFixed(4),'one-way radio s',delay.toFixed(3));
if(process.argv.includes('--online')){
  const origins=[...new Set(data.records.map(record=>record.source))];
  const evidence=[];
  for(const url of origins){
    const response=await fetch(url,{signal:AbortSignal.timeout(14000),headers:{'user-agent':'MOONSHIFT educational NASA source checker'}});
    if(!response.ok)throw new Error(url+' returned HTTP '+response.status);
    const body=await response.text();
    const lower=body.toLowerCase();
    if(url.includes('ccmc.gsfc.nasa.gov')&&!lower.includes('2024'))throw new Error('CCMC page does not describe 2024');
    if(url.includes('moonfact')&&!lower.includes('gravity'))throw new Error('Moon fact sheet content mismatch');
    if(url.includes('/moon/facts')&&!lower.includes('384,400'))throw new Error('Moon distance reference missing');
    evidence.push({sourceUrl:url,fetchedAtUTC:new Date().toISOString(),sha256:crypto.createHash('sha256').update(body).digest('hex'),bytes:Buffer.byteLength(body),httpStatus:response.status});
    console.log('SOURCE_VERIFIED',url,body.length);
  }
  const dest=path.join(projectRoot,'docs/NASA_ONLINE_SOURCE_AUDIT.json');
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,JSON.stringify({records:evidence,verifiedSnapshotVersion:data.version},null,2)+'\n');
  console.log('EVIDENCE_WRITTEN',dest);
}
