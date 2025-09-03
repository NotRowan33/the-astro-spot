(function() {
    // --- SET YOUR PASSWORD HERE ---
    const password = 'TestingOnly';
    // -----------------------------

    const storedPassword = sessionStorage.getItem('site_password');

    if (storedPassword === password) {
        // If they've already entered the password during this browser session, do nothing.
        return;
    }

    const input = prompt("Please enter the password to view this site:", "");

    if (input === password) {
        // If they enter the correct password, save it for this session and let them view the page.
        sessionStorage.setItem('site_password', password);
    } else {
        // If the password is wrong, block the site.
        document.body.innerHTML = `<div style="text-align: center; padding-top: 100px; color: white; font-family: sans-serif;"><h1>Access Denied</h1><p>Incorrect password.</p></div>`;
        alert("Incorrect password. Access denied.");
    }
})();