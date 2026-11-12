import * as THREE from 'three';

/**
 * Art-directed station details. Deliberately visual-only: keeps movement/collision
 * and existing interactive consoles unchanged.
 */
export class LunarArtPass {
  private group = new THREE.Group();
  private structural = new THREE.MeshStandardMaterial({color:0x293e50,metalness:0.52,roughness:0.4});
  private satin = new THREE.MeshStandardMaterial({color:0xe0e6e7,metalness:0.18,roughness:0.47});
  private brass = new THREE.MeshStandardMaterial({color:0xb78d5a,metalness:0.69,roughness:0.38});
  private glass = new THREE.MeshPhysicalMaterial({color:0x25445b,metalness:0.25,roughness:0.18,clearcoat:0.8,transparent:true,opacity:0.82});

  constructor(scene:THREE.Scene) {
    this.group.name = 'MOONSHIFT — cinematic habitat art pass';
    this.buildRoomIdentity();
    this.buildArchitecturalLights();
    this.buildAstronautKeepsakes();
    scene.add(this.group);
  }

  private box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private labelTexture(heading:string,subtitle:string,accent:string) {
    const c = document.createElement('canvas');
    c.width=1024;c.height=384;
    const g=c.getContext('2d')!;
    g.fillStyle='#0e1a26';g.fillRect(0,0,1024,384);
    g.fillStyle=accent;g.fillRect(42,42,12,302);
    g.fillStyle='#e8f1f4';g.font='700 85px sans-serif';g.fillText(heading,86,183);
    g.fillStyle='#9cb8c7';g.font='36px sans-serif';g.fillText(subtitle,88,253);
    g.fillStyle=accent;g.fillRect(86,299,490,4);
    for(let i=0;i<16;i++){g.fillStyle=i%3===0?accent:'#416074';g.fillRect(616+i*22,309,9,15);}
    const tex=new THREE.CanvasTexture(c);
    tex.colorSpace=THREE.SRGBColorSpace;
    tex.anisotropy=4;
    return tex;
  }

  private sign(x:number,z:number,yaw:number,title:string,subtitle:string,color:string) {
    const group = new THREE.Group();
    group.position.set(x,3.15,z);
    group.rotation.y=yaw;
    const accent=new THREE.MeshStandardMaterial({color:new THREE.Color(color),emissive:new THREE.Color(color),emissiveIntensity:0.85,roughness:0.4});
    this.box(group,4.5,1.42,0.17,0,0,0,this.structural);
    this.box(group,4.17,1.13,0.025,0,0,0.102,new THREE.MeshBasicMaterial({map:this.labelTexture(title,subtitle,color)}));
    this.box(group,4.5,0.045,0.21,0,-0.71,0,accent);
    for(const offset of [-2.12,2.12]){
      this.box(group,0.06,1.4,0.25,offset,0,0, this.brass);
    }
    this.group.add(group);
  }

  private buildRoomIdentity() {
    // Elevated wayfinding, clear of all walkable passages and console interaction volumes.
    this.sign(0,-22.65,0,'POWER LAB','Sunlight • energy • batteries','#f1b66c');
    this.sign(22.8,0,-Math.PI/2,'LIFE SUPPORT','Air • water • breathing','#8fd4e5');
    this.sign(0,22.65,Math.PI,'SAFE SHELTER','Radiation • protection','#bea9ed');
    this.sign(-22.8,0,Math.PI/2,'GREENHOUSE','Plants • light • water','#a2d7a0');
  }

  private lightFixture(x:number,z:number,accent:number,width=3.6) {
    const cluster=new THREE.Group();
    cluster.position.set(x,4.02,z);
    this.box(cluster,width+0.35,0.18,0.7,0,0,0,this.structural);
    this.box(cluster,width,0.045,0.45,0,-0.12,0,new THREE.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:1.3,roughness:0.2}));
    for(let i=-2;i<=2;i++){
      this.box(cluster,0.045,0.13,0.75,(width/5)*i,0,0,this.brass);
    }
    this.group.add(cluster);
  }

  private buildArchitecturalLights() {
    const rooms=[
      {x:0,z:0,accent:0xcce8ec},{x:0,z:-17.5,accent:0xffc87f},
      {x:17.5,z:0,accent:0x81c9e5},{x:0,z:17.5,accent:0xb99ae9},
      {x:-17.5,z:0,accent:0xa9e1a9}
    ];
    for(const r of rooms) {
      this.lightFixture(r.x,r.z-3.0,r.accent);
      this.lightFixture(r.x,r.z+3.0,r.accent);
      // Slim layered beams give the ceiling volume and repeated purposeful rhythm.
      for(const zOffset of [-3.8,0,3.8]){
        this.box(this.group,6.3,0.12,0.13,r.x,3.9,r.z+zOffset,this.structural);
        this.box(this.group,6.05,0.025,0.12,r.x,3.82,r.z+zOffset,this.brass);
      }
    }
  }

  private buildAstronautKeepsakes() {
    const lounge = new THREE.Group();
    lounge.position.set(-5.6,0,4.4);
    // Small human-scale reading corner tucked against the central hub wall.
    this.box(lounge,1.75,0.13,0.65,0,0.48,0,this.satin);
    this.box(lounge,1.75,0.68,0.12,0,0.92,0.27,this.structural);
    for(const x of [-0.72,0.72])this.box(lounge,0.13,0.50,0.59,x,0.22,0,this.structural);
    this.box(lounge,0.58,0.46,0.39,-0.6,0.8,0.16,new THREE.MeshStandardMaterial({color:0x567b86,roughness:0.82}));
    // A travel journal and a warm reading lamp.
    this.box(lounge,0.49,0.045,0.38,0.52,0.56,-0.08,this.brass);
    this.box(lounge,0.15,0.43,0.15,0.95,0.85,-0.32,this.satin);
    this.box(lounge,0.26,0.13,0.23,0.95,1.09,-0.32,new THREE.MeshStandardMaterial({color:0xe6c48f,emissive:0xe6b77d,emissiveIntensity:0.9}));
    this.group.add(lounge);

    const memory = new THREE.Group();
    memory.position.set(-6.69,2.48,2.4);
    memory.rotation.y=Math.PI/2;
    this.box(memory,1.3,1.0,0.1,0,0,0,this.brass);
    this.box(memory,1.17,0.87,0.02,0,0,0.08,this.glass);
    this.box(memory,0.74,0.31,0.025,0,0.03,0.1,new THREE.MeshBasicMaterial({map:this.labelTexture('HOME','EARTH','#91b9d9')}));
    this.group.add(memory);
  }
}
