import * as THREE from 'three';

/**
 * LUNA-7 Planetary Science Observatory.
 * The physical orbital sculpture is explicitly diagrammatic, NOT an accurate
 * scale/position model. Scientific comparisons are in the companion exhibit.
 */
export class PlanetariumWing {
 public readonly group=new THREE.Group();
 public readonly console=new THREE.Group();
 private readonly orbiting:THREE.Group[]=[];
 private readonly frames=new THREE.Group();
 private readonly navy=new THREE.MeshStandardMaterial({color:0x182e3e,metalness:.56,roughness:.42});
 private readonly titanium=new THREE.MeshStandardMaterial({color:0x667783,metalness:.67,roughness:.41});
 private readonly ceramic=new THREE.MeshStandardMaterial({color:0xb9c7ca,metalness:.16,roughness:.62});
 private readonly brass=new THREE.MeshStandardMaterial({color:0xc4a37a,metalness:.71,roughness:.37});
 private readonly glass=new THREE.MeshStandardMaterial({color:0x3a6684,emissive:0x155b78,emissiveIntensity:.3,metalness:.28,roughness:.16});
 private readonly core=new THREE.MeshStandardMaterial({color:0xffd39d,emissive:0xf6a85e,emissiveIntensity:1.6,roughness:.5});

 constructor(scene:THREE.Scene){
  this.group.name='LUNA-7 · Planetary Science Observatory';
  this.buildGallery();
  this.buildSculpture();
  this.buildConsole();
  scene.add(this.group);
 }
 private box(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material){
  const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);obj.position.set(x,y,z);obj.receiveShadow=true;parent.add(obj);return obj;
 }
 private label(title:string,sub:string):THREE.Texture{
  const c=document.createElement('canvas');c.width=1024;c.height=416;
  const g=c.getContext('2d')!;g.fillStyle='#122635';g.fillRect(0,0,1024,416);
  g.fillStyle='#d9b786';g.fillRect(38,31,10,353);
  g.fillStyle='#e8f1f3';g.font='bold 70px sans-serif';g.fillText(title,80,188);
  g.fillStyle='#a8c9d5';g.font='33px sans-serif';g.fillText(sub,84,270);
  g.fillStyle='#82b8ce';g.fillRect(80,332,760,4);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
 }
 private buildGallery(){
  // Room at (17.5,17.5) 11m x 11m, with 3.6m south entry.
  for(const side of [-1,1]){
   this.box(this.group,17.5+side*4.6,3.75,17.5,.18,.28,9.2,this.navy);
   this.box(this.group,17.5+side*4.6,3.61,17.5,.09,.04,8.7,this.glass);
   this.box(this.group,17.5,3.66,17.5+side*4.5,9.2,.22,.18,this.titanium);
   this.box(this.group,17.5,3.52,17.5+side*4.5,8.6,.045,.07,this.brass);
  }
  // Quiet peripheral service station bays, keeping the 3.6m entrance open.
  for(const x of [13.3,21.7]){
   for(const z of [14.1,20.6]){
    const p=new THREE.Group();p.position.set(x,0,z);
    this.box(p,0,.68,0,.8,1.36,.7,this.navy);
    this.box(p,0,1.34,.15,.73,.32,.35,this.titanium);
    this.box(p,0,.85,.36,.59,.35,.05,this.glass);
    this.box(p,0,.47,.37,.34,.04,.05,this.brass);
    this.group.add(p);
   }
  }
  const title=new THREE.Mesh(new THREE.PlaneGeometry(3.5,1.43),new THREE.MeshBasicMaterial({map:this.label('PLANETARIUM','Discover our solar system')}));
  title.position.set(17.5,3.23,22.99);title.rotation.y=Math.PI;this.group.add(title);
  const light=new THREE.PointLight(0x7aaed0,1.05,12,2);
  light.position.set(17.5,3.7,17.5);this.group.add(light);
  const warm=new THREE.PointLight(0xe0af7a,.60,6,2);warm.position.set(17.5,3,19.5);this.group.add(warm);
  // Entry wayfinder above open north-side doorway.
  const entrance=new THREE.Mesh(new THREE.PlaneGeometry(3.20,.68),
   new THREE.MeshBasicMaterial({map:this.label('SPACE LAB','Solar system + experiments')}));
  entrance.position.set(17.5,3.55,12.24);this.group.add(entrance);
 }
 private buildSculpture(){
  const baseX=17.5,baseZ=18.2;
  this.box(this.group,baseX,.32,baseZ,4.6,.62,4.6,this.navy);
  this.box(this.group,baseX,.65,baseZ,4.3,.045,4.3,this.titanium);
  const assembly=new THREE.Group();assembly.position.set(baseX,1.62,baseZ);
  // Science sculpture held up by a single central mast.
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.10,.16,.88,16),this.titanium);
  mast.position.y=-.43;assembly.add(mast);
  const sun=new THREE.Mesh(new THREE.SphereGeometry(.41,28,20),this.core);
  sun.position.y=.08;assembly.add(sun);
  const radii=[.64,.86,1.10,1.35,1.62,1.82,2.02,2.19];
  const cols=[0x948a82,0xcbb78d,0x4e87b1,0xb57759,0xc19d7e,0xd0bc90,0x81bfcc,0x4d76b8];
  const sizes=[.058,.098,.10,.077,.23,.20,.15,.15];
  for(let i=0;i<8;i++){
   const ring=new THREE.Mesh(new THREE.TorusGeometry(radii[i],.012,5,88),this.glass);
   ring.rotation.x=Math.PI/2;ring.position.y=.025;assembly.add(ring);
   const pivot=new THREE.Group();pivot.rotation.y=i*1.12;assembly.add(pivot);
   const model=new THREE.Mesh(new THREE.SphereGeometry(sizes[i],14,12),
     new THREE.MeshStandardMaterial({color:cols[i],metalness:0,roughness:.72,emissive:cols[i],emissiveIntensity:.18}));
   model.position.set(radii[i],.025,0);pivot.add(model);
   if(i===5){
    const satRing=new THREE.Mesh(new THREE.RingGeometry(.26,.39,36),new THREE.MeshBasicMaterial({color:0xd5c4a5,side:THREE.DoubleSide,transparent:true,opacity:.75}));
    satRing.rotation.x=Math.PI*.34;model.add(satRing);
   }
   this.orbiting.push(pivot);
  }
  const glassPlatform=new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.35,.12,48),this.navy);
  glassPlatform.position.y=-.91;assembly.add(glassPlatform);
  this.group.add(assembly);
 }
 private buildConsole(){
  this.console.position.set(20.65,0,16.5);
  this.box(this.console,0,.65,0,1.24,1.30,.88,this.navy);
  this.box(this.console,0,1.27,-.17,1.42,.12,.95,this.titanium);
  const screenBase=this.box(this.console,0,1.69,-.20,1.35,.82,.13,this.navy);
  screenBase.rotation.x=-.29;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.7),new THREE.MeshBasicMaterial({map:this.label('EXPLORE','Choose a planet  [E]')}));
  screen.position.set(0,1.69,-.11);screen.rotation.x=-.29;this.console.add(screen);
  this.box(this.console,0,1.3,.25,.62,.042,.31,this.glass);
  this.group.add(this.console);
 }
 public update(dt:number){
  const t=Math.min(.08,Math.max(0,dt));
  this.orbiting.forEach((obj,i)=>{obj.rotation.y+=t*(.1+i*.009)});
 }
}
