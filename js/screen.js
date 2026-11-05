import * as THREE from 'three';
const Q=new URLSearchParams(location.search),VIEW=Q.get('screen'),HOST=!VIEW,PFX='wemble-cricket-',ALPHA='ABCDEFGHJKLMNPQRSTUVWXYZ',$=i=>document.getElementById(i);
const view={stage:'lobby',msg:'',sub:'',roster:[],sc:[],bat:'',bowl:'',left:6,sw:0,bw:0,code:''};
const esc=s=>s.replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';'),clamp=(v,a=-1,b=1)=>Math.max(a,Math.min(b,v)),r2=v=>Math.round(v*100)/100;
// ---------- audio (WebAudio synth)
let AC=null,mute=false,evq=[];
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch{}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,d,type='square',vol=.08,slide=0,delay=0){const c=AC;if(!c||mute)return;const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
 if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d)}
function noise(d,v=.08){const c=AC;if(!c||mute)return;const b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);
 const s=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1200;g.gain.value=v;s.buffer=b;s.connect(f);f.connect(g);g.connect(c.destination);s.start()}
const SFX={bowl:()=>tone(220,.3,'sawtooth',.04,400),swing:()=>tone(400,.12,'triangle',.06,-200),hit:()=>{tone(1500,.06,'square',.18,-900);noise(.15,.1)},
 cheer:()=>{noise(1.2,.1);[523,659,784,1047].forEach((f,i)=>tone(f,.2,'triangle',.08,0,i*.08))},out:()=>{tone(330,.7,'sawtooth',.1,-280);noise(.4,.08)},wide:()=>tone(300,.25,'triangle',.1),
 win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.3,'triangle',.12,0,i*.14)),join:()=>{tone(660,.1,'triangle',.1);tone(990,.15,'triangle',.1,0,.1)}};
const sfx=n=>SFX[n]&&SFX[n](),emit=n=>{evq.push(n);sfx(n)};
// ---------- scene
const R=new THREE.WebGLRenderer({canvas:$('c'),antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.shadowMap.enabled=true;
const S=new THREE.Scene();S.background=new THREE.Color('#8fd3ff');S.fog=new THREE.Fog('#8fd3ff',70,150);
const cam=new THREE.PerspectiveCamera(55,1,.1,300),look=new THREE.Vector3(0,1.5,-4);cam.position.set(-6,7,21);
S.add(new THREE.HemisphereLight(0xffffff,0x4a8a4a,1.1));
const sun=new THREE.DirectionalLight(0xffffff,1.5);sun.position.set(15,30,15);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-38,right:38,top:38,bottom:-38,near:1,far:100});sun.shadow.mapSize.set(2048,2048);S.add(sun);
const resize=()=>{R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',resize);resize();
const mesh=(g,c,x=0,y=0,z=0)=>{const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.8}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m};
const flat=(g,c,y)=>{const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:c}));m.rotation.x=-Math.PI/2;m.position.y=y;S.add(m);return m};
const g2=mesh(new THREE.CircleGeometry(160,32),0x2f7d3a,0,-.02,0);g2.rotation.x=-Math.PI/2;S.add(g2);
const gr=mesh(new THREE.CircleGeometry(42,64),0x4aa656);gr.rotation.x=-Math.PI/2;S.add(gr);
flat(new THREE.RingGeometry(31,31.4,96),0xffffff,.03);
const pt=mesh(new THREE.PlaneGeometry(3.2,22),0xd9b77e,0,.02,0);pt.rotation.x=-Math.PI/2;S.add(pt);
for(const z of[-8.7,8.7]){const l=flat(new THREE.PlaneGeometry(3.4,.08),0xffffff,.035);l.position.z=z}
for(const z of[-10,10])for(const x of[-.11,0,.11])S.add(mesh(new THREE.CylinderGeometry(.025,.025,.72),0xf1e0b0,x,.36,z));
function person(){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6}),b=new THREE.Mesh(new THREE.CapsuleGeometry(.3,.7,6,12),mat);b.position.y=.95;b.castShadow=true;g.add(b);
 g.add(mesh(new THREE.SphereGeometry(.22,12,12),0xf1c27d,0,1.85,0));const sp=new THREE.Sprite(new THREE.SpriteMaterial({depthTest:false}));sp.scale.set(2.6,.65,1);sp.position.y=2.6;g.add(sp);
 g.userData={mat,sp,sig:null};S.add(g);return g}
function setP(g,id){const p=id==='ai'?{name:'Computer',color:'#8d99ae'}:view.roster.find(r=>r.id===id),sig=p?p.name+p.color:'';if(g.userData.sig===sig)return;g.userData.sig=sig;g.visible=!!p;if(!p)return;
 g.userData.mat.color.set(p.color);const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.font='bold 36px sans-serif';x.textAlign='center';x.lineWidth=6;x.strokeStyle='#000';x.fillStyle='#fff';x.strokeText(p.name,128,44);x.fillText(p.name,128,44);
 g.userData.sp.material.map=new THREE.CanvasTexture(c);g.userData.sp.material.needsUpdate=true}
const batter=person();batter.position.set(.55,0,9.4);batter.rotation.y=Math.PI;
const pivot=new THREE.Group();pivot.position.set(.35,.9,.25);pivot.add(mesh(new THREE.BoxGeometry(.05,.14,.95),0xe8c27a,0,0,.45));batter.add(pivot);
const bowler=person();bowler.position.set(0,0,-12.6);
const FP=[];for(const a of[-80,-55,-30,0,30,55,80])FP.push([21*Math.sin(a*Math.PI/180),9.5-21*Math.cos(a*Math.PI/180)]);for(const a of[-40,40])FP.push([9*Math.sin(a*Math.PI/180),9.5-9*Math.cos(a*Math.PI/180)]);
FP.forEach(p=>S.add(mesh(new THREE.CapsuleGeometry(.28,.7,4,8),0x2a7fff,p[0],.65,p[1])));S.add(mesh(new THREE.CapsuleGeometry(.28,.7,4,8),0x8d6e63,0,.65,12.2));
const ballM=mesh(new THREE.SphereGeometry(.13,12,12),0xd32f2f);S.add(ballM);const ballPos=new THREE.Vector3(.35,1.6,-10.3);
function apply(s){view.stage=s.st;view.msg=s.msg;view.sub=s.sub;view.bat=s.bat;view.bowl=s.bowl;view.left=s.lf;view.sc=s.sc;view.sw=s.sw;view.bw=s.bw;ballPos.set(s.b[0],s.b[1],s.b[2]);if(s.ev&&!HOST)s.ev.forEach(sfx)}
function frame(dt){ballM.position.lerp(ballPos,1-Math.exp(-28*dt));setP(batter,view.bat);setP(bowler,view.bowl);bowler.position.z=-12.6+view.bw*2.2;pivot.rotation.y=1.4-view.sw*3.1;
 const tg=view.stage==='hit'?new THREE.Vector3(ballPos.x*.6,Math.max(1,ballPos.y*.4),(ballPos.z-4)*.6-4):new THREE.Vector3(0,1.5,-4);look.lerp(tg,1-Math.exp(-3*dt));cam.lookAt(look)}
// ---------- HUD
let lastSc='';
function drawRoster(){$('roster').innerHTML=view.roster.map(p=>`<li><i style="background:${p.color}"></i>${esc(p.name)}${p.lead?' ⭐':''}</li>`).join('')||'<li>Waiting for players…</li>'}
function hud(){const st=view.stage,on=!!AC&&AC.state==='running';$('snd').classList.toggle('hide',on);$('mute').textContent=mute||!on?'🔇':'🔊';
 $('lobby').classList.toggle('hide',st!=='lobby');$('score').classList.toggle('hide',st==='lobby');$('sub').classList.toggle('hide',st==='lobby');
 const h=view.sc.map(([id,r,b,o])=>{const p=view.roster.find(x=>x.id===id);return `<div class="${id===view.bat?'cur':''}"><i style="background:${p?p.color:'#888'}"></i>${p?esc(p.name):'?'} <b>${r}</b> <small>${b}b${o?' · out':''}</small></div>`}).join('');
 if(h!==lastSc){lastSc=h;$('score').innerHTML=h}
 $('sub').textContent=view.sub+(st==='final'?'':' · Balls left: '+view.left);$('big').textContent=['ready','hit','result','final'].includes(st)?view.msg:''}
function showJoin(code){const base=location.href.split('?')[0].replace(/[^/]*$/,''),url=base+'controller.html?room='+code;
 $('code').textContent=code;$('url').textContent=base+'controller.html';$('qr').innerHTML='';new QRCode($('qr'),{text:url,width:180,height:180});
 $('hint').textContent=HOST?'Each player bats one over (6 balls) while the next player bowls. Most runs wins. The first player can start from their phone.':'Extra screen connected.';
 if(HOST)$('extra').textContent='More screens: open '+base+'index.html?screen='+code}
// ---------- host: room, players, match logic
const pl=new Map(),scr=new Set(),sc=new Map();let peer,order=[],inn=0,stT=0,T=1,ft=0,line=0,zb=0,hb=1,swung=false,swT=0,hitA=null,pend=null,swPhase=0,bwv=0,ball=[.35,1.6,-10.3];
const lead=()=>pl.keys().next().value,nm=id=>id==='ai'?'Computer':(pl.get(id)||{name:'?'}).name;
function notify(){const st=view.stage,l=lead();pl.forEach(p=>{const role=p.id===view.bat?'bat':p.id===view.bowl?'bowl':'watch';let tx;
 if(st==='lobby')tx=p.id===l?'You lead the room. Start when everyone is in.':'Waiting for the leader to start…';
 else if(st==='final'||st==='hit'||st==='result')tx=view.msg||'…';
 else if(role==='bat')tx=st==='flight'?'SWING when the ball reaches you!':'You are batting. Stick: shot direction (push up to loft). Tap SWING on time.';
 else if(role==='bowl')tx=st==='bowling'?'Stick: left/right = line, up = fuller. Then tap BOWL.':'Bowling…';else tx='Watch the screen';
 try{p.c.send({t:'state',st,role,lead:p.id===l&&st==='lobby',tx})}catch{}})}
function roster(){const l=lead();view.roster=[...pl.values()].map(p=>({id:p.id,name:p.name,color:p.color,lead:p.id===l}));drawRoster();scr.forEach(c=>{try{c.send({t:'roster',r:view.roster})}catch{}});notify()}
function resetBall(){swung=false;swPhase=0;bwv=0;ball=[.35,1.6,-10.3];hitA=null;pend=null}
function start(){if(view.stage!=='lobby'||!pl.size)return;order=[...pl.keys()];sc.clear();order.forEach(id=>sc.set(id,{name:pl.get(id).name,runs:0,balls:0,out:false}));inn=-1;nextInnings()}
function nextInnings(){inn++;while(inn<order.length&&!pl.has(order[inn]))inn++;if(inn>=order.length)return finish();
 view.bat=order[inn];const o=[...pl.keys()].filter(i=>i!==view.bat);view.bowl=o.length?o[inn%o.length]:'ai';view.left=6;
 view.msg=nm(view.bat)+' to bat';view.sub='Bowler: '+nm(view.bowl);view.stage='ready';stT=2.4;resetBall();notify()}
function toBowling(){resetBall();view.msg='';view.stage='bowling';stT=view.bowl==='ai'?1.6:12;notify()}
function bowlBall(x,y){line=clamp(x)*.95+(Math.random()-.5)*.12;const L=(clamp(y)+1)/2;zb=7-L*9;hb=.5+L*1.5;T=.75+Math.random()*.4;ft=-.6;view.stage='flight';view.msg='';emit('bowl');notify()}
function finish(){const mx=Math.max(...order.map(id=>sc.get(id).runs)),w=order.filter(id=>sc.get(id).runs===mx).map(id=>sc.get(id).name);
 view.stage='final';view.msg='🏆 '+w.join(' & ')+' wins with '+mx+'!';view.sub='Final result';view.bat='';view.bowl='';stT=9;emit('win');notify()}
function hit(dv){const a=Math.abs(dv),aim=pl.get(view.bat).in,loft=aim.y<-.35,qq=a<.08?3:a<.15?2:1,r=Math.random();let runs=0,out='';
 if(qq===3){if(loft){if(r<.85)runs=6;else out='Caught'}else runs=r<.9?4:2}
 else if(qq===2){if(loft){if(r<.3)out='Caught';else runs=r<.65?6:r<.85?4:2}else runs=r<.4?4:r<.8?2:3}
 else{if(loft&&r<.35)out='Caught';else runs=r<.3?0:r<.7?1:2}
 const ang=clamp(aim.x*1.25+dv*2.2,-1.3,1.3),d=[Math.sin(ang),-Math.cos(ang)],sx=.5,sz=9,b=sx*d[0]+sz*d[1],sb=-b+Math.sqrt(b*b-(sx*sx+sz*sz-961));
 let tx,tz,h=3,roll=0,dur=1.5;
 if(out){let best=1e9,f=FP[0];for(const p of FP){const dd=Math.abs(Math.atan2(p[0]-sx,-(p[1]-sz))-ang);if(dd<best){best=dd;f=p}}tx=f[0];tz=f[1];h=7}
 else if(runs===6){tx=sx+d[0]*(sb+3);tz=sz+d[1]*(sb+3);h=14;dur=2}
 else if(runs===4){tx=sx+d[0]*sb;tz=sz+d[1]*sb;roll=1;h=0;dur=1.6}
 else{const L=runs?runs*6+4:3;tx=sx+d[0]*L;tz=sz+d[1]*L;h=runs?2.5:.5;dur=1.2}
 hitA={sx,sz,tx,tz,h,roll,dur,t:0};pend={runs,out,msg:out?'OUT! '+out:runs===6?'SIX!':runs===4?'FOUR!':runs?runs+' run'+(runs>1?'s':''):'Dot ball'};
 view.msg=pend.msg;view.stage='hit';emit('hit');notify()}
function judge(){if(!swung&&Math.abs(line)>.85)pend={wide:1,runs:1,msg:'WIDE! +1 run'};else if(Math.abs(line)<.3)pend={out:'Bowled',runs:0,msg:'BOWLED! OUT'};else pend={runs:0,msg:swung?'Missed! Dot ball':'Dot ball'};toResult()}
function toResult(){const s=sc.get(view.bat);s.runs+=pend.runs;if(!pend.wide){s.balls++;view.left--}if(pend.out)s.out=true;view.msg=pend.msg;view.stage='result';stT=2.2;
 const e=pend.out?'out':pend.runs>=4?'cheer':pend.wide?'wide':null;if(e)emit(e);
 if(pend.out||pend.runs>=4){const b=pl.get(view.bat);try{b&&b.c.send({t:'buzz'})}catch{}}notify()}
function act(id){const st=view.stage;
 if(st==='flight'&&id===view.bat&&!swung&&ft>-.3){swung=true;swT=ft;swPhase=.001;emit('swing');const dv=swT-T;if(Math.abs(dv)<=.26)hit(dv)}
 else if(st==='bowling'&&id===view.bowl){const p=pl.get(id);bowlBall(p.in.x,p.in.y)}}
function onMsg(c,m){const id=c.peer;if(!m)return;
 if(m.t==='join'||m.t==='profile'){const name=String(m.name||'Player').replace(/[<>&"]/g,'').slice(0,12)||'Player',color=/^#[0-9a-f]{6}$/i.test(m.color)?m.color:'#ff6b9d';
  let p=pl.get(id);if(!p){p={id,c,in:{x:0,y:0}};pl.set(id,p);emit('join')}p.name=name;p.color=color;roster()}
 else if(m.t==='in'){const p=pl.get(id);if(p)p.in={x:clamp(+m.x||0),y:clamp(+m.y||0)}}
 else if(m.t==='act')act(id);else if(m.t==='start'&&id===lead())start()}
function onLeave(id){if(!pl.delete(id))return;roster();if(['lobby','final'].includes(view.stage))return;
 if(!pl.size){view.stage='lobby';view.msg='';view.sub='';view.sc=[];sc.clear();order=[];notify()}else if(id===view.bat)nextInnings();else if(id===view.bowl){view.bowl='ai';notify()}}
function openRoom(){if(peer)peer.destroy();const code=Array.from({length:4},()=>ALPHA[Math.random()*ALPHA.length|0]).join('');peer=new Peer(PFX+code);
 peer.on('open',()=>{view.code=code;showJoin(code)});
 peer.on('error',e=>{if(e.type==='unavailable-id')openRoom();else $('hint').textContent='Network problem: '+e.type});
 peer.on('connection',c=>{c.on('open',()=>{if(c.metadata&&c.metadata.role==='screen'){scr.add(c);c.send({t:'roster',r:view.roster})}});
  c.on('data',m=>onMsg(c,m));c.on('close',()=>{scr.delete(c);onLeave(c.peer)});c.on('error',()=>{})})}
function step(dt){const st=view.stage;if(swPhase>0)swPhase=Math.min(1,swPhase+dt/.35);
 if(st==='ready'){if((stT-=dt)<=0)toBowling()}
 else if(st==='bowling'){if((stT-=dt)<=0)bowlBall(Math.random()*1.6-.8,Math.random()*2-1)}
 else if(st==='flight'){ft+=dt;
  if(ft<0){bwv=(ft+.6)/.6;ball=[.35,1.6,-10.3]}
  else{bwv=1;const u=ft/T,ub=(zb+10)/20,uu=Math.min(u,1),y=u<ub?.12+1.8*Math.pow(1-u/ub,2):.12+hb*Math.max(0,Math.sin((uu-ub)/(1-ub)*Math.PI/2))*(u>1?Math.max(0,1-(u-1)*4):1);ball=[.35+(line-.35)*uu,y,-10+20*u]}
  if(ft>T+.35)judge()}
 else if(st==='hit'){hitA.t+=dt;const u=Math.min(hitA.t/hitA.dur,1),a=hitA;ball=[a.sx+(a.tx-a.sx)*u,.2+(a.roll?Math.abs(Math.sin(u*9))*.5*(1-u):a.h*4*u*(1-u)),a.sz+(a.tz-a.sz)*u];if(u>=1)toResult()}
 else if(st==='result'){if((stT-=dt)<=0){if(pend.out||view.left<=0)nextInnings();else toBowling()}}
 else if(st==='final'){if((stT-=dt)<=0){view.stage='lobby';view.msg='';view.sub='';view.sc=[];sc.clear();order=[];notify()}}}
const snap=()=>({t:'s',st:view.stage,msg:view.msg,sub:view.sub,bat:view.bat,bowl:view.bowl,lf:view.left,sw:r2(swPhase),bw:r2(bwv),b:ball.map(r2),
 sc:order.filter(id=>sc.has(id)).map(id=>{const s=sc.get(id);return [id,s.runs,s.balls,s.out?1:0]})});
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
 frame(dt);hud();R.render(S,cam);requestAnimationFrame(loop)})(last);
