/* Interaktiver Einstieg: SUP per Maus/Finger um die Boje steuern. Erst danach öffnet sich die Seite. */
(function(){
  var sec=document.getElementById('start'); if(!sec) return;
  var cv=sec.querySelector('canvas'), ctx=cv.getContext('2d');
  var pctEl=sec.querySelector('.sp-pct'), skip=sec.querySelector('.sp-skip'), root=document.documentElement;
  var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W=0,H=0,dpr=1,pxM=100, S=3.4, TAU=Math.PI*2;
  function hash(n){var v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);}
  function sm(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)}
  function foam(a){return 'rgba(255,255,255,'+a+')';}
  function b2w(P,lx,ly){var c=Math.cos(P.h),s=Math.sin(P.h);return {x:P.x+lx*c-ly*s,y:P.y+lx*s+ly*c};}
  function wrap(a){while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a;}

  /* Sperre: Seite scrollt erst nach dem Turn */
  var locked=true, done=false;
  function lock(){ root.classList.add('sp-lock'); }
  function unlock(){ if(!locked) return; locked=false; root.classList.remove('sp-lock'); sec.classList.add('open'); }
  if(rm || (location.hash && location.hash!=='#start')){ unlock(); } else lock();
  function finish(goScroll){ unlock(); if(goScroll){ var g=document.getElementById('ziele'); setTimeout(function(){ if(g) g.scrollIntoView({behavior:'smooth'}); },60); } }
  skip.addEventListener('click',function(){ finish(true); });

  /* Zustand */
  var BUOY={x:0,y:0}, R_TRACK=2.7;
  var portrait=innerWidth<innerHeight, st=portrait?{x:-4.4,y:1.0,h:-.2,v:0,tr:0,stance:0}:{x:-7,y:.4,h:-.1,v:0,tr:0,stance:0}, dist=0, lastPush=0, hist=[], puddles=[], cycle=-1, sides={}, alt=0, started=false;
  var ptr={x:0,y:0,on:false}, cam=portrait?{x:-2.2,y:.5}:{x:-3.5,y:.2}, cum=0, prevA=null, maxD=0, tNow=0;
  function resize(){ var r=cv.getBoundingClientRect(); W=r.width;H=r.height;dpr=Math.min(2,devicePixelRatio||1); cv.width=W*dpr;cv.height=H*dpr; pxM=Math.min(H/7,W/5.2); }
  addEventListener('resize',resize); resize();
  function setPtr(e){ var r=cv.getBoundingClientRect(); ptr.x=e.clientX-r.left; ptr.y=e.clientY-r.top; ptr.on=true; started=true; }
  sec.addEventListener('pointermove',setPtr); sec.addEventListener('pointerdown',setPtr);
  sec.addEventListener('pointerleave',function(e){ if(e.pointerType==='mouse') ptr.on=ptr.on; });
  var vis=true; new IntersectionObserver(function(e){vis=e[0].isIntersecting;},{rootMargin:'50px'}).observe(sec);

  function pickSide(peek){
    if(Math.abs(st.tr)>.35) return st.tr>0?-1:1;
    var c=peek?alt:++alt; return (Math.floor(c/3)%2)?-1:1;
  }

  function update(dt){
    var tx=0,ty=0;
    if(ptr.on){ tx=cam.x+(ptr.x-W/2)/pxM; ty=cam.y+(ptr.y-H/2)/pxM; } else { tx=st.x+Math.cos(st.h)*5; ty=st.y+Math.sin(st.h)*5; }
    var dxT=tx-st.x, dyT=ty-st.y, dT=Math.hypot(dxT,dyT);
    var turn=0;
    if(started){ var want=Math.atan2(dyT,dxT), dh=wrap(want-st.h), mt=(1.75+.3*Math.min(1,st.v/3))*dt; if(dT<1.2) mt*=dT/1.2; turn=Math.max(-mt,Math.min(mt,dh)); st.h+=turn; }
    st.tr+=((turn/dt)-st.tr)*Math.min(1,dt*6);
    st.stance+=((sm((Math.abs(st.tr)-.3)/.5))-st.stance)*Math.min(1,dt*3.2);
    var vt=started?Math.max(1.0,Math.min(3.9,dT*1.1)):0; vt*=(1-.3*Math.min(1,Math.abs(st.tr)/1.75));
    st.v+=(vt-st.v)*Math.min(1,dt*1.5);
    var u=((dist%S)/S), pulse=1+.1*Math.sin((u*TAU)-1.2), step=st.v*pulse*dt;
    st.x+=Math.cos(st.h)*step; st.y+=Math.sin(st.h)*step; dist+=step;
    if(dist-lastPush>=.06){ lastPush=dist; hist.push({x:st.x,y:st.y,h:st.h,d:dist,id:Math.floor(dist/.06)}); if(hist.length>340) hist.shift(); }
    var k=Math.floor(dist/S);
    if(k!==cycle){ cycle=k; var sd=pickSide(false); sides[k]=sd; var tf=Math.min(1,Math.abs(st.tr)/.9), ex=.9+.5*tf, ey=sd*(.55+.35*tf*(sd<0?1:0)); var E=b2w(st,ex-1.7*st.stance,ey); puddles.push({x:E.x,y:E.y,d0:dist}); if(puddles.length>6) puddles.shift(); }
    /* Runde zählen */
    var rx=st.x-BUOY.x, ry=st.y-BUOY.y, rd=Math.hypot(rx,ry), ang=Math.atan2(ry,rx);
    if(rd<6.5){ if(prevA!==null){ var da=wrap(ang-prevA); if(Math.abs(da)<1) cum+=da; } prevA=ang; maxD=Math.max(maxD,rd); } else { prevA=null; cum*=.97; }
    if(!done && Math.abs(cum)>=TAU*.8 && maxD<7){ done=true; sec.classList.add('done'); setTimeout(function(){ finish(true); },1300); }
    var pct=Math.max(0,Math.min(100,Math.round(Math.abs(cum)/(TAU*.8)*100))); pctEl.textContent=(done?100:pct)+' %';
    if(started && !sec.classList.contains('go')) sec.classList.add('go');
    /* Kamera */
    var cx=st.x+(BUOY.x-st.x)*.5, cy=st.y+(BUOY.y-st.y)*.5; cam.x+=(cx-cam.x)*Math.min(1,dt*3); cam.y+=(cy-cam.y)*Math.min(1,dt*3);
  }

  function draw(t){
    var s=dist, P=st;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    var g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0C6A86'); g.addColorStop(.5,'#1790AF'); g.addColorStop(1,'#0B5F7B'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    var rg=ctx.createRadialGradient(W*.5,H*.45,0,W*.5,H*.45,Math.max(W,H)*.7); rg.addColorStop(0,'rgba(120,220,240,.28)'); rg.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.translate(W/2,H/2); ctx.scale(pxM,pxM); ctx.translate(-cam.x,-cam.y);
    var vw=W/pxM/2+2, vh=H/pxM/2+2;
    ctx.lineCap='round'; ctx.lineWidth=.03;
    for(var pass=0;pass<2;pass++){ for(var i=-14;i<=14;i++){ var by=(Math.floor(cam.y)+i); ctx.beginPath();
      for(var x=cam.x-vw;x<=cam.x+vw;x+=.45){ var y=by+Math.sin(x*1.4+t*.7+i*1.9+pass*2)*.08+Math.sin(x*.55-t*.45+i*.7)*.06+(pass?Math.sin(x*3.1+t*1.3)*.02:0); if(x===cam.x-vw) ctx.moveTo(x,y); else ctx.lineTo(x,y); }
      ctx.strokeStyle=foam((pass?.045:.07)+.035*Math.sin(i*1.3+pass)); ctx.stroke(); } }
    for(var gx=Math.floor((cam.x-vw)/1.2);gx<=Math.floor((cam.x+vw)/1.2);gx++) for(var gy=Math.floor((cam.y-vh)/1.2);gy<=Math.floor((cam.y+vh)/1.2);gy++){
      var hs=hash(gx*73.1+gy*19.7); if(hs<.55) continue; var a=.55*Math.max(0,Math.sin(t*(1.5+hs*2)+hs*40)); if(a<.05) continue;
      ctx.fillStyle=foam(a*.8); ctx.beginPath(); ctx.ellipse(gx*1.2+hs*1.1,gy*1.2+hash(hs*9)*1.1,.07+hs*.05,.012,0,0,6.3); ctx.fill(); }
    /* Zielkreis + Fortschritt */
    ctx.setLineDash([.18,.28]); ctx.strokeStyle=foam(.35); ctx.lineWidth=.04; ctx.beginPath(); ctx.arc(0,0,R_TRACK,0,TAU); ctx.stroke(); ctx.setLineDash([]);
    if(Math.abs(cum)>.05){ var a0=Math.atan2(-0,1); var endA=prevA!==null?prevA:0, startA=endA-cum; ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=.07; ctx.beginPath(); ctx.arc(0,0,R_TRACK,Math.min(startA,endA),Math.max(startA,endA)); ctx.stroke(); }
    /* Boje: Seil, Ringe */
    var bob=Math.sin(t*1.6)*.015;
    ctx.strokeStyle='rgba(20,50,64,.55)'; ctx.lineWidth=.03; ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(.2,.5,.35,.55); ctx.stroke();
    for(var r=0;r<4;r++){ var ph=((t*.35+r/4)%1); ctx.strokeStyle=foam(.35*(1-ph)); ctx.lineWidth=.025; ctx.beginPath(); ctx.arc(0,0,.4+ph*1.4,0,6.3); ctx.stroke(); }
    ctx.fillStyle=foam(.35); ctx.beginPath(); ctx.arc(0,0,.5,0,6.3); ctx.fill();
    /* Kielwasser */
    for(var q=hist.length-1;q>=0;q--){ var hh=hist[q], d=dist-hh.d; if(d>18) break; var al=.3*Math.exp(-d/6); if(al<.02) continue;
      var sp_=.16+d*.07, off=(hash(hh.id*1.7)-.5)*sp_*1.6, rr=.04+d*.012+hash(hh.id)*.07, Wq=b2w(hh,-2.0,off); ctx.fillStyle=foam(al*(.45+.5*hash(hh.id*3.1))); ctx.beginPath(); ctx.arc(Wq.x,Wq.y,rr,0,6.3); ctx.fill(); }
    ctx.lineWidth=.04;
    for(var sg=-1;sg<=1;sg+=2){ var prev=null; for(var q2=hist.length-1;q2>=0;q2-=6){ var h2=hist[q2], d2=dist-h2.d; if(d2>14) break; var Wp=b2w(h2,-1,sg*(.55+d2*.085)); if(prev){ctx.strokeStyle=foam(.32*Math.exp(-d2/5));ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(Wp.x,Wp.y);ctx.stroke();} prev=Wp; } }
    /* Pfützen */
    puddles.forEach(function(p){ var age=dist-p.d0, fade=Math.exp(-age/3.2); for(var q=0;q<3;q++){ ctx.strokeStyle=foam(.4*fade/(1+q*.6)); ctx.lineWidth=.03; ctx.beginPath(); ctx.arc(p.x,p.y,.12+age*.22+q*.16,0,6.3); ctx.stroke(); } if(age<S*.5){ ctx.fillStyle=foam(.5*fade); ctx.beginPath(); ctx.arc(p.x,p.y,.14,0,6.3); ctx.fill(); } });
    /* Bugwelle */
    var nose=b2w(P,2.15,0); ctx.lineWidth=.035;
    for(var sg2=-1;sg2<=1;sg2+=2){ var an=P.h+Math.PI+sg2*.34, bw=Math.min(1,P.v/2); var gl=ctx.createLinearGradient(nose.x,nose.y,nose.x+Math.cos(an)*3,nose.y+Math.sin(an)*3); gl.addColorStop(0,'rgba(255,255,255,'+.55*bw+')'); gl.addColorStop(1,'rgba(255,255,255,0)'); ctx.strokeStyle=gl; ctx.beginPath(); ctx.moveTo(nose.x,nose.y); ctx.lineTo(nose.x+Math.cos(an)*3,nose.y+Math.sin(an)*3); ctx.stroke(); }
    /* Cursor-Ziel */
    if(ptr.on){ var tx=cam.x+(ptr.x-W/2)/pxM, ty=cam.y+(ptr.y-H/2)/pxM, pr=((t*.9)%1); ctx.strokeStyle=foam(.6*(1-pr)); ctx.lineWidth=.035; ctx.beginPath(); ctx.arc(tx,ty,.15+pr*.5,0,6.3); ctx.stroke(); ctx.fillStyle='rgba(255,122,26,.9)'; ctx.beginPath(); ctx.arc(tx,ty,.07,0,6.3); ctx.fill(); }
    /* Boje (Kugel) */
    ctx.fillStyle='rgba(8,40,54,.3)'; ctx.beginPath(); ctx.arc(.07,.1,.38+bob,0,6.3); ctx.fill();
    var bg=ctx.createRadialGradient(-.1,-.12,.03,0,0,.4+bob); bg.addColorStop(0,'#FFE08A'); bg.addColorStop(.35,'#FFB020'); bg.addColorStop(1,'#E0720A'); ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(0,0,.36+bob,0,6.3); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(-.12,-.13,.09,.05,-.6,0,6.3); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillRect(-.36,-.03,.72,.06);

    /* Brett + Paddler */
    var yaw=Math.sin(dist/S*TAU)*.025*Math.min(1,P.v); ctx.save(); ctx.translate(P.x,P.y); ctx.rotate(P.h+yaw);
    function boardPath(){ ctx.beginPath(); ctx.moveTo(-2.15,0); ctx.bezierCurveTo(-2.15,-.3,-1,-.36,.2,-.36); ctx.bezierCurveTo(1.4,-.36,2.0,-.12,2.15,0); ctx.bezierCurveTo(2.0,.12,1.4,.36,.2,.36); ctx.bezierCurveTo(-1,.36,-2.15,.3,-2.15,0); ctx.closePath(); }
    ctx.save(); ctx.translate(.08,.12); ctx.fillStyle='rgba(6,36,50,.28)'; boardPath(); ctx.fill(); ctx.restore();
    var bgd=ctx.createLinearGradient(0,-.36,0,.36); bgd.addColorStop(0,'#B81C16'); bgd.addColorStop(.5,'#E8372A'); bgd.addColorStop(1,'#A5170F'); ctx.fillStyle=bgd; boardPath(); ctx.fill(); ctx.strokeStyle='rgba(90,10,6,.7)'; ctx.lineWidth=.03; ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(.9,-.2,1.3,.05,0,0,6.3); ctx.fill();
    /* Blitz */ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(1.75,-.1); ctx.lineTo(1.05,.02); ctx.lineTo(1.3,.03); ctx.lineTo(.95,.14); ctx.lineTo(1.7,-.01); ctx.lineTo(1.42,-.02); ctx.closePath(); ctx.fill(); ctx.fillStyle='#17110F'; ctx.fillRect(-.1,-.3,.02,.6);
    ctx.fillStyle='rgba(28,22,22,.92)'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-.75,-.22,1.4,.44,.14); else ctx.rect(-.75,-.22,1.4,.44); ctx.fill();
    ctx.fillStyle='rgba(28,22,22,.92)'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-2.0,-.2,.62,.4,.12); else ctx.rect(-2.0,-.2,.62,.4); ctx.fill(); ctx.fillStyle='#FF7A1A'; ctx.fillRect(-1.88,-.03,.38,.06);
    var k0=Math.floor(dist/S), u=(dist-k0*S)/S, side=sides[k0]||1, sd1=pickSide(true);
    var turnF=Math.min(1,Math.abs(P.tr)/.9), amp=1+.5*turnF, wf=.45, bx,by,lift=0, still=(P.v<.3);
    if(still){ u=.2; }
    if(u<wf){ var pw=u/wf; bx=(.9+.5*turnF)-pw*(1.53*amp); by=side*(.5+.35*turnF*(side<0?1:0)+.05*Math.sin(pw*3.1)); }
    else { var rr2=(u-wf)/(1-wf); lift=Math.sin(rr2*Math.PI); var ex=(.9+.5*turnF)-1.53*amp, nx=.9+.5*turnF, bl=sm((rr2-.55)/.45), sy=side*(.85+.35*lift)*(1-bl)+sd1*(.6+.2*lift)*bl; bx=ex+(nx-ex)*sm(rr2); by=sy; }
    var inW=u<wf, tw=side*(inW?.22*Math.sin(u/wf*Math.PI):-.1*lift), lean=inW?.1*Math.sin(u/wf*Math.PI):0;
    ctx.save(); ctx.translate(-1.7*P.stance,0);
    ctx.fillStyle='#1B3442'; for(var lg=-1;lg<=1;lg+=2){ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-.38,lg*.2-.065,.62,.13,.06); else ctx.rect(-.38,lg*.2-.065,.62,.13); ctx.fill(); }
    ctx.fillStyle='#F2F4F5'; ctx.beginPath(); ctx.ellipse(.28,-.2,.1,.06,0,0,6.3); ctx.ellipse(.28,.2,.1,.06,0,0,6.3); ctx.fill();
    var Hx=.3+lean*.5, Hy=-side*.12, dx=bx-Hx, dy=by-Hy, len=Math.hypot(dx,dy), ux=dx/len, uy=dy/len, bladeLen=.42;
    if(lift>.05){ ctx.fillStyle='rgba(6,36,50,'+(.18*lift)+')'; ctx.beginPath(); ctx.ellipse(bx+.15,by+.25*lift,.24,.09,Math.atan2(uy,ux),0,6.3); ctx.fill(); }
    ctx.lineCap='round'; ctx.strokeStyle='#15262F'; ctx.lineWidth=.045; ctx.beginPath(); ctx.moveTo(Hx,Hy); ctx.lineTo(bx-ux*bladeLen*.5,by-uy*bladeLen*.5); ctx.stroke();
    ctx.save(); ctx.translate(bx-ux*bladeLen*.1,by-uy*bladeLen*.1); ctx.rotate(Math.atan2(uy,ux)); ctx.fillStyle=inW?'rgba(10,34,46,.95)':'#17303D'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-bladeLen*.35,-.095,bladeLen*.85,.19,.07); else ctx.rect(-bladeLen*.35,-.095,bladeLen*.85,.19); ctx.fill(); ctx.fillStyle='#FF7A1A'; ctx.fillRect(-bladeLen*.1,-.012,bladeLen*.35,.024); ctx.restore();
    ctx.strokeStyle='#15262F'; ctx.lineWidth=.04; ctx.beginPath(); ctx.moveTo(Hx-.05,Hy-.06*side); ctx.lineTo(Hx+.05,Hy+.06*side); ctx.stroke();
    var sx=.02+lean, cs=Math.cos(tw), sn=Math.sin(tw); function sh(o){return {x:sx+(-sn*o),y:cs*o};}
    var shP=sh(side*.27), shO=sh(-side*.27), lo={x:Hx+(bx-Hx)*.55,y:Hy+(by-Hy)*.55};
    ctx.strokeStyle='#D9A07A'; ctx.lineWidth=.085; ctx.beginPath(); ctx.moveTo(shP.x,shP.y); ctx.lineTo(lo.x,lo.y); ctx.moveTo(shO.x,shO.y); ctx.lineTo(Hx,Hy); ctx.stroke();
    ctx.save(); ctx.translate(sx,0); ctx.rotate(tw); ctx.fillStyle='#E8EEF1'; ctx.beginPath(); ctx.ellipse(0,0,.19,.31,0,0,6.3); ctx.fill(); ctx.fillStyle='#1FA3C4'; ctx.fillRect(-.02,-.31,.04,.62); ctx.restore();
    ctx.fillStyle='#F4F6F7'; ctx.beginPath(); ctx.arc(sx+.08,side*.03,.125,0,6.3); ctx.fill(); ctx.fillStyle='#FF7A1A'; ctx.beginPath(); ctx.ellipse(sx+.2,side*.03,.04,.1,0,-1.57,1.57); ctx.fill();
    ctx.restore(); ctx.restore();
    if(Math.abs(P.tr)>.9 && P.v>1){ for(var n=0;n<18;n++){ var o=b2w(P,-1.7-Math.random()*1.2,(P.tr>0?-1:1)*(.3+Math.random()*.7)); ctx.fillStyle=foam(.3+Math.random()*.4); ctx.beginPath(); ctx.arc(o.x,o.y,.015+Math.random()*.035,0,6.3); ctx.fill(); } }
    ctx.restore();
    var vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.75); vg.addColorStop(0,'rgba(0,20,30,0)'); vg.addColorStop(1,'rgba(0,20,30,.45)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    var tg=ctx.createLinearGradient(0,H*.55,0,H); tg.addColorStop(0,'rgba(0,20,30,0)'); tg.addColorStop(1,'rgba(0,20,30,.5)'); ctx.fillStyle=tg; ctx.fillRect(0,H*.55,W,H*.45);
  }
  window.__sp=function(){return {st:st,cam:cam,pxM:pxM,cum:cum,W:W,H:H,done:done,locked:locked}};
  var last=performance.now(), t0=last;
  (function loop(n){ var dt=Math.max(.001,Math.min(.05,(n-last)/1000)); last=n; if(vis){ update(dt); draw((n-t0)/1000); } requestAnimationFrame(loop); })(last);
})();
