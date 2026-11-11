/* LeRossi – Interaktionen */
document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktop = window.matchMedia('(min-width: 801px)');

    // Gespeicherte Sprache wiederherstellen
    try {
        const saved = localStorage.getItem('lerossi-lang');
        if (saved && saved !== 'de') changeLanguage(saved);
    } catch (e) { /* Speicher nicht verfügbar – egal */ }

    /* ---------- Menü ---------- */
    const menuBtn = document.getElementById('menuBtn');
    const mainNav = document.getElementById('main-nav');
    const mainHeader = document.querySelector('.main-header');

    function toggleMenu(open) {
        if (!menuBtn || !mainNav) return;
        menuBtn.classList.toggle('open', open);
        mainNav.classList.toggle('active', open);
        menuBtn.setAttribute('aria-expanded', String(open));
    }
    if (menuBtn && mainNav) {
        menuBtn.addEventListener('click', () => toggleMenu(!mainNav.classList.contains('active')));
        mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggleMenu(false)));
    }

    /* ---------- Header: Hintergrund beim Scrollen, versteckt sich beim Runterscrollen ---------- */
    if (mainHeader) {
        let lastY = window.scrollY;
        const onScroll = () => {
            const y = window.scrollY;
            mainHeader.classList.toggle('scrolled', y > 40);
            mainHeader.classList.toggle('hide', y > 300 && y > lastY);
            lastY = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- Hero-Video erst nach dem Laden starten (schnellere Ladezeit = besser für Google) ---------- */
    const heroVideo = document.querySelector('.bg-video[data-src]');
    if (heroVideo) {
        const startVideo = () => setTimeout(() => { heroVideo.src = heroVideo.dataset.src; }, 600);
        if (document.readyState === 'complete') startVideo(); else window.addEventListener('load', startVideo, { once: true });
    }

    /* ---------- Hero: «Nicolas» genau so breit wie der Bildschirm ---------- */
    const heroStage = document.querySelector('.hero-stage');
    const fitName = () => {
        const ref = document.querySelector('#heroMask .line:first-child > span');
        const rossi = document.querySelector('#heroMask .line:nth-child(2) > span');
        const block = document.querySelector('#heroMask .hero-block');
        if (!heroStage || !ref || !rossi || !block) return;
        const measure = el => { el.style.display = 'inline-block'; const w = el.getBoundingClientRect().width; el.style.display = ''; return w; };
        // Text & Knöpfe beginnen genau unter dem «R» von Rossi
        const placeText = () => {
            const left = Math.max(0, block.clientWidth - measure(rossi));
            const room = block.clientWidth - left;
            heroStage.style.setProperty('--rossi-left', room >= 200 ? `${left.toFixed(1)}px` : '0px');
        };
        heroStage.style.setProperty('--name-size', '100px');
        const w = measure(ref);
        if (!w) return;
        const byWidth = 100 * block.clientWidth / w * 0.985;
        let size = byWidth;
        for (let i = 0; i < 2; i++) {
            heroStage.style.setProperty('--name-size', `${size.toFixed(1)}px`);
            placeText();
            const slogan = document.querySelector('#heroMask .hero-slogan');
            const sloganH = slogan ? slogan.getBoundingClientRect().height + 30 : 120;
            const cta = document.querySelector('#heroMask .hero-cta');
            const ctaH = cta ? cta.getBoundingClientRect().height + 20 : 0;
            const byHeight = (window.innerHeight - 120 - sloganH - ctaH) / (2 * 0.84);   // Platz für Menü, Angebot & untere Zeile
            size = Math.min(byWidth, byHeight) * 0.85;   // 15 % kleiner als der maximal mögliche Platz
        }
        heroStage.style.setProperty('--name-size', `${size.toFixed(1)}px`);
        placeText();
    };
    fitName();
    window.addEventListener('resize', fitName);
    if (document.fonts) document.fonts.ready.then(fitName);

    /* ---------- Mein Weg: Linie zeichnet sich, Punkte erscheinen nacheinander ---------- */
    const route = document.getElementById('route');
    if (route) {
        if ('IntersectionObserver' in window) {
            const ro = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { route.classList.add('drawn'); ro.disconnect(); } }), { threshold: 0.3 });
            ro.observe(route);
        } else route.classList.add('drawn');
    }

    /* ---------- Höhenlinien-Karte: Linien zeichnen sich, sobald sie ins Bild kommen ---------- */
    const topoMap = document.querySelector('.topo-map');
    if (topoMap) {
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { topoMap.classList.add('drawn'); io.disconnect(); } }), { threshold: 0.2 });
            io.observe(topoMap);
        } else topoMap.classList.add('drawn');
    }

    /* ---------- Hero: Zoom in den ausgestanzten Buchstaben ---------- */
    const heroPin = document.getElementById('heroPin');
    const heroMask = document.getElementById('heroMask');
    const heroLayers = document.querySelectorAll('.hero-mask');   // alle drei Ebenen bewegen sich gleich
    const setHero = (prop, value) => heroLayers.forEach(l => { l.style[prop] = value; });
    const heroUi = document.getElementById('heroUi');
    const heroFill = document.getElementById('heroFill');
    const heroClaim = document.getElementById('heroClaim');
    const heroLine = document.getElementById('heroLine');
    const zoomTarget = document.getElementById('zoomTarget');
    if (heroPin && heroMask && zoomTarget && !reduceMotion) {
        let maxScale = 1;
        const measureHero = () => {
            setHero('transform', 'none');
            fitName();
            if (!desktop.matches) { setHero('transformOrigin', ''); return; }
            const m = heroMask.getBoundingClientRect();
            const t = zoomTarget.getBoundingClientRect();
            // Mitte des Buchstaben-Strichs als Zoom-Punkt
            const ox = t.left + t.width / 2 - m.left;
            const oy = t.top + t.height * 0.55 - m.top;
            setHero('transformOrigin', `${ox}px ${oy}px`);
            const stroke = Math.max(8, t.width * 0.45);
            maxScale = Math.max(8, (window.innerWidth * 1.6) / stroke);
            const claimDot = heroClaim && heroClaim.querySelector('.claim-dot');
            if (heroLine && claimDot) {
                const prev = heroClaim.style.transform; heroClaim.style.transform = 'none';
                const d = claimDot.getBoundingClientRect();
                heroClaim.style.transform = prev;
                heroLine.style.transformOrigin = `${(d.left + d.width / 2).toFixed(1)}px 50%`;
            }
            sizeSparks();
            updateHero();
        };
        /* Orange Funken: beim Reinzoomen sprühen sie aus dem Buchstaben – je schneller man scrollt, desto mehr */
        const sparkCv = document.createElement('canvas');
        sparkCv.className = 'hero-sparks'; sparkCv.setAttribute('aria-hidden', 'true');
        heroStage.appendChild(sparkCv);
        const sctx = sparkCv.getContext('2d');
        let lineOx = 0, lineY = 0, sparks = [], sparkRaf = 0, sparkOx = 0, sparkOy = 0, lastY = window.scrollY, dpr = 1;
        const sizeSparks = () => {
            dpr = Math.min(2, window.devicePixelRatio || 1);
            sparkCv.width = Math.round(heroStage.clientWidth * dpr);
            sparkCv.height = Math.round(heroStage.clientHeight * dpr);
            const sr = heroStage.getBoundingClientRect();
            const prev = heroLayers[0].style.transform; setHero('transform', 'none');
            const t0 = zoomTarget.getBoundingClientRect(); setHero('transform', prev);
            if (heroLine) { const lr = heroLine.getBoundingClientRect(); lineY = lr.top + lr.height / 2 - sr.top; lineOx = parseFloat(heroLine.style.transformOrigin) || heroStage.clientWidth / 2; }
            sparkOx = t0.left + t0.width / 2 - sr.left; sparkOy = t0.top + t0.height * 0.55 - sr.top;
        };
        const COLORS = ['#FF5A00', '#FF5A00', '#FF7A1F', '#FFA35C', '#FFD08A'];
        const pushSpark = (x, y, a, sp, o) => {
            sparks.push({
                x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0.5),
                life: 0, max: o.max * (0.7 + Math.random() * 0.6), s: o.s * (0.6 + Math.random() * 0.9),
                streak: Math.random() < o.streak, c: COLORS[(Math.random() * COLORS.length) | 0], g: o.g || 0.012
            });
        };
        const spawnSparks = (n, z) => {   // Zoom-Phase: Funkenregen aus dem Buchstaben
            const W = heroStage.clientWidth, ring = W * (0.015 + 0.46 * z);
            for (let i = 0; i < n; i++) {
                const a = Math.random() * Math.PI * 2, r = ring * (0.65 + Math.random() * 0.6);
                pushSpark(sparkOx + Math.cos(a) * r, sparkOy + Math.sin(a) * r, a + (Math.random() - .5) * 0.5, 2 + Math.random() * 7, { max: 55, s: 2.6, streak: 0.45 });
            }
            if (sparks.length > 900) sparks.splice(0, sparks.length - 900);
            if (!sparkRaf) sparkRaf = requestAnimationFrame(tickSparks);
        };
        const spawnLineSparks = (n, e) => {   // Linie: Funken sprühen an beiden Enden der wachsenden Linie
            const W = heroStage.clientWidth;
            for (let i = 0; i < n; i++) {
                const dir = Math.random() < 0.5 ? -1 : 1;
                const x = lineOx + dir * e * (dir < 0 ? lineOx : W - lineOx);
                pushSpark(x, lineY, (dir < 0 ? Math.PI : 0) + (Math.random() - .5) * 1.6, 1 + Math.random() * 4, { max: 38, s: 2, streak: 0.5, up: 0.4 + Math.random() * 1.4, g: 0.03 });
            }
            if (!sparkRaf) sparkRaf = requestAnimationFrame(tickSparks);
        };
        const tickSparks = () => {
            sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            sctx.clearRect(0, 0, sparkCv.width / dpr, sparkCv.height / dpr);
            sparks = sparks.filter(q => q.life < q.max);
            sparks.forEach(q => {
                q.life++; q.vx *= 0.978; q.vy = q.vy * 0.978 - q.g * -1 * -1; q.vy -= 0.01; q.x += q.vx; q.y += q.vy;
                const k = 1 - q.life / q.max, r = q.s * (0.35 + 0.65 * k);
                sctx.globalAlpha = Math.min(1, k * 1.5);
                sctx.fillStyle = q.c; sctx.strokeStyle = q.c;
                if (q.streak) {
                    sctx.lineWidth = r * 0.9; sctx.lineCap = 'round';
                    sctx.beginPath(); sctx.moveTo(q.x, q.y); sctx.lineTo(q.x - q.vx * 3.2, q.y - q.vy * 3.2); sctx.stroke();
                }
                if (r > 2.2) { sctx.shadowColor = '#FF5A00'; sctx.shadowBlur = 10; } else { sctx.shadowBlur = 0; }
                sctx.beginPath(); sctx.arc(q.x, q.y, r, 0, 6.2832); sctx.fill();
            });
            sctx.shadowBlur = 0;
            sparkRaf = sparks.length ? requestAnimationFrame(tickSparks) : 0;
        };
        const updateHero = () => {
            if (!desktop.matches) return;
            const start = heroPin.getBoundingClientRect().top + window.scrollY;
            const total = heroPin.offsetHeight - window.innerHeight;
            const p = total > 0 ? Math.min(1, Math.max(0, (window.scrollY - start) / total)) : 0;
            const z = Math.min(1, p / 0.5);   // erste Hälfte: in «Nicolas» hineinzoomen
            const dy = Math.abs(window.scrollY - lastY); lastY = window.scrollY;
            if (dy > 0 && z > 0.03 && z < 0.95) spawnSparks(Math.min(48, 4 + Math.round(dy * 0.6)), z);
            setHero('transform', `scale(${Math.pow(maxScale, z)})`);
            setHero('visibility', z > 0.97 ? 'hidden' : 'visible');
            if (heroUi) heroUi.style.opacity = String(Math.max(0, 1 - z * 4));
            if (heroFill) heroFill.style.opacity = String(Math.min(1, Math.max(0, (z - 0.4) / 0.32)));
            if (heroClaim) {   // danach: «Choose to like it» zoomt von gross auf normal heraus
                const q = Math.min(1, Math.max(0, (p - 0.44) / 0.26));
                const e = 1 - Math.pow(1 - q, 3);
                heroClaim.style.opacity = String(Math.min(1, q * 1.6));
                heroClaim.classList.toggle('mix', q > 0.3);
                heroClaim.style.transform = `scale(${(1 + (1 - e) * 2.2).toFixed(4)})`;
            }
            if (heroLine) {   // zum Schluss: vom Punkt in «it.» zieht sich die orange Linie über die ganze Breite – sie wird zur Trennlinie zu «Das biete ich»
                const l = Math.min(1, Math.max(0, (p - 0.8) / 0.17));
                heroLine.style.transform = `scaleX(${(1 - Math.pow(1 - l, 3)).toFixed(4)})`;
                if (dy > 0 && l > 0.02 && l < 0.98) spawnLineSparks(Math.min(14, 2 + Math.round(dy * 0.2)), 1 - Math.pow(1 - l, 3));
            }
        };
        window.addEventListener('scroll', updateHero, { passive: true });
        window.addEventListener('resize', measureHero);
        desktop.addEventListener('change', measureHero);
        // nach dem Laden der Schrift neu messen
        (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(measureHero, 1300));
        measureHero();
    }

    /* ---------- Feine orange Linie zwischen den Abschnitten, mit wanderndem Punkt ---------- */
    const panels = Array.from(document.querySelectorAll('main > section[data-theme], footer[data-theme]'));
    const dots = [];
    panels.forEach((s, i) => {
        const before = panels[i - 1];
        if (!before) return;
        const sep = document.createElement('div');
        sep.className = 'sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.innerHTML = '<span class="sep-dot"></span>';
        s.prepend(sep);
        dots.push(sep.firstChild);
    });
    /* Punkte spielen die Rot+Gelb=Orange-Animation, sobald sie ins Bild kommen */
    {
        const mixTargets = [...dots, ...document.querySelectorAll('.footer-wordmark .mix-dot, .claim-static')];
        dots.forEach(d => d.classList.add('mixd'));
        const logoDot = document.querySelector('.logo .mix-dot');
        if (logoDot && !reduceMotion) setTimeout(() => logoDot.classList.add('go'), 500);
        if ('IntersectionObserver' in window && !reduceMotion) {
            const mio = new IntersectionObserver((es) => es.forEach(en => {
                const el = en.target, isClaim = el.classList.contains('claim-static');
                if (en.isIntersecting) { el.classList.add(isClaim ? 'mix' : 'go'); if (!isClaim) mio.unobserve(el); }
                else if (isClaim) el.classList.remove('mix');
            }), { threshold: 0.6 });
            mixTargets.forEach(el => mio.observe(el));
        }
    }
    if (dots.length && !reduceMotion) {
        let ticking = false;
        const moveDots = () => {
            ticking = false;
            const vh = window.innerHeight;
            dots.forEach(dot => {
                const line = dot.parentElement;
                const top = line.getBoundingClientRect().top;
                if (top > vh * 1.1 || top < -vh * .1) return;
                const p = Math.min(1, Math.max(0, (vh - top) / vh));     // 0 = Linie unten, 1 = Linie oben
                const pad = Math.min(56, Math.max(20, window.innerWidth * 0.04));
                const x = pad + p * (line.clientWidth - 2 * pad - dot.offsetWidth);
                dot.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
            });
        };
        const onScrollDots = () => { if (!ticking) { ticking = true; requestAnimationFrame(moveDots); } };
        window.addEventListener('scroll', onScrollDots, { passive: true });
        window.addEventListener('resize', onScrollDots);
        moveDots();
    }
    const hexOf = { red: '#FF2A1A', yellow: '#FFCC00', orange: '#FF5A00', light: '#FFFFFF', paper: '#F3F1EC', dark: '#0E0E0E', dark2: '#191817' };

    /* ---------- Header & Mauszeiger übernehmen die Farbe des Abschnitts in der Bildschirmmitte ---------- */
    const themed = document.querySelectorAll('main [data-theme], footer[data-theme]');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const themeHex = hexOf;
    if (themed.length && 'IntersectionObserver' in window) {
        const themeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const t = entry.target.dataset.theme;
                if (document.body.dataset.theme === t) return;
                document.body.dataset.theme = t;
                if (metaTheme) metaTheme.setAttribute('content', getComputedStyle(entry.target).backgroundColor);
            });
        }, { rootMargin: '-50% 0px -50% 0px' });
        themed.forEach(s => themeObserver.observe(s));
    }

    /* ---------- Mein Weg: die Route füllt sich beim Scrollen, erreichte Wegpunkte werden orange ---------- */
    const trail = document.getElementById('trail');
    if (trail) {
        const points = [...trail.querySelectorAll('.wp')];
        const updateTrail = () => {
            const r = trail.getBoundingClientRect();
            const mark = window.innerHeight * 0.6;   // «Ankunft» etwas unterhalb der Bildschirmmitte
            const p = Math.min(1, Math.max(0, (mark - r.top) / r.height));
            trail.style.setProperty('--trail-p', p.toFixed(4));
            points.forEach(li => {
                const dot = li.querySelector('.wp-dot').getBoundingClientRect();
                li.classList.toggle('passed', dot.top + dot.height / 2 < mark);
            });
        };
        window.addEventListener('scroll', updateTrail, { passive: true });
        window.addEventListener('resize', updateTrail);
        updateTrail();
    }

    /* ---------- Karussell (für Unterseiten) ---------- */
    const carouselTrack = document.getElementById('carouselTrack');
    const carouselLeft = document.getElementById('carouselLeft');
    const carouselRight = document.getElementById('carouselRight');
    if (carouselTrack && carouselLeft && carouselRight) {
        const items = Array.from(carouselTrack.querySelectorAll('.carousel-item'));
        let currentIndex = 0;
        let autoScrollInterval;
        const scrollToIndex = (i) => {
            if (!items.length) return;
            currentIndex = (i + items.length) % items.length;
            carouselTrack.scrollTo({ left: items[currentIndex].offsetLeft, behavior: 'smooth' });
        };
        const startAutoScroll = () => { autoScrollInterval = setInterval(() => scrollToIndex(currentIndex + 1), 3500); };
        const stopAutoScroll = () => clearInterval(autoScrollInterval);
        carouselRight.addEventListener('click', () => scrollToIndex(currentIndex + 1));
        carouselLeft.addEventListener('click', () => scrollToIndex(currentIndex - 1));
        startAutoScroll();
        carouselTrack.addEventListener('mouseenter', stopAutoScroll);
        carouselTrack.addEventListener('mouseleave', startAutoScroll);
        carouselTrack.addEventListener('touchstart', stopAutoScroll, { passive: true });
    }

    /* ---------- Lightbox ---------- */
    const lightbox = document.getElementById('lightbox');
    const lightboxContent = document.getElementById('lightboxContent');
    const lightboxClose = document.getElementById('lightboxClose');
    let lastFocus = null;

    function openLightbox(mediaEl) {
        lastFocus = document.activeElement;
        lightboxContent.innerHTML = '';
        const clone = mediaEl.cloneNode(true);
        clone.removeAttribute('loading');
        if (clone.tagName === 'VIDEO') {
            clone.removeAttribute('autoplay');
            clone.muted = false;
            clone.controls = true;
            clone.loop = true;
        }
        lightboxContent.appendChild(clone);
        lightbox.classList.add('active');
        if (lightboxClose) lightboxClose.focus();
    }
    function closeLightbox() {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        lightbox.classList.remove('active');
        lightboxContent.innerHTML = '';
        if (lastFocus) lastFocus.focus();
    }
    if (lightbox && lightboxContent) {
        document.addEventListener('click', (e) => {
            const media = e.target.closest('.carousel-item img, .carousel-item video, .impressions-grid img, .subpage-gallery img');
            if (media && !lightbox.contains(media)) openLightbox(media);
        });
        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeLightbox(); toggleMenu(false); }
    });

    /* ---------- YouTube: Vorschaubild, Player lädt erst beim Klick (schneller + datenschutzfreundlich) ---------- */
    document.querySelectorAll('.yt-lite').forEach(btn => btn.setAttribute('aria-label', `Video abspielen: ${btn.dataset.title || ''}`));
    // ein Klick-Handler für alle Video-Vorschauen – funktioniert auch in der Referenz-Detail-Ansicht
    document.addEventListener('click', e => {
        const btn = e.target.closest('.yt-lite, .tt-lite');
        if (!btn || btn.classList.contains('playing')) return;
        const yt = btn.classList.contains('yt-lite');
        const iframe = document.createElement('iframe');
        iframe.src = yt ? `https://www.youtube-nocookie.com/embed/${btn.dataset.id}?autoplay=1&rel=0&modestbranding=1`
                        : `https://www.tiktok.com/player/v1/${btn.dataset.id}?autoplay=1&music_info=0&description=0`;
        iframe.title = btn.dataset.title || btn.getAttribute('aria-label') || 'Video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
        iframe.allowFullscreen = true;
        btn.classList.add('playing');
        btn.appendChild(iframe);
    });

    /* ---------- Fehlende Bilder (z. B. noch nicht hochgeladen) ausblenden statt kaputt anzeigen ---------- */
    document.querySelectorAll('main img').forEach(img => {
        const hide = () => { (img.closest('.gallery-item, figure, a.lightbox-trigger') || img).style.display = 'none'; };
        if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) hide();
        else img.addEventListener('error', hide);
    });

    /* ---------- Referenzen: Klick öffnet eine kurze Detail-Ansicht ---------- */
    const refPanel = document.getElementById('refPanel');
    if (refPanel) {
        const sheet = refPanel.querySelector('.ref-panel-sheet');
        let lastFocus = null;
        const close = () => {
            refPanel.classList.remove('open');
            document.documentElement.style.overflow = '';
            setTimeout(() => { refPanel.hidden = true; }, 450);
            if (lastFocus) lastFocus.focus();
        };
        document.querySelectorAll('.ref-open').forEach(btn => {
            btn.addEventListener('click', () => {
                const ref = btn.closest('.ref');
                lastFocus = btn;
                refPanel.querySelector('.ref-panel-title').innerHTML = ref.querySelector('.ref-name').innerHTML;
                refPanel.querySelector('.ref-panel-meta').innerHTML = ref.querySelector('.ref-meta').innerHTML;
                const body = refPanel.querySelector('.ref-panel-body');
                body.innerHTML = '';
                const tpl = ref.querySelector('.ref-detail');
                if (tpl) body.appendChild(tpl.content.cloneNode(true));
                const lang = document.documentElement.lang || 'de';   // Texte aus der Vorlage in der aktuellen Sprache zeigen
                body.querySelectorAll('[data-' + lang + ']').forEach(el => { el.innerHTML = el.getAttribute('data-' + lang); });
                body.querySelectorAll('.ref-desc').forEach(p => { if (!p.textContent.trim()) p.remove(); });
                body.querySelectorAll('.ref-gallery').forEach(g => { if (!g.children.length) g.remove(); });
                refPanel.hidden = false;
                document.documentElement.style.overflow = 'hidden';
                requestAnimationFrame(() => requestAnimationFrame(() => refPanel.classList.add('open')));
                sheet.scrollTop = 0;
                refPanel.querySelector('.ref-panel-close').focus();
            });
        });
        refPanel.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && refPanel.classList.contains('open')) close(); });
    }

    /* ---------- Kontaktformular: ohne Seitenwechsel senden ---------- */
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    if (form && status && window.fetch) {
        const msgs = {
            de: { ok: 'Danke! Deine Nachricht ist angekommen – ich melde mich bald.', err: 'Hoppla, das hat nicht geklappt. Bitte versuch es nochmal.' },
            en: { ok: 'Thanks! Your message arrived – I\'ll get back to you soon.', err: 'Oops, that didn\'t work. Please try again.' },
            fr: { ok: 'Merci ! Ton message est bien arrivé – je te réponds bientôt.', err: 'Oups, ça n\'a pas marché. Merci de réessayer.' }
        };
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const lang = document.documentElement.lang in msgs ? document.documentElement.lang : 'de';
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            status.className = 'form-status';
            status.textContent = '';
            try {
                const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
                if (!res.ok) throw new Error();
                form.reset();
                status.textContent = msgs[lang].ok;
                status.classList.add('ok');
            } catch (err) {
                status.textContent = msgs[lang].err;
                status.classList.add('err');
            } finally {
                btn.disabled = false;
            }
        });
    }

    /* ---------- Eigener Cursor (nur Maus) ---------- */
    const cursor = document.querySelector('.cursor');
    if (cursor && window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
        let x = 0, y = 0, cx = 0, cy = 0;
        window.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; cursor.classList.add('on'); }, { passive: true });
        document.addEventListener('mouseleave', () => cursor.classList.remove('on'));
        document.addEventListener('mouseover', (e) => {
            cursor.classList.toggle('big', !!e.target.closest('a, button, summary, .impressions-grid img, .ref'));
        });
        const loop = () => {
            cx += (x - cx) * 0.2;
            cy += (y - cy) * 0.2;
            cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
            requestAnimationFrame(loop);
        };
        loop();
    }

    /* ---------- Elemente sanft einblenden ---------- */
    if ('IntersectionObserver' in window && !reduceMotion) {
        const targets = document.querySelectorAll(
            '.section-top, .intro-grid > *, .intro-side > *, .work, .ref, .vision-media, .vision-text, .impressions-grid img, .yt-lite, .social-follow, .faq-list details, .contact-grid > *'
        );
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

        targets.forEach(el => {
            const siblings = Array.from(el.parentElement.children);
            el.style.transitionDelay = `${(siblings.indexOf(el) % 3) * 100}ms`;
            el.classList.add('reveal');
            observer.observe(el);
        });
    }
});

/* ---------- Sprache wechseln ---------- */
function changeLanguage(lang) {
    document.querySelectorAll('[data-de]').forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (text) el.innerHTML = text;
    });
    document.documentElement.lang = lang;

    const placeholders = {
        de: { name: 'Name', email: 'Email', msg: 'Nachricht' },
        en: { name: 'Name', email: 'Email', msg: 'Message' },
        fr: { name: 'Nom', email: 'E-mail', msg: 'Message' }
    };
    const formName = document.querySelector('form input[name="name"]');
    const formEmail = document.querySelector('form input[name="email"]');
    const formText = document.querySelector('form textarea[name="message"]');
    if (formName) formName.placeholder = placeholders[lang].name;
    if (formEmail) formEmail.placeholder = placeholders[lang].email;
    if (formText) formText.placeholder = placeholders[lang].msg;

    document.querySelectorAll('.lang-btn, .lang-btn-compact').forEach(btn => {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
    });
    document.querySelectorAll(`[onclick="changeLanguage('${lang}')"]`).forEach(btn => {
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'true');
    });

    try { localStorage.setItem('lerossi-lang', lang); } catch (e) { /* egal */ }
}
