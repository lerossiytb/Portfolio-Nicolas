/*
    ====================
    FOTO-GALERIE LIGHTBOX
    ====================
    Eigenständig von script.js (das die Homepage-Lightbox steuert).
    Erwartet: window.galleryPhotos = [{ src, label }, ...] wird in der
    jeweiligen HTML-Seite vor diesem Script definiert.
*/

var currentPhotoIndex = 0;

function renderGalleryPhoto() {
    var photo = window.galleryPhotos[currentPhotoIndex];
    var img = document.getElementById('photoLightboxImg');
    img.src = photo.src;
    img.alt = photo.label;
}

function openPhotoLightbox(index) {
    currentPhotoIndex = index;
    renderGalleryPhoto();
    document.getElementById('photoLightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePhotoLightbox() {
    document.getElementById('photoLightbox').classList.remove('active');
    document.body.style.overflow = '';
}

function showPrevPhoto() {
    var total = window.galleryPhotos.length;
    currentPhotoIndex = (currentPhotoIndex - 1 + total) % total;
    renderGalleryPhoto();
}

function showNextPhoto() {
    var total = window.galleryPhotos.length;
    currentPhotoIndex = (currentPhotoIndex + 1) % total;
    renderGalleryPhoto();
}

document.addEventListener('DOMContentLoaded', function () {
    var lightbox = document.getElementById('photoLightbox');
    if (!lightbox) return;

    lightbox.addEventListener('click', function (e) {
        if (e.target.id === 'photoLightbox') closePhotoLightbox();
    });

    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closePhotoLightbox();
        if (e.key === 'ArrowLeft') showPrevPhoto();
        if (e.key === 'ArrowRight') showNextPhoto();
    });
});
