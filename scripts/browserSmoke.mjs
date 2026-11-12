#!/usr/bin/env node
/**
 * Real browser smoke test, intended to run in GitHub Actions.
 * Does not fabricate screenshots or claim a visual art quality score.
 * Run: npm install --no-save playwright@1.56.1 && npm run dev -- --port 4173 &
 *      node scripts/browserSmoke.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const url=process.env.MOONSHIFT_TEST_URL || 'http://127.0.0.1:4173/';
const browser=await chromium.launch({
  headless:true,
  args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage','--no-sandbox']
});
const page=await browser.newPage({viewport:{width:1365,height:768},reducedMotion:'reduce'});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/WebGL|GPU|Context|SwiftShader/i.test(m.text()))errors.push(m.text())});
page.setDefaultTimeout(12000);
const outDir='browser-test-artifacts';
fs.mkdirSync(outDir,{recursive:true});
const record=async(label)=>{
  try {
    await page.screenshot({path:`${outDir}/${label}.png`,fullPage:false,timeout:3500,animations:'disabled'});
    console.log('BROWSER_SCREENSHOT',label);
  } catch (error) {
    console.warn('OPTIONAL_SCREENSHOT_SKIPPED',label,error instanceof Error?error.message.split('\n')[0]:String(error));
  }
  console.log('BROWSER_CHECK',label,'url',page.url());
};
const academy=async()=>{ const item=page.getByRole('button',{name:/Story & Science Academy/i});await item.waitFor({state:'attached'});await item.evaluate(el=>el.click()); };
const pick=async(label)=>{const item=page.getByRole('button',{name:new RegExp(label,'i')});await item.waitFor({state:'attached'});await item.evaluate(el=>el.click());};
try{
  const resp=await page.goto(url,{waitUntil:'networkidle',timeout:35000});
  assert.equal(resp?.status(),200,'Game HTML must be accessible');
  await page.getByRole('button',{name:/begin the adventure|start a new adventure/i}).waitFor();
  await record('01-title');
  await page.getByRole('button',{name:/begin the adventure|start a new adventure/i}).click();
  const skip=page.getByRole('button',{name:/Skip scene/i});
  await skip.waitFor();
  await record('02-in-engine-arrival');
  await skip.evaluate(el=>el.click());
  await page.locator('canvas').first().waitFor();
  assert.ok(await page.locator('canvas').count()>0,'Real game rendering canvas should exist');
  const glWarning=await page.getByText("Full 3D graphics couldn't start").count();
  console.log('BROWSER_WEBGL_CONTEXT',glWarning?'Software fallback in CI':'No graphics fallback warning');
  if(glWarning)await page.getByRole('button',{name:/Continue in basic mode/i}).evaluate(el=>el.click());
  await academy();
  await page.getByText('A home on the Moon',{exact:true}).waitFor();
  await pick('The Energy Crisis');
  await academy();
  await page.getByText('Why is everything so floaty?',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Earth',exact:true}).evaluate(el=>el.click());
  await page.getByRole('button',{name:/I tested both worlds/i}).click();
  await academy();
  await page.getByText('A little sunlight goes a long way',{exact:true}).waitFor();
  await page.locator('input[type=range]').first().evaluate(el=>{el.focus();el.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'ArrowRight'}));el.stepUp();el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
  await pick('Save some battery');
  await academy();
  await page.getByText('Keeping our home breathable',{exact:true}).waitFor();
  await page.locator('input[type=range]').first().evaluate(el=>{el.focus();el.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'ArrowRight'}));el.stepUp();el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
  await pick('Switch on the air filters');
  await academy();
  await page.getByText('Tiny plants, big decisions',{exact:true}).waitFor();
  await page.locator('input[type=range]').first().evaluate(el=>{el.focus();el.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'ArrowRight'}));el.stepUp();el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
  await pick('Recover and reuse water');
  await academy();
  await page.getByText('Everyone to the safe room!',{exact:true}).waitFor();
  await pick('Prepared interior shelter');
  await pick('Prepare the crew shelter');
  await academy();
  await page.getByText('What will you tell Maya?',{exact:true}).waitFor();
  await pick('Send test signal to Earth');
  await pick('Use what we already know');
  await page.getByText('You did it, Moon explorer!',{exact:true}).waitFor();
  await record('03-story-ending');
  const problem=errors.filter(e=>!/WebGL|GPU|SwiftShader/i.test(e));
  assert.equal(problem.length,0,'Browser runtime errors: '+problem.join('\n'));
  console.log('BROWSER_STORY_PLAYTHROUGH_PASSED',7,'chapters');
}finally{
  await browser.close();
}
