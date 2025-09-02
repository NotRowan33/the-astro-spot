// File: menu.js
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger-menu');
    const mobileNav = document.getElementById('mobile-nav');

    if (hamburger && mobileNav) {
        // Toggle menu on hamburger click
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('is-open');
            mobileNav.classList.toggle('is-open');
        });

        // Close menu when a link inside it is clicked
        mobileNav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                hamburger.classList.remove('is-open');
                mobileNav.classList.remove('is-open');
            }
        });
    }
});