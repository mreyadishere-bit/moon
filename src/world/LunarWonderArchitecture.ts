import * as THREE from 'three';

/**
 * LUNAR WONDER / Architectural detail kit
 * All elements are decorative, placed above player height or flush to boundaries;
 * the existing collision mesh and open door spans remain authoritative.
 * One consistent family of reusable PBR materials and instanced details.
 */
export class LunarWonderArchitecture {
  private root=new THREE.Group();
  private graphite=new THREE.MeshStandardMaterial({color:0x27343f,metalness:0.65,roughness:0.46});
  private graphiteDark=new THREE.MeshStandardMaterial({color:0x131e2b,metalness:0.57,roughness:0.56});
  private titanium=new THREE.MeshStandardMaterial({color:0x66737f,metalness:0.78,roughness:0.38});
  private ceramic=new THREE.MeshStandardMaterial({color:0xd1d7dc,metalness:0.21,roughness:0.6});
  private champagne=new THREE.MeshStandardMaterial({color:0xb99d78,metalness:0.68,roughness:0.39});
  private orange=new THREE.MeshStandardMaterial({color:0xf2a85b,emissive:0xd27f31,emissiveIntensity:0.53,roughness:0.4});
  private blue=new THREE.MeshStandardMaterial({color:0x7abedb,emissive:0x3a93b6,emissiveIntensity:0.85,roughness:0.33});
  private rubbers=new THREE.MeshStandardMaterial({color:0x111923,metalness:0.1,roughness:0.92});
  private solar=new THREE.MeshStandardMaterial({color:0x203749,metalness:0.47,roughness:0.24});
  private cube=new THREE.BoxGeometry(1,1,1);
  private cyl=new THREE.CylinderGeometry(1,1,1,12);
  private boltGeo=new THREE.CylinderGeometry(0.026,0.026,0.016,6);
  private rooms=[
    {x:0,z:0,w:14,d:14,h:4.4,accent:'hub' as const},
    {x:0,z:-17.5,w:13,d:11,h:4.4,accent:'power' as const},
    {x:17.5,z:0,w:11,d:13,h:4.4,accent:'air' as const},
    {x:0,z:17.5,w:13,d:11,h:4.4,accent:'shelter' as const},
    {x:-17.5,z:0,w:11,d:13,h:4.4,accent:'plants' as const},
  ];
  constructor(scene:THREE.Scene){
    this.root.name='Lunar Wonder — integrated environmental architecture';
    for(const room of this.rooms) this.constructModule(room);
    this.buildExhibitScreens();
    scene.add(this.root);
  }
  private part(x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material,parent=this.root){
    const m=new THREE.Mesh(this.cube,mat);
    m.position.set(x,y,z);m.scale.set(w,h,d);
    m.receiveShadow=true;
    parent.add(m);return m;
  }
  private pipe(a:THREE.Vector3,b:THREE.Vector3,r:number,mat:THREE.Material){
    const diff=new THREE.Vector3().subVectors(b,a);
    const obj=new THREE.Mesh(this.cyl,mat);
    obj.position.copy(a).add(b).multiplyScalar(.5);
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.clone().normalize());
    obj.scale.set(r,diff.length(),r);
    this.root.add(obj);
  }
  private constructModule(room:{x:number;z:number;w:number;d:number;h:number;accent:'hub'|'power'|'air'|'shelter'|'plants'}){
    const {x,z,w,d,h,accent}=room;
    const ox=w/2-0.22,oz=d/2-0.22;
    const light=accent==='plants'?this.orange:accent==='power'?this.orange:accent==='shelter'?this.champagne:this.blue;
    // Deep structural wall articulation. Walls retain large, readable voids at entrances.
    const onEastWest=(side:number)=>{
      const wx=x+side*ox;
      this.part(wx,1.55,z,0.14,2.5,0.15,this.graphiteDark);
      for(let k=-1;k<=1;k++){
        if(k===0)continue; // no beam covering the approach to any door.
        const wz=z+k*(d*.315);
        this.part(wx-side*.08,h/2,wz,.17,h-.28,.24,this.graphite);
        this.part(wx-side*.16,h-.23,wz,.21,.16,.3,this.titanium);
        this.part(wx-side*.17,1.44,wz,.055,1.8,.1,this.ceramic);
        this.part(wx-side*.23,1.44,wz,.038,1.4,.065,light);
        this.part(wx-side*.11,2.95,wz,.14,.12,1.2,this.champagne);
      }
      // Long fascia is elevated and narrow, never blocks a player.
      this.part(wx-side*.07,h-.4,z,.18,.22,d-.5,this.graphite);
      this.part(wx-side*.16,h-.48,z,.07,.035,d-.7,this.orange);
    };
    for(const side of [-1,1])onEastWest(side);
    const onNorthSouth=(side:number)=>{
      const wz=z+side*oz;
      for(let k=-1;k<=1;k++){
        if(k===0)continue;
        const wx=x+k*w*.315;
        this.part(wx,h/2,wz,.24,h-.28,.17,this.graphite);
        this.part(wx,h-.24,wz-side*.08,.28,.14,.19,this.titanium);
        this.part(wx,1.45,wz-side*.16,.10,1.7,.065,this.ceramic);
        this.part(wx,1.45,wz-side*.23,.06,1.33,.035,light);
      }
      this.part(x,h-.39,wz-side*.08,w-.5,.22,.18,this.graphite);
      this.part(x,h-.47,wz-side*.16,w-.75,.037,.06,this.orange);
    };
    for(const side of [-1,1])onNorthSouth(side);
    // Suspended modular ceiling frame and insulated heat/service pipes, all overhead.
    for(const dz of [-d*.31,d*.31]){
      this.part(x,h-.28,z+dz,w-.55,.16,.18,this.titanium);
      this.part(x,h-.36,z+dz,w-.9,.035,.09,light);
    }
    for(const dx of [-w*.3,w*.3]){
      this.part(x+dx,h-.35,z,.18,.22,d-.55,this.graphiteDark);
      this.part(x+dx,h-.48,z,.06,.07,d-.72,this.blue);
    }
    // Human-scale ceiling service conduits and riveted struts.
    for(const dx of [-w*.405,w*.405]){
      this.pipe(new THREE.Vector3(x+dx,h-.32,z-d*.35),new THREE.Vector3(x+dx,h-.32,z+d*.35),.07,this.titanium);
      this.pipe(new THREE.Vector3(x+dx+.13,h-.34,z-d*.35),new THREE.Vector3(x+dx+.13,h-.34,z+d*.35),.043,this.champagne);
    }
    // Inlaid floor service rails along wall boundaries; stay outside walkable path.
    for(const side of [-1,1]){
      this.part(x+side*(w/2-.62),.045,z,.37,.04,d-1.1,this.graphiteDark);
      this.part(x,.045,z+side*(d/2-.62),w-1.1,.04,.37,this.graphiteDark);
      this.part(x+side*(w/2-.86),.045,z,.045,.017,d-1.4,this.champagne);
    }
    // Purposeful mechanical fasteners instanced as one draw call, not hundreds.
    const count=32;
    const bolts=new THREE.InstancedMesh(this.boltGeo,this.titanium,count);
    const dummy=new THREE.Object3D();
    for(let i=0;i<count;i++){
      const side=i%4,along=Math.floor(i/4),t=along/7;
      const lx=side<2?x+(side===0?-w/2+.38:w/2-.38):x+(t-.5)*(w-1.8);
      const lz=side>=2?z+(side===2?-d/2+.38:d/2-.38):z+(t-.5)*(d-1.8);
      dummy.position.set(lx,.072,lz);
      dummy.rotation.set(Math.PI/2,0,0);
      dummy.updateMatrix();bolts.setMatrixAt(i,dummy.matrix);
    }
    this.root.add(bolts);
    // Functional infrastructure: separate module mood without arbitrary neon rainbows.
    if(accent==='air'){
      this.buildVent(x+w*.32,z-d*.30,h);
    }else if(accent==='power'){
      this.buildPowerRack(x+w*.35,z-d*.25);
    }else if(accent==='plants'){
      this.buildGreenhouseWarmth(x-w*.32,z+d*.29);
    }else if(accent==='shelter'){
      this.buildShelterCache(x+w*.29,z+d*.31);
    }else{
      this.buildHubMemoryDisplay(x-w*.33,z+d*.34);
    }
  }
  private buildVent(x:number,z:number,h:number){
    const p=new THREE.Group();p.position.set(x,2.2,z);
    const back=this.part(0,0,0,1.6,1.33,.18,this.graphiteDark,p);
    back.rotation.y=0;
    this.part(0,.53,.14,1.5,.09,.1,this.champagne,p);
    for(let i=-4;i<=4;i++)this.part(0,i*.11,.14,1.32,.045,.07,this.titanium,p);
    this.part(0,-.57,.15,.98,.08,.1,this.blue,p);
    this.root.add(p);
  }
  private buildPowerRack(x:number,z:number){
    // Attached to outside service wall; keep central interaction corridor free.
    const p=new THREE.Group();p.position.set(x,1.8,z);
    this.part(0,0,0,1.55,2.2,.4,this.graphiteDark,p);
    for(let i=0;i<4;i++){
      const yy=.82-i*.53;
      this.part(0,yy,.22,1.36,.38,.035,this.solar,p);
      this.part(-.57,yy,.245,.06,.25,.04,i===0?this.orange:this.blue,p);
      for(let k=0;k<3;k++)this.part(-.26+k*.26,yy-.13,.25,.16,.018,.02,this.champagne,p);
    }
    this.root.add(p);
  }
  private buildGreenhouseWarmth(x:number,z:number){
    const p=new THREE.Group();p.position.set(x,2,z);
    this.part(0,0,0,1.66,1.75,.28,this.graphite,p);
    this.part(0,.3,.16,1.42,.8,.04,new THREE.MeshStandardMaterial({color:0x173f35,roughness:.38,metalness:.12,emissive:0x124e30,emissiveIntensity:.25}),p);
    for(let i=0;i<4;i++){
      this.part(-.51+i*.35,-.2,.19,.055,.36,.035,this.champagne,p);
      this.part(-.51+i*.35,0,.2,.26,.17,.035,new THREE.MeshStandardMaterial({color:0x528d69,roughness:.8}),p);
    }
    this.part(0,-.54,.18,1.46,.12,.12,this.orange,p);
    this.root.add(p);
  }
  private buildShelterCache(x:number,z:number){
    const p=new THREE.Group();p.position.set(x,2,z);
    this.part(0,0,0,1.5,1.7,.34,this.graphite,p);
    for(let j=0;j<3;j++){
      this.part(0,-.56+j*.54,.19,1.28,.38,.05,this.titanium,p);
      this.part(-.55,-.56+j*.54,.24,.08,.21,.04,this.orange,p);
    }
    this.root.add(p);
  }
  private buildHubMemoryDisplay(x:number,z:number){
    const p=new THREE.Group();p.position.set(x,2.35,z);
    this.part(0,0,0,1.72,1.08,.12,this.graphite,p);
    this.part(0,0,.07,1.58,.95,.04,this.solar,p);
    const tex=this.createDiagramTexture('HOME IS UP HERE','Earth • Lunar surface • LUNA-7');
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.48,.84),new THREE.MeshBasicMaterial({map:tex}));
    panel.position.set(0,0,.101);p.add(panel);
    this.root.add(p);
  }
  private buildExhibitScreens(){
    // Floor-level interaction affordance in the central hub, using premium
    // monochromatic markings rather than random neon or a fake UI.
    const legend=this.createDiagramTexture('WELCOME TO LUNA-7','Explore. Experiment. Protect our home.');
    const mat=new THREE.MeshBasicMaterial({map:legend,side:THREE.DoubleSide});
    const board=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.72),mat);
    board.position.set(0,3.12,6.63);board.rotation.y=Math.PI;
    this.root.add(board);
  }
  private createDiagramTexture(head:string,sub:string){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
    const c=canvas.getContext('2d')!;
    c.fillStyle='#122432';c.fillRect(0,0,1024,512);
    c.fillStyle='#d5b68a';c.fillRect(52,56,9,398);
    c.fillStyle='#eef0ec';c.font='bold 63px sans-serif';c.fillText(head,92,218);
    c.fillStyle='#9cc6d8';c.font='32px sans-serif';c.fillText(sub,92,305);
    c.fillStyle='#9fb5c6';c.fillRect(92,374,785,3);
    c.fillStyle='#d5b68a';c.fillRect(92,374,285,3);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    tex.anisotropy=4;return tex;
  }
}
