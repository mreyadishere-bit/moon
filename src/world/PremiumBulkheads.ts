import * as THREE from 'three';

/** Art-directed, soft-beveled octagonal bulkhead casings.
 * Architectural dressing only: gameplay doors and collisions remain owned by
 * HabitatBuilder and CollisionSystem. Inner clear width 3.8m > actual 3.6m
 * door opening, so the model does not narrow the traversable entrance.
 */
export class PremiumBulkheads {
  private readonly root=new THREE.Group();
  private readonly frameMat=new THREE.MeshStandardMaterial({color:0x5c6b7b,metalness:.79,roughness:.41});
  private readonly shadowMat=new THREE.MeshStandardMaterial({color:0x1b2a38,metalness:.57,roughness:.55});
  private readonly trimMat=new THREE.MeshStandardMaterial({color:0xafa09a,metalness:.75,roughness:.39});
  private readonly softWhite=new THREE.MeshStandardMaterial({color:0xc5d9e1,emissive:0x688ba8,emissiveIntensity:.6,roughness:.23});
  private readonly warmWhite=new THREE.MeshStandardMaterial({color:0xf4c189,emissive:0xd9a366,emissiveIntensity:.85,roughness:.23});
  private readonly status=new THREE.MeshStandardMaterial({color:0x86cfaf,emissive:0x4daa88,emissiveIntensity:1.0,roughness:.23});
  private readonly boltGeometry=new THREE.CylinderGeometry(.026,.026,.024,8);
  constructor(scene:THREE.Scene){
    this.root.name='Lunar Wonder / sculpted bulkhead framing';
    const portals=[
      {x:0,z:-7,rotation:0,accent:'amber'},
      {x:0,z:-12,rotation:0,accent:'amber'},
      {x:7,z:0,rotation:Math.PI/2,accent:'blue'},
      {x:12,z:0,rotation:Math.PI/2,accent:'blue'},
      {x:0,z:7,rotation:0,accent:'blue'},
      {x:0,z:12,rotation:0,accent:'blue'},
      {x:-7,z:0,rotation:Math.PI/2,accent:'amber'},
      {x:-12,z:0,rotation:Math.PI/2,accent:'amber'},
    ];
    for(const p of portals)this.makeDoorFrame(p.x,p.z,p.rotation,p.accent==='amber'?this.warmWhite:this.softWhite);
    scene.add(this.root);
  }
  private archShape(outerWidth:number,height:number,insideWidth:number,insideHeight:number){
    // beveled outer jamb cut corners; generous rectilinear inner clearance.
    const s=new THREE.Shape();
    const x=outerWidth/2,y0=.03,y1=height;
    const chamfer=.42;
    s.moveTo(-x+chamfer,y0);s.lineTo(x-chamfer,y0);
    s.lineTo(x,y0+chamfer);s.lineTo(x,y1-chamfer);
    s.lineTo(x-chamfer,y1);s.lineTo(-x+chamfer,y1);
    s.lineTo(-x,y1-chamfer);s.lineTo(-x,y0+chamfer);
    s.closePath();
    const hole=new THREE.Path();
    const inner=insideWidth/2,base=-.3,top=insideHeight;
    // Intentionally no bottom sill, so player passes unobstructed.
    hole.moveTo(-inner,base);hole.lineTo(-inner,top-.20);
    hole.lineTo(-inner+.20,top);hole.lineTo(inner-.20,top);
    hole.lineTo(inner,top-.20);hole.lineTo(inner,base);hole.closePath();
    s.holes.push(hole);
    return s;
  }
  private shapeMesh(width:number,h:number,innerWidth:number,innerH:number,thick:number,mat:THREE.Material){
    const geom=new THREE.ExtrudeGeometry(this.archShape(width,h,innerWidth,innerH),{
      depth:thick,steps:1,bevelEnabled:true,bevelSize:.045,bevelThickness:.033,bevelSegments:2,curveSegments:6
    });
    geom.translate(0,0,-thick/2);
    return new THREE.Mesh(geom,mat);
  }
  private stick(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  private makeDoorFrame(x:number,z:number,rot:number,accent:THREE.Material){
    const p=new THREE.Group();
    p.position.set(x,0,z);p.rotation.y=rot;
    const back=this.shapeMesh(4.87,3.87,3.84,3.30,.39,this.shadowMat);
    const middle=this.shapeMesh(4.69,3.78,3.87,3.33,.31,this.frameMat);
    const front=this.shapeMesh(4.53,3.70,3.91,3.34,.14,this.trimMat);
    back.position.z=-.08;middle.position.z=.065;front.position.z=.23;
    for(const [m,shadow] of [[back,false],[middle,false],[front,false]] as [THREE.Mesh,boolean][]){
      m.castShadow=shadow;m.receiveShadow=true;p.add(m);
    }
    // Integrated aperture corner indicators on the frame, NOT inside passage.
    for(const side of [-1,1]){
      this.stick(p,side*2.12,2.06,.36,.085,1.0,.055,accent);
      this.stick(p,side*2.08,3.46,.37,.12,.12,.06,this.status);
      this.stick(p,side*2.27,1.55,.31,.29,.48,.12,this.shadowMat);
      this.stick(p,side*2.27,1.57,.38,.20,.31,.038,this.softWhite);
      for(let i=0;i<3;i++){
        this.stick(p,side*2.265,1.48+i*.074,.41,.14,.028,.025,this.status);
      }
    }
    this.stick(p,0,3.59,.37,2.1,.07,.055,accent);
    // Embedded mechanical hinge pins and fasteners.
    const pts=[[-2.33,.58],[2.33,.58],[-2.33,2.55],[2.33,2.55],[-1.47,3.61],[1.47,3.61]];
    for(const [bx,by] of pts){
      const bolt=new THREE.Mesh(this.boltGeometry,this.shadowMat);
      bolt.rotation.x=Math.PI/2;bolt.position.set(bx,by,.38);
      p.add(bolt);
    }
    this.root.add(p);
  }
}
