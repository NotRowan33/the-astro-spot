document.addEventListener('DOMContentLoaded', () => {
    const mainNav = document.querySelector('.main-nav');
    const navUl = document.querySelector('.main-nav ul');
    const siteHeader = document.querySelector('.site-header');

    // Create the hamburger menu icon
    const hamburger = document.createElement('div');
    hamburger.classList.add('hamburger-menu');
    hamburger.innerHTML = `
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
    `;
    // Insert the hamburger before the ul in the main-nav
    if (mainNav && navUl) {
        mainNav.insertBefore(hamburger, navUl);
    }

    hamburger.addEventListener('click', () => {
        if (navUl) {
            navUl.classList.toggle('nav-open');
            hamburger.classList.toggle('open');
        }
        // Optional: add a class to the header for styling when menu is open
        if (siteHeader) {
            siteHeader.classList.toggle('menu-active');
        }
    });

    // Close menu when a link is clicked (for single-page feel, if applicable)
    if (navUl) {
        navUl.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navUl.classList.remove('nav-open');
                hamburger.classList.remove('open');
                if (siteHeader) {
                    siteHeader.classList.remove('menu-active');
                }
            });
        });
    }

    // Close menu if clicked outside (optional but good UX)
    document.addEventListener('click', (event) => {
        if (navUl && !mainNav.contains(event.target) && navUl.classList.contains('nav-open')) {
            navUl.classList.remove('nav-open');
            hamburger.classList.remove('open');
            if (siteHeader) {
                siteHeader.classList.remove('menu-active');
            }
        }
    });

    // Ensure menu is closed if window is resized above mobile breakpoint
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navUl && navUl.classList.contains('nav-open')) {
            navUl.classList.remove('nav-open');
            hamburger.classList.remove('open');
            if (siteHeader) {
                siteHeader.classList.remove('menu-active');
            }
        }
    });
});