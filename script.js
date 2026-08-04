document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menuBtn');
    const mainNav = document.getElementById('main-nav');
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

    // Content-Karussell: Pfeil-Navigation
    const carouselTrack = document.getElementById('carouselTrack');
    const carouselLeft = document.getElementById('carouselLeft');
    const carouselRight = document.getElementById('carouselRight');
    if (carouselTrack && carouselLeft && carouselRight) {
        const scrollAmount = 170; // Breite eines Items + Abstand
        carouselRight.addEventListener('click', () => {
            carouselTrack.scrollBy({ left: scrollAmount * 2, behavior: 'smooth' });
        });
        carouselLeft.addEventListener('click', () => {
            carouselTrack.scrollBy({ left: -scrollAmount * 2, behavior: 'smooth' });
        });
    }
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
    // 3. Aktiven Button stylen
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}
