const PFX='wemble-cricket-',$=i=>document.getElementById(i),Q=new URLSearchParams(location.search);
const COLS=['#ff6b9d','#ffd166','#4cc9f0','#06d6a0','#b388ff','#ff9f1c','#ef476f','#8ecae6','#ffffff','#7bd389'];
let color=localStorage.wcc||COLS[Math.random()*COLS.length|0],peer,conn,joined=false,tilt=false,tb=null,tx=0,ty=0,sx=0,sy=0;
const cl=n=>Math.max(-1,Math.min(1,n));
$('name').value=localStorage.wcn||'';$('room').value=(Q.get('room')||localStorage.wcr||'').toUpperCase();
function sw(){$('sw').innerHTML='';COLS.forEach(c=>{const b=document.createElement('b');b.style.background=c;if(c===color)b.className='sel';b.onclick=()=>{color=c;sw()};$('sw').append(b)})}sw();
const show=id=>{$('join').classList.toggle('hide',id!=='join');$('pad').classList.toggle('hide',id!=='pad')};
$('go').onclick=()=>{const name=$('name').value.trim()||'Player',room=$('room').value.trim().toUpperCase();if(room.length<4)return $('hint').textContent='Enter the 4-letter room code';
 localStorage.wcn=name;localStorage.wcc=color;localStorage.wcr=room;
 if(joined&&conn&&conn.open){conn.send({t:'profile',name,color});return show('pad')}
 $('hint').textContent='Connecting…';connect(room,name)};
function connect(room,name){peer=new Peer();
 peer.on('open',()=>{conn=peer.connect(PFX+room,{metadata:{role:'pad'}});
  conn.on('open',()=>{joined=true;conn.send({t:'join',name,color});show('pad');try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{})}catch{}});
  conn.on('data',on);
  conn.on('close',()=>{$('stat').textContent='Disconnected… reconnecting';setTimeout(()=>{peer.destroy();connect(room,localStorage.wcn||name)},1500)})});
 peer.on('error',e=>{if(e.type==='peer-unavailable'){peer.destroy();joined=false;show('join');$('hint').textContent='Room not found. Check the code.'}})}
function on(m){if(m.t==='buzz'){navigator.vibrate&&navigator.vibrate(400);return}
 if(m.t!=='state')return;const playing=m.st!=='lobby'&&m.st!=='final';
 $('stat').textContent=m.tx;$('act').textContent=m.role==='bowl'?'BOWL':'SWING';
 $('act').classList.toggle('hide',!(playing&&m.role!=='watch'));
 $('start').classList.toggle('hide',!m.lead);$('edit').classList.toggle('hide',m.st!=='lobby')}
$('start').onclick=()=>conn&&conn.send({t:'start'});$('edit').onclick=()=>{$('go').textContent='Save';show('join')};
const zone=$('zone'),base=$('base'),knob=$('knob'),act=$('act');let sid=null,cx=0,cy=0;const RAD=60;
function mv(e){let dx=e.clientX-cx,dy=e.clientY-cy;const d=Math.hypot(dx,dy);if(d>RAD){dx*=RAD/d;dy*=RAD/d}sx=dx/RAD;sy=dy/RAD;knob.style.transform=`translate(${dx}px,${dy}px)`}
zone.onpointerdown=e=>{if(sid!==null)return;sid=e.pointerId;zone.setPointerCapture(sid);cx=e.clientX;cy=e.clientY;base.style.cssText=`left:${cx-70}px;top:${cy-70}px;bottom:auto;opacity:1`;mv(e)};
zone.onpointermove=e=>{if(e.pointerId===sid)mv(e)};
zone.onpointerup=zone.onpointercancel=e=>{if(e.pointerId===sid){sid=null;sx=sy=0;base.style.cssText='';knob.style.transform=''}};
act.onpointerdown=e=>{e.preventDefault();act.classList.add('on');if(conn&&conn.open)conn.send({t:'act'});navigator.vibrate&&navigator.vibrate(25)};
act.onpointerup=act.onpointercancel=()=>act.classList.remove('on');
$('tilt').onclick=async()=>{if(tilt){tilt=false;tx=ty=0;$('tilt').textContent='Tilt: off';return}
 if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission){try{if(await DeviceOrientationEvent.requestPermission()!=='granted')return}catch{return}}
 tilt=true;tb=null;$('tilt').textContent='Tilt: on (tap to stop)'};
addEventListener('deviceorientation',e=>{if(!tilt||e.beta==null)return;if(!tb)tb=[e.beta,e.gamma];
 const b=e.beta-tb[0],g=e.gamma-tb[1],a=(((screen.orientation&&screen.orientation.angle)??window.orientation??0)+360)%360;
 let x,y;if(a===90){x=b;y=-g}else if(a===270){x=-b;y=g}else if(a===180){x=-g;y=-b}else{x=g;y=b}
 tx=cl(x/25);ty=cl(y/25);if(Math.hypot(tx,ty)<.18)tx=ty=0});
setInterval(()=>{if(!conn||!conn.open)return;const s=Math.hypot(sx,sy)>.05;conn.send({t:'in',x:s?sx:tx,y:s?sy:ty})},33);
const FE=document.documentElement;if(!FE.requestFullscreen)$('fs').classList.add('hide');$('fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():FE.requestFullscreen().catch(()=>{});
document.addEventListener('contextmenu',e=>e.preventDefault());
