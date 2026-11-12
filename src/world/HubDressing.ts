import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Central Habitat furniture, designed around the actual navigable floorplan.
 *
 * Doors have 3.6m clear spans centered on each wall. All dressing is positioned
 * 3.2m or farther from the respective central doorway. Existing collision
 * bounds for the workstation and window bench are deliberately respected.
 */
export class HubDressing {
  readonly root = new THREE.Group();
  readonly telescope: THREE.Object3D;
  readonly telescopePosition = new THREE.Vector3(4.80, 1.36, -5.82);

  private readonly shell = new THREE.MeshStandardMaterial({color: 0x384957, metalness: .56, roughness: .48});
  private readonly structural = new THREE.MeshStandardMaterial({color: 0x162734, metalness: .67, roughness: .49});
  private readonly panel = new THREE.MeshStandardMaterial({color: 0xaebac0, metalness: .24, roughness: .63});
  private readonly trim = new THREE.MeshStandardMaterial({color: 0xc4a578, metalness: .7, roughness: .4});
  private readonly cushion = new THREE.MeshStandardMaterial({color: 0x5e7382, metalness: .02, roughness: .87});
  private readonly ceramic = new THREE.MeshStandardMaterial({color: 0xdbdfd7, metalness: .05, roughness: .77});
  private readonly glass = new THREE.MeshPhysicalMaterial({color: 0x6696aa, metalness: .16, roughness: .19, clearcoat: .45});
  private readonly live = new THREE.MeshStandardMaterial({color: 0x86beca, emissive: 0x4a849e, emissiveIntensity: .55, metalness:.17, roughness:.4});
  private readonly textile = new THREE.MeshStandardMaterial({color: 0x9d6f53, metalness: .02, roughness: .86});
  private readonly foliage = new THREE.MeshStandardMaterial({color: 0x588b6b, metalness: 0, roughness: .9, side:THREE.DoubleSide});

  constructor(scene: THREE.Scene) {
    this.root.name='LUNA-7 / lived-in central habitat';
    this.buildCrewWorkstation();
    this.buildObservationBench();
    this.buildStorageNiche();
    this.buildCrewMemories();
    scene.add(this.root);
    this.telescope = this.buildTelescope();
  }

  private box(parent:THREE.Object3D, x:number,y:number,z:number, w:number,h:number,d:number, material:THREE.Material, radius=0){
    const geo=radius>0?new RoundedBoxGeometry(w,h,d,2,Math.min(radius,w/4,h/4,d/4)):new THREE.BoxGeometry(w,h,d);
    const mesh=new THREE.Mesh(geo,material);
    mesh.position.set(x,y,z);mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  private rod(parent:THREE.Object3D, a:THREE.Vector3,b:THREE.Vector3,r:number,mat:THREE.Material) {
    const length=a.distanceTo(b);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,length,10),mat);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
    parent.add(mesh);
    return mesh;
  }
  private screenTexture(head:string,subtitle:string,accent='#83bdce') {
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=576;
    const c=canvas.getContext('2d')!;
    c.fillStyle='#101f2e';c.fillRect(0,0,1024,576);
    const g=c.createLinearGradient(0,0,1024,0);g.addColorStop(0,'#234357');g.addColorStop(1,'#0e1d29');
    c.fillStyle=g;c.fillRect(30,32,964,510);
    c.fillStyle=accent;c.fillRect(55,62,13,425);
    c.fillStyle='#bcd1d9';c.font='600 37px Arial, sans-serif';c.fillText('LUNA-7  /  CREW SYSTEMS',95,126);
    c.fillStyle='#eff4f1';c.font='bold 79px Arial, sans-serif';c.fillText(head,91,260);
    c.fillStyle='#a4c2cd';c.font='36px Arial, sans-serif';c.fillText(subtitle,96,337);
    c.strokeStyle='rgba(168,209,223,.25)';c.lineWidth=3;
    for(let i=0;i<5;i++) {c.beginPath();c.moveTo(95,396+i*21);c.lineTo(823-i*67,396+i*21);c.stroke();}
    c.fillStyle=accent;c.fillRect(95,493,530,5);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
  }
  private display(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,title:string,sub:string) {
    this.box(parent,x,y,z,w+.10,h+.10,.15,this.structural,.045);
    const texture=this.screenTexture(title,sub);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));
    screen.position.set(x,y,z+.084);parent.add(screen);
  }

  private buildCrewWorkstation(){
    // Within existing static collision: x[3.2,5.6], z[4.8,6.5].
    const group=new THREE.Group();group.position.set(4.35,0,5.78);
    this.box(group,0,.80,0,2.30,.095,1.12,this.panel,.04);
    this.box(group,-.92,.41,-.08,.39,.76,.93,this.shell,.045);
    this.box(group,.92,.41,-.08,.39,.76,.93,this.shell,.045);
    this.box(group,0,.74,-.46,2.34,.075,.08,this.trim);
    for (let i=0;i<3;i++) {
      const z=.12+i*.18;
      this.box(group,-.92,.27+i*.20,z,.31,.10,.022,this.structural);
      this.box(group,.92,.27+i*.20,z,.31,.10,.022,this.structural);
    }
    // Angled matte monitor, not a block with an untextured colored screen.
    const mount=new THREE.Group();mount.position.set(-.46,1.24,-.24);mount.rotation.x=-.19;
    this.display(mount,0,0,0,.72,.48,'CREW LOG','ALL SYSTEMS CHECK');
    group.add(mount);
    this.box(group,.33,.93,-.18,.46,.22,.30,this.structural,.025);
    this.box(group,.33,1.065,-.18,.35,.055,.23,this.glass,.017);
    // Lightweight mug and habitat journal humanize the room without obstruction.
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(.075,.062,.14,12),this.ceramic);
    cup.position.set(.85,.96,.25);group.add(cup);
    this.box(group,-.40,.88,.23,.43,.045,.34,this.textile,.025);
    this.root.add(group);
  }

  private buildObservationBench() {
    // Align with the existing north-east lounge collider, x[2.6,5.4].
    const group=new THREE.Group();group.position.set(3.95,0,-5.98);
    this.box(group,0,.44,0,2.64,.12,.70,this.shell,.06);
    this.box(group,0,.54,.02,2.48,.17,.62,this.cushion,.075);
    this.box(group,0,.86,.34,2.51,.60,.10,this.panel,.038);
    for(const x of [-1.12,1.12]){
      this.box(group,x,.22,-.04,.13,.42,.62,this.structural,.02);
      this.box(group,x,.56,0,.13,.22,.74,this.trim,.02);
    }
    // Tight reading lamp, mounted inside silhouette of the lounge.
    this.box(group,-1.12,1.05,.31,.20,.15,.25,this.ceramic,.06);
    const readingLight=new THREE.PointLight(0xffd0a0,.37,2.8,2);
    readingLight.position.set(-1.12,1.0,.25);group.add(readingLight);
    this.root.add(group);
  }

  private buildStorageNiche(){
    // Replace the former giant black cabinets across the western airlock.
    // Storage now sits entirely past z>3.5, well clear of the z±1.8 door.
    const group=new THREE.Group();group.position.set(-6.12,0,4.78);
    group.rotation.y=Math.PI/2;
    const total=2.06, lockerWidth=.65;
    this.box(group,0,1.34,0,total,2.68,.57,this.structural,.035);
    this.box(group,0,2.72,.02,2.20,.09,.69,this.trim,.035);
    for(let i=0;i<3;i++){
      const x=-.67+i*.67;
      this.box(group,x,1.34,.32,.60,2.42,.045,this.shell,.02);
      this.box(group,x,2.41,.36,.46,.17,.023,this.panel,.016);
      this.box(group,x+.19,1.33,.37,.03,.36,.018,this.trim,.01);
      for(let j=0;j<4;j++)this.box(group,x,1.98-j*.065,.364,.30,.016,.008,this.structural);
      this.box(group,x,.18,.353,.43,.035,.03,this.live);
    }
    this.root.add(group);
  }

  private buildCrewMemories(){
    // A compact wall-mounted personal-photo exhibition in the south-west
    // quadrant, away from any circulation / interaction envelope.
    const wall=new THREE.Group();wall.position.set(-4.70,2.30,6.63);
    this.box(wall,0,0,0,2.3,1.06,.10,this.structural,.05);
    this.box(wall,0,0,.067,2.14,.90,.025,this.shell,.035);
    this.box(wall,0,-.34,.089,1.95,.055,.015,this.trim);
    const tex=this.screenTexture('OUR HOME','Maya  •  Leo  •  PIX');
    const pic=new THREE.Mesh(new THREE.PlaneGeometry(1.86,.73),new THREE.MeshBasicMaterial({map:tex}));
    pic.position.set(0,.03,.088);wall.add(pic);
    this.root.add(wall);
    // Potted greenery is in the pressurized interior only.
    const group=new THREE.Group();group.position.set(-5.25,0,5.76);
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.20,.145,.38,12),this.ceramic);
    pot.position.y=.24;group.add(pot);
    for(let i=0;i<7;i++){
      const a=i*Math.PI*2/7,xx=Math.cos(a),zz=Math.sin(a);
      this.rod(group,new THREE.Vector3(0,.40,0),new THREE.Vector3(xx*.12,.77+(.08*Math.sin(i)),zz*.12),.025,this.foliage);
      const leaf=new THREE.Mesh(new THREE.SphereGeometry(.16,9,7),this.foliage);
      leaf.position.set(xx*.20,.79+(.06*Math.sin(i)),zz*.20);leaf.scale.set(.66,1.5,.40);leaf.rotation.z=-xx*.5;group.add(leaf);
    }
    this.root.add(group);
  }

  private buildTelescope(){
    // Observational device next to the window, not a billboard: barrel points
    // toward the lunar exterior; physical interaction is retained.
    const group=new THREE.Group();group.position.set(4.85,0,-5.42);
    this.box(group,0,.10,0,.46,.19,.40,this.structural,.04);
    this.rod(group,new THREE.Vector3(0,.22,0),new THREE.Vector3(0,1.27,0),.054,this.panel);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.13,.18,.76,16),this.shell);
    barrel.rotation.x=Math.PI/2-.12;barrel.position.set(0,1.36,-.17);
    group.add(barrel);
    const objective=new THREE.Mesh(new THREE.CylinderGeometry(.153,.153,.055,20),this.glass);
    objective.rotation.x=Math.PI/2-.12;objective.position.set(0,1.41,-.55);
    group.add(objective);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.153,.018,8,20),this.trim);
    ring.position.copy(objective.position);group.add(ring);
    this.root.add(group);
    return barrel;
  }
}
