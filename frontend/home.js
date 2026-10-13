//Demonstrates Event-Driven Architecture (Slideshow UI)

// SLIDESHOW STATE VARIABLES
let slideIndex = 1;
let slides;
let dots;
let slideInterval;

function plusSlides(n) {
    clearInterval(slideInterval);
    showSlides(slideIndex += n);
    startAutoSlide();
}

function currentSlide(n) {
    clearInterval(slideInterval);
    showSlides(slideIndex = n);
    startAutoSlide();
}

function startAutoSlide() {
    slideInterval = setInterval(() => {
        showSlides(slideIndex += 1);
    }, 4500); 
}

function showSlides(n) {
    let i;
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }
    
    for (i = 0; i < slides.length; i++) {
        slides[i].style.opacity = "0";
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    if(slides.length > 0) {
        slides[slideIndex - 1].style.opacity = "1";
        dots[slideIndex - 1].className += " active";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = checkAuth();
    if (!currentUser) return;

    // Load Virtual Identity
    document.getElementById('player-name').textContent = currentUser.username;
    
    // Load the player's Best Scores directly from the synced session data
    document.getElementById('best-easy').textContent = currentUser.best_easy || 0;
    document.getElementById('best-medium').textContent = currentUser.best_medium || 0;
    document.getElementById('best-hard').textContent = currentUser.best_hard || 0;
    
    // Initialize Slideshow
    slides = document.querySelectorAll('.slide');
    dots = document.querySelectorAll('.dot');
    
    if(slides.length > 0) {
        showSlides(slideIndex);
        startAutoSlide();
    }

    // Event Listeners for Nav
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        AuthSystem.logout();
    });

    document.getElementById('start-game-btn')?.addEventListener('click', () => {
        window.location.href = 'game.html';
    });
});