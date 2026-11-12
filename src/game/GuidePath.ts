import { CollisionSystem } from './CollisionSystem';

/**
 * Lightweight 2-D navigation for the station's contextual floor guidance.
 * Uses the *same* wall and prop colliders as the player, with proximity-open
 * doors considered traversable. Routing stays in the pressurized habitat;
 * it never projects a trail through the central table or through solid walls.
 */
export interface GuidePoint { x:number; z:number }

const MIN=-23.4;
const STEP=0.6;
const SIZE=79;
const RADIUS=0.42;
const INDEX=(x:number,z:number)=>z*SIZE+x;

export const insidePressurizedHabitat=(x:number,z:number):boolean => (
  (Math.abs(x)<=6.72 && Math.abs(z)<=6.72) ||
  (Math.abs(x)<=1.83 && z>=-12.1 && z<=-6.7) ||
  (Math.abs(x)<=6.22 && z>=-22.72 && z<=-11.9) ||
  (Math.abs(z)<=1.83 && x>=6.7 && x<=12.1) ||
  (Math.abs(z)<=6.22 && x>=11.9 && x<=22.72) ||
  (Math.abs(x)<=1.83 && z>=6.7 && z<=12.1) ||
  (Math.abs(x)<=6.22 && z>=11.9 && z<=22.72) ||
  (Math.abs(x-17.5)<=1.74 && z>=6.25 && z<=12.3) ||
  (Math.abs(x-17.5)<=5.22 && Math.abs(z-17.5)<=5.22) ||
  (Math.abs(z)<=1.83 && x>=-12.1 && x<=-6.7) ||
  (Math.abs(z)<=6.22 && x>=-22.72 && x<=-11.9)
);

const coord=(i:number)=>MIN+i*STEP;
const gridPos=(point:GuidePoint):[number,number]=>[
  Math.max(0,Math.min(SIZE-1,Math.round((point.x-MIN)/STEP))),
  Math.max(0,Math.min(SIZE-1,Math.round((point.z-MIN)/STEP)))
];

const distSq=(a:GuidePoint,b:GuidePoint)=>(a.x-b.x)**2+(a.z-b.z)**2;

export function createStationGuidePath(
  start:GuidePoint, goal:GuidePoint, maxPoints=100,
):GuidePoint[] {
  const collision=new CollisionSystem();
  for(let i=0;i<4;i++)collision.setDoorOpenFactor(i,1);
  const valid=(x:number,z:number)=>insidePressurizedHabitat(x,z)&&collision.isPointValid(x,z,RADIUS);
  const [sx,sz]=gridPos(start),[gx,gz]=gridPos(goal);
  // Snap to the closest legal grid cell, handling a player standing beside
  // a table and interactables located at their physical pedestal boundaries.
  const nearest=(ix:number,iz:number):number=>{
    let best=-1,score=Infinity;
    for(let radius=0;radius<=6;radius++){
      for(let z=Math.max(0,iz-radius);z<=Math.min(SIZE-1,iz+radius);z++){
        for(let x=Math.max(0,ix-radius);x<=Math.min(SIZE-1,ix+radius);x++){
          if(radius>0&&Math.abs(x-ix)!==radius&&Math.abs(z-iz)!==radius)continue;
          const px=coord(x),pz=coord(z);
          if(!valid(px,pz))continue;
          const d=(x-ix)**2+(z-iz)**2;
          if(d<score){best=INDEX(x,z);score=d;}
        }
      }
      if(best>=0)return best;
    }
    return -1;
  };
  const startNode=nearest(sx,sz),endNode=nearest(gx,gz);
  if(startNode<0||endNode<0)return [];

  const seen=new Uint8Array(SIZE*SIZE);
  const prev=new Int32Array(SIZE*SIZE);
  prev.fill(-1);
  const queue=new Int32Array(SIZE*SIZE);
  let head=0,tail=0;
  queue[tail++]=startNode;seen[startNode]=1;
  const dirs=[[-1,0],[1,0],[0,-1],[0,1]] as const;
  while(head<tail){
    const u=queue[head++];
    if(u===endNode)break;
    const ux=u%SIZE,uz=Math.floor(u/SIZE);
    for(const [dx,dz] of dirs){
      const x=ux+dx,z=uz+dz;
      if(x<0||z<0||x>=SIZE||z>=SIZE)continue;
      const v=INDEX(x,z);
      if(seen[v]||!valid(coord(x),coord(z)))continue;
      seen[v]=1;prev[v]=u;queue[tail++]=v;
    }
  }
  if(!seen[endNode])return [];
  const indices:number[]=[];
  for(let u=endNode;u!==-1;u=prev[u]){
    indices.push(u);
    if(u===startNode)break;
  }
  indices.reverse();
  const path=indices.map(i=>({x:coord(i%SIZE),z:coord(Math.floor(i/SIZE))}));
  // Remove redundant corners only when the entire straight segment is safe.
  const straightSafe=(a:GuidePoint,b:GuidePoint)=>{
    const count=Math.max(1,Math.ceil(Math.sqrt(distSq(a,b))/.16));
    for(let i=0;i<=count;i++){
      const t=i/count;
      if(!valid(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;
    }
    return true;
  };
  const clean:GuidePoint[]=[];
  for(let i=0;i<path.length;){
    clean.push(path[i]);
    let k=Math.min(path.length-1,i+18);
    while(k>i+1&&!straightSafe(path[i],path[k]))k--;
    if(k<=i)break;
    i=k;
  }
  if(clean.length<2||distSq(clean[clean.length-1],path[path.length-1])>0.001){
    clean.push(path[path.length-1]);
  }
  // maxPoints protects visual code against unreasonable routes.
  return clean.slice(0,Math.max(2,maxPoints));
}

/** Stops before the physically solid console pedestal, not inside it. */
export function currentMissionGuideDestination(completed:{
  stationLightsOn:boolean;
  power:{completed:boolean};
  lifeSupport:{completed:boolean};
  greenhouse:{completed:boolean};
  radiation:{completed:boolean};
}):GuidePoint {
  if(!completed.stationLightsOn)return {x:0,z:2.65};
  if(!completed.power.completed)return {x:0,z:-19.15};
  if(!completed.lifeSupport.completed)return {x:19.15,z:0};
  if(!completed.greenhouse.completed)return {x:-19.15,z:0};
  if(!completed.radiation.completed)return {x:0,z:19.15};
  return {x:0,z:2.65};
}
