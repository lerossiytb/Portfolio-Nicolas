(function(){
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var body=document.body; body.classList.add('sp-js');

  /* Preloader: Zähler 0→100, Welle, dann Vorhang nach oben */
  var pre=$('.sp-pre'), pc=$('.sp-pre-c');
  function done(){ if(!pre) return; pre.classList.add('out'); body.classList.add('sp-ready'); setTimeout(function(){pre.remove()},1100); }
  if(pre){ if(rm){done();} else { var t0=performance.now(), D=1500;
    (function tick(n){ var p=Math.min(1,(n-t0)/D); pc.textContent=Math.round(p*100); pre.style.setProperty('--p',p); if(p<1) requestAnimationFrame(tick); else setTimeout(done,150); })(t0); } }
  else body.classList.add('sp-ready');

  /* Titel in Buchstaben zerlegen */
  $$('.sp-hero .sp-title').forEach(function(el){ var txt=el.textContent; el.setAttribute('aria-label',txt); el.textContent='';
    txt.split(' ').forEach(function(w,wi){ var ws=document.createElement('span'); ws.className='sp-w'; ws.setAttribute('aria-hidden','true');
      w.split('').forEach(function(c,i){ var s=document.createElement('span'); s.className='sp-ch'; s.textContent=c; s.style.setProperty('--i',wi*5+i); ws.appendChild(s); });
      el.appendChild(ws); el.appendChild(document.createTextNode(' ')); }); });

  /* Statement: Wort für Wort aufhellen (scrub) – DE/EN/FR-Spans werden einzeln zerlegt */
  var words=[];
  function splitBig(el){ var holder=el.firstElementChild; if(!holder) return;
    var txt=holder.textContent; holder.textContent=''; holder.setAttribute('data-orig',txt);
    txt.split(' ').forEach(function(w){ var s=document.createElement('span'); s.className='sp-bw'; s.textContent=w+' '; holder.appendChild(s); }); }
  var big=$('.sp-big'); if(big){ splitBig(big); }
  /* nach Sprachwechsel neu zerlegen */
  var lo=new MutationObserver(function(){ var h=big&&big.firstElementChild; if(h&&!h.querySelector('.sp-bw')&&h.textContent.trim()){ var t=h.textContent; h.textContent=''; t.split(' ').forEach(function(w){var s=document.createElement('span');s.className='sp-bw';s.textContent=w+' ';h.appendChild(s);}); upd(); } });
  if(big) lo.observe(big,{childList:true,subtree:true,characterData:true});

  /* Zähler */
  var cio=new IntersectionObserver(function(es){ es.forEach(function(e){ if(!e.isIntersecting) return; cio.unobserve(e.target);
    var el=e.target, to=+el.dataset.count, t0=performance.now();
    (function f(n){ var p=Math.min(1,(n-t0)/1400); el.textContent=Math.round(to*(1-Math.pow(1-p,4))); if(p<1) requestAnimationFrame(f); })(t0); }); },{threshold:.6});
  $$('[data-count]').forEach(function(e){ rm?e.textContent=e.dataset.count:cio.observe(e); });

  /* Reveal von Zeilen / Fotos / Karten */
  var rio=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in2'); rio.unobserve(e.target); } }); },{threshold:.15});
  $$('.sp-photo:not(.sp-photo--hero),.sp-card,.sp-stats li,.sp-wm-card,.sp-year,.sp-gives li,.sp-counters>div,.sp-ev').forEach(function(e,i){ e.classList.add('sp-rv'); e.style.setProperty('--d',(i%4)*90+'ms'); rio.observe(e); });

  /* Scroll-Schleife: Fortschritt, Parallax, Statement-Scrub, Marquee-Tempo */
  var prog=$('.sp-progress'), photos=$$('.sp-photo'), marks=$$('.sp-mark,.sp-waves'), mq=$$('.sp-marquee-t'), last=scrollY, vel=0, mx=0;
  function upd(){
    var H=document.documentElement.scrollHeight-innerHeight, y=scrollY;
    if(prog) prog.style.transform='scaleX('+(y/H)+')';
    $$('.sp-bw').forEach(function(w){ var r=w.getBoundingClientRect(), p=1-(r.top-innerHeight*.35)/(innerHeight*.45); w.style.opacity=Math.max(.18,Math.min(1,p)); });
    photos.forEach(function(f){ var r=f.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return; var p=(r.top+r.height/2-innerHeight/2)/innerHeight; var ph=f.firstElementChild; if(ph) ph.style.transform='translateY('+(p*-8)+'%) scale(1.14)'; });
    marks.forEach(function(m,i){ m.style.transform='translate3d(0,'+(y*(i?-.06:.12))+'px,0)'; });
  }
  function loop(){
    var y=scrollY; vel+= (y-last-vel)*.15; last=y; mx-= .6+Math.abs(vel)*.35*(vel>=0?1:-1);
    mq.forEach(function(m){ var w=m.firstElementChild.offsetWidth; if(w){ mx=((mx%w)+w)%w*-1+0; m.style.transform='translate3d('+(mx)+'px,0,0) skewX('+Math.max(-12,Math.min(12,-vel*.35))+'deg)'; } });
    requestAnimationFrame(loop);
  }
  if(!rm){ var mpos=0; mq.forEach(function(m){ m.dataset.x=0; });
    (function(){ var x=0, lastY=scrollY, v=0;
      (function frame(){ var y=scrollY; v+=(y-lastY-v)*.12; lastY=y; x-= 1.1+Math.abs(v)*.5;
        mq.forEach(function(m){ var w=m.firstElementChild.offsetWidth||1; if(-x>=w) x+=w; m.style.transform='translate3d('+x+'px,0,0) skewX('+Math.max(-10,Math.min(10,-v*.3))+'deg)'; });
        requestAnimationFrame(frame); })(); })();
    addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd); upd();
  } else { $$('.sp-bw').forEach(function(w){w.style.opacity=1}); }

  /* Cursor (nur Maus) + magnetische Buttons + Foto-Tilt */
  if(!rm && matchMedia('(hover:hover) and (pointer:fine)').matches){
    var c=$('.sp-cursor'), cx=0, cy=0, tx=0, ty=0; body.classList.add('sp-cur');
    addEventListener('mousemove',function(e){ tx=e.clientX; ty=e.clientY; });
    (function m(){ cx+=(tx-cx)*.2; cy+=(ty-cy)*.2; c.style.transform='translate3d('+cx+'px,'+cy+'px,0)'; requestAnimationFrame(m); })();
    $$('a,button,.sp-photo').forEach(function(e){ e.addEventListener('mouseenter',function(){c.classList.add('big'); if(e.classList.contains('sp-photo')) c.classList.add('ph');}); e.addEventListener('mouseleave',function(){c.classList.remove('big','ph');}); });
    $$('.btn').forEach(function(b){ b.addEventListener('mousemove',function(e){ var r=b.getBoundingClientRect(); b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.25)+'px,'+((e.clientY-r.top-r.height/2)*.35)+'px)'; }); b.addEventListener('mouseleave',function(){b.style.transform='';}); });
    $$('.sp-photo').forEach(function(f){ f.addEventListener('mousemove',function(e){ var r=f.getBoundingClientRect(), px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5; f.style.transform='perspective(900px) rotateY('+px*8+'deg) rotateX('+(-py*8)+'deg)'; }); f.addEventListener('mouseleave',function(){f.style.transform='';}); });
  }
})();
(function(){ var g=document.querySelector('.sp-goalfull'); if(!g) return;
  new IntersectionObserver(function(e,o){ if(e[0].isIntersecting){ g.classList.add('in2'); o.disconnect(); } },{threshold:.35}).observe(g); })();
