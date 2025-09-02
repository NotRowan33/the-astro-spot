// --- Step 1: PASTE YOUR FIREBASE CONFIGURATION HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyCAhgl6D7fG4EzsyNqXmdIE-W6euiTTy9g",
  authDomain: "the-astro-spot.firebaseapp.com",
  projectId: "the-astro-spot",
  storageBucket: "the-astro-spot.firebasestorage.app",
  messagingSenderId: "1085270741987",
  appId: "1:1085270741987:web:c08ae3b40b14f36bb846d6",
  measurementId: "G-WC15S5GD6E"
};
// ---------------------------------------------------------

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const desktopNav = document.querySelector('.main-nav');
const mobileNav = document.querySelector('.mobile-nav');
const errorMessageDiv = document.getElementById('error-message');

// Function to update the navigation based on login state
const updateNav = (user) => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const links = {
        'Home': 'index.html',
        'About': 'about.html',
        'Blog': 'blogs.html',
        'AI Assistant': 'assistant.html',
        'Support': 'donations.html'
    };
    
    let navHTML = '<ul>';
    for (const [title, url] of Object.entries(links)) {
        const isActive = (url === currentPage) ? 'class="active"' : '';
        navHTML += `<li><a href="${url}" ${isActive}>${title}</a></li>`;
    }

    if (user && user.emailVerified) {
        navHTML += `<li><a href="#" id="logout-button">Logout</a></li>`;
    } else {
        const loginActive = (currentPage === 'login.html' || currentPage === 'signup.html') ? 'class="active"' : '';
        navHTML += `<li><a href="login.html" ${loginActive}>Login</a></li>`;
    }
    navHTML += '</ul>';

    if(desktopNav) desktopNav.innerHTML = navHTML;
    if(mobileNav) mobileNav.innerHTML = navHTML;

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut();
        });
    }
};

// Listen for authentication state changes
auth.onAuthStateChanged(user => {
    updateNav(user);
    if (user && user.emailVerified && (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('signup.html'))) {
        window.location.href = 'index.html';
    }
});

// --- Logic for Signup Page ---
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = signupForm.email.value;
        const password = signupForm.password.value;
        
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                userCredential.user.sendEmailVerification()
                    .then(() => {
                        signupForm.innerHTML = `<p style="color: var(--primary-color);">Account created successfully! A verification link has been sent to your email address. Please check your inbox and verify your account before logging in.</p>`;
                        const authContainer = document.querySelector('.auth-form-container p');
                        if (authContainer) authContainer.style.display = 'none';
                    });
            })
            .catch((error) => {
                errorMessageDiv.textContent = error.message;
                errorMessageDiv.style.display = 'block';
            });
    });
}

// --- Logic for Login Page ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                if (userCredential.user.emailVerified) {
                    // Signed in successfully, onAuthStateChanged will handle redirect
                    console.log('User logged in:', userCredential.user);
                } else {
                    auth.signOut();
                    errorMessageDiv.textContent = 'Your email has not been verified. Please check your inbox for the verification link.';
                    errorMessageDiv.style.display = 'block';
                }
            })
            .catch((error) => {
                errorMessageDiv.textContent = error.message;
                errorMessageDiv.style.display = 'block';
            });
    });
}