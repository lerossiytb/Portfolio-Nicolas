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

    // Content-Karussell: Pfeil-Navigation + Auto-Rotation (index-basiert für sauberes Snapping)
    const carouselTrack = document.getElementById('carouselTrack');
    const carouselLeft = document.getElementById('carouselLeft');
    const carouselRight = document.getElementById('carouselRight');

    if (carouselTrack && carouselLeft && carouselRight) {
        const items = Array.from(carouselTrack.querySelectorAll('.carousel-item'));
        let currentIndex = 0;

        function scrollToIndex(i) {
            currentIndex = (i + items.length) % items.length;
            const item = items[currentIndex];
            carouselTrack.scrollTo({ left: item.offsetLeft, behavior: 'smooth' });
        }

        carouselRight.addEventListener('click', () => scrollToIndex(currentIndex + 1));
        carouselLeft.addEventListener('click', () => scrollToIndex(currentIndex - 1));

        // Auto-Rotation: springt alle 3.5s zum nächsten Bild, danach zurück zum Anfang
        let autoScrollInterval;
        function startAutoScroll() {
            autoScrollInterval = setInterval(() => {
                scrollToIndex(currentIndex + 1);
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

    // Event-Delegation: funktioniert zuverlässig, auch für Elemente die erst später im DOM landen
    document.addEventListener('click', (e) => {
        const carouselMedia = e.target.closest('.carousel-item img, .carousel-item video');
        if (carouselMedia) {
            openLightbox(carouselMedia);
        }
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

    document.addEventListener('click', (e) => {
        const wrapper = e.target.closest('.portfolio-item-wrapper');
        if (!wrapper) return;

        const media = wrapper.querySelector('.portfolio-item img, .portfolio-item video');
        const title = wrapper.querySelector('.project-info strong');
        const desc = wrapper.querySelector('.project-info p');
        if (!media || !title || !desc) return;

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
