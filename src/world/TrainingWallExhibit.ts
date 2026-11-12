import * as THREE from 'three';

/**
 * Wall-mounted physical science exhibit in Central Habitat. Placed against an
 * existing collision wall (east x=6.8), without entering the walkable center.
 * Uses the same material, light and signage grammar as the Lunar Wonder art bible.
 */
export class TrainingWallExhibit {
  public readonly group=new THREE.Group();
  public readonly interactionPoint=new THREE.Vector3(6.05,1.65,4.2);
  private labelTexture:THREE.CanvasTexture;

  constructor(scene:THREE.Scene) {
    this.group.name='Astronaut Science Academy — interact with E';
    this.group.position.set(6.52,1.85,4.2);
    this.group.rotation.y=-Math.PI/2;

    const graphite=new THREE.MeshStandardMaterial({color:0x1a2f3d,metalness:0.54,roughness:0.37});
    const ceramic=new THREE.MeshStandardMaterial({color:0xd5dedf,metalness:0.18,roughness:0.54});
    const champagne=new THREE.MeshStandardMaterial({color:0xc2a37c,metalness:0.66,roughness:0.35});
    const blue=new THREE.MeshStandardMaterial({color:0x77b7c9,emissive:0x77b7c9,emissiveIntensity:0.78,metalness:0.12,roughness:0.4});
    const mesh=(geo:THREE.BufferGeometry,mat:THREE.Material,x=0,y=0,z=0)=>{
      const item=new THREE.Mesh(geo,mat);item.position.set(x,y,z);this.group.add(item);return item;
    };
    // Flush against the existing wall to avoid obstructing player movement.
    mesh(new THREE.BoxGeometry(2.7,1.85,.13),graphite,0,0,0);
    mesh(new THREE.BoxGeometry(2.58,1.74,.05),ceramic,0,0,.075);
    mesh(new THREE.BoxGeometry(2.42,1.56,.055),graphite,0,0,.115);
    for(const x of [-1.22,1.22])mesh(new THREE.BoxGeometry(.055,1.77,.13),champagne,x,0,.095);
    mesh(new THREE.BoxGeometry(2.42,.04,.095),blue,0,-.79,.14);
    mesh(new THREE.BoxGeometry(2.42,.045,.095),blue,0,.79,.14);
    for(const x of [-.9,-.72,-.54])mesh(new THREE.BoxGeometry(.1,.04,.05),champagne,x,-.63,.19);

    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=640;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('TrainingWallExhibit requires 2D canvas');
    ctx.fillStyle='#0d2130';ctx.fillRect(0,0,1024,640);
    const grd=ctx.createLinearGradient(0,0,1024,640);grd.addColorStop(0,'#24485c');grd.addColorStop(1,'#10283b');
    ctx.fillStyle=grd;ctx.fillRect(32,34,960,575);
    ctx.strokeStyle='rgba(168,215,225,.32)';ctx.lineWidth=3;ctx.strokeRect(45,48,932,546);
    ctx.fillStyle='#d9b88d';ctx.font='bold 30px sans-serif';ctx.fillText('LUNA-7 • LEARNING LAB',84,120);
    ctx.fillStyle='#eaf6fa';ctx.font='bold 84px sans-serif';ctx.fillText('SCIENCE',78,240);ctx.fillText('ACADEMY',78,340);
    ctx.fillStyle='#a8c6d7';ctx.font='32px sans-serif';ctx.fillText('Play • Explore • Experiment • Decide',84,420);
    ctx.fillStyle='#8bd2df';ctx.fillRect(84,468,602,8);
    ctx.fillStyle='#e2f0f3';ctx.font='bold 32px sans-serif';ctx.fillText('PRESS E TO BEGIN',84,534);
    this.labelTexture=new THREE.CanvasTexture(canvas);
    this.labelTexture.colorSpace=THREE.SRGBColorSpace;
    this.labelTexture.anisotropy=4;
    mesh(new THREE.PlaneGeometry(2.22,1.4),new THREE.MeshBasicMaterial({map:this.labelTexture}),0,.04,.17);
    scene.add(this.group);
  }
}
