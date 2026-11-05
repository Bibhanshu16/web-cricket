import * as THREE from 'three';
const Q=new URLSearchParams(location.search),VIEW=Q.get('screen'),HOST=!VIEW,PFX='wemble-cricket-',ALPHA='ABCDEFGHJKLMNPQRSTUVWXYZ',$=i=>document.getElementById(i);
const view={stage:'lobby',msg:'',sub:'',dl:'',roster:[],sc:[],bat:'',bowl:'',left:6,sw:0,bw:0,br:0,fl:[],fid:[],code:''};
const esc=s=>s.replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';'),clamp=(v,a=-1,b=1)=>Math.max(a,Math.min(b,v)),r2=v=>Math.round(v*100)/100,G=12,rm=r=>r?r+' run'+(r>1?'s':''):'Dot ball';
const FP=[];for(const a of[-80,-55,-30,0,30,55,80])FP.push([21*Math.sin(a*Math.PI/180),9.5-21*Math.cos(a*Math.PI/180)]);for(const a of[-40,40])FP.push([9*Math.sin(a*Math.PI/180),9.5-9*Math.cos(a*Math.PI/180)]);FP.push([0,12.2],[0,-10.4]);
let crowdT=0,cfT=0,bdir=-1,lastBr=0;
// ---------- audio (WebAudio synth)
let AC=null,mute=false,evq=[];
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch{}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,d,type='square',vol=.08,slide=0,delay=0){const c=AC;if(!c||mute)return;const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
 if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d)}
function noise(d,v=.08){const c=AC;if(!c||mute)return;const b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);
 const s=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1200;g.gain.value=v;s.buffer=b;s.connect(f);f.connect(g);g.connect(c.destination);s.start()}
const SFX={bowl:()=>tone(220,.3,'sawtooth',.04,400),swing:()=>tone(400,.12,'triangle',.06,-200),hit:()=>{tone(1500,.06,'square',.18,-900);noise(.15,.1)},dive:()=>tone(250,.2,'sawtooth',.05,-120),throw:()=>tone(500,.12,'triangle',.07,350),catch:()=>{tone(800,.08,'square',.1);noise(.1,.06)},
 cheer:()=>{noise(1.4,.12);[523,659,784,1047].forEach((f,i)=>tone(f,.2,'triangle',.08,0,i*.08));confetti();crowdT=1.6},out:()=>{tone(330,.7,'sawtooth',.1,-280);noise(.4,.08)},wide:()=>tone(300,.25,'triangle',.1),
 win:()=>{[523,659,784,1047,1319].forEach((f,i)=>tone(f,.3,'triangle',.12,0,i*.14));confetti()},join:()=>{tone(660,.1,'triangle',.1);tone(990,.15,'triangle',.1,0,.1)}};
const sfx=n=>SFX[n]&&SFX[n](),emit=n=>{evq.push(n);sfx(n)};
// ---------- scene
const R=new THREE.WebGLRenderer({canvas:$('c'),antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
const cv2=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
const S=new THREE.Scene();S.background=cv2(4,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2e86de');g.addColorStop(.55,'#8fd3ff');g.addColorStop(1,'#eaf7ff');x.fillStyle=g;x.fillRect(0,0,w,h)});S.fog=new THREE.Fog('#cfeaff',90,200);
const cam=new THREE.PerspectiveCamera(55,1,.1,400),look=new THREE.Vector3(0,1.5,-4),CP0=new THREE.Vector3(-5,6.5,19),LP0=new THREE.Vector3(0,1.5,-4);cam.position.copy(CP0);
S.add(new THREE.HemisphereLight(0xdff0ff,0x4a8a4a,1.0));
const sun=new THREE.DirectionalLight(0xfff1d6,2.2);sun.position.set(18,34,14);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-38,right:38,top:38,bottom:-38,near:1,far:110});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;S.add(sun);
const resize=()=>{R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',resize);resize();
const mesh=(g,c,x=0,y=0,z=0)=>{const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.8}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m};
const flat=(g,c,y)=>{const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:c}));m.rotation.x=-Math.PI/2;m.position.y=y;S.add(m);return m};
const g2=mesh(new THREE.CircleGeometry(200,32),0x2f7d3a,0,-.05,0);g2.rotation.x=-Math.PI/2;S.add(g2);
const grass=cv2(1024,1024,(x,w)=>{for(let i=24;i>=0;i--){x.fillStyle=i%2?'#3d9449':'#4aa95a';x.beginPath();x.arc(w/2,w/2,w/2*i/24,0,7);x.fill()}x.strokeStyle='#ffffff55';x.lineWidth=3;x.beginPath();x.arc(w/2,w/2,w/2*30/42,0,7);x.stroke()});
const gr=new THREE.Mesh(new THREE.CircleGeometry(42,96),new THREE.MeshStandardMaterial({map:grass,roughness:.95}));gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;S.add(gr);
flat(new THREE.RingGeometry(31,31.35,128),0xffffff,.03);
const pitchT=cv2(128,512,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#cfa970');g.addColorStop(.5,'#dcbb85');g.addColorStop(1,'#cfa970');x.fillStyle=g;x.fillRect(0,0,w,h);for(let i=0;i<500;i++){x.fillStyle=`rgba(${120+Math.random()*60|0},${90+Math.random()*40|0},50,.12)`;x.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*10,1+Math.random()*3)}});
const pt=new THREE.Mesh(new THREE.PlaneGeometry(3.2,22),new THREE.MeshStandardMaterial({map:pitchT,roughness:.9}));pt.rotation.x=-Math.PI/2;pt.position.y=.02;pt.receiveShadow=true;S.add(pt);
for(const z of[-8.7,8.7]){const l=flat(new THREE.PlaneGeometry(3.4,.08),0xffffff,.035);l.position.z=z}
for(const z of[-10,10]){for(const x of[-.11,0,.11])S.add(mesh(new THREE.CylinderGeometry(.025,.025,.72),0xf1e0b0,x,.36,z));for(const x of[-.055,.055])S.add(mesh(new THREE.CylinderGeometry(.012,.012,.1),0xc0392b,x,.74,z).rotateZ(Math.PI/2))}
// stadium: hoardings, stands, crowd, floodlights
const adT=cv2(1024,64,(x,w,h)=>{const cols=['#e63946','#ffd166','#2a9d8f','#4361ee'];for(let i=0;i<8;i++){x.fillStyle=cols[i%4];x.fillRect(i*128,0,128,h);x.fillStyle=i%4===1?'#222':'#fff';x.font='bold 30px sans-serif';x.textAlign='center';x.fillText('WEMBLE',i*128+64,42)}});adT.wrapS=THREE.RepeatWrapping;adT.repeat.set(-4,1);
S.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(32.6,32.6,1.1,128,1,true),new THREE.MeshStandardMaterial({map:adT,side:THREE.BackSide,roughness:.5})),{position:new THREE.Vector3(0,.55,0)}));
const stand=new THREE.Mesh(new THREE.CylinderGeometry(56,36,15,96,1,true),new THREE.MeshStandardMaterial({color:0x40506f,side:THREE.DoubleSide,roughness:.9}));stand.position.y=7.5;stand.receiveShadow=true;S.add(stand);
const NC=1800,cm=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.8,.4),new THREE.MeshStandardMaterial({roughness:.9}),NC),cb=[],dm=new THREE.Object3D(),pal=['#e63946','#ffd166','#2a9d8f','#4361ee','#ffffff','#f4a261','#9b5de5'].map(c=>new THREE.Color(c));
for(let i=0;i<NC;i++){const a=Math.random()*Math.PI*2,s=Math.random(),r=36.8+s*18;cb.push([Math.cos(a)*r,s*15+.5,Math.sin(a)*r,a]);dm.position.set(cb[i][0],cb[i][1],cb[i][2]);dm.rotation.y=-a;dm.updateMatrix();cm.setMatrixAt(i,dm.matrix);cm.setColorAt(i,pal[i%pal.length])}
cm.instanceColor.needsUpdate=true;S.add(cm);
for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2,x=Math.cos(a)*60,z=Math.sin(a)*60;S.add(mesh(new THREE.CylinderGeometry(.6,.9,34),0x555a66,x,17,z));const h=new THREE.Mesh(new THREE.BoxGeometry(9,4,.6),new THREE.MeshBasicMaterial({color:0xfff6d0}));h.position.set(x,35,z);h.lookAt(0,10,0);S.add(h)}
// characters
function person(){const g=new THREE.Group(),body=new THREE.Group(),jm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6}),pm=new THREE.MeshStandardMaterial({color:0xf4f4f4,roughness:.7}),sk=new THREE.MeshStandardMaterial({color:0xe0ac69,roughness:.7});
 const limb=(len,r,mat,x,y)=>{const p=new THREE.Group();p.position.set(x,y,0);const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,4,8),mat);m.position.y=-len/2-r;m.castShadow=true;p.add(m);body.add(p);return p};
 const legs=[limb(.5,.11,pm,-.13,.85),limb(.5,.11,pm,.13,.85)],arms=[limb(.42,.08,jm,-.34,1.55),limb(.42,.08,jm,.34,1.55)];
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.25,.4,6,12),jm);torso.position.y=1.28;torso.castShadow=true;body.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.19,14,14),sk);head.position.y=1.88;head.castShadow=true;body.add(head);
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.205,14,8,0,Math.PI*2,0,Math.PI/2),jm);cap.position.y=1.9;body.add(cap);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({depthTest:false}));sp.scale.set(2.6,.65,1);sp.position.y=2.55;g.add(body,sp);
 g.userData={jm,legs,arms,body,sp,sig:null,ph:0,px:0,pz:0,init:0,pi:0};S.add(g);return g}
function setP(g,id,def){const u=g.userData,p=id==='ai'?{name:'Computer',color:'#8d99ae'}:((id?view.roster.find(r=>r.id===id):null)||def),sig=p?p.name+p.color:'';if(u.sig===sig)return;u.sig=sig;g.visible=!!p;if(!p)return;u.jm.color.set(p.color);u.sp.visible=!!p.name;
 if(p.name){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.font='bold 36px sans-serif';x.textAlign='center';x.lineWidth=6;x.strokeStyle='#000';x.fillStyle='#fff';x.strokeText(p.name,128,44);x.fillText(p.name,128,44);u.sp.material.map=new THREE.CanvasTexture(c);u.sp.material.needsUpdate=true}}
function anim(p,dt,face){const u=p.userData,dx=p.position.x-u.px,dz=p.position.z-u.pz,sp=u.init?Math.hypot(dx,dz)/Math.max(dt,.001):0;u.init=1;u.px=p.position.x;u.pz=p.position.z;u.ph+=sp*dt*1.5;
 const w=Math.sin(u.ph)*Math.min(1,sp/3.5)*.9;u.legs[0].rotation.x=w;u.legs[1].rotation.x=-w;u.arms[0].rotation.x=-w*.8;if(!u.keep)u.arms[1].rotation.x=w*.8;
 const ty=sp>.8?Math.atan2(dx,dz):Math.atan2(face[0]-p.position.x,face[1]-p.position.z);let da=ty-p.rotation.y;da=Math.atan2(Math.sin(da),Math.cos(da));p.rotation.y+=da*Math.min(1,10*dt);return sp}
const batter=person();batter.position.set(.55,0,9.4);batter.rotation.y=Math.PI;batter.userData.keep=1;
const pivot=new THREE.Group();pivot.position.set(.3,1.15,.25);pivot.add(mesh(new THREE.BoxGeometry(.05,.14,.95),0xe8c27a,0,0,.45));batter.userData.body.add(pivot);batter.userData.pivot=pivot;
const FPN=FP.map((p,i)=>{const g=person();if(i===10)g.userData.keep=1;return g});
// ball, trail, shadow, confetti
const ballM=mesh(new THREE.SphereGeometry(.13,16,16),0xd32f2f);S.add(ballM);const ballPos=new THREE.Vector3(.35,1.6,-10.3);
const TR=16,trG=new THREE.BufferGeometry(),trP=new Float32Array(TR*3);trG.setAttribute('position',new THREE.BufferAttribute(trP,3));const trail=new THREE.Line(trG,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.55}));trail.frustumCulled=false;S.add(trail);
const bsh=new THREE.Mesh(new THREE.CircleGeometry(.22,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.35}));bsh.rotation.x=-Math.PI/2;S.add(bsh);
const CF=140,cfG=new THREE.BufferGeometry(),cfP=new Float32Array(CF*3),cfC=new Float32Array(CF*3),cfV=new Float32Array(CF*3);cfG.setAttribute('position',new THREE.BufferAttribute(cfP,3));cfG.setAttribute('color',new THREE.BufferAttribute(cfC,3));
const cf=new THREE.Points(cfG,new THREE.PointsMaterial({size:.35,vertexColors:true}));cf.frustumCulled=false;cf.visible=false;S.add(cf);
function confetti(){const c=new THREE.Color();for(let i=0;i<CF;i++){cfP.set([(Math.random()-.5)*8,9+Math.random()*3,-6+(Math.random()-.5)*8],i*3);cfV.set([(Math.random()-.5)*5,Math.random()*3,(Math.random()-.5)*5],i*3);c.setHSL(Math.random(),.9,.6);cfC.set([c.r,c.g,c.b],i*3)}cfT=3;cf.visible=true;cfG.attributes.color.needsUpdate=true}
function apply(s){view.stage=s.st;view.msg=s.msg;view.sub=s.sub;view.dl=s.dl;view.bat=s.bat;view.bowl=s.bowl;view.left=s.lf;view.sc=s.sc;view.sw=s.sw;view.bw=s.bw;view.br=s.br;view.fl=s.fl;view.fid=s.fid;ballPos.set(s.b[0],s.b[1],s.b[2]);if(s.ev&&!HOST)s.ev.forEach(sfx)}
function frame(dt,now){const bp=ballPos,st=view.stage,k=1-Math.exp(-20*dt);
 ballM.position.lerp(bp,1-Math.exp(-30*dt));trP.copyWithin(3,0,(TR-1)*3);trP[0]=ballM.position.x;trP[1]=ballM.position.y;trP[2]=ballM.position.z;trG.attributes.position.needsUpdate=true;trail.visible=st==='flight'||st==='hit';
 bsh.position.set(ballM.position.x,.04,ballM.position.z);bsh.scale.setScalar(1/(1+ballM.position.y*.18));
 setP(batter,view.bat);batter.position.z=9.4-view.br*17.4;if(view.br>lastBr+.001)bdir=-1;else if(view.br<lastBr-.001)bdir=1;if(st!=='hit')bdir=-1;lastBr=view.br;
 anim(batter,dt,[batter.position.x,bdir*100]);const bu=batter.userData;bu.body.rotation.y=-view.sw*.9;bu.pivot.rotation.y=1.3-view.sw*3.2;
 for(let i=0;i<FPN.length;i++){const p=FPN[i],u=p.userData,f=view.fl[i],id=view.fid[i];if(!f||(i===10&&!id)){p.visible=false;continue}
  p.visible=true;setP(p,id,{name:'',color:i===9?'#8d6e63':'#2a7fff'});if(!u.pi){p.position.set(f[0],0,f[1]);u.pi=1}else{p.position.x+=(f[0]-p.position.x)*k;p.position.z+=(f[1]-p.position.z)*k}
  anim(p,dt,[bp.x,bp.z]);u.body.rotation.x+=((f[2]?1.15:0)-u.body.rotation.x)*Math.min(1,14*dt);u.body.position.y=-u.body.rotation.x*.25;
  if(i===10){const ta=st==='flight'&&view.bw<1?-view.bw*3.4:0;u.arms[1].rotation.x+=(ta-u.arms[1].rotation.x)*Math.min(1,12*dt)}}
 let cp=CP0,lp=LP0;if(st==='hit'){cp=new THREE.Vector3(clamp(bp.x*.5-3,-18,18),9,clamp(bp.z+18,-6,23));lp=new THREE.Vector3(bp.x,Math.max(1,bp.y*.5),bp.z)}
 cam.position.lerp(cp,1-Math.exp(-2.5*dt));look.lerp(lp,1-Math.exp(-4*dt));cam.lookAt(look);
 if(crowdT>0){crowdT-=dt;const a=Math.max(0,crowdT/1.6);for(let i=0;i<NC;i++){const c=cb[i];dm.position.set(c[0],c[1]+Math.abs(Math.sin(now/110+i))*.5*a,c[2]);dm.rotation.y=-c[3];dm.updateMatrix();cm.setMatrixAt(i,dm.matrix)}cm.instanceMatrix.needsUpdate=true}
 if(cfT>0){cfT-=dt;for(let i=0;i<CF;i++){cfV[i*3+1]-=6*dt;for(let j=0;j<3;j++)cfP[i*3+j]+=cfV[i*3+j]*dt}cfG.attributes.position.needsUpdate=true;if(cfT<=0)cf.visible=false}}
// ---------- HUD
let lastSc='',lastBig='';
function drawRoster(){$('roster').innerHTML=view.roster.map(p=>`<li><i style="background:${p.color}"></i>${esc(p.name)}${p.lead?' ⭐':''}</li>`).join('')||'<li>Waiting for players…</li>'}
function hud(){const st=view.stage,on=!!AC&&AC.state==='running';$('snd').classList.toggle('hide',on);$('mute').textContent=mute||!on?'🔇':'🔊';
 $('lobby').classList.toggle('hide',st!=='lobby');$('score').classList.toggle('hide',st==='lobby');$('sub').classList.toggle('hide',st==='lobby');
 const h=view.sc.map(([id,r,b,o])=>{const p=view.roster.find(x=>x.id===id);return `<div class="${id===view.bat?'cur':''}"><i style="background:${p?p.color:'#888'}"></i>${p?esc(p.name):'?'} <b>${r}</b> <small>${b}b${o?' · out':''}</small></div>`}).join('');
 if(h!==lastSc){lastSc=h;$('score').innerHTML=h}
 $('sub').textContent=view.sub+(st==='final'?'':' · Balls left: '+view.left)+(view.dl&&(st==='flight'||st==='hit')?' · '+view.dl:'');
 const t=['ready','hit','result','final'].includes(st)?view.msg:'';if(t!==lastBig){lastBig=t;const b=$('big');b.textContent=t;b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}}
function showJoin(code){const base=location.href.split('?')[0].replace(/[^/]*$/,''),url=base+'controller.html?room='+code;
 $('code').textContent=code;$('url').textContent=base+'controller.html';$('qr').innerHTML='';new QRCode($('qr'),{text:url,width:180,height:180});
 $('hint').textContent=HOST?'Each player bats one over (6 balls). The next player bowls and everyone else fields. Most runs wins. The first player can start from their phone.':'Extra screen connected.';
 if(HOST)$('extra').textContent='More screens: open '+base+'index.html?screen='+code}
// ---------- host: room, players, match logic
const pl=new Map(),scr=new Set(),sc=new Map(),F=FP.map(p=>({x:p[0],z:p[1],hx:p[0],hz:p[1],id:'',ds:0,dc:0,hb:0,luck:0}));
let peer,order=[],inn=0,stT=0,T=1,ft=0,line=0,curve=0,spinD=0,lineF=0,zb=0,hb=1,swung=false,swT=0,pend=null,swPhase=0,bwv=0,brv=0,ball=[.35,1.6,-10.3],B={x:0,y:1,z:9,vx:0,vy:0,vz:0,bounced:false,mov:false},bs='free',held=-1,holdT=0,doneT=0,ptm=0,thr=null,chasers=new Set(),chasePt=[0,0];
const lead=()=>pl.keys().next().value,nm=id=>id==='ai'?'Computer':(pl.get(id)||{name:'?'}).name,isH=f=>!!f.id&&f.id!=='ai'&&pl.has(f.id),fname=i=>isH(F[i])?pl.get(F[i].id).name:'a fielder';
function emit2(){}
function notify(){const st=view.stage,l=lead();pl.forEach(p=>{const as=F.some(f=>f.id===p.id),role=p.id===view.bat?'bat':p.id===view.bowl?'bowl':as?'field':'watch';let tx;
 if(st==='lobby')tx=p.id===l?'You lead the room. Start when everyone is in.':'Waiting for the leader to start…';
 else if(st==='final'||st==='result')tx=view.msg||'…';
 else if(role==='bat')tx=st==='flight'?'SWING when the ball reaches you!':st==='hit'?'Running…':'You are batting. Stick: shot direction (push up to loft). Tap SWING on time.';
 else if(role==='bowl')tx=st==='bowling'?'Pick FAST / SWING / SPIN, aim with the stick, HOLD BOWL and let go in the green zone.':'Field! Stick: run. DIVE to catch, THROW when you hold the ball.';
 else if(role==='field')tx=st==='hit'?'Chase the ball! DIVE to catch, THROW when you hold it.':'Fielding: stick to move, DIVE to catch, THROW when you hold the ball.';
 else tx='Watch the screen';
 try{p.c.send({t:'state',st,role,lead:p.id===l&&st==='lobby',tx})}catch{}})}
function roster(){const l=lead();view.roster=[...pl.values()].map(p=>({id:p.id,name:p.name,color:p.color,lead:p.id===l}));drawRoster();scr.forEach(c=>{try{c.send({t:'roster',r:view.roster})}catch{}});notify()}
function assign(){F.forEach(f=>{f.id='';f.x=f.hx;f.z=f.hz;f.ds=0;f.hb=0});const hs=[...pl.keys()].filter(i=>i!==view.bat&&i!==view.bowl),ord=[3,0,6,1,5,7,8,2,4];hs.slice(0,9).forEach((id,k)=>F[ord[k]].id=id);F[10].id=view.bowl}
function resetBall(){swung=false;swPhase=0;bwv=0;ball=[.35,1.6,-10.3];pend=null}
function start(){if(view.stage!=='lobby'||!pl.size)return;order=[...pl.keys()];sc.clear();order.forEach(id=>sc.set(id,{name:pl.get(id).name,runs:0,balls:0,out:false}));inn=-1;nextInnings()}
function nextInnings(){inn++;while(inn<order.length&&!pl.has(order[inn]))inn++;if(inn>=order.length)return finish();
 view.bat=order[inn];const o=[...pl.keys()].filter(i=>i!==view.bat);view.bowl=o.length?o[inn%o.length]:'ai';view.left=6;assign();brv=0;
 view.msg=nm(view.bat)+' to bat';view.sub='Bowler: '+nm(view.bowl);view.stage='ready';stT=2.4;resetBall();notify()}
function toBowling(){resetBall();brv=0;view.dl='';view.msg='';view.stage='bowling';stT=view.bowl==='ai'?1.6:14;F[10].x=0;F[10].z=-12.6;F.forEach(f=>{f.hb=0;f.ds=0});notify()}
function bowlBall(x,y,pw=.75,ty=0){const off=Math.max(0,Math.abs(pw-.75)-.15);line=clamp(x)*.95+(Math.random()-.5)*(.12+off*3);const L=(clamp(y)+1)/2;zb=7-L*9;hb=.5+L*1.5;
 T=[.72,.85,1.15][ty]*(1.12-.24*pw)+Math.random()*.05;curve=ty===1?-Math.sign(x||1)*.65:0;spinD=ty===2?-Math.sign(x||1)*1:0;lineF=clamp(line+curve+spinD,-2.5,2.5);
 view.dl=['Fast','Swing','Spin'][ty]+' '+Math.round(20/T*3.6*1.4)+' km/h';ft=-.6;view.stage='flight';view.msg='';emit('bowl');notify()}
function finish(){const mx=Math.max(...order.map(id=>sc.get(id).runs)),w=order.filter(id=>sc.get(id).runs===mx).map(id=>sc.get(id).name);
 view.stage='final';view.msg='🏆 '+w.join(' & ')+' wins with '+mx+'!';view.sub='Final result';view.bat='';view.bowl='';F.forEach(f=>f.id='');stT=9;emit('win');notify()}
function hit(dv){const a=Math.abs(dv),aim=pl.get(view.bat).in,loft=aim.y<-.35,qq=a<.08?3:a<.15?2:1;let sp,el;if(loft){sp=[0,11,19,24][qq];el=[0,55,32,36][qq]}else{sp=[0,8,17,27][qq];el=[0,6,3,3][qq]}
 el*=Math.PI/180;sp*=.92+Math.random()*.16;const ang=clamp(aim.x*1.25+dv*2.2,-1.3,1.3);
 B={x:.5,y:1,z:9,vx:sp*Math.cos(el)*Math.sin(ang),vy:sp*Math.sin(el),vz:-sp*Math.cos(el)*Math.cos(ang),bounced:false,mov:false};
 bs='free';ptm=0;held=-1;doneT=0;F.forEach(f=>{f.luck=Math.random();f.hb=0});view.msg='';view.stage='hit';emit('hit');notify()}
function judge(){if(!swung&&Math.abs(lineF)>.85)pend={wide:1,runs:1,out:'',msg:'WIDE! +1 run'};else if(Math.abs(lineF)<.3)pend={out:'Bowled',runs:0,msg:'BOWLED! OUT'};else pend={runs:0,out:'',msg:swung?'Missed! Dot ball':'Dot ball'};toResult()}
function toResult(){const s=sc.get(view.bat);s.runs+=pend.runs;if(!pend.wide){s.balls++;view.left--}if(pend.out)s.out=true;view.msg=pend.msg;view.stage='result';stT=2.2;
 const e=pend.out?'out':pend.runs>=4?'cheer':pend.wide?'wide':null;if(e)emit(e);
 if(pend.out||pend.runs>=4){const b=pl.get(view.bat);try{b&&b.c.send({t:'buzz'})}catch{}}notify()}
function end(p,delay,mov){pend=Object.assign({runs:0,out:''},p);bs='done';doneT=delay;B.mov=!!mov;view.msg=pend.msg;if(!pend.out)brv=pend.runs%2}
function chase(){let tx,tz;if(!B.bounced){const t=(B.vy+Math.sqrt(Math.max(0,B.vy*B.vy+2*G*(B.y-.13))))/G;tx=B.x+B.vx*t;tz=B.z+B.vz*t}else{tx=B.x+B.vx*.5;tz=B.z+B.vz*.5}
 chasePt=[tx,tz];const d2=i=>(F[i].x-tx)**2+(F[i].z-tz)**2;chasers=new Set(F.map((f,i)=>i).filter(i=>i!==9&&!isH(F[i])).sort((a,b)=>d2(a)-d2(b)).slice(0,2))}
function physics(dt){for(let k=0;k<2;k++){const h=dt/2;B.vy-=G*h;B.x+=B.vx*h;B.y+=B.vy*h;B.z+=B.vz*h;
 if(B.y<=.13){B.y=.13;if(B.vy<-1.5){B.vy=-B.vy*.45;B.vx*=.85;B.vz*=.85;B.bounced=true}else{B.vy=0;B.bounced=true;const s=Math.hypot(B.vx,B.vz);if(s>0){const n=Math.max(0,s-3.2*h)/s;B.vx*=n;B.vz*=n}}}}}
function throwBall(){const f=F[held];f.hb=0;bs='throw';thr={x:B.x,y:B.y,z:B.z,t:0,d:Math.hypot(B.x,10-B.z)/26+.12};emit('throw')}
function playStep(dt){ptm+=dt;if(bs==='free'||(bs==='done'&&B.mov))physics(dt);
 if(bs==='free'){
  if(Math.hypot(B.x,B.z)>=31.2)end(B.bounced?{runs:4,msg:'FOUR!'}:{runs:6,msg:'SIX!'},1.5,true);
  else{chase();for(let i=0;i<F.length;i++){const f=F[i],d=Math.hypot(B.x-f.x,B.z-f.z),h=isH(f),dv=f.ds>0;
   if(!B.bounced){if(B.y<2.7&&d<(dv?1.7:.9)&&(h?(dv||d<.65):f.luck<.62)){held=i;B.vx=B.vy=B.vz=0;emit('catch');end({out:'Caught',msg:'CAUGHT by '+fname(i)+'!'},1.1,false);break}}
   else if(B.y<.9&&d<(dv?1.6:.9)&&(h||f.luck<.93)){bs='held';held=i;f.hb=1;holdT=0;B.vx=B.vy=B.vz=0;break}}
   if(ptm>16&&bs==='free'){const r=clamp(Math.floor((ptm-.5)/1.5),0,3);end({runs:r,msg:rm(r)},.6,false)}}}
 else if(bs==='held'){const f=F[held];B.x=f.x;B.z=f.z;B.y=1;holdT+=dt;if(holdT>(isH(f)?2.5:.3))throwBall()}
 else if(bs==='throw'){thr.t+=dt;const u=Math.min(1,thr.t/thr.d);B.x=thr.x*(1-u);B.z=thr.z+(10-thr.z)*u;B.y=thr.y+(.8-thr.y)*u+Math.sin(u*Math.PI)*1.2;
  if(u>=1){const r=clamp(Math.floor((ptm-.5)/1.5),0,3);end({runs:r,msg:rm(r)},.9,false)}}
 else if(bs==='done'){doneT-=dt;if(held>=0&&pend.out){B.x=F[held].x;B.z=F[held].z;B.y=1.6}if(doneT<=0)toResult()}
 ball=[B.x,B.y,B.z];if(bs==='free'||bs==='held'||bs==='throw'){const rp=(ptm-.5)/1.5;brv=rp<=0?0:Math.floor(rp)%2===0?rp%1:1-rp%1}}
function moveF(dt){const st=view.stage,play=st==='hit'&&bs==='free';
 F.forEach((f,i)=>{f.ds=Math.max(0,f.ds-dt);f.dc=Math.max(0,f.dc-dt);if(i===9)return;if(i===10&&(st==='bowling'||(st==='flight'&&ft<0)))return;
  let vx=0,vz=0;const h=isH(f)?pl.get(f.id):null,bo=f.ds>0?1.7:1;
  if(h){if(st!=='ready'){vx=h.in.x*7.5*bo;vz=h.in.y*7.5*bo;if(f.ds>0&&!vx&&!vz&&play){const dx=B.x-f.x,dz=B.z-f.z,d=Math.hypot(dx,dz)||1;vx=dx/d*9;vz=dz/d*9}}}
  else{const ch=play&&chasers.has(i),t=ch?chasePt:[f.hx,f.hz],dx=t[0]-f.x,dz=t[1]-f.z,d=Math.hypot(dx,dz);if(d>.3){const s=ch?6.8:3;vx=dx/d*s;vz=dz/d*s}}
  f.x+=vx*dt;f.z+=vz*dt;const r=Math.hypot(f.x,f.z);if(r>30){f.x*=30/r;f.z*=30/r}})}
function act(id){const st=view.stage;
 if(st==='flight'&&id===view.bat&&!swung&&ft>-.3){swung=true;swT=ft;swPhase=.001;emit('swing');const dv=swT-T;if(Math.abs(dv)<=.26)hit(dv)}
 else{const f=F.find(q=>q.id===id);if(!f)return;if(f.hb&&bs==='held')throwBall();else if(f.dc<=0&&(st==='hit'||st==='flight'||st==='bowling')){f.ds=.5;f.dc=1.2;emit('dive')}}}
function onMsg(c,m){const id=c.peer;if(!m)return;
 if(m.t==='join'||m.t==='profile'){const name=String(m.name||'Player').replace(/[<>&"]/g,'').slice(0,12)||'Player',color=/^#[0-9a-f]{6}$/i.test(m.color)?m.color:'#ff6b9d';
  let p=pl.get(id);if(!p){p={id,c,in:{x:0,y:0}};pl.set(id,p);emit('join')}p.name=name;p.color=color;roster()}
 else if(m.t==='in'){const p=pl.get(id);if(p)p.in={x:clamp(+m.x||0),y:clamp(+m.y||0)}}
 else if(m.t==='act')act(id);
 else if(m.t==='bowl'&&view.stage==='bowling'&&id===view.bowl){const p=pl.get(id);bowlBall(p.in.x,p.in.y,clamp(+m.pw||.75,0,1),clamp(m.ty|0,0,2))}
 else if(m.t==='start'&&id===lead())start()}
function toLobby(){view.stage='lobby';view.msg='';view.sub='';view.sc=[];view.bat='';view.bowl='';sc.clear();order=[];F.forEach(f=>{f.id='';f.x=f.hx;f.z=f.hz});notify()}
function onLeave(id){if(!pl.delete(id))return;roster();if(['lobby','final'].includes(view.stage))return;
 if(!pl.size)toLobby();else if(id===view.bat)nextInnings();else if(id===view.bowl){view.bowl='ai';F[10].id='ai';notify()}}
function openRoom(){if(peer)peer.destroy();const code=Array.from({length:4},()=>ALPHA[Math.random()*ALPHA.length|0]).join('');peer=new Peer(PFX+code);
 peer.on('open',()=>{view.code=code;showJoin(code)});
 peer.on('error',e=>{if(e.type==='unavailable-id')openRoom();else $('hint').textContent='Network problem: '+e.type});
 peer.on('connection',c=>{c.on('open',()=>{if(c.metadata&&c.metadata.role==='screen'){scr.add(c);c.send({t:'roster',r:view.roster})}});
  c.on('data',m=>onMsg(c,m));c.on('close',()=>{scr.delete(c);onLeave(c.peer)});c.on('error',()=>{})})}
function step(dt){const st=view.stage;if(swPhase>0)swPhase=Math.min(1,swPhase+dt/.35);if(st!=='lobby'&&st!=='final')moveF(dt);
 if(st==='ready'){if((stT-=dt)<=0)toBowling()}
 else if(st==='bowling'){if((stT-=dt)<=0)bowlBall(Math.random()*1.6-.8,Math.random()*2-1,.6+Math.random()*.25,Math.random()*3|0)}
 else if(st==='flight'){ft+=dt;
  if(ft<0){bwv=(ft+.6)/.6;ball=[.35,1.6,-10.3];F[10].x=0;F[10].z=-12.6+bwv*2.2}
  else{bwv=1;const u=ft/T,ub=(zb+10)/20,uu=Math.min(u,1),y=u<ub?.12+1.8*Math.pow(1-u/ub,2):.12+hb*Math.max(0,Math.sin((uu-ub)/(1-ub)*Math.PI/2))*(u>1?Math.max(0,1-(u-1)*4):1);
   ball=[.35+(line-.35)*uu+curve*uu*uu*uu+spinD*Math.max(0,(uu-ub)/(1-ub)),y,-10+20*u]}
  if(ft>T+.35)judge()}
 else if(st==='hit')playStep(dt);
 else if(st==='result'){if((stT-=dt)<=0){if(pend.out||view.left<=0)nextInnings();else toBowling()}}
 else if(st==='final'){if((stT-=dt)<=0)toLobby()}}
const snap=()=>({t:'s',st:view.stage,msg:view.msg,sub:view.sub,dl:view.dl,bat:view.bat,bowl:view.bowl,lf:view.left,sw:r2(swPhase),bw:r2(bwv),br:r2(brv),b:ball.map(r2),
 fl:F.map(f=>[r2(f.x),r2(f.z),f.ds>0?1:0,f.hb?1:0]),fid:F.map(f=>f.id),sc:order.filter(id=>sc.has(id)).map(id=>{const s=sc.get(id);return [id,s.runs,s.balls,s.out?1:0]})});
// ---------- viewer (extra screen)
function openViewer(){view.code=VIEW.toUpperCase();showJoin(view.code);$('startBtn').classList.add('hide');peer=new Peer();
 peer.on('open',()=>{const c=peer.connect(PFX+view.code,{metadata:{role:'screen'}});
  c.on('data',m=>{if(m.t==='s')apply(m);else if(m.t==='roster'){view.roster=m.r;drawRoster()}});c.on('close',()=>$('hint').textContent='Disconnected from the host screen.')});
 peer.on('error',e=>$('hint').textContent='Cannot reach room '+view.code+' ('+e.type+')')}
// ---------- wiring + loop
const FS=document.documentElement;$('fs').onclick=()=>{document.fullscreenElement?document.exitFullscreen():FS.requestFullscreen&&FS.requestFullscreen()};
$('mute').onclick=()=>{if(!AC||AC.state!=='running'){ac();sfx('join');return}mute=!mute};$('snd').onclick=()=>{ac();sfx('join')};
addEventListener('keydown',e=>{if(e.key==='f'||e.key==='F')$('fs').click();if(e.key==='m'||e.key==='M')$('mute').click();ac()});addEventListener('pointerdown',ac);
$('startBtn').onclick=()=>{ac();start()};if(HOST)openRoom();else openViewer();drawRoster();
let last=performance.now(),acc=0;
(function loop(now){const dt=Math.min((now-last)/1000,.05);last=now;
 if(HOST){step(dt);const s=snap();apply(s);acc+=dt;if(acc>=.04){acc=0;s.ev=evq;evq=[];scr.forEach(c=>{try{c.send(s)}catch{}})}}
 frame(dt,now);hud();R.render(S,cam);requestAnimationFrame(loop)})(last);
