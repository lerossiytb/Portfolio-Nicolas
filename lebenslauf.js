/* Lebenslauf als Flug: Mapbox GL JS.
   Den öffentlichen Mapbox-Token (beginnt mit pk.) hier eintragen und auf Mapbox auf nicolasrossi.ch beschränken. */
(function(){
  var MAPBOX_TOKEN = '';
  var root = document.querySelector('.lb');
  var steps = [].slice.call(document.querySelectorAll('.lb-step'));
  var fly = document.getElementById('lbFly');
  var map = null;
  function noMap(){ root.classList.add('no-map'); steps.forEach(function(s){ s.classList.add('on'); }); }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce && fly) fly.checked = false;

  if(!MAPBOX_TOKEN || !window.mapboxgl || !mapboxgl.supported()){ noMap(); if(fly) fly.closest('label').hidden = true; return; }

  mapboxgl.accessToken = MAPBOX_TOKEN;
  map = new mapboxgl.Map({
    container: 'lbMap',
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    center: [8.2083, 47.4833], zoom: 4.2, pitch: 0, bearing: 0,
    interactive: false, attributionControl: true
  });
  map.on('error', function(e){ if(e && e.error && /401|403|token/i.test(e.error.message||'')) noMap(); });

  function place(s){
    var el = document.createElement('div');
    el.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#FF5A00;border:3px solid #fff;box-shadow:0 0 0 6px rgba(255,90,0,.3)';
    new mapboxgl.Marker(el).setLngLat([+s.dataset.lng, +s.dataset.lat]).addTo(map);
  }
  /* Adressen werden nur für die Position auf der Karte genutzt (nicht angezeigt). Schlägt die Suche fehl, gelten die Ortskoordinaten. */
  Promise.all(steps.map(function(s){
    var a = s.dataset.addr; if(!a) return;
    return fetch('https://api.mapbox.com/search/geocode/v6/forward?limit=1&country=ch,nz&q='+encodeURIComponent(a)+'&access_token='+MAPBOX_TOKEN)
      .then(function(r){ return r.json(); })
      .then(function(d){ var c = d.features && d.features[0] && d.features[0].geometry.coordinates;
        if(c){ s.dataset.lng = c[0]; s.dataset.lat = c[1]; s.dataset.zoom = Math.max(+s.dataset.zoom, 14); } })
      .catch(function(){});
  })).then(function(){ steps.forEach(place); });

  var current = -1;
  function go(i){
    if(i === current) return; current = i;
    var s = steps[i]; var c = [+s.dataset.lng, +s.dataset.lat]; var z = +s.dataset.zoom;
    if(fly.checked){
      map.flyTo({ center: c, zoom: z, pitch: 55, bearing: (i%2?-25:25), speed: .7, curve: 1.6, essential: true });
    } else {
      map.jumpTo({ center: c, zoom: z, pitch: 0, bearing: 0 });
    }
  }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('on'); go(steps.indexOf(e.target)); }
    });
  }, { threshold: .55 });
  steps.forEach(function(s){ io.observe(s); });
})();
