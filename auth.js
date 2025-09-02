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

const navElement = document.querySelector('.main-nav');
const errorMessageDiv = document.getElementById('error-message'); // For login/signup pages

// Function to update the navigation based on login state
const updateNav = (user) => {
    let navHTML = '';
    if (user && user.emailVerified) {
        // --- User is logged in AND verified ---
        navHTML = `
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="blogs.html">Blog</a></li>
                <li><a href="assistant.html">AI Assistant</a></li>
                <li><a href="donations.html">Support</a></li>
                <li><a href="#" id="logout-button">Logout</a></li>
            </ul>
        `;
    } else {
        // --- User is logged out OR not verified ---
        navHTML = `
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="blogs.html">Blog</a></li>
                <li><a href="donations.html">Support</a></li>
                <li><a href="login.html">Login</a></li>
            </ul>
        `;
    }
    navElement.innerHTML = navHTML;

    // Add logout functionality if the button exists
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
        // If a verified user is on login/signup page, redirect to home
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
                // --- NEW: Send verification email ---
                userCredential.user.sendEmailVerification()
                    .then(() => {
                        // Email sent.
                        signupForm.innerHTML = `<p style="color: var(--primary-color);">Account created successfully! A verification link has been sent to your email address. Please check your inbox and verify your account before logging in.</p>`;
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
                // --- NEW: Check if email is verified ---
                if (userCredential.user.emailVerified) {
                    // Signed in successfully, onAuthStateChanged will handle redirect
                    console.log('User logged in:', userCredential.user);
                } else {
                    // User's email is not verified
                    auth.signOut(); // Log them out immediately
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