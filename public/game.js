import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07111f);
scene.fog = new THREE.Fog(0x07111f, 35, 85);
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 150);
camera.position.set(0, 23, 25);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xa9dcff, 0x17243a, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-12, 25, 12); sun.castShadow = true; scene.add(sun);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(50,50), new THREE.MeshStandardMaterial({color:0x10243a, roughness:.85}));
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
const grid = new THREE.GridHelper(50, 50, 0x246080, 0x18364d); grid.position.y=.015; scene.add(grid);
const wallMat = new THREE.MeshStandardMaterial({color:0x1a5a7c, emissive:0x073047, metalness:.35, roughness:.4});
for (const [x,z,sx,sz] of [[0,-25,50,.5],[0,25,50,.5],[-25,0,.5,50],[25,0,.5,50]]) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(sx,1.3,sz), wallMat);
  wall.position.set(x,.65,z); wall.castShadow=true; scene.add(wall);
}
const players = new Map(), foods = new Map();
let myId=null, myColor="#42d6ff", myScore=0, joined=false;
const keys = {};
addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true; if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase()))e.preventDefault();});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
const scoreEl=document.querySelector("#score"), statusEl=document.querySelector("#status"), leadersEl=document.querySelector("#leaders");
const errorEl=document.querySelector("#error");
const socketUrl = `${location.protocol==="https:"?"wss":"ws"}://${location.host}`;
let socket;
function connect(){
  socket=new WebSocket(socketUrl);
  socket.onopen=()=>{statusEl.textContent="Sunucuya bağlı";};
  socket.onclose=()=>{statusEl.textContent="Bağlantı kesildi"; errorEl.textContent="Sunucu bağlantısı kesildi. Sayfayı yenileyip tekrar dene.";};
  socket.onerror=()=>{errorEl.textContent="Sunucuya bağlanılamadı. Önce bilgisayarında server.js dosyasını çalıştır.";};
  socket.onmessage=e=>{
    const msg=JSON.parse(e.data);
    if(msg.type==="welcome"){myId=msg.id;myColor=msg.color;}
    if(msg.type==="state") updateWorld(msg);
  };
}
connect();

function makePlayer(color){
  const group=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color,roughness:.38,metalness:.12});
  const body=new THREE.Mesh(new THREE.SphereGeometry(.8,24,18),mat);
  body.scale.y=.75; body.position.y=.72; body.castShadow=true; group.add(body);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.92,.055,8,32),new THREE.MeshBasicMaterial({color:0xffffff}));
  ring.rotation.x=Math.PI/2; ring.position.y=.12; group.add(ring);
  const eyeMat=new THREE.MeshStandardMaterial({color:0x07111f});
  for(const x of [-.23,.23]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),eyeMat);eye.position.set(x, .86, .66);group.add(eye);}
  scene.add(group); return group;
}
function makeFood(){
  const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.22,1),new THREE.MeshStandardMaterial({color:0x53e7ff,emissive:0x1689bd,emissiveIntensity:1.5,roughness:.25}));
  m.castShadow=true;scene.add(m);return m;
}
function updateWorld(state){
  const seenP=new Set();
  for(const p of state.players){
    seenP.add(p.id);
    let obj=players.get(p.id);
    if(!obj){obj=makePlayer(p.color);players.set(p.id,obj);}
    obj.position.set(p.x,0,p.z);
    const size=Math.min(1+p.score*.008,1.65);obj.scale.setScalar(size);
    if(p.id===myId){myScore=p.score;scoreEl.textContent=`Puan: ${myScore}`;}
  }
  for(const [id,obj] of players){if(!seenP.has(id)){scene.remove(obj);players.delete(id);}}
  const seenF=new Set();
  for(const f of state.foods){
    seenF.add(f.id);let obj=foods.get(f.id);
    if(!obj){obj=makeFood();foods.set(f.id,obj);}
    obj.position.set(f.x,.35+Math.sin(performance.now()*.003+f.x)*.08,f.z);
  }
  for(const [id,obj] of foods){if(!seenF.has(id)){scene.remove(obj);foods.delete(id);}}
  const sorted=[...state.players].sort((a,b)=>b.score-a.score).slice(0,6);
  leadersEl.innerHTML=sorted.map(p=>`<li>${escapeText(p.name)} — ${p.score}</li>`).join("");
}
function escapeText(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

document.querySelector("#play").addEventListener("click",()=>{
  const name=document.querySelector("#nickname").value.trim().slice(0,16)||"Oyuncu";
  if(socket.readyState!==WebSocket.OPEN){errorEl.textContent="Sunucuya bağlanılamadı. Önce server'ı başlat.";return;}
  socket.send(JSON.stringify({type:"join",name}));
  joined=true;document.querySelector("#join").style.display="none";
});

let lastSend=0;
function animate(t){
  requestAnimationFrame(animate);
  for(const obj of foods.values())obj.rotation.y+=.012;
  if(joined && socket.readyState===WebSocket.OPEN && t-lastSend>45){
    let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
    let z=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
    socket.send(JSON.stringify({type:"move",x,z}));lastSend=t;
  }
  if(myId && players.has(myId)){
    const p=players.get(myId);
    const target=new THREE.Vector3(p.position.x+0, 22, p.position.z+22);
    camera.position.lerp(target,.07);
    camera.lookAt(p.position.x,0,p.position.z);
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
