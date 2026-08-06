document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menuBtn');
    const mainNav = document.getElementById('main-nav');
    const mainHeader = document.querySelector('.main-header');

    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('open');
        mainNav.classList.toggle('active');
    });
    // Close menu on nav link click
    mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('open');
            mainNav.classList.remove('active');
        });
    });

    // Fixierter Header: Balken erscheint beim Scrollen
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
    });

    // Content-Karussell: Pfeil-Navigation
    const carouselTrack = document.getElementById('carouselTrack');
    const carouselLeft = document.getElementById('carouselLeft');
    const carouselRight = document.getElementById('carouselRight');
    const scrollAmount = 236; // Breite eines Items (220px) + Abstand (16px)

    if (carouselTrack && carouselLeft && carouselRight) {
        carouselRight.addEventListener('click', () => {
            carouselTrack.scrollBy({ left: scrollAmount * 2, behavior: 'smooth' });
        });
        carouselLeft.addEventListener('click', () => {
            carouselTrack.scrollBy({ left: -scrollAmount * 2, behavior: 'smooth' });
        });

        // Auto-Rotation: scrollt automatisch alle 3.5s weiter, springt am Ende zurück zum Start
        let autoScrollInterval;
        function startAutoScroll() {
            autoScrollInterval = setInterval(() => {
                const atEnd = carouselTrack.scrollLeft + carouselTrack.clientWidth >= carouselTrack.scrollWidth - 5;
                if (atEnd) {
                    carouselTrack.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    carouselTrack.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }, 3500);
        }
        function stopAutoScroll() {
            clearInterval(autoScrollInterval);
        }
        startAutoScroll();
        // Pausiert beim Hovern/Berühren, damit man in Ruhe klicken/scrollen kann
        carouselTrack.addEventListener('mouseenter', stopAutoScroll);
        carouselTrack.addEventListener('mouseleave', startAutoScroll);
        carouselTrack.addEventListener('touchstart', stopAutoScroll);
    }

    // Lightbox: Bilder/Videos aus dem Karussell vergrössert anzeigen
    const lightbox = document.getElementById('lightbox');
    const lightboxContent = document.getElementById('lightboxContent');
    const lightboxClose = document.getElementById('lightboxClose');

    function openLightbox(mediaEl) {
        lightboxContent.innerHTML = '';
        const clone = mediaEl.cloneNode(true);
        if (clone.tagName === 'VIDEO') {
            clone.removeAttribute('autoplay');
            clone.muted = false;
            clone.controls = true;
            clone.loop = true;
        }
        lightboxContent.appendChild(clone);
        lightbox.classList.add('active');
    }
    function closeLightbox() {
        lightbox.classList.remove('active');
        lightboxContent.innerHTML = '';
    }

    document.querySelectorAll('.carousel-item img, .carousel-item video').forEach(mediaEl => {
        mediaEl.addEventListener('click', () => openLightbox(mediaEl));
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Portfolio Detail-Overlay: Klick auf Karte öffnet grosse Ansicht mit Titel + Text
    const portfolioModal = document.getElementById('portfolioModal');
    const portfolioModalMedia = document.getElementById('portfolioModalMedia');
    const portfolioModalTitle = document.getElementById('portfolioModalTitle');
    const portfolioModalDesc = document.getElementById('portfolioModalDesc');
    const portfolioModalClose = document.getElementById('portfolioModalClose');

    document.querySelectorAll('.portfolio-item-wrapper').forEach(wrapper => {
        wrapper.addEventListener('click', () => {
            const media = wrapper.querySelector('.portfolio-item img, .portfolio-item video');
            const title = wrapper.querySelector('.project-info strong');
            const desc = wrapper.querySelector('.project-info p');

            portfolioModalMedia.innerHTML = '';
            const clone = media.cloneNode(true);
            if (clone.tagName === 'VIDEO') {
                clone.removeAttribute('autoplay');
                clone.muted = false;
                clone.controls = true;
                clone.loop = true;
            }
            portfolioModalMedia.appendChild(clone);
            portfolioModalTitle.textContent = title.textContent;
            portfolioModalDesc.textContent = desc.textContent;
            portfolioModal.classList.add('active');
        });
    });

    function closePortfolioModal() {
        portfolioModal.classList.remove('active');
        portfolioModalMedia.innerHTML = '';
    }
    portfolioModalClose.addEventListener('click', closePortfolioModal);
    portfolioModal.addEventListener('click', (e) => {
        if (e.target === portfolioModal) closePortfolioModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closePortfolioModal();
        }
    });
});
function changeLanguage(lang) {
    // 1. Alle Elemente mit data-[lang] Attributen suchen
    const elements = document.querySelectorAll('[data-de]');
    
    elements.forEach(el => {
        // Text austauschen basierend auf gewählter Sprache
        if (el.getAttribute(`data-${lang}`)) {
            el.innerHTML = el.getAttribute(`data-${lang}`);
        }
    });
    // 2. Platzhalter in Formularen anpassen (Name, E-Mail, Nachricht)
    const placeholders = {
        de: { name: "Name", email: "Email", msg: "Nachricht" },
        en: { name: "Name", email: "Email", msg: "Message" },
        fr: { name: "Nom", email: "E-mail", msg: "Message" }
    };
    
    const formName = document.querySelector('input[placeholder="Name"], input[placeholder="Nom"]');
    const formEmail = document.querySelector('input[placeholder="Email"], input[placeholder="E-mail"]');
    const formText = document.querySelector('textarea');
    if (formName) formName.placeholder = placeholders[lang].name;
    if (formEmail) formEmail.placeholder = placeholders[lang].email;
    if (formText) formText.placeholder = placeholders[lang].msg;
    // 3. Aktive Buttons stylen (beide Sprachwechsler-Sets: Header-Balken & Mobile-Menü)
    document.querySelectorAll('.lang-btn, .lang-btn-compact').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll(`[onclick="changeLanguage('${lang}')"]`).forEach(btn => btn.classList.add('active'));
}
